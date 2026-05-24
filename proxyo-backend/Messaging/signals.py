from django.db.models.signals import post_save
from django.dispatch import receiver
from User.models.missions_model import Mission
from Messaging.models.channel_model import MissionChannel


@receiver(post_save, sender=Mission)
def handle_mission_channel(sender, instance, **kwargs):
    """
    - Quand la mission passe à 'in_progress' → crée le canal
    - Quand la mission passe à 'completed'   → programme la fermeture dans 7 jours
    """
    if instance.status == 'in_progress':
        MissionChannel.objects.get_or_create(mission=instance)

    elif instance.status == 'completed':
        try:
            channel = instance.channel
            if channel.closed_at is None:
                channel.schedule_closing()
        except MissionChannel.DoesNotExist:
            pass
