import json
import os
import boto3
import logging
from datetime import datetime

# Import modules
from validation import validate_franchise_request, detect_spam_content
from storage import save_franchise_to_dynamodb
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
    sender_email = os.environ.get('SENDER_EMAIL', 'franchise@nashandsmashed.com')
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
FRANCHISE_TABLE = os.environ.get('FRANCHISE_TABLE', 'nash-and-smashed-franchise-form-table')
RECIPIENT_EMAIL = os.environ.get('RECIPIENT_EMAIL', 'info@nashandsmashed.com')
CC_EMAIL = os.environ.get('CC_EMAIL', 'qc@nashandsmashed.com')

def lambda_handler(event, context):
    """Main handler function for the franchise form Lambda with security features"""
    try:
        # Log the incoming event (redact sensitive information for production)
        if os.environ.get('LOG_LEVEL') == 'DEBUG':
            logger.info(f"Received franchise inquiry: {json.dumps(event)}")
        else:
            logger.info(f"Received franchise inquiry")
        
        # Check for OPTIONS request (CORS preflight)
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                    'Access-Control-Max-Age': '86400'
                },
                'body': ''
            }
        
        # Get client IP address for rate limiting
        ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
        logger.info(f"Processing request from IP: {ip_address}")
        
        # Check rate limiting first
        rate_limit_ok, rate_limit_message = check_rate_limit(ip_address)
        if not rate_limit_ok:
            logger.warning(f"Rate limit exceeded for IP {ip_address}: {rate_limit_message}")
            return {
                'statusCode': 429,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Retry-After': '3600'  # 1 hour
                },
                'body': json.dumps({
                    'success': False,
                    'message': rate_limit_message,
                    'retryAfter': 3600
                })
            }
        
        # Parse request body
        body = get_body_from_event(event)
        
        # Validate the request (includes sanitization and honeypot check)
        validation_errors = validate_franchise_request(body)
        if validation_errors:
            logger.warning(f"Validation failed for IP {ip_address}: {validation_errors}")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False,
                    'message': 'Please check your form data and try again.',
                    'errors': validation_errors
                })
            }
        
        # Detect spam content
        spam_indicators = detect_spam_content(body)
        if spam_indicators:
            logger.warning(f"Spam detected from IP {ip_address}: {spam_indicators}")
            # Still process the form but flag it for review
        
        # Add metadata to form data
        form_data = body.copy()
        form_data['metadata'] = {
            'submittedAt': datetime.now().isoformat(),
            'userAgent': event.get('headers', {}).get('User-Agent', ''),
            'ipAddress': ip_address,
            'spamIndicators': spam_indicators if spam_indicators else None
        }
        
        # Save franchise inquiry to DynamoDB
        form_id = save_franchise_to_dynamodb(form_data, FRANCHISE_TABLE)
        
        # Send notification email to admin
        admin_email_sent = send_notification_email(
            form_data=form_data, 
            form_id=form_id, 
            website_name=WEBSITE_NAME, 
            website_url=WEBSITE_URL,
            to_addresses=[
                'info@nashandsmashed.com',
                'qc@nashandsmashed.com', 
                'accounting@nashandsmashed.com'            
            ]
        )
        
        # Send confirmation email to the inquirer
        confirmation_email_sent = send_confirmation_email(
            form_data=form_data, 
            website_name=WEBSITE_NAME, 
            website_url=WEBSITE_URL
        )
        
        # Log spam indicators if any
        if spam_indicators:
            logger.info(f"Form {form_id} flagged with spam indicators: {spam_indicators}")
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Your franchise inquiry has been successfully submitted. We will contact you shortly to discuss the opportunity.',
                'formID': form_id
            })
        }
        
    except Exception as e:
        # Log the error
        logger.error(f"Error processing franchise inquiry: {str(e)}")
        
        # Return error response
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'message': 'An error occurred while processing your franchise inquiry. Please try again later or contact us directly.'
            })
        }