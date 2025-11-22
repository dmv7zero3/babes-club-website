import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger()

def sanitize_input(input_string: str) -> str:
    """Sanitize input by removing potentially harmful content"""
    if not input_string:
        return ""
    
    # Remove HTML tags
    input_string = re.sub(r'<[^>]+>', '', input_string)
    
    # Remove script tags and their content
    input_string = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', input_string, flags=re.IGNORECASE)
    
    # Remove potential JavaScript
    input_string = re.sub(r'javascript:', '', input_string, flags=re.IGNORECASE)
    
    # Remove excessive whitespace
    input_string = re.sub(r'\s+', ' ', input_string).strip()
    
    return input_string

def detect_spam_content(form_data: Dict[str, Any]) -> List[str]:
    """Detect potential spam indicators in form submission"""
    spam_indicators = []
    
    # Spam keywords (common in spam emails)
    spam_keywords = [
        'bitcoin', 'cryptocurrency', 'crypto', 'forex', 'investment opportunity',
        'make money fast', 'click here', 'urgent', 'congratulations you have won',
        'nigerian prince', 'lottery', 'millions of dollars', 'bank transfer',
        'western union', 'money gram', 'advance fee', 'inheritance',
        'casino', 'gambling', 'viagra', 'cialis', 'rolex', 'replica',
        'weight loss', 'miracle cure', 'work from home', 'make $', 'earn $',
        'free money', 'no experience required', 'guaranteed income'
    ]
    
    # Suspicious domains (common temporary email providers)
    suspicious_domains = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
        'trashmail.com', 'throwaway.email', 'temp-mail.org', 'getnada.com',
        'maildrop.cc', 'sharklasers.com'
    ]
    
    # Check email domain
    email = form_data.get('email', '').lower()
    if email:
        domain = email.split('@')[-1] if '@' in email else ''
        if domain in suspicious_domains:
            spam_indicators.append(f"Suspicious email domain: {domain}")
    
    # Check all text fields for spam keywords
    text_fields = ['businessExperience', 'firstName', 'lastName', 'homeAddress']
    for field in text_fields:
        content = str(form_data.get(field, '')).lower()
        for keyword in spam_keywords:
            if keyword in content:
                spam_indicators.append(f"Spam keyword '{keyword}' found in {field}")
    
    # Check for excessive URLs
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    business_exp = str(form_data.get('businessExperience', ''))
    urls_found = re.findall(url_pattern, business_exp)
    if len(urls_found) > 2:
        spam_indicators.append(f"Excessive URLs found: {len(urls_found)} URLs")
    
    # Check for repetitive characters (common spam tactic)
    for field in text_fields:
        content = str(form_data.get(field, ''))
        if re.search(r'(.)\1{10,}', content):  # Same character repeated 10+ times
            spam_indicators.append(f"Repetitive characters found in {field}")
    
    # Check for phone number in business experience (suspicious)
    business_exp = str(form_data.get('businessExperience', ''))
    phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    if re.search(phone_pattern, business_exp):
        spam_indicators.append("Phone number found in business experience")
    
    # Check for excessive capitalization
    for field in text_fields:
        content = str(form_data.get(field, ''))
        if len(content) > 20 and sum(1 for c in content if c.isupper()) / len(content) > 0.5:
            spam_indicators.append(f"Excessive capitalization in {field}")
    
    return spam_indicators

def sanitize_form_data(form_data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize all form data fields"""
    sanitized_data = {}
    
    for key, value in form_data.items():
        if isinstance(value, str):
            sanitized_data[key] = sanitize_input(value)
        else:
            sanitized_data[key] = value
    
    return sanitized_data

def validate_email(email):
    """Validate email format"""
    if not email:
        return False
    
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return False
    
    return True

def validate_phone(phone):
    """Validate phone format if provided"""
    if not phone:
        return True
    phone_regex = r'^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$'
    return re.match(phone_regex, phone) is not None

def validate_franchise_request(event_body):
    """Validate franchise form submission data with sanitization"""
    # First sanitize the data
    sanitized_data = sanitize_form_data(event_body)
    
    errors = []
    
    # Check for honeypot field (bot detection)
    if sanitized_data.get('website') and sanitized_data.get('website').strip():
        errors.append("Invalid submission detected")
        return errors
    
    # Check required fields
    if not sanitized_data.get('firstName'):
        errors.append("First name is required")
    
    if not sanitized_data.get('lastName'):
        errors.append("Last name is required")
    
    if not sanitized_data.get('homeAddress'):
        errors.append("Home address is required")
    
    if not sanitized_data.get('areaOfInterest'):
        errors.append("Area of interest is required")
    
    if not sanitized_data.get('stateCountryOfInterest'):
        errors.append("State/country of interest is required")
    
    if not sanitized_data.get('cityOfInterest'):
        errors.append("City of interest is required")
    
    if not sanitized_data.get('stateOfResidence'):
        errors.append("State of residence is required")
    
    if not sanitized_data.get('cityOfResidence'):
        errors.append("City of residence is required")
        
    # Validate email
    email = sanitized_data.get('email')
    if not email:
        errors.append("Email is required")
    elif not validate_email(email):
        errors.append("Email address is invalid")
    
    # Validate phone
    phone = sanitized_data.get('phone')
    if not phone:
        errors.append("Phone number is required")
    elif not validate_phone(phone):
        errors.append("Phone number is invalid")
    
    if not sanitized_data.get('liquidCapital'):
        errors.append("Liquid capital is required")
    
    business_exp = sanitized_data.get('businessExperience')
    if not business_exp:
        errors.append("Business experience is required")
    elif len(business_exp.strip()) < 10:
        errors.append("Business experience must be at least 10 characters")
    
    # REMOVED: referralSource is now optional
    # No validation needed for referralSource - it's completely optional
    
    # Update the original event_body with sanitized data for further processing
    event_body.update(sanitized_data)
    
    return errors