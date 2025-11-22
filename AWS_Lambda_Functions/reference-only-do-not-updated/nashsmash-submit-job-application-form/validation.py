import re
import logging

logger = logging.getLogger()

# Spam protection patterns
SPAM_KEYWORDS = [
    'viagra', 'casino', 'porn', 'bitcoin', 'crypto', 'loan', 'debt',
    'make money fast', 'free money', 'click here',
    'urgent', 'congratulations', 'winner', 'prize'
]

BLOCKED_DOMAINS = [
    'tempmail.org', '10minutemail.com', 'guerrillamail.com', 
    'mailinator.com', 'throwaway.email'
]

def validate_email(email):
    """Validate email format"""
    if not email:
        return False
    
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return False
    
    # Check for blocked domains
    email_lower = email.lower()
    for domain in BLOCKED_DOMAINS:
        if domain in email_lower:
            return False
    
    return True

def validate_phone(phone):
    """Validate phone format if provided"""
    if not phone:
        return True
    
    # Remove non-digits and check length
    digits_only = re.sub(r'\D', '', phone)
    return len(digits_only) in [10, 11]

def validate_name_length(name):
    """Validate name length (max 100 chars)"""
    if not name:
        return False
    return len(name.strip()) <= 100

def sanitize_input(value):
    """Remove HTML/script tags and sanitize content"""
    if not isinstance(value, str):
        return value
    
    # Remove HTML tags
    clean_value = re.sub(r'<[^>]*>', '', value)
    
    # Remove script content
    clean_value = re.sub(r'javascript:', '', clean_value, flags=re.IGNORECASE)
    clean_value = re.sub(r'on\w+\s*=', '', clean_value, flags=re.IGNORECASE)
    
    # Check for spam keywords
    for keyword in SPAM_KEYWORDS:
        if keyword.lower() in clean_value.lower():
            logger.warning(f"Spam keyword detected: {keyword}")
            # Don't block immediately, just log
    
    # Limit length and return
    if len(clean_value) > 1000:
        clean_value = clean_value[:1000]
    
    return clean_value.strip()

def detect_spam_content(form_data):
    """Detect spam in form content"""
    spam_indicators = []
    
    # Check for spam keywords in text fields
    text_fields = ['firstName', 'lastName', 'email', 'phone', 'address', 'position', 'workExperience', 'references']
    for field in text_fields:
        if field in form_data:
            content = str(form_data[field]).lower()
            for keyword in SPAM_KEYWORDS:
                if keyword in content:
                    spam_indicators.append(f"Spam keyword '{keyword}' found in {field}")
    
    # Check for suspicious email domains
    email = form_data.get('email', '').lower()
    for domain in BLOCKED_DOMAINS:
        if domain in email:
            spam_indicators.append(f"Suspicious email domain: {domain}")
    
    # Check for excessive URLs
    url_pattern = re.compile(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')
    for field in ['firstName', 'lastName', 'workExperience', 'references']:
        if field in form_data:
            urls = url_pattern.findall(str(form_data[field]))
            if len(urls) > 2:  # Allow max 2 URLs in any field
                spam_indicators.append(f"Too many URLs in {field}: {len(urls)}")
    
    # Check for repetitive characters
    for field in ['firstName', 'lastName', 'workExperience']:
        if field in form_data:
            content = str(form_data[field])
            # Check for 5+ consecutive same characters
            if re.search(r'(.)\1{4,}', content):
                spam_indicators.append(f"Repetitive characters in {field}")
    
    # Check honeypot field
    if form_data.get('website'):  # Honeypot field should be empty
        spam_indicators.append("Honeypot field filled (likely bot)")
    
    return spam_indicators

def sanitize_form_data(form_data):
    """Sanitize all form data"""
    sanitized = {}
    for key, value in form_data.items():
        if isinstance(value, str):
            sanitized[key] = sanitize_input(value)
        elif isinstance(value, list):
            sanitized[key] = [sanitize_input(item) if isinstance(item, str) else item for item in value]
        else:
            sanitized[key] = value
    return sanitized

def validate_career_request(event_body):
    """Validate career form submission data with enhanced security"""
    errors = {}
    
    # Sanitize input first
    sanitized_body = sanitize_form_data(event_body)
    
    # Check required fields with length validation
    if not sanitized_body.get('firstName'):
        errors['firstName'] = "First name is required"
    elif not validate_name_length(sanitized_body.get('firstName')):
        errors['firstName'] = "First name is too long (max 100 characters)"
    
    if not sanitized_body.get('lastName'):
        errors['lastName'] = "Last name is required"
    elif not validate_name_length(sanitized_body.get('lastName')):
        errors['lastName'] = "Last name is too long (max 100 characters)"
    
    if not sanitized_body.get('eligibleToWork'):
        errors['eligibleToWork'] = "Work eligibility is required"
    
    if not sanitized_body.get('address'):
        errors['address'] = "Address is required"
    
    # Check for both possible field names for location (frontend sends both)
    if not sanitized_body.get('cityState') and not sanitized_body.get('preferredLocation'):
        errors['cityState'] = "Preferred location is required"
    
    if not sanitized_body.get('age'):
        errors['age'] = "Age information is required"
    
    # Check for both possible field names for position (frontend sends both)
    if not sanitized_body.get('interestType') and not sanitized_body.get('position'):
        errors['interestType'] = "Position interest is required"
    
    if not sanitized_body.get('weekendAvailability'):
        errors['weekendAvailability'] = "Weekend availability is required"
    
    if not sanitized_body.get('startDate'):
        errors['startDate'] = "Start date is required"
    
    if not sanitized_body.get('terminated'):
        errors['terminated'] = "Previous termination information is required"
    
    # If terminated is 'yes', explanation should be required
    if sanitized_body.get('terminated') == 'yes' and not sanitized_body.get('terminationExplanation'):
        errors['terminationExplanation'] = "Termination explanation is required"
    
    if not sanitized_body.get('workExperience'):
        errors['workExperience'] = "Work experience is required"
    
    if not sanitized_body.get('references'):
        errors['references'] = "References are required"
        
    # Validate email
    email = sanitized_body.get('email')
    if not email:
        errors['email'] = "Email is required"
    elif not validate_email(email):
        errors['email'] = "Email address is invalid or from a blocked domain"
    
    # Validate phone
    phone = sanitized_body.get('phone')
    if not phone:
        errors['phone'] = "Phone number is required"
    elif not validate_phone(phone):
        errors['phone'] = "Phone number format is invalid"
    
    # Validate notification emails if present
    notification_emails = sanitized_body.get('notificationEmails')
    if notification_emails:
        if isinstance(notification_emails, list):
            for email in notification_emails:
                if email and not validate_email(email):
                    errors['notificationEmails'] = "One or more notification emails are invalid"
                    break
        elif isinstance(notification_emails, str) and not validate_email(notification_emails):
            errors['notificationEmails'] = "Notification email is invalid"
    
    # Update the original event_body with sanitized data
    event_body.update(sanitized_body)
    
    # Convert to list format if needed
    if errors:
        return list(errors.values())
    
    return []