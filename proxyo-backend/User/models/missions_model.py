from django.db import models
from django.core.validators import MinValueValidator, RegexValidator
from django.utils import timezone
from .company_model import Company


class Mission(models.Model):

    STATUS_CHOICES = [
        ('open',                 'Ouverte'),
        ('pending_payment',      'En attente de paiement'),
        ('in_progress',          'En cours'),
        ('pending_confirmation', 'En attente de confirmation'),
        ('completed',            'Terminée'),
        ('cancelled',            'Annulée'),
        ('expired',              'Expirée'),
    ]
   

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='missions_posted',
    )

    title       = models.CharField(max_length=255)
    description = models.TextField()


    sector = models.CharField(
        max_length=50,
        choices=Company.SECTOR_CHOICES,
    )

    city        = models.CharField(max_length=100)
    postal_code = models.CharField(
        max_length=5,
        blank=True,
        null=True,
        validators=[RegexValidator(r'^\d{5}$', 'Code postal invalide (5 chiffres)')],
        help_text="Code postal du lieu de la mission",
    )
    budget_min = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    budget_max = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    deadline   = models.DateField()
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sector']),
            models.Index(fields=['status']),
            models.Index(fields=['company']),
        ]

    def __str__(self):
        return f"{self.title} — {self.company.name}"

    @classmethod
    def expire_overdue(cls):
        cls.objects.filter(
            status='open',
            deadline__lt=timezone.now().date()
        ).update(status='expired')

    @property
    def is_expired(self):
        return self.status == 'expired'

    # @property
    # def applications_count(self):
    #     return self.applications.count()