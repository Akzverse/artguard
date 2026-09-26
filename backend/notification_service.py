"""
ArtGuard Notification Service
Handles email notifications to users when their artwork analysis completes.
Matches the Notification Service (SMTP Email) component in the system architecture.
"""

import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def send_analysis_complete_notification(artwork, analysis):
    """
    Sends an email notification to the artwork submitter once AI analysis finishes.
    Includes verdict, confidence score, and verification details.
    """
    user = artwork.uploaded_by
    recipient_email = getattr(user, 'email', None)

    if not recipient_email:
        logger.info(f"No email registered for user '{user.username}', skipping email notification.")
        return False

    verdict = "LIKELY AUTHENTIC" if analysis.is_likely_authentic else "POTENTIAL FORGERY DETECTED"
    confidence_pct = analysis.confidence_score * 100
    style_pct = analysis.style_match_score * 100

    subject = f"[ArtGuard] AI Verification Complete: {artwork.title}"
    message = f"""Hello {user.username},

Your submitted artwork has completed AI forensic verification via the ArtGuard ResNet50 deep learning pipeline.

--- ANALYSIS SUMMARY ---
Artwork: {artwork.title}
Claimed Artist: {artwork.claimed_artist}
Period: {artwork.period}

Forensic Verdict: {verdict}
Authenticity Confidence: {confidence_pct:.1f}%
Style Consistency Match: {style_pct:.1f}%
Model Architecture: {analysis.model_version}

You can view the full interactive Grad-CAM heatmap visualization and download the official PDF report by logging into your ArtGuard dashboard at http://localhost:3000.

Best regards,
The ArtGuard Forensic Verification Team
"""

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'notifications@artguard.local')
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[recipient_email],
            fail_silently=True,
        )
        logger.info(f"Analysis completion email sent to {recipient_email} for artwork #{artwork.id}.")
        return True
    except Exception as e:
        logger.warning(f"Failed to send email notification: {e}")
        return False
