from django.db import models
from .company_model import Company


class StripeAccount(models.Model):
    """
    Données Stripe liées à une company.
    - stripe_customer_id  : company qui paie (client)
    - stripe_account_id   : company qui reçoit (prestataire Connect Express)
    """
    company = models.OneToOneField(
        Company,
        on_delete=models.CASCADE,
        related_name='stripe',
    )

    # Côté client (paiement)
    stripe_customer_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="ID client Stripe (cus_xxx) — créé au premier paiement",
    )

    # Côté prestataire (réception)
    stripe_account_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="ID compte Connect Express (acct_xxx) — créé à l'onboarding",
    )
    stripe_onboarded = models.BooleanField(
        default=False,
        help_text="True quand le prestataire a terminé son onboarding Stripe",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Stripe Account'

    def __str__(self):
        return f"Stripe — {self.company.name}"
