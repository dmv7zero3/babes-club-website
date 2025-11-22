import os
import boto3
import logging
from datetime import datetime
from botocore.exceptions import ClientError
from email_templates import get_career_notification_template, get_career_confirmation_template

# Configure logging
logger = logging.getLogger()

# Initialize SES
ses = boto3.client('ses')

# Environment variables - REMOVED CC_EMAIL usage
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'accounting@nashandsmashed.com')

def send_notification_email(form_data, form_id, website_name, website_url, to_addresses=None):
    """Send notification email to specified addresses only - NO CC_EMAIL"""
    
    if to_addresses is None or not to_addresses:
        # Fallback to RECIPIENT_EMAIL if available, otherwise use default
        fallback_email = os.environ.get('RECIPIENT_EMAIL', 'accounting@nashandsmashed.com')
        to_addresses = [fallback_email]
        logger.info(f"Using fallback email: {fallback_email}")
    
    subject, body_html, body_text = get_career_notification_template(
        form_data=form_data,
        form_id=form_id,
        website_name=website_name,
        website_url=website_url
    )
    
    try:
        response = ses.send_email(
            Source=SENDER_EMAIL,
            Destination={
                'ToAddresses': to_addresses
            },
            Message={
                'Subject': {'Data': subject},
                'Body': {
                    'Text': {'Data': body_text},
                    'Html': {'Data': body_html}
                }
            },
            ReplyToAddresses=[form_data.get('email', SENDER_EMAIL)]
        )
        
        logger.info(f"Notification email sent to {len(to_addresses)} recipients: {', '.join(to_addresses)}")
        logger.info(f"SES MessageId: {response['MessageId']}")
        
        return True
    except ClientError as e:
        logger.error(f"SES error: {e}")
        # Don't fail the function if email fails - we already saved to DB
        return False

def send_confirmation_email(form_data, website_name, website_url):
    """Send confirmation email to the job applicant"""
    subject, body_html, body_text = get_career_confirmation_template(
        form_data=form_data,
        website_name=website_name,
        website_url=website_url
    )
    
    try:
        to_addresses = [form_data.get('email')]
            
        response = ses.send_email(
            Source=SENDER_EMAIL,
            Destination={
                'ToAddresses': to_addresses
            },
            Message={
                'Subject': {'Data': subject},
                'Body': {
                    'Text': {'Data': body_text},
                    'Html': {'Data': body_html}
                }
            }
        )
        logger.info(f"Confirmation email sent to {', '.join(to_addresses)}: {response['MessageId']}")
        return True
    except ClientError as e:
        logger.error(f"SES error for confirmation email: {e}")
        # Don't fail the function if confirmation email fails
        return False