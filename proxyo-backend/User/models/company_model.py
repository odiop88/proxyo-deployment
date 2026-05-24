from django.db import models
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator


class Company(models.Model):
    SECTOR_CHOICES = [
        ('it', 'IT/Informatique'),
        ('secretariat', 'Secrétariat/Assistanat'),
        ('photographie ', 'Photographie/Vidéo'),
        ('jardinage', 'Jardinage'),
        ('manutention', 'Manutention/Déménagement'),
        ('securite', 'Sécurité/Gardiennage'),
        ('restauration', 'Restauration'),
        ('nettoyage', 'Nettoyage/Ménage'),
        ('autre', 'Autre'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('suspended', 'Suspendu'),
        ('pending', 'En attente de vérification'),
    ]
    
    # PAS BESOIN de déclarer id
    
    name = models.CharField(max_length=255, unique=True, help_text="Nom officiel de l'entreprise")
    
    siret = models.CharField(
        max_length=14,
        unique=True,
        validators=[RegexValidator(r'^\d{14}$', 'SIRET doit contenir 14 chiffres')],
        help_text="Numéro SIRET (14 chiffres)"
    )
    
    contact_email = models.EmailField(unique=True, max_length=255, help_text="Email de contact principal")
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[RegexValidator(r'^[\d\s\+\-\(\)]+$', 'Format de téléphone invalide')],
        help_text="Numéro de téléphone"
    )
    
    sector = models.CharField(max_length=50, choices=SECTOR_CHOICES, help_text="Secteur d'activité principal")
    address = models.CharField(max_length=255, help_text="Adresse complète")
    city = models.CharField(max_length=100, help_text="Ville")
    
    postal_code = models.CharField(
        max_length=5,
        validators=[RegexValidator(r'^\d{5}$', 'Code postal invalide (5 chiffres)')],
        help_text="Code postal"
    )
    
    country = models.CharField(max_length=100, default='France', help_text="Pays")
    description = models.TextField(blank=True, null=True, help_text="Description courte de l'entreprise")
    
    logo = models.ImageField(upload_to='company_logos/%Y/%m/%d/', blank=True, null=True, help_text="Logo de l'entreprise")
    banner = models.ImageField(upload_to='company_banners/%Y/%m/%d/', blank=True, null=True, help_text="Image de bannière")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', help_text="Statut de l'entreprise")
    is_active = models.BooleanField(default=True, help_text="L'entreprise peut accéder à la plateforme")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name_plural = 'Companies'
        indexes = [
            models.Index(fields=['siret']),
            models.Index(fields=['contact_email']),
            models.Index(fields=['sector']),
            models.Index(fields=['is_active']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.sector})"

