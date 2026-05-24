from django.db import models
from User.models.company_model import Company


class Notification(models.Model):

    TYPE_CHOICES = [
        ('new_mission',           'Nouvelle mission disponible'),
        ('new_application',       'Nouvelle candidature reçue'),
        ('application_accepted',  'Candidature acceptée'),
        ('application_rejected',  'Candidature rejetée'),
        ('review_received',       'Avis reçu'),
    ]

    # Destinataire — l'entreprise qui reçoit la notif
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='notifications',
    )

    type    = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title   = models.CharField(max_length=255)
    message = models.TextField()

    # Données contextuelles (id mission, id candidature, etc.)
    data = models.JSONField(default=dict, blank=True)

    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['company']),
            models.Index(fields=['is_read']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"[{self.type}] → {self.company.name}"