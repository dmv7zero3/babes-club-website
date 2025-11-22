import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

SPAM_KEYWORDS = [
    "viagra",
    "casino",
    "porn",
    "bitcoin",
    "crypto",
    "loan",
    "debt",
    "make money fast",
    "free money",
    "click here",
    "urgent",
    "congratulations",
    "winner",
    "prize",
]

BLOCKED_DOMAINS = [
    "tempmail.org",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "throwaway.email",
]


def validate_email(email: str | None) -> bool:
    if not email:
        return False
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_regex, email):
        return False
    email_lower = email.lower()
    return not any(domain in email_lower for domain in BLOCKED_DOMAINS)


def validate_phone(phone: str | None) -> bool:
    if not phone:
        return True
    digits_only = re.sub(r"\D", "", phone)
    return len(digits_only) in (10, 11)


def validate_name_length(name: str | None) -> bool:
    if not name:
        return False
    return len(name.strip()) <= 100


def sanitize_input(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    clean_value = re.sub(r"<[^>]*>", "", value)
    clean_value = re.sub(r"javascript:", "", clean_value, flags=re.IGNORECASE)
    clean_value = re.sub(r"on\w+\s*=", "", clean_value, flags=re.IGNORECASE)
    if len(clean_value) > 1000:
        clean_value = clean_value[:1000]
    return clean_value.strip()


def detect_spam_content(form_data: Dict[str, Any]) -> List[str]:
    indicators: List[str] = []
    text_fields = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "address",
        "position",
        "workExperience",
        "references",
    ]
    for field in text_fields:
        if field in form_data:
            content = str(form_data[field]).lower()
            for keyword in SPAM_KEYWORDS:
                if keyword in content:
                    indicators.append(f"Spam keyword '{keyword}' found in {field}")

    email_value = (form_data.get("email") or "").lower()
    for domain in BLOCKED_DOMAINS:
        if domain in email_value:
            indicators.append(f"Suspicious email domain: {domain}")

    url_pattern = re.compile(r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+")
    for field in ["firstName", "lastName", "workExperience", "references"]:
        if field in form_data:
            urls = url_pattern.findall(str(form_data[field]))
            if len(urls) > 2:
                indicators.append(f"Too many URLs in {field}: {len(urls)}")

    for field in ["firstName", "lastName", "workExperience"]:
        if field in form_data:
            content = str(form_data[field])
            if re.search(r"(.)\1{4,}", content):
                indicators.append(f"Repetitive characters in {field}")

    if form_data.get("website"):
        indicators.append("Honeypot field filled (likely bot)")

    return indicators


def sanitize_form_data(form_data: Dict[str, Any]) -> Dict[str, Any]:
    sanitized: Dict[str, Any] = {}
    for key, value in form_data.items():
        if isinstance(value, str):
            sanitized[key] = sanitize_input(value)
        elif isinstance(value, list):
            sanitized[key] = [sanitize_input(item) if isinstance(item, str) else item for item in value]
        else:
            sanitized[key] = value
    return sanitized


def validate_career_request(event_body: Dict[str, Any]) -> List[str]:
    errors = {}
    sanitized_body = sanitize_form_data(event_body)

    if not sanitized_body.get("firstName"):
        errors["firstName"] = "First name is required"
    elif not validate_name_length(sanitized_body.get("firstName")):
        errors["firstName"] = "First name is too long (max 100 characters)"

    if not sanitized_body.get("lastName"):
        errors["lastName"] = "Last name is required"
    elif not validate_name_length(sanitized_body.get("lastName")):
        errors["lastName"] = "Last name is too long (max 100 characters)"

    if not sanitized_body.get("eligibleToWork"):
        errors["eligibleToWork"] = "Work eligibility is required"

    if not sanitized_body.get("address"):
        errors["address"] = "Address is required"

    if not sanitized_body.get("cityState") and not sanitized_body.get("preferredLocation"):
        errors["cityState"] = "Preferred location is required"

    if not sanitized_body.get("age"):
        errors["age"] = "Age information is required"

    if not sanitized_body.get("interestType") and not sanitized_body.get("position"):
        errors["interestType"] = "Position interest is required"

    if not sanitized_body.get("weekendAvailability"):
        errors["weekendAvailability"] = "Weekend availability is required"

    if not sanitized_body.get("startDate"):
        errors["startDate"] = "Start date is required"

    if not sanitized_body.get("terminated"):
        errors["terminated"] = "Previous termination information is required"

    if sanitized_body.get("terminated") == "yes" and not sanitized_body.get("terminationExplanation"):
        errors["terminationExplanation"] = "Termination explanation is required"

    if not sanitized_body.get("workExperience"):
        errors["workExperience"] = "Work experience is required"

    if not sanitized_body.get("references"):
        errors["references"] = "References are required"

    email_value = sanitized_body.get("email")
    if not email_value:
        errors["email"] = "Email is required"
    elif not validate_email(email_value):
        errors["email"] = "Email address is invalid or from a blocked domain"

    phone_value = sanitized_body.get("phone")
    if not phone_value:
        errors["phone"] = "Phone number is required"
    elif not validate_phone(phone_value):
        errors["phone"] = "Phone number format is invalid"

    notification_emails = sanitized_body.get("notificationEmails")
    if notification_emails:
        if isinstance(notification_emails, list):
            for entry in notification_emails:
                if entry and not validate_email(entry):
                    errors["notificationEmails"] = "One or more notification emails are invalid"
                    break
        elif isinstance(notification_emails, str) and not validate_email(notification_emails):
            errors["notificationEmails"] = "Notification email is invalid"

    event_body.update(sanitized_body)
    return list(errors.values())
