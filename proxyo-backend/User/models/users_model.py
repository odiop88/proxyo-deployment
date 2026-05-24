from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.core.validators import RegexValidator
from django.db.models.signals import pre_delete
from django.dispatch import receiver



class User(AbstractUser):
    ROLES_CHOICES = [
        ('owner', 'Propriétaire'),
        ('employee', 'Employé'),
    ]

    # PAS BESOIN de déclarer id - AbstractUser a déjà un AutoField par défaut
    
    company = models.ForeignKey(
        'Company',
        on_delete=models.CASCADE,
        related_name='users',
        help_text="L'entreprise à laquelle l'utilisateur appartient"
    )

    email = models.EmailField(unique=True, max_length=255)
    
    role = models.CharField(
        max_length=20,
        choices=ROLES_CHOICES,
        default='employee',
        help_text="Le rôle de l'utilisateur dans l'entreprise"
    )
    
    tel = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[RegexValidator(r'^[\d\s\+\-\(\)]+$', 'Format de téléphone invalide')],
    )
    
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True, 
        null=True,
        help_text="Photo de profil de l'utilisateur"
    )
    
    job_title = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Le poste ou titre de l'utilisateur dans l'entreprise"
    )

    bio = models.TextField(blank=True, null=True, help_text="Une courte biographie")
    
    is_verified = models.BooleanField(default=False, help_text="Email vérifié")
    email_verified_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', 'company', 'role', 'first_name']
        unique_together = [['company', 'email']]
        indexes = [
            models.Index(fields=['company', 'role']),
            models.Index(fields=['email']),
            models.Index(fields=['is_verified']),
        ]
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.get_full_name()} ({self.company.name}) - {self.get_role_display()}"

#signal
@receiver(pre_delete, sender=User)
def delete_company_on_owner_delete(sender, instance, **kwargs):
    """
    Quand un owner est supprimé, supprimer sa company.
    Le CASCADE de Company supprimera ensuite automatiquement :
    - Tous les autres users de la company
    - Toutes les missions
    - Toutes les candidatures
    - Toutes les notifications
    """
    if instance.role == 'owner':
        try:
            company = instance.company
            if company:
                company.delete()
        except Exception:
            pass

