from django.db import models
from django.core.validators import MinValueValidator
from .company_model import Company
from .missions_model import Mission


class Application(models.Model):

    STATUS_CHOICES = [
        ('pending',   'En attente'),
        ('accepted',  'Acceptée'),
        ('rejected',  'Rejetée'),
        ('withdrawn', 'Retirée'),
    ]

    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name='applications',
    )

    # L'entreprise qui candidate
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='applications_sent',
    )

    cover_letter   = models.TextField(help_text="Message de candidature")
    proposed_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    estimated_days = models.PositiveIntegerField(help_text="Délai estimé en jours")

    apply_tva = models.BooleanField(default=False, help_text="Le prestataire applique-t-il la TVA ?")
    tva_rate  = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Taux de TVA en % (ex: 20.00 pour 20%)",
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [['mission', 'company']]  # Une seule candidature par mission par company
        indexes = [
            models.Index(fields=['mission']),
            models.Index(fields=['company']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.company.name} → {self.mission.title} ({self.get_status_display()})"
