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

def save_career_to_dynamodb(form_data, table_name):
    """Save career form submission to DynamoDB"""
    table = dynamodb.Table(table_name)
    
    # Generate timestamp and submission ID
    timestamp = int(time.time() * 1000)  # Current time in milliseconds
    form_id = f"CAREER_{timestamp}"
    
    try:
        # Handle field mapping - frontend sends both old and new field names
        city_state = form_data.get('cityState') or form_data.get('preferredLocation', '')
        interest_type = form_data.get('interestType') or form_data.get('position', '')
        
        # Create item for DynamoDB with proper keys
        item = {
            'formID': form_id,  # This is the partition key
            'timestamp': timestamp,  # This is the sort key
            'firstName': form_data.get('firstName', ''),
            'lastName': form_data.get('lastName', ''),
            'fullName': f"{form_data.get('firstName', '')} {form_data.get('lastName', '')}".strip(),
            'email': form_data.get('email', ''),
            'phone': form_data.get('phone', ''),
            'eligibleToWork': form_data.get('eligibleToWork', ''),
            'age': form_data.get('age', ''),
            'address': form_data.get('address', ''),
            'cityState': city_state,
            'preferredLocation': city_state,  # Store in both fields for compatibility
            'interestType': interest_type,
            'position': interest_type,  # Store in both fields for compatibility
            'weekendAvailability': form_data.get('weekendAvailability', ''),
            'startDate': form_data.get('startDate', ''),
            'terminated': form_data.get('terminated', ''),
            'terminationExplanation': form_data.get('terminationExplanation', ''),
            'workExperience': form_data.get('workExperience', ''),
            'references': form_data.get('references', ''),
            'formType': 'career',
            'status': 'new'
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
        logger.info(f"Career application saved to DynamoDB: {form_id}")
        return form_id
    
    except ClientError as e:
        logger.error(f"DynamoDB error while saving career application: {e}")
        raise Exception("Failed to save career application")