import json
import os
from shared_commerce.env import get_env
from shared_commerce.jwt import validate_refresh_token, issue_access_token

def lambda_handler(event, context):
    # Parse refresh token from request body
    try:
        body = event.get('body')
        if body:
            data = json.loads(body)
        else:
            return { 'statusCode': 400, 'body': json.dumps({'error': 'Missing body'}) }
        refresh_token = data.get('refresh_token')
        if not refresh_token:
            return { 'statusCode': 400, 'body': json.dumps({'error': 'Missing refresh_token'}) }
    except Exception as e:
        return { 'statusCode': 400, 'body': json.dumps({'error': 'Invalid request', 'details': str(e)}) }

    # Validate refresh token
    try:
        user_info = validate_refresh_token(refresh_token)
        if not user_info:
            return { 'statusCode': 401, 'body': json.dumps({'error': 'Invalid refresh token'}) }
    except Exception as e:
        return { 'statusCode': 401, 'body': json.dumps({'error': 'Token validation failed', 'details': str(e)}) }

    # Issue new access token
    try:
        access_token = issue_access_token(user_info)
        return {
            'statusCode': 200,
            'body': json.dumps({
                'access_token': access_token,
                'user': user_info
            })
        }
    except Exception as e:
        return { 'statusCode': 500, 'body': json.dumps({'error': 'Token issuance failed', 'details': str(e)}) }
