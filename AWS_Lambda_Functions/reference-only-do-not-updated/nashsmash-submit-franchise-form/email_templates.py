from datetime import datetime

def get_franchise_notification_template(form_data, form_id, website_name, website_url):
    """Generate notification email template for franchise form submissions"""
    
    subject = f"{website_name}: New Franchise Inquiry"
    
    # Format form data for nice display
    liquid_capital = form_data.get('liquidCapital', 'Not specified')
    business_exp = form_data.get('businessExperience', 'Not specified')
    
    body_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #b87333; color: white; padding: 15px; text-align: center; }}
            .content {{ padding: 20px; border: 1px solid #eaeaea; }}
            .footer {{ margin-top: 20px; font-size: 12px; color: #666; text-align: center; }}
            .details {{ margin-bottom: 15px; }}
            .label {{ font-weight: bold; }}
            .highlight {{ background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-bottom: 15px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New Franchise Inquiry</h2>
            </div>
            <div class="content">
                <div class="highlight">
                    <p><span class="label">Submission Time:</span> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p><span class="label">Area of Interest:</span> {form_data.get('areaOfInterest', 'Not specified')}</p>
                    <p><span class="label">Location of Interest:</span> {form_data.get('cityOfInterest', '')}, {form_data.get('stateCountryOfInterest', '')}</p>
                </div>
                
                <div class="details">
                    <h3>Contact Information</h3>
                    <p><span class="label">Name:</span> {form_data.get('firstName', '')} {form_data.get('lastName', '')}</p>
                    <p><span class="label">Email:</span> <a href="mailto:{form_data.get('email', '')}">{form_data.get('email', '')}</a></p>
                    <p><span class="label">Phone:</span> {form_data.get('phone', 'Not provided')}</p>
                    <p><span class="label">Home Address:</span> {form_data.get('homeAddress', 'Not provided')}</p>
                    <p><span class="label">Current Location:</span> {form_data.get('cityOfResidence', '')}, {form_data.get('stateOfResidence', '')}</p>
                </div>
                
                <div class="details">
                    <h3>Financial & Business Information</h3>
                    <p><span class="label">Available Liquid Capital:</span> {liquid_capital}</p>
                    <p><span class="label">Business Experience:</span> {business_exp}</p>
                    <p><span class="label">Referral Source:</span> {form_data.get('referralSource', 'Not specified')}</p>
                </div>
                
                <hr>
                <p>Please respond to this franchise inquiry as soon as possible.</p>
            </div>
            <div class="footer">
                <p>Form ID: {form_id}</p>
                <p>© {datetime.now().year} {website_name}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    body_text = f"""
    NEW FRANCHISE INQUIRY
    
    Submission Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    Form ID: {form_id}
    
    FRANCHISE DETAILS:
    Area of Interest: {form_data.get('areaOfInterest', 'Not specified')}
    Location of Interest: {form_data.get('cityOfInterest', '')}, {form_data.get('stateCountryOfInterest', '')}
    
    CONTACT INFORMATION:
    Name: {form_data.get('firstName', '')} {form_data.get('lastName', '')}
    Email: {form_data.get('email', '')}
    Phone: {form_data.get('phone', 'Not provided')}
    Home Address: {form_data.get('homeAddress', 'Not provided')}
    Current Location: {form_data.get('cityOfResidence', '')}, {form_data.get('stateOfResidence', '')}
    
    FINANCIAL & BUSINESS INFORMATION:
    Available Liquid Capital: {liquid_capital}
    Business Experience: {business_exp}
    Referral Source: {form_data.get('referralSource', 'Not specified')}
    
    Please respond to this franchise inquiry as soon as possible.
    """
    
    return subject, body_html, body_text

def get_franchise_confirmation_template(form_data, website_name, website_url):
    """Generate confirmation email template for franchise form submissions"""
    
    subject = f"Thank you for your franchise inquiry - {website_name}"
    
    body_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #b87333; color: white; padding: 15px; text-align: center; }}
            .content {{ padding: 20px; border: 1px solid #eaeaea; }}
            .footer {{ margin-top: 20px; font-size: 12px; color: #666; text-align: center; }}
            .steps {{ background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            .steps h3 {{ color: #b87333; margin-top: 0; }}
            .steps ol {{ padding-left: 20px; }}
            .steps li {{ margin-bottom: 10px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Your Franchise Inquiry Has Been Received</h2>
            </div>
            <div class="content">
                <p>Dear {form_data.get('firstName', '')},</p>
                
                <p>Thank you for your interest in joining the Nash & Smashed franchise family! We've received your franchise inquiry and we're excited to discuss this opportunity with you.</p>
                
                <div class="steps">
                    <h3>Next Steps:</h3>
                    <ol>
                        <li>Our franchise development team will review your inquiry within 1-2 business days.</li>
                        <li>A member of our team will reach out to you directly to discuss your interest and answer your initial questions.</li>
                        <li>We'll provide you with our Franchise Disclosure Document and additional information about the investment opportunity.</li>
                        <li>We'll schedule a more detailed conversation to explore how Nash & Smashed might fit with your business goals.</li>
                    </ol>
                </div>
                
                <p>If you have any immediate questions, please feel free to contact our Franchise Development Office at <a href="mailto:info@nashandsmashed.com">info@nashandsmashed.com</a>.</p>
                
                <p>We look forward to getting to know you and exploring the possibility of bringing Nash & Smashed to {form_data.get('cityOfInterest', 'your area')}!</p>
                
                <p>Warm regards,</p>
                <p>The Nash & Smashed Franchise Development Team<br>{website_name}</p>
            </div>
            <div class="footer">
                <p>© {datetime.now().year} {website_name}</p>
                <p><a href="{website_url}">{website_url}</a></p>
            </div>
        </div>
    </body>
    </html>
    """
    
    body_text = f"""
    YOUR FRANCHISE INQUIRY HAS BEEN RECEIVED
    
    Dear {form_data.get('firstName', '')},
    
    Thank you for your interest in joining the Nash & Smashed franchise family! We've received your franchise inquiry and we're excited to discuss this opportunity with you.
    
    NEXT STEPS:
    1. Our franchise development team will review your inquiry within 1-2 business days.
    2. A member of our team will reach out to you directly to discuss your interest and answer your initial questions.
    3. We'll provide you with our Franchise Disclosure Document and additional information about the investment opportunity.
    4. We'll schedule a more detailed conversation to explore how Nash & Smashed might fit with your business goals.
    
    If you have any immediate questions, please feel free to contact our Franchise Development Office at franchise@nashandsmashed.com.
    
    We look forward to getting to know you and exploring the possibility of bringing Nash & Smashed to {form_data.get('cityOfInterest', 'your area')}!
    
    Warm regards,
    The Nash & Smashed Franchise Development Team
    {website_name}
    
    © {datetime.now().year} {website_name}
    {website_url}
    """
    
    return subject, body_html, body_text