from datetime import datetime


def get_career_notification_template(form_data, form_id, website_name, website_url):
    """Generate notification email template for career form submissions."""

    subject = f"{website_name}: New Job Application"

    # Handle both field name formats for position and location
    position = form_data.get("position") or form_data.get("interestType", "Not specified")
    location = form_data.get("preferredLocation") or form_data.get("cityState", "Not specified")

    body_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #b87333; color: white; padding: 15px; text-align: center; }}
            .content {{ padding: 20px; border: 1px solid #eaeaea; }}
            .footer {{ margin-top: 20px; font-size: 12px; color: #666; text-align: center; }}
            .details {{ margin-bottom: 20px; }}
            .label {{ font-weight: bold; color: #333; }}
            .highlight {{ background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin-bottom: 20px; }}
            .field-group {{ margin-bottom: 15px; }}
            table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
            td {{ padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }}
            .field-label {{ font-weight: bold; width: 30%; color: #555; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New Job Application</h2>
            </div>
            <div class="content">
                <div class="highlight">
                    <p><span class="label">Submission Time:</span> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p><span class="label">Form ID:</span> {form_id}</p>
                </div>

                <div class="details">
                    <h3 style="color: #b87333; border-bottom: 2px solid #b87333; padding-bottom: 5px;">Position Details</h3>
                    <table>
                        <tr>
                            <td class="field-label">Position Applied For:</td>
                            <td>{position}</td>
                        </tr>
                        <tr>
                            <td class="field-label">Preferred Location:</td>
                            <td>{location}</td>
                        </tr>
                        <tr>
                            <td class="field-label">Earliest Start Date:</td>
                            <td>{form_data.get('startDate', 'Not specified')}</td>
                        </tr>
                        <tr>
                            <td class="field-label">Weekend Availability:</td>
                            <td>{form_data.get('weekendAvailability', 'Not specified')}</td>
                        </tr>
                    </table>
                </div>

                <div class="details">
                    <h3 style="color: #b87333; border-bottom: 2px solid #b87333; padding-bottom: 5px;">Personal Information</h3>
                    <table>
                        <tr>
                            <td class="field-label">Name:</td>
                            <td>{form_data.get('firstName', '')} {form_data.get('lastName', '')}</td>
                        </tr>
                        <tr>
                            <td class="field-label">Email:</td>
                            <td><a href="mailto:{form_data.get('email', '')}">{form_data.get('email', '')}</a></td>
                        </tr>
                        <tr>
                            <td class="field-label">Phone:</td>
                            <td>{form_data.get('phone', 'Not provided')}</td>
                        </tr>
                        <tr>
                            <td class="field-label">Age Range:</td>
                            <td>{form_data.get('age', 'Not provided')}</td>
                        </tr>
                        <tr>
                            <td class="field-label">Address:</td>
                            <td>{form_data.get('address', 'Not provided')}</td>
                        </tr>
                        <tr>
                            <td class="field-label">Eligible to Work in US:</td>
                            <td>{form_data.get('eligibleToWork', 'Not specified')}</td>
                        </tr>
                    </table>
                </div>

                <div class="details">
                    <h3 style="color: #b87333; border-bottom: 2px solid #b87333; padding-bottom: 5px;">Employment History</h3>
                    <table>
                        <tr>
                            <td class="field-label">Previously Terminated:</td>
                            <td>{form_data.get('terminated', 'Not specified')}</td>
                        </tr>
                        {f'<tr><td class="field-label">Termination Explanation:</td><td>{form_data.get("terminationExplanation", "")}</td></tr>' if form_data.get('terminated') == 'yes' else ''}
                    </table>

                    <div class="field-group">
                        <span class="label">Work Experience:</span>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; white-space: pre-wrap;">{form_data.get('workExperience', 'Not provided')}</div>
                    </div>

                    <div class="field-group">
                        <span class="label">References:</span>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; white-space: pre-wrap;">{form_data.get('references', 'Not provided')}</div>
                    </div>
                </div>

                <hr style="margin: 20px 0; border: 1px solid #ddd;">
                <p style="text-align: center; font-weight: bold; color: #b87333;">Please review this application and contact the applicant if qualified.</p>
            </div>
            <div class="footer">
                <p>Form ID: {form_id}</p>
                <p>© {datetime.now().year} {website_name}</p>
                <p><a href="{website_url}">{website_url}</a></p>
            </div>
        </div>
    </body>
    </html>
    """

    body_text = f"""
    NEW JOB APPLICATION
    ==================

    Submission Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    Form ID: {form_id}

    POSITION DETAILS:
    ----------------
    Position Applied For: {position}
    Preferred Location: {location}
    Earliest Start Date: {form_data.get('startDate', 'Not specified')}
    Weekend Availability: {form_data.get('weekendAvailability', 'Not specified')}

    PERSONAL INFORMATION:
    --------------------
    Name: {form_data.get('firstName', '')} {form_data.get('lastName', '')}
    Email: {form_data.get('email', '')}
    Phone: {form_data.get('phone', 'Not provided')}
    Age Range: {form_data.get('age', 'Not provided')}
    Address: {form_data.get('address', 'Not provided')}
    Eligible to Work in US: {form_data.get('eligibleToWork', 'Not specified')}

    EMPLOYMENT HISTORY:
    ------------------
    Previously Terminated: {form_data.get('terminated', 'Not specified')}
    {f'Termination Explanation: {form_data.get("terminationExplanation", "")}' if form_data.get('terminated') == 'yes' else ''}

    Work Experience:
    {form_data.get('workExperience', 'Not provided')}

    References:
    {form_data.get('references', 'Not provided')}

    ==================
    Please review this application and contact the applicant if qualified.

    © {datetime.now().year} {website_name}
    {website_url}
    """

    return subject, body_html, body_text


def get_career_confirmation_template(form_data, website_name, website_url):
    """Generate confirmation email template for career form submissions."""

    subject = f"Thank you for your application - {website_name}"
    position = form_data.get("position") or form_data.get("interestType", "the position")

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
                <h2>Your Job Application Has Been Received</h2>
            </div>
            <div class="content">
                <p>Dear {form_data.get('firstName', '')},</p>

                <p>Thank you for your interest in joining the Nash & Smashed team! We've received your application for the <strong>{position}</strong> position.</p>

                <div class="steps">
                    <h3>What Happens Next:</h3>
                    <ol>
                        <li>Our hiring team will review your application within 3-5 business days.</li>
                        <li>If your qualifications match our needs, we'll reach out to schedule an interview.</li>
                        <li>If we determine there isn't a current fit, we'll keep your application on file for future opportunities.</li>
                    </ol>
                </div>

                <p>Please note that due to the high volume of applications, we may not be able to respond to every applicant individually. If you don't hear from us within two weeks, we encourage you to apply for future openings that match your skills and experience.</p>

                <p>If you have any questions about your application, please contact our HR team at <a href="mailto:info@nashandsmashed.com">info@nashandsmashed.com</a>.</p>

                <p>Best regards,</p>
                <p>The Nash & Smashed HR Team<br>{website_name}</p>
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
    YOUR JOB APPLICATION HAS BEEN RECEIVED

    Dear {form_data.get('firstName', '')},

    Thank you for your interest in joining the Nash & Smashed team! We've received your application for the {position} position.

    WHAT HAPPENS NEXT:
    1. Our hiring team will review your application within 3-5 business days.
    2. If your qualifications match our needs, we'll reach out to schedule an interview.
    3. If we determine there isn't a current fit, we'll keep your application on file for future opportunities.

    Please note that due to the high volume of applications, we may not be able to respond to every applicant individually. If you don't hear from us within two weeks, we encourage you to apply for future openings that match your skills and experience.

    If you have any questions about your application, please contact our HR team at accounting@nashandsmashed.com.

    Best regards,
    The Nash & Smashed HR Team
    {website_name}

    © {datetime.now().year} {website_name}
    {website_url}
    """

    return subject, body_html, body_text
