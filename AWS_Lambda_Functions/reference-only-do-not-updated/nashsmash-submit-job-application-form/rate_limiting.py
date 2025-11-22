"""
Rate Limiting Module for AWS Lambda Functions
Provides IP-based rate limiting using DynamoDB
"""

import os
import boto3
import logging
from datetime import datetime, timedelta
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Configuration from environment variables
RATE_LIMIT_TABLE_NAME = os.environ.get('RATE_LIMIT_TABLE', 'career-form-rate-limits')
MAX_SUBMISSIONS_PER_IP_PER_HOUR = int(os.environ.get('MAX_SUBMISSIONS_PER_HOUR', '5'))
MAX_SUBMISSIONS_PER_IP_PER_DAY = int(os.environ.get('MAX_SUBMISSIONS_PER_DAY', '10'))

class RateLimiter:
    """Rate limiting class for managing submission limits per IP address"""
    
    def __init__(self, table_name: str = None, hourly_limit: int = None, daily_limit: int = None):
        """
        Initialize the rate limiter
        
        Args:
            table_name: DynamoDB table name for storing rate limit data
            hourly_limit: Maximum submissions per IP per hour
            daily_limit: Maximum submissions per IP per day
        """
        self.table_name = table_name or RATE_LIMIT_TABLE_NAME
        self.hourly_limit = hourly_limit or MAX_SUBMISSIONS_PER_IP_PER_HOUR
        self.daily_limit = daily_limit or MAX_SUBMISSIONS_PER_IP_PER_DAY
        
        try:
            self.table = dynamodb.Table(self.table_name)
        except Exception as e:
            logger.error(f"Failed to initialize DynamoDB table {self.table_name}: {str(e)}")
            self.table = None
    
    def _get_rate_limit_keys(self, ip_address: str) -> Tuple[str, str]:
        """
        Generate rate limiting keys for hourly and daily tracking
        
        Args:
            ip_address: Client IP address
            
        Returns:
            Tuple of (hourly_key, daily_key)
        """
        current_time = datetime.now()
        hour_key = f"{ip_address}_{current_time.strftime('%Y%m%d%H')}"
        day_key = f"{ip_address}_{current_time.strftime('%Y%m%d')}"
        return hour_key, day_key
    
    def _get_submission_count(self, rate_limit_key: str) -> int:
        """
        Get current submission count for a rate limit key
        
        Args:
            rate_limit_key: The rate limiting key to check
            
        Returns:
            Current submission count
        """
        try:
            response = self.table.get_item(Key={'rate_limit_key': rate_limit_key})
            return response.get('Item', {}).get('submission_count', 0)
        except Exception as e:
            logger.error(f"Error getting submission count for key {rate_limit_key}: {str(e)}")
            return 0
    
    def _update_submission_count(self, rate_limit_key: str, new_count: int, expires_at: int, ip_address: str) -> bool:
        """
        Update submission count for a rate limit key
        
        Args:
            rate_limit_key: The rate limiting key to update
            new_count: New submission count
            expires_at: TTL timestamp for automatic cleanup
            ip_address: Client IP address
            
        Returns:
            True if update successful, False otherwise
        """
        try:
            self.table.put_item(
                Item={
                    'rate_limit_key': rate_limit_key,
                    'submission_count': new_count,
                    'ip_address': ip_address,
                    'expires_at': expires_at,
                    'last_updated': datetime.now().isoformat()
                }
            )
            return True
        except Exception as e:
            logger.error(f"Error updating submission count for key {rate_limit_key}: {str(e)}")
            return False
    
    def check_rate_limit(self, ip_address: str) -> Tuple[bool, Optional[str]]:
        """
        Check if IP address has exceeded rate limits
        
        Args:
            ip_address: Client IP address to check
            
        Returns:
            Tuple of (is_allowed, error_message)
            - is_allowed: True if request is allowed, False if rate limited
            - error_message: Description of rate limit violation (None if allowed)
        """
        if not self.table:
            logger.warning("Rate limiting table not available, allowing request")
            return True, None
        
        if not ip_address or ip_address == 'unknown':
            logger.warning("Unknown IP address, allowing request")
            return True, None
        
        try:
            current_time = datetime.now()
            hour_key, day_key = self._get_rate_limit_keys(ip_address)
            
            # Check hourly limit
            hourly_count = self._get_submission_count(hour_key)
            if hourly_count >= self.hourly_limit:
                logger.warning(f"Hourly rate limit exceeded for IP {ip_address}: {hourly_count}/{self.hourly_limit}")
                return False, f"Too many submissions this hour ({hourly_count}/{self.hourly_limit}). Please wait before submitting again."
            
            # Check daily limit
            daily_count = self._get_submission_count(day_key)
            if daily_count >= self.daily_limit:
                logger.warning(f"Daily rate limit exceeded for IP {ip_address}: {daily_count}/{self.daily_limit}")
                return False, f"Daily submission limit reached ({daily_count}/{self.daily_limit}). Please try again tomorrow."
            
            # Update counters
            hourly_expires = int((current_time + timedelta(hours=2)).timestamp())
            daily_expires = int((current_time + timedelta(days=2)).timestamp())
            
            hourly_updated = self._update_submission_count(hour_key, hourly_count + 1, hourly_expires, ip_address)
            daily_updated = self._update_submission_count(day_key, daily_count + 1, daily_expires, ip_address)
            
            if not (hourly_updated and daily_updated):
                logger.error(f"Failed to update rate limit counters for IP {ip_address}")
                # Still allow the request if we can't update counters
            
            logger.info(f"Rate limit check passed for IP {ip_address}: hourly {hourly_count + 1}/{self.hourly_limit}, daily {daily_count + 1}/{self.daily_limit}")
            return True, None
            
        except Exception as e:
            logger.error(f"Rate limiting error for IP {ip_address}: {str(e)}")
            # Fail open - allow request if rate limiting fails
            return True, None
    
    def get_rate_limit_status(self, ip_address: str) -> dict:
        """
        Get current rate limit status for an IP address
        
        Args:
            ip_address: Client IP address
            
        Returns:
            Dictionary with current usage and limits
        """
        if not self.table or not ip_address or ip_address == 'unknown':
            return {
                'hourly_usage': 0,
                'daily_usage': 0,
                'hourly_limit': self.hourly_limit,
                'daily_limit': self.daily_limit
            }
        
        try:
            hour_key, day_key = self._get_rate_limit_keys(ip_address)
            hourly_count = self._get_submission_count(hour_key)
            daily_count = self._get_submission_count(day_key)
            
            return {
                'hourly_usage': hourly_count,
                'daily_usage': daily_count,
                'hourly_limit': self.hourly_limit,
                'daily_limit': self.daily_limit,
                'hourly_remaining': max(0, self.hourly_limit - hourly_count),
                'daily_remaining': max(0, self.daily_limit - daily_count)
            }
        except Exception as e:
            logger.error(f"Error getting rate limit status for IP {ip_address}: {str(e)}")
            return {
                'hourly_usage': 0,
                'daily_usage': 0,
                'hourly_limit': self.hourly_limit,
                'daily_limit': self.daily_limit
            }

# Convenience functions for easy import
def check_rate_limit(ip_address: str) -> Tuple[bool, Optional[str]]:
    """
    Simple function to check rate limit for an IP address
    
    Args:
        ip_address: Client IP address
        
    Returns:
        Tuple of (is_allowed, error_message)
    """
    rate_limiter = RateLimiter()
    return rate_limiter.check_rate_limit(ip_address)

def get_rate_limit_status(ip_address: str) -> dict:
    """
    Simple function to get rate limit status for an IP address
    
    Args:
        ip_address: Client IP address
        
    Returns:
        Dictionary with current usage and limits
    """
    rate_limiter = RateLimiter()
    return rate_limiter.get_rate_limit_status(ip_address)