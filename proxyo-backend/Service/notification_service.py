import logging
from User.models.notifications_model import Notification
from User.models.company_model import Company

logger = logging.getLogger(__name__)


def _create_notification(company, notif_type, title, message, data=None):
    """Fonction interne — crée une notification in-app."""
    return Notification.objects.create(
        company=company,
        type=notif_type,
        title=title,
        message=message,
        data=data or {},
    )


def notify_new_mission(mission):
    """
    Appelé après la création d'une mission.
    → Notifie (in-app + email) toutes les companies du même secteur
      qui sont actives et différentes du posteur.
    """
    from User.configs.utils import send_new_mission_email

    filters = {'sector': mission.sector, 'status': 'active'}
    if mission.postal_code:
        filters['postal_code__startswith'] = mission.postal_code[:2]

    companies = Company.objects.filter(**filters).exclude(pk=mission.company.pk)

    for company in companies:
        # 1. Notification in-app
        _create_notification(
            company=company,
            notif_type='new_mission',
            title='Nouvelle mission disponible',
            message=(
                f"Une nouvelle mission dans votre secteur "
                f"({mission.get_sector_display()}) vient d'être publiée : "
                f"\"{mission.title}\" — Budget {mission.budget_min}€ – {mission.budget_max}€."
            ),
            data={
                'mission_id':    mission.id,
                'mission_title': mission.title,
                'posted_by':     mission.company.name,
                'city':          mission.city,
                'budget_min':    str(mission.budget_min),
                'budget_max':    str(mission.budget_max),
                'deadline':      str(mission.deadline),
            },
        )

        # 2. Email → envoyé au owner de la company
        owner = company.users.filter(role='owner').first()
        if owner:
            send_new_mission_email(owner, mission)

    logger.info(
        f"Notifications envoyées à {companies.count()} entreprises "
        f"pour la mission '{mission.title}'"
    )


def notify_new_application(application):
    """
    Appelé après qu'une entreprise candidate à une mission.
    → Notifie le posteur de la mission.
    """
    mission = application.mission
    _create_notification(
        company=mission.company,
        notif_type='new_application',
        title='Nouvelle candidature reçue',
        message=(
            f"{application.company.name} a candidaté à votre mission "
            f"\"{mission.title}\" avec un devis de {application.proposed_price}€."
        ),
        data={
            'mission_id':      mission.id,
            'mission_title':   mission.title,
            'application_id':  application.id,
            'applicant':       application.company.name,
            'proposed_price':  str(application.proposed_price),
        },
    )


def notify_application_accepted(application):
    """
    Appelé quand une candidature est acceptée.
    → Notifie le candidat (in-app + email).
    """
    from User.configs.utils import send_application_accepted_email

    _create_notification(
        company=application.company,
        notif_type='application_accepted',
        title='Candidature acceptée',
        message=(
            f"Votre candidature pour \"{application.mission.title}\" "
            f"a été acceptée par {application.mission.company.name}. "
            f"La mission démarrera dès réception du paiement."
        ),
        data={
            'mission_id':    application.mission.id,
            'mission_title': application.mission.title,
            'client':        application.mission.company.name,
            'payment_id':    application.payment.id,
        },
    )

    owner = application.company.users.filter(role='owner').first()
    if owner:
        send_application_accepted_email(owner, application)


def notify_mission_pending_confirmation(application):
    """
    Appelé quand le prestataire marque la mission comme terminée.
    → Notifie le client pour qu'il confirme.
    """
    _create_notification(
        company=application.mission.company,
        notif_type='new_application',
        title='Mission en attente de confirmation',
        message=(
            f"{application.company.name} a marqué la mission "
            f"\"{application.mission.title}\" comme terminée. "
            f"Veuillez confirmer pour déclencher le paiement."
        ),
        data={
            'mission_id':    application.mission.id,
            'mission_title': application.mission.title,
        },
    )


def notify_mission_confirmed(application):
    """
    Appelé quand le client confirme la mission terminée.
    → Notifie le prestataire de renseigner ses coordonnées bancaires.
    """
    _create_notification(
        company=application.company,
        notif_type='new_mission',
        title='Mission confirmée — Renseignez vos coordonnées bancaires',
        message=(
            f"La mission \"{application.mission.title}\" a été confirmée. "
            f"Renseignez vos coordonnées bancaires pour recevoir votre paiement de "
            f"{application.payment.prestataire_receives} €."
        ),
        data={
            'mission_id':            application.mission.id,
            'mission_title':         application.mission.title,
            'prestataire_receives':  str(application.payment.prestataire_receives),
            'payment_id':            application.payment.id,
        },
    )


def notify_mission_started(application):
    """
    Appelé quand le paiement est confirmé (webhook payment_intent.succeeded).
    → Notifie le prestataire (in-app + email) que la mission peut démarrer.
    → Notifie le client (in-app) que son paiement a été reçu.
    """
    from User.configs.utils import send_mission_started_email

    # Notif in-app prestataire
    _create_notification(
        company=application.company,
        notif_type='new_mission',
        title='Mission démarrée',
        message=(
            f"Le paiement a été confirmé. La mission \"{application.mission.title}\" "
            f"peut maintenant démarrer."
        ),
        data={
            'mission_id':    application.mission.id,
            'mission_title': application.mission.title,
        },
    )

    # Email prestataire
    owner = application.company.users.filter(role='owner').first()
    if owner:
        send_mission_started_email(owner, application)

    # Notif in-app client
    _create_notification(
        company=application.mission.company,
        notif_type='new_mission',
        title='Paiement confirmé',
        message=(
            f"Votre paiement pour la mission \"{application.mission.title}\" "
            f"a bien été reçu. La mission est maintenant en cours."
        ),
        data={
            'mission_id':    application.mission.id,
            'mission_title': application.mission.title,
        },
    )


def notify_payment_failed(payment):
    """
    Appelé quand le paiement échoue (webhook payment_intent.payment_failed).
    → Notifie le client (posteur de la mission).
    """
    mission = payment.application.mission
    _create_notification(
        company=mission.company,
        notif_type='new_application',
        title='Échec du paiement',
        message=(
            f"Votre paiement pour la mission \"{mission.title}\" a échoué. "
            f"Veuillez réessayer."
        ),
        data={
            'mission_id':  mission.id,
            'payment_id':  payment.id,
        },
    )


def notify_application_rejected(application):
    """
    Appelé quand une candidature est rejetée.
    → Notifie le candidat.
    """
    _create_notification(
        company=application.company,
        notif_type='application_rejected',
        title='Candidature non retenue',
        message=(
            f"Votre candidature pour \"{application.mission.title}\" "
            f"n'a pas été retenue par {application.mission.company.name}."
        ),
        data={
            'mission_id':    application.mission.id,
            'mission_title': application.mission.title,
            'client':        application.mission.company.name,
        },
    )