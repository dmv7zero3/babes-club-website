"""Tests for dashboard-get-profile Lambda.

AWS_Lambda_Functions/babes-website-dashboard-get-profile/test_lambda_function.py

Run with: pytest test_lambda_function.py -v
"""

from __future__ import annotations

import json
from decimal import Decimal
from typing import Any, Dict
from unittest.mock import MagicMock, patch

import pytest


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def mock_table():
    """Create a mock DynamoDB table."""
    return MagicMock()


@pytest.fixture
def sample_profile():
    """Sample profile item from DynamoDB."""
    return {
        "PK": "USER#user-123",
        "SK": "PROFILE",
        "userId": "user-123",
        "email": "test@example.com",
        "displayName": "Test User",
        "shippingAddress": {
            "line1": "123 Main St",
            "city": "Toronto",
            "state": "ON",
            "postalCode": "M5V 1A1",
            "country": "CA",
        },
        "dashboardSettings": {
            "theme": "light",
            "notifications": True,
        },
        "stripeCustomerId": "cus_test123",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-11-26T12:00:00Z",
        # Sensitive fields that should be filtered
        "passwordHash": "hashed_password_value",
        "passwordSalt": "random_salt_value",
        "hashAlgorithm": "argon2id",
        "hashIterations": Decimal(100000),
    }


def make_event(
    method: str = "GET",
    user_id: str | None = "user-123",
    headers: Dict[str, str] | None = None,
) -> Dict[str, Any]:
    """Build a mock API Gateway event."""
    event: Dict[str, Any] = {
        "httpMethod": method,
        "headers": headers or {"origin": "https://thebabesclub.com"},
        "requestContext": {},
    }
    
    if user_id:
        event["requestContext"]["authorizer"] = {"userId": user_id}
    
    return event


# =============================================================================
# Tests
# =============================================================================

class TestOptionsRequest:
    """Test CORS preflight handling."""
    
    def test_returns_200_with_ok(self):
        """OPTIONS request returns 200 with ok body."""
        from lambda_function import lambda_handler
        
        event = make_event(method="OPTIONS")
        result = lambda_handler(event, None)
        
        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert body["ok"] is True
    
    def test_cors_headers_present(self):
        """OPTIONS response includes CORS headers."""
        from lambda_function import lambda_handler
        
        event = make_event(method="OPTIONS")
        result = lambda_handler(event, None)
        
        headers = result["headers"]
        assert "Access-Control-Allow-Origin" in headers
        assert "Access-Control-Allow-Methods" in headers


class TestUnauthorized:
    """Test authorization handling."""
    
    def test_missing_authorizer_returns_401(self):
        """Request without authorizer context returns 401."""
        from lambda_function import lambda_handler
        
        event = make_event(user_id=None)
        result = lambda_handler(event, None)
        
        assert result["statusCode"] == 401
        body = json.loads(result["body"])
        assert body["error"] == "Unauthorized"
    
    def test_empty_user_id_returns_401(self):
        """Request with empty userId returns 401."""
        from lambda_function import lambda_handler
        
        event = {
            "httpMethod": "GET",
            "headers": {},
            "requestContext": {"authorizer": {"userId": ""}},
        }
        result = lambda_handler(event, None)
        
        assert result["statusCode"] == 401


class TestMethodValidation:
    """Test HTTP method handling."""
    
    def test_post_returns_405(self):
        """POST request returns 405 Method Not Allowed."""
        from lambda_function import lambda_handler
        
        event = make_event(method="POST")
        result = lambda_handler(event, None)
        
        assert result["statusCode"] == 405
        body = json.loads(result["body"])
        assert body["error"] == "Method not allowed"
    
    def test_put_returns_405(self):
        """PUT request returns 405 Method Not Allowed."""
        from lambda_function import lambda_handler
        
        event = make_event(method="PUT")
        result = lambda_handler(event, None)
        
        assert result["statusCode"] == 405


class TestGetProfile:
    """Test profile retrieval."""
    
    @patch("lambda_function.get_commerce_table")
    def test_returns_profile_on_success(self, mock_get_table, sample_profile):
        """Successful request returns profile."""
        from lambda_function import lambda_handler
        
        mock_table = MagicMock()
        mock_table.get_item.return_value = {"Item": sample_profile}
        mock_get_table.return_value = mock_table
        
        event = make_event(user_id="user-123")
        result = lambda_handler(event, None)
        
        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert "profile" in body
        assert body["profile"]["userId"] == "user-123"
        assert body["profile"]["email"] == "test@example.com"
    
    @patch("lambda_function.get_commerce_table")
    def test_filters_sensitive_fields(self, mock_get_table, sample_profile):
        """Sensitive fields are removed from response."""
        from lambda_function import lambda_handler
        
        mock_table = MagicMock()
        mock_table.get_item.return_value = {"Item": sample_profile}
        mock_get_table.return_value = mock_table
        
        event = make_event(user_id="user-123")
        result = lambda_handler(event, None)
        
        body = json.loads(result["body"])
        profile = body["profile"]
        
        # These should be filtered out
        assert "PK" not in profile
        assert "SK" not in profile
        assert "passwordHash" not in profile
        assert "passwordSalt" not in profile
        assert "hashAlgorithm" not in profile
        assert "hashIterations" not in profile
        
        # These should remain
        assert "userId" in profile
        assert "email" in profile
        assert "displayName" in profile
        assert "shippingAddress" in profile
    
    @patch("lambda_function.get_commerce_table")
    def test_handles_decimal_values(self, mock_get_table):
        """Decimal values from DynamoDB are serialized correctly."""
        from lambda_function import lambda_handler
        
        mock_table = MagicMock()
        mock_table.get_item.return_value = {
            "Item": {
                "PK": "USER#user-123",
                "SK": "PROFILE",
                "userId": "user-123",
                "email": "test@example.com",
                "orderCount": Decimal(42),
                "totalSpent": Decimal("199.99"),
            }
        }
        mock_get_table.return_value = mock_table
        
        event = make_event(user_id="user-123")
        result = lambda_handler(event, None)
        
        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        
        # Decimal(42) should become int 42
        assert body["profile"]["orderCount"] == 42
        assert isinstance(body["profile"]["orderCount"], int)
        
        # Decimal("199.99") should become float
        assert body["profile"]["totalSpent"] == 199.99
    
    @patch("lambda_function.get_commerce_table")
    def test_returns_404_when_not_found(self, mock_get_table):
        """Returns 404 when profile doesn't exist."""
        from lambda_function import lambda_handler
        
        mock_table = MagicMock()
        mock_table.get_item.return_value = {}  # No Item
        mock_get_table.return_value = mock_table
        
        event = make_event(user_id="nonexistent-user")
        result = lambda_handler(event, None)
        
        assert result["statusCode"] == 404
        body = json.loads(result["body"])
        assert body["error"] == "Profile not found"
    
    @patch("lambda_function.get_commerce_table")
    def test_returns_500_on_database_error(self, mock_get_table):
        """Returns 500 when DynamoDB fails."""
        from lambda_function import lambda_handler
        
        mock_table = MagicMock()
        mock_table.get_item.side_effect = Exception("DynamoDB error")
        mock_get_table.return_value = mock_table
        
        event = make_event(user_id="user-123")
        result = lambda_handler(event, None)
        
        assert result["statusCode"] == 500
        body = json.loads(result["body"])
        assert body["error"] == "Database error"


class TestCorsHandling:
    """Test CORS origin handling."""
    
    @patch("lambda_function.get_commerce_table")
    @patch("lambda_function.resolve_origin")
    def test_uses_resolved_origin(self, mock_resolve, mock_get_table, sample_profile):
        """Response uses origin from resolve_origin."""
        from lambda_function import lambda_handler
        
        mock_resolve.return_value = "https://thebabesclub.com"
        mock_table = MagicMock()
        mock_table.get_item.return_value = {"Item": sample_profile}
        mock_get_table.return_value = mock_table
        
        event = make_event(user_id="user-123")
        result = lambda_handler(event, None)
        
        assert result["headers"]["Access-Control-Allow-Origin"] == "https://thebabesclub.com"


# =============================================================================
# Run Tests
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])