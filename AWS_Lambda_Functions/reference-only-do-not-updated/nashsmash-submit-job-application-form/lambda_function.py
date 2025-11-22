# AWS_Lambda_Functions/nashsmash-submit-job-application-form/lambda_function.py
import json
import os
import boto3
import logging
from datetime import datetime
import re

# Import modules
from validation import validate_career_request, detect_spam_content, sanitize_form_data
from storage import save_career_to_dynamodb
from email_services import send_notification_email, send_confirmation_email
from utils import get_body_from_event
from rate_limiting import check_rate_limit

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Check if SES is properly configured
try:
    # Verify SES identity is available
    ses_client = boto3.client('ses')
    sender_email = os.environ.get('SENDER_EMAIL', 'accounting@nashandsmashed.com')
    identity_verified = False
    
    # Try to describe the SES identity to check if it's verified
    try:
        response = ses_client.get_identity_verification_attributes(
            Identities=[sender_email]
        )
        if sender_email in response['VerificationAttributes'] and \
           response['VerificationAttributes'][sender_email]['VerificationStatus'] == 'Success':
            identity_verified = True
    except Exception as e:
        logger.warning(f"Could not check SES identity status: {str(e)}")
    
    if not identity_verified:
        logger.warning(f"SES identity '{sender_email}' may not be verified. Email sending might fail.")
except Exception as e:
    logger.error(f"Error checking SES configuration: {str(e)}")

# Environment variables
WEBSITE_NAME = os.environ.get('WEBSITE_NAME', 'Nash & Smashed')
WEBSITE_URL = os.environ.get('WEBSITE_URL', 'https://nashandsmashed.com')
JOB_APPLICATION_TABLE = os.environ.get('JOB_APPLICATION_TABLE', 'nash-and-smashed-job-application-form-table')

# Email configuration - REMOVED ALL CC_EMAIL USAGE
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'HR@nashandsmashed.com')
# REMOVED: ACCOUNTING_EMAIL = os.environ.get('CC_EMAIL', 'accounting@nashandsmashed.com')

def get_cors_headers():
    """Get CORS headers for all responses - CRITICAL FOR MOBILE BROWSERS"""
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
    }

def lambda_handler(event, context):
    """Main handler function for the career application form Lambda"""
    try:
        logger.info("Received career application submission")
        
        # Check for OPTIONS request (CORS preflight) - API Gateway handles this
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': get_cors_headers(),
                'body': ''
            }
        
        # Get IP address for rate limiting
        ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
        
        # Check rate limit
        rate_limit_ok, rate_limit_message = check_rate_limit(ip_address)
        if not rate_limit_ok:
            logger.warning(f"Rate limit exceeded for IP: {ip_address}")
            return {
                'statusCode': 429,  # Too Many Requests
                'headers': get_cors_headers(),
                'body': json.dumps({
                    'success': False,
                    'message': rate_limit_message
                })
            }
        
        # Parse request body
        body = get_body_from_event(event)
        
        # Validate the request (this now includes sanitization)
        validation_errors = validate_career_request(body)
        if validation_errors:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({
                    'success': False,
                    'errors': validation_errors
                })
            }
        
        # Check for spam content
        spam_indicators = detect_spam_content(body)
        if spam_indicators:
            logger.warning(f"Spam detected from IP {ip_address}: {spam_indicators}")
            # Log but don't block immediately - could be false positive
            # In production, you might want to flag for manual review
            pass
        
        # Add metadata to form data
        form_data = body.copy()
        form_data['metadata'] = {
            'submittedAt': datetime.now().isoformat(),
            'userAgent': event.get('headers', {}).get('User-Agent', ''),
            'ipAddress': ip_address,
            'spamIndicators': spam_indicators if spam_indicators else None
        }
        
        # Save career application to DynamoDB
        form_id = save_career_to_dynamodb(form_data, JOB_APPLICATION_TABLE)
        
        # UPDATED: Build notification emails - COMPLETELY REMOVED CC_EMAIL DEPENDENCY
        hr_email = 'hr@nashandsmashed.com'
        notification_emails = [hr_email]
        logger.info(f"Added HR email: {hr_email}")
        
        # 1. Add store owner emails sent from frontend
        store_owner_emails = body.get('storeOwnerEmails', [])
        
        if isinstance(store_owner_emails, list):
            for email in store_owner_emails:
                if email and email not in notification_emails:
                    notification_emails.append(email)
                    logger.info(f"Added store owner email: {email}")
        elif isinstance(store_owner_emails, str) and store_owner_emails:
            # Handle single email as string
            if store_owner_emails not in notification_emails:
                notification_emails.append(store_owner_emails)
                logger.info(f"Added store owner email: {store_owner_emails}")
        
        # 2. Fallback: Legacy support for old 'notificationEmails' field
        if not store_owner_emails:
            legacy_emails = body.get('notificationEmails', [])
            if isinstance(legacy_emails, list):
                for email in legacy_emails:
                    if email and '@nashandsmashed.com' not in email.lower():
                        if email not in notification_emails:
                            notification_emails.append(email)
                            logger.info(f"Added legacy store owner email: {email}")
        
        # 3. Ensure we have at least one email - use RECIPIENT_EMAIL if available
        if not notification_emails:
            fallback_email = os.environ.get('RECIPIENT_EMAIL', 'accounting@nashandsmashed.com')
            notification_emails = [fallback_email]
            logger.warning(f"No store owner emails found, using fallback: {fallback_email}")
        
        # Log final notification email list
        logger.info(f"Final notification email list: {notification_emails}")
        
        # Send notification email (NO CC_EMAIL usage)
        admin_email_sent = send_notification_email(
            form_data=form_data, 
            form_id=form_id, 
            website_name=WEBSITE_NAME, 
            website_url=WEBSITE_URL,
            to_addresses=notification_emails
        )
        
        # Send confirmation email to the applicant
        confirmation_email_sent = send_confirmation_email(
            form_data=form_data, 
            website_name=WEBSITE_NAME, 
            website_url=WEBSITE_URL
        )
        
        # Return successful response with CORS headers
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'success': True,
                'message': 'Your job application has been successfully submitted. We will review your qualifications and contact you if there is a match.',
                'formID': form_id
            })
        }
        
    except Exception as e:
        # Log the error
        logger.error(f"Error processing career application: {str(e)}")
        
        # Return error response with CORS headers
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'success': False,
                'message': 'An error occurred while processing your job application. Please try again later or contact us directly.'
            })
        }