import os
import boto3
import logging
from datetime import datetime
from botocore.exceptions import ClientError
from email_templates import get_franchise_notification_template, get_franchise_confirmation_template

# Configure logging
logger = logging.getLogger()

# Initialize SES
ses = boto3.client('ses')

# Environment variables - update for Nash & Smashed
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'nashandsmashed@marketbrewer.com')
RECIPIENT_EMAIL = os.environ.get('RECIPIENT_EMAIL', 'nashandsmashed@marketbrewer.com')
CC_EMAIL = os.environ.get('CC_EMAIL')

def send_notification_email(form_data, form_id, website_name, website_url, to_addresses=None, cc_addresses=None):
    """Send notification email to franchise administrators"""
    # Use provided to_addresses or default
    if to_addresses is None:
        to_addresses = [RECIPIENT_EMAIL]
        
    # Use provided cc_addresses or default
    if cc_addresses is None and CC_EMAIL:
        cc_addresses = [CC_EMAIL]
    elif cc_addresses is None:
        cc_addresses = []
    
    subject, body_html, body_text = get_franchise_notification_template(
        form_data=form_data,
        form_id=form_id,
        website_name=website_name,
        website_url=website_url
    )
    
    try:
        email_destination = {
            'ToAddresses': to_addresses
        }
        
        # Add CC addresses if any exist
        if cc_addresses:
            email_destination['CcAddresses'] = cc_addresses
        
        response = ses.send_email(
            Source=SENDER_EMAIL,
            Destination=email_destination,
            Message={
                'Subject': {'Data': subject},
                'Body': {
                    'Text': {'Data': body_text},
                    'Html': {'Data': body_html}
                }
            },
            ReplyToAddresses=[form_data.get('email', SENDER_EMAIL)]
        )
        
        recipients_log = ', '.join(to_addresses)
        if cc_addresses:
            recipients_log += f" (CC: {', '.join(cc_addresses)})"
            
        logger.info(f"Notification email sent to {recipients_log}: {response['MessageId']}")
        return True
    except ClientError as e:
        logger.error(f"SES error: {e}")
        # Don't fail the function if email fails - we already saved to DB
        return False

def send_confirmation_email(form_data, website_name, website_url):
    """Send confirmation email to the person who submitted the form"""
    subject, body_html, body_text = get_franchise_confirmation_template(
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