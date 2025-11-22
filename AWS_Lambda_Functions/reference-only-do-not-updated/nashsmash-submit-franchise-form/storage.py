import os
import json
import time
import boto3
import logging
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')

def save_franchise_to_dynamodb(form_data, table_name):
    """Save franchise form submission to DynamoDB"""
    table = dynamodb.Table(table_name)
    
    # Generate timestamp and submission ID
    timestamp = int(time.time() * 1000)  # Current time in milliseconds
    form_id = f"FRANC_{timestamp}"
    
    try:
        # Create item for DynamoDB with proper keys
        item = {
            'formID': form_id,          # This is the partition key
            'timestamp': timestamp,      # This is the sort key
            'firstName': form_data.get('firstName', ''),
            'lastName': form_data.get('lastName', ''),
            'fullName': f"{form_data.get('firstName', '')} {form_data.get('lastName', '')}".strip(),
            'homeAddress': form_data.get('homeAddress', ''),
            'areaOfInterest': form_data.get('areaOfInterest', ''),
            'stateCountryOfInterest': form_data.get('stateCountryOfInterest', ''),
            'cityOfInterest': form_data.get('cityOfInterest', ''),
            'stateOfResidence': form_data.get('stateOfResidence', ''),
            'cityOfResidence': form_data.get('cityOfResidence', ''),
            'phone': form_data.get('phone', ''),
            'email': form_data.get('email', ''),
            'liquidCapital': form_data.get('liquidCapital', ''),
            'businessExperience': form_data.get('businessExperience', ''),
            'referralSource': form_data.get('referralSource', ''),
            'formType': 'franchise',
            'status': 'new',
        }
        
        # Add metadata if available
        if form_data.get('metadata'):
            if form_data['metadata'].get('submittedAt'):
                item['submittedAt'] = form_data['metadata']['submittedAt']
            if form_data['metadata'].get('userAgent'):
                item['userAgent'] = form_data['metadata']['userAgent']
            if form_data['metadata'].get('ipAddress'):
                item['ipAddress'] = form_data['metadata']['ipAddress']
           
        # Save to DynamoDB
        table.put_item(Item=item)
        logger.info(f"Franchise form submission saved to DynamoDB: {form_id}")
        return form_id
    
    except ClientError as e:
        logger.error(f"DynamoDB error while saving franchise form: {e}")
        raise Exception("Failed to save franchise form submission")