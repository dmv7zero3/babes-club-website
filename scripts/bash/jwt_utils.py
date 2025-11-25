"""JWT utility functions for Babes Club authentication - Environment Variable Version"""

import json
import time
import hmac
import hashlib
import base64
import os
import uuid
from typing import Dict, Optional, Any

def get_jwt_secret() -> str:
    """Get JWT signing secret from environment variable"""
    secret = os.environ.get('JWT_SECRET')
    if not secret:
        raise ValueError("JWT_SECRET environment variable not set")
    return secret

def get_refresh_secret() -> str:
    """Get refresh token secret from environment variable"""
    secret = os.environ.get('REFRESH_SECRET')
    if not secret:
        raise ValueError("REFRESH_SECRET environment variable not set")
    return secret

def base64url_encode(data: bytes) -> str:
    """Base64 URL-safe encoding without padding"""
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data: str) -> bytes:
    """Base64 URL-safe decoding with padding restoration"""
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)

def create_jwt(payload: Dict[str, Any], secret: Optional[str] = None, expires_in: int = 43200) -> str:
    """
    Create a JWT token
    
    Args:
        payload: Token payload data
        secret: Optional secret (defaults to JWT_SECRET env var)
        expires_in: Token expiry in seconds (default 12 hours)
    
    Returns:
        JWT token string
    """
    if not secret:
        secret = get_jwt_secret()
    
    # Set standard claims
    now = int(time.time())
    payload['iat'] = now
    if 'exp' not in payload:
        payload['exp'] = now + expires_in
    if 'jti' not in payload:
        payload['jti'] = uuid.uuid4().hex
    
    # Create header
    header = {
        'alg': 'HS256',
        'typ': 'JWT'
    }
    
    # Encode header and payload
    header_encoded = base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_encoded = base64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    
    # Create signature
    message = f"{header_encoded}.{payload_encoded}"
    signature = hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).digest()
    signature_encoded = base64url_encode(signature)
    
    return f"{message}.{signature_encoded}"

def verify_jwt(token: str, secret: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
        secret: Optional secret (defaults to JWT_SECRET env var)
    
    Returns:
        Decoded payload if valid, None otherwise
    """
    if not secret:
        secret = get_jwt_secret()
    
    try:
        # Split token
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header_encoded, payload_encoded, signature_encoded = parts
        
        # Verify signature
        message = f"{header_encoded}.{payload_encoded}"
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        actual_signature = base64url_decode(signature_encoded)
        
        if not hmac.compare_digest(expected_signature, actual_signature):
            return None
        
        # Decode payload
        payload = json.loads(base64url_decode(payload_encoded))
        
        # Verify expiration
        if 'exp' in payload and payload['exp'] < time.time():
            return None
        
        return payload
        
    except Exception as e:
        # Log error in production
        print(f"JWT verification error: {e}")
        return None

def create_refresh_token(user_id: str, secret: Optional[str] = None) -> str:
    """
    Create a refresh token (30-day expiry)
    
    Args:
        user_id: User ID to embed in token
        secret: Optional secret (defaults to REFRESH_SECRET env var)
    
    Returns:
        Refresh token string
    """
    if not secret:
        secret = get_refresh_secret()
    
    payload = {
        'sub': user_id,
        'type': 'refresh',
        'jti': uuid.uuid4().hex
    }
    
    return create_jwt(payload, secret, expires_in=30*24*3600)  # 30 days

def verify_refresh_token(token: str, secret: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Verify a refresh token
    
    Args:
        token: Refresh token string
        secret: Optional secret (defaults to REFRESH_SECRET env var)
    
    Returns:
        Decoded payload if valid refresh token, None otherwise
    """
    if not secret:
        secret = get_refresh_secret()
    
    payload = verify_jwt(token, secret)
    if payload and payload.get('type') == 'refresh':
        return payload
    return None

def extract_bearer_token(auth_header: str) -> Optional[str]:
    """
    Extract token from Authorization header
    
    Args:
        auth_header: Authorization header value
    
    Returns:
        Token if found, None otherwise
    """
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header[7:]
    return None

# Optional: PyJWT-compatible interface for easier migration
def encode(payload: Dict[str, Any], secret: str, algorithm: str = 'HS256') -> str:
    """PyJWT-compatible encode function"""
    if algorithm != 'HS256':
        raise ValueError("Only HS256 algorithm is supported")
    return create_jwt(payload, secret)

def decode(token: str, secret: str, algorithms: list = ['HS256']) -> Dict[str, Any]:
    """PyJWT-compatible decode function"""
    if 'HS256' not in algorithms:
        raise ValueError("Only HS256 algorithm is supported")
    payload = verify_jwt(token, secret)
    if not payload:
        raise ValueError("Invalid token")
    return payload