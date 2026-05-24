from django.db import models
from .applications_model import Application


class Payment(models.Model):

    PLATFORM_COMMISSION_RATE = 10  # 10% fixe

    STATUS_CHOICES = [
        ('pending',   'En attente de paiement'),
        ('paid',      'Payé'),
        ('released',  'Fonds versés au prestataire'),
        ('refunded',  'Remboursé'),
    ]

    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='payment',
    )

    # -- Montants calculés à la création (snapshot au moment de l'acceptation) --
    proposed_price       = models.DecimalField(max_digits=10, decimal_places=2)
    tva_rate             = models.DecimalField(max_digits=5,  decimal_places=2, default=0)
    tva_amount           = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    platform_fee         = models.DecimalField(max_digits=10, decimal_places=2)
    prestataire_receives = models.DecimalField(max_digits=10, decimal_places=2)
    total_client_pays    = models.DecimalField(max_digits=10, decimal_places=2)

    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_transfer_id       = models.CharField(max_length=255, blank=True, null=True)

    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.id} — {self.application} — {self.get_status_display()}"

    @classmethod
    def create_from_application(cls, application):
        """
        Crée un Payment à partir d'une candidature acceptée.
        Calcule et snapshote tous les montants.
        """
        proposed = application.proposed_price
        tva_rate = application.tva_rate if application.apply_tva and application.tva_rate else 0

        tva_amount           = round(proposed * tva_rate / 100, 2)
        platform_fee         = round(proposed * cls.PLATFORM_COMMISSION_RATE / 100, 2)
        prestataire_receives = round(proposed + tva_amount, 2)
        total_client_pays    = round(proposed + tva_amount + platform_fee, 2)

        return cls.objects.create(
            application=application,
            proposed_price=proposed,
            tva_rate=tva_rate,
            tva_amount=tva_amount,
            platform_fee=platform_fee,
            prestataire_receives=prestataire_receives,
            total_client_pays=total_client_pays,
        )
