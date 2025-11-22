# AWS_Lambda_Functions/babes-website-dashboard-get-profile/test_lambda_function.py

from lambda_function import lambda_handler

def test_lambda_handler_options():
    event = {"httpMethod": "OPTIONS"}
    result = lambda_handler(event, None)
    assert result["statusCode"] == 200
    assert "ok" in result["body"]

def test_lambda_handler_unauthorized():
    event = {"httpMethod": "GET", "requestContext": {"authorizer": {}}}
    result = lambda_handler(event, None)
    assert result["statusCode"] == 401