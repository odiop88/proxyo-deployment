from django.db import models
from django.utils import timezone
from datetime import timedelta
from User.models.missions_model import Mission


class MissionChannel(models.Model):
    mission = models.OneToOneField(
        Mission,
        on_delete=models.CASCADE,
        related_name='channel',
    )

    closed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date de fermeture du canal (completed_at + 7 jours)",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['mission']),
        ]

    @property
    def is_closed(self):
        if self.closed_at is None:
            return False
        return timezone.now() > self.closed_at

    def schedule_closing(self):
        """Appelé quand la mission passe à 'completed'. Ferme le canal dans 7 jours."""
        self.closed_at = timezone.now() + timedelta(days=7)
        self.save(update_fields=['closed_at'])

    def __str__(self):
        return f"Canal — {self.mission.title}"
