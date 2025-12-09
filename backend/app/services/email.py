"""
Email service for sending transactional emails using Resend.
"""
import logging
from typing import Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending transactional emails via Resend API."""

    BASE_URL = "https://api.resend.com/emails"

    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_address = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>"
        self.app_url = settings.APP_URL

    @property
    def is_configured(self) -> bool:
        """Check if email sending is configured."""
        return bool(self.api_key)

    async def send_email(
        self,
        to: str,
        subject: str,
        html: str,
        text: Optional[str] = None,
    ) -> bool:
        """
        Send an email via Resend API.

        Args:
            to: Recipient email address
            subject: Email subject
            html: HTML content
            text: Plain text content (optional)

        Returns:
            True if email was sent successfully
        """
        if not self.is_configured:
            logger.warning("Email sending skipped - RESEND_API_KEY not configured")
            return False

        payload = {
            "from": self.from_address,
            "to": [to],
            "subject": subject,
            "html": html,
        }

        if text:
            payload["text"] = text

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.BASE_URL,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    timeout=10.0,
                )

                if response.status_code == 200:
                    logger.info(f"Email sent successfully to {to}")
                    return True
                else:
                    logger.error(f"Failed to send email: {response.status_code} - {response.text}")
                    return False

        except Exception as e:
            logger.error(f"Error sending email to {to}: {str(e)}")
            return False

    async def send_team_invite(
        self,
        to_email: str,
        to_name: Optional[str],
        organization_name: str,
        inviter_name: Optional[str],
        role: str,
    ) -> bool:
        """
        Send a team invitation email.

        Args:
            to_email: Invitee's email address
            to_name: Invitee's name (optional)
            organization_name: Name of the organization
            inviter_name: Name of the person sending the invite (optional)
            role: Role being assigned

        Returns:
            True if email was sent successfully
        """
        recipient_greeting = to_name or "there"
        inviter_display = inviter_name or "A team member"

        role_descriptions = {
            "admin": "full access and team management",
            "staff": "access to assigned clients and projects",
            "viewer": "read-only access to the organization",
        }
        role_description = role_descriptions.get(role, role)

        signup_url = f"{self.app_url}/signup?invite=true"

        subject = f"You've been invited to join {organization_name}"

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">You're Invited!</h1>
    </div>

    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hi {recipient_greeting},</p>

        <p style="font-size: 16px;">
            {inviter_display} has invited you to join <strong>{organization_name}</strong> on NexusCheck.
        </p>

        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">Your role will be:</p>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 600; color: #1e293b;">
                {role.title()} - {role_description}
            </p>
        </div>

        <p style="font-size: 16px;">
            Click the button below to accept this invitation and get started:
        </p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{signup_url}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Accept Invitation
            </a>
        </div>

        <p style="font-size: 14px; color: #64748b;">
            If the button doesn't work, copy and paste this link into your browser:
            <br>
            <a href="{signup_url}" style="color: #3b82f6; word-break: break-all;">{signup_url}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            This invitation was sent to {to_email}. If you weren't expecting this email, you can safely ignore it.
        </p>
    </div>
</body>
</html>
"""

        text = f"""
Hi {recipient_greeting},

{inviter_display} has invited you to join {organization_name} on NexusCheck.

Your role will be: {role.title()} - {role_description}

Accept your invitation: {signup_url}

If you weren't expecting this email, you can safely ignore it.
"""

        return await self.send_email(
            to=to_email,
            subject=subject,
            html=html,
            text=text,
        )


# Singleton instance
email_service = EmailService()
