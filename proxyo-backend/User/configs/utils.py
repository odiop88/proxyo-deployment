import re
import secrets
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

# ============================================
# VALIDATIONS
# ============================================

def validate_siret(siret):
    if not siret or len(siret) != 14:
        return False
    if not siret.isdigit():
        return False
    return True

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not email:
        return False
    return bool(re.match(pattern, email))

def validate_password(password):
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    return True

# ============================================
# GÉNÉRATION DE TOKENS
# ============================================

def generate_verification_token():
    token = secrets.token_urlsafe(32)
    return token

# ============================================
# EMAILS
# ============================================

def send_verification_email(user, token):
    try:
        if not user or not token:
            logger.error("User ou token manquant")
            return False
        
        if not user.company:
            logger.error(f"L'utilisateur {user.email} n'a pas d'entreprise associée")
            return False
        
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        verification_url = f"{frontend_url}/verify-email-confirmation?token={token}"
        
        context = {
            'user_name': user.get_full_name() or user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'company_name': user.company.name,
            'verification_url': verification_url,
            'token': token,
            'expiry_hours': 24,
        }
        
        subject = f"Vérifiez votre email - {user.company.name}"
        
        html_message = render_to_string('emails/verify_email.html', context)
        
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')
        
        send_mail(
            subject=subject,
            message="",  # Message vide car on utilise html_message
            from_email=from_email,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Email envoyé à {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Erreur envoi email: {str(e)}")
        return False


def send_application_accepted_email(user, application):
    """
    Envoie un email au owner du prestataire pour l'informer
    que sa candidature a été acceptée et que le paiement est en attente.
    """
    try:
        payment = application.payment
        context = {
            'user_name':             user.first_name or user.email,
            'company_name':          user.company.name,
            'mission_title':         application.mission.title,
            'mission_city':          application.mission.city,
            'client_name':           application.mission.company.name,
            'proposed_price':        payment.proposed_price,
            'tva_rate':              payment.tva_rate,
            'tva_amount':            payment.tva_amount,
            'prestataire_receives':  payment.prestataire_receives,
        }

        subject      = f"Candidature acceptée — {application.mission.title}"
        html_message = render_to_string('emails/application_accepted.html', context)
        from_email   = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')

        send_mail(
            subject=subject,
            message="",
            from_email=from_email,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Email candidature acceptée envoyé à {user.email}")
        return True

    except Exception as e:
        logger.error(f"Erreur envoi email candidature acceptée : {str(e)}")
        return False


def send_mission_started_email(user, application):
    """
    Envoie un email au prestataire pour l'informer que le paiement
    a été confirmé et que la mission peut démarrer.
    """
    try:
        payment = application.payment
        context = {
            'user_name':             user.first_name or user.email,
            'company_name':          user.company.name,
            'mission_title':         application.mission.title,
            'mission_city':          application.mission.city,
            'client_name':           application.mission.company.name,
            'proposed_price':        payment.proposed_price,
            'tva_rate':              payment.tva_rate,
            'tva_amount':            payment.tva_amount,
            'prestataire_receives':  payment.prestataire_receives,
        }

        subject      = f"Mission démarrée — {application.mission.title}"
        html_message = render_to_string('emails/mission_started.html', context)
        from_email   = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')

        send_mail(
            subject=subject,
            message="",
            from_email=from_email,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Email mission démarrée envoyé à {user.email}")
        return True

    except Exception as e:
        logger.error(f"Erreur envoi email mission démarrée : {str(e)}")
        return False


def send_billing_confirmation_email(payment):
    """
    Envoie un email de confirmation de facturation au owner ET au contact_email
    de la company cliente après confirmation du paiement Stripe.
    """
    try:
        mission  = payment.application.mission
        company  = mission.company
        owner    = company.users.filter(role='owner').first()

        owner_email   = owner.email if owner else None
        company_email = company.contact_email

        recipients = list({e for e in [owner_email, company_email] if e})
        if not recipients:
            logger.warning(f"Aucun destinataire trouvé pour la facturation du payment {payment.id}")
            return False

        user_name = owner.first_name if owner else company.name

        context = {
            'user_name':        user_name,
            'company_name':     company.name,
            'mission_title':    mission.title,
            'prestataire_name': payment.application.company.name,
            'proposed_price':   payment.proposed_price,
            'tva_rate':         payment.tva_rate,
            'tva_amount':       payment.tva_amount,
            'platform_fee':     payment.platform_fee,
            'total_client_pays': payment.total_client_pays,
        }

        subject      = f"Confirmation de paiement — {mission.title}"
        html_message = render_to_string('emails/billing_confirmation.html', context)
        from_email   = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')

        send_mail(
            subject=subject,
            message="",
            from_email=from_email,
            recipient_list=recipients,
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Email facturation envoyé à {recipients} pour payment {payment.id}")
        return True

    except Exception as e:
        logger.error(f"Erreur envoi email facturation : {str(e)}")
        return False


def send_new_mission_email(user, mission):
    """
    Envoie un email à un utilisateur pour l'informer
    qu'une nouvelle mission est disponible dans son secteur.
    """
    try:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        mission_url  = f"{frontend_url}/missions/{mission.id}"

        context = {
            'user_name':    user.first_name or user.email,
            'company_name': user.company.name,
            'mission_title':  mission.title,
            'mission_city':   mission.city,
            'mission_sector': mission.get_sector_display(),
            'budget_min':     mission.budget_min,
            'budget_max':     mission.budget_max,
            'deadline':       mission.deadline,
            'posted_by':      mission.company.name,
            'mission_url':    mission_url,
        }

        subject      = f"Nouvelle mission disponible — {mission.title}"
        html_message = render_to_string('emails/new_mission.html', context)
        from_email   = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')

        send_mail(
            subject=subject,
            message="",
            from_email=from_email,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Email nouvelle mission envoyé à {user.email}")
        return True

    except Exception as e:
        logger.error(f"Erreur envoi email nouvelle mission : {str(e)}")
        return False