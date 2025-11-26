#!/usr/bin/env python3
"""
Test script for verifying order snapshot creation in the Stripe webhook handler.

This script simulates webhook events and validates that order snapshots are
correctly created in DynamoDB.

Usage:
    # Set environment variables
    export COMMERCE_TABLE=babesclub-commerce
    export AWS_REGION=us-east-1
    
    # Run tests
    python test_order_snapshot.py
    
    # Run with verbose output
    python test_order_snapshot.py -v
"""

import json
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from unittest.mock import MagicMock, patch

# Add Lambda function path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def create_mock_checkout_completed_event(
    session_id: str = None,
    user_id: str = None,
    customer_email: str = "test@example.com",
    amount_total: int = 10000,
    currency: str = "usd",
    line_items: list = None,
) -> Dict[str, Any]:
    """Create a mock checkout.session.completed webhook event."""
    
    if session_id is None:
        session_id = f"cs_test_{uuid.uuid4().hex}"
    
    metadata = {
        "quoteSignature": f"quote_{uuid.uuid4().hex[:16]}",
        "normalizedHash": f"hash_{uuid.uuid4().hex[:8]}",
    }
    if user_id:
        metadata["userId"] = user_id
    
    return {
        "id": f"evt_{uuid.uuid4().hex}",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": session_id,
                "status": "complete",
                "payment_status": "paid",
                "amount_total": amount_total,
                "amount_subtotal": amount_total,
                "currency": currency,
                "customer": f"cus_{uuid.uuid4().hex[:14]}",
                "customer_email": customer_email,
                "customer_details": {
                    "email": customer_email,
                    "phone": "+1234567890",
                },
                "payment_intent": f"pi_{uuid.uuid4().hex}",
                "metadata": metadata,
                "shipping_details": {
                    "name": "Test Customer",
                    "address": {
                        "line1": "123 Test St",
                        "line2": "Apt 4",
                        "city": "Test City",
                        "state": "TS",
                        "postal_code": "12345",
                        "country": "US",
                    },
                },
            }
        },
    }


def create_mock_line_items() -> Dict[str, Any]:
    """Create mock line items response from Stripe."""
    return {
        "data": [
            {
                "description": "Red Necklace",
                "quantity": 2,
                "amount_total": 6000,
                "amount_subtotal": 6000,
                "currency": "usd",
                "price": {
                    "id": "price_1SEzbLE2izAILc8xFMdUwAlm",
                    "unit_amount": 3000,
                    "currency": "usd",
                    "product": {
                        "id": "prod_TBMJ4DtUWw1BtC",
                        "name": "Red Necklace",
                        "metadata": {
                            "sku": "N-RED",
                            "collection": "necklaces",
                            "variant_id": "red",
                            "color": "Red",
                        },
                    },
                },
            },
            {
                "description": "Blue Earrings",
                "quantity": 1,
                "amount_total": 2500,
                "amount_subtotal": 2500,
                "currency": "usd",
                "price": {
                    "id": "price_1SEzbWE2izAILc8xqL5wMpZa",
                    "unit_amount": 2500,
                    "currency": "usd",
                    "product": {
                        "id": "prod_TBMKPTUQPzXNAW",
                        "name": "Blue Earrings",
                        "metadata": {
                            "sku": "E-BBL-SIL",
                            "collection": "earrings",
                            "variant_id": "bbl-sil",
                            "color": "Baby Blue",
                        },
                    },
                },
            },
        ]
    }


class MockDynamoDBTable:
    """Mock DynamoDB table for testing."""
    
    def __init__(self):
        self.items: Dict[str, Dict[str, Any]] = {}
        self.calls: list = []
    
    def get_item(self, Key: Dict[str, str], **kwargs) -> Dict[str, Any]:
        self.calls.append(("get_item", Key))
        pk = Key.get("PK", "")
        sk = Key.get("SK", "")
        key = f"{pk}|{sk}"
        item = self.items.get(key)
        return {"Item": item} if item else {}
    
    def put_item(self, Item: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        self.calls.append(("put_item", Item))
        pk = Item.get("PK", "")
        sk = Item.get("SK", "")
        key = f"{pk}|{sk}"
        self.items[key] = Item
        return {}
    
    def query(self, **kwargs) -> Dict[str, Any]:
        self.calls.append(("query", kwargs))
        # Return empty for simplicity
        return {"Items": []}
    
    def get_orders_for_user(self, user_id: str) -> list:
        """Helper to retrieve all orders for a user."""
        orders = []
        prefix = f"USER#{user_id}|ORDER#"
        for key, item in self.items.items():
            if key.startswith(prefix):
                orders.append(item)
        return orders


def test_order_snapshot_creation_with_user_id():
    """Test that order snapshot is created with userId from metadata."""
    print("\n=== Test: Order Snapshot Creation with userId ===")
    
    mock_table = MockDynamoDBTable()
    user_id = "user_12345"
    session_id = f"cs_test_{uuid.uuid4().hex}"
    
    # Import the function we're testing
    from lambda_function import _create_order_snapshot
    
    event = create_mock_checkout_completed_event(
        session_id=session_id,
        user_id=user_id,
        amount_total=8500,
    )
    
    data_object = event["data"]["object"]
    metadata = data_object["metadata"]
    
    # Mock Stripe line items fetch
    with patch("lambda_function._fetch_line_items_from_stripe") as mock_fetch:
        mock_fetch.return_value = [
            {
                "name": "Red Necklace",
                "quantity": 2,
                "unitPrice": 3000,
                "currency": "usd",
                "amountTotal": 6000,
                "sku": "N-RED",
            },
            {
                "name": "Blue Earrings",
                "quantity": 1,
                "unitPrice": 2500,
                "currency": "usd",
                "amountTotal": 2500,
                "sku": "E-BBL-SIL",
            },
        ]
        
        order = _create_order_snapshot(
            stripe_session_id=session_id,
            data_object=data_object,
            metadata=metadata,
            quote_signature=metadata.get("quoteSignature"),
            processed_at=datetime.now(timezone.utc).isoformat(),
            table=mock_table,
        )
    
    # Assertions
    assert order is not None, "Order should be created"
    assert order["userId"] == user_id, f"Expected userId={user_id}, got {order['userId']}"
    assert order["PK"] == f"USER#{user_id}", f"Expected PK=USER#{user_id}"
    assert order["SK"].startswith("ORDER#"), "SK should start with ORDER#"
    assert order["status"] == "completed", "Status should be completed"
    assert order["amount"] == 8500, f"Expected amount=8500, got {order['amount']}"
    assert order["orderNumber"].startswith("BC-"), "Order number should start with BC-"
    assert len(order["items"]) == 2, f"Expected 2 items, got {len(order['items'])}"
    
    # Verify stored in mock table
    stored_orders = mock_table.get_orders_for_user(user_id)
    assert len(stored_orders) == 1, f"Expected 1 stored order, got {len(stored_orders)}"
    
    print(f"✅ Order created successfully:")
    print(f"   - Order Number: {order['orderNumber']}")
    print(f"   - User ID: {order['userId']}")
    print(f"   - Amount: {order['amount']} {order['currency']}")
    print(f"   - Items: {order['itemCount']}")
    print(f"   - PK: {order['PK']}")
    print(f"   - SK: {order['SK']}")


def test_order_snapshot_fallback_to_email():
    """Test that order snapshot uses email when userId is not provided."""
    print("\n=== Test: Order Snapshot Fallback to Email ===")
    
    mock_table = MockDynamoDBTable()
    customer_email = "guest@example.com"
    session_id = f"cs_test_{uuid.uuid4().hex}"
    
    from lambda_function import _create_order_snapshot
    
    event = create_mock_checkout_completed_event(
        session_id=session_id,
        user_id=None,  # No userId
        customer_email=customer_email,
        amount_total=5000,
    )
    
    data_object = event["data"]["object"]
    metadata = data_object["metadata"]
    
    with patch("lambda_function._fetch_line_items_from_stripe") as mock_fetch:
        mock_fetch.return_value = [
            {"name": "Test Item", "quantity": 1, "unitPrice": 5000, "currency": "usd"}
        ]
        
        order = _create_order_snapshot(
            stripe_session_id=session_id,
            data_object=data_object,
            metadata=metadata,
            quote_signature=metadata.get("quoteSignature"),
            processed_at=datetime.now(timezone.utc).isoformat(),
            table=mock_table,
        )
    
    assert order is not None, "Order should be created"
    assert order["userId"] == customer_email, f"Expected userId={customer_email}"
    assert order["PK"] == f"USER#{customer_email}", "PK should use email"
    
    print(f"✅ Order created with email fallback:")
    print(f"   - User ID (email): {order['userId']}")


def test_order_number_generation():
    """Test order number generation format."""
    print("\n=== Test: Order Number Generation ===")
    
    from lambda_function import _generate_order_number
    
    test_cases = [
        ("cs_test_a1B2c3D4e5F6g7H8", "BC-E5F6G7H8"),
        ("cs_live_ABCDEFGH12345678", "BC-12345678"),
        ("cs_test_short", "BC-ST_SHORT"),  # Handles short IDs
        ("", "BC-"),  # Handles empty (will use timestamp)
    ]
    
    for session_id, expected_prefix in test_cases:
        result = _generate_order_number(session_id)
        assert result.startswith("BC-"), f"Order number should start with BC-: {result}"
        print(f"   {session_id[-20:]:>20} → {result}")
    
    print("✅ Order number generation works correctly")


def test_shipping_address_extraction():
    """Test that shipping address is correctly extracted."""
    print("\n=== Test: Shipping Address Extraction ===")
    
    mock_table = MockDynamoDBTable()
    session_id = f"cs_test_{uuid.uuid4().hex}"
    
    from lambda_function import _create_order_snapshot
    
    event = create_mock_checkout_completed_event(
        session_id=session_id,
        user_id="user_with_shipping",
    )
    
    data_object = event["data"]["object"]
    metadata = data_object["metadata"]
    
    with patch("lambda_function._fetch_line_items_from_stripe") as mock_fetch:
        mock_fetch.return_value = []
        
        order = _create_order_snapshot(
            stripe_session_id=session_id,
            data_object=data_object,
            metadata=metadata,
            quote_signature=None,
            processed_at=datetime.now(timezone.utc).isoformat(),
            table=mock_table,
        )
    
    assert order is not None, "Order should be created"
    assert "shippingAddress" in order, "Order should have shipping address"
    
    addr = order["shippingAddress"]
    assert addr["name"] == "Test Customer"
    assert addr["line1"] == "123 Test St"
    assert addr["city"] == "Test City"
    assert addr["state"] == "TS"
    assert addr["postalCode"] == "12345"
    assert addr["country"] == "US"
    
    print(f"✅ Shipping address extracted correctly:")
    print(f"   {addr['name']}")
    print(f"   {addr['line1']}")
    print(f"   {addr['city']}, {addr['state']} {addr['postalCode']}")


def run_all_tests():
    """Run all tests."""
    print("=" * 60)
    print("Order Snapshot Creation Tests")
    print("=" * 60)
    
    tests = [
        test_order_number_generation,
        test_order_snapshot_creation_with_user_id,
        test_order_snapshot_fallback_to_email,
        test_shipping_address_extraction,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"❌ FAILED: {test.__name__}")
            print(f"   Error: {e}")
            failed += 1
        except Exception as e:
            print(f"❌ ERROR: {test.__name__}")
            print(f"   Exception: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return failed == 0


if __name__ == "__main__":
    # Check if we're running in verbose mode
    verbose = "-v" in sys.argv or "--verbose" in sys.argv
    
    if verbose:
        import logging
        logging.basicConfig(level=logging.DEBUG)
    
    success = run_all_tests()
    sys.exit(0 if success else 1)
