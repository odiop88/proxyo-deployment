from django.db import models
from django.utils import timezone
from datetime import timedelta
import secrets
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser


class EmailVerificationToken(models.Model):
    """
    Token pour vérifier l'email lors de l'inscription
    """
    
    # PAS BESOIN de déclarer id - Django le crée automatiquement
    
    # Lien vers l'utilisateur
    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='verification_token',
        help_text="L'utilisateur à vérifier"
    )
    
    # Token unique
    token = models.CharField(
        max_length=255,
        unique=True,
        default=secrets.token_urlsafe,
        help_text="Token unique de vérification"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text="Date d'expiration du token")
    is_used = models.BooleanField(default=False, help_text="Token déjà utilisé")
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Email Verification Token'
        verbose_name_plural = 'Email Verification Tokens'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Token - {self.user.email}"
    
    def is_valid(self):
        now = timezone.now()
        return now < self.expires_at and not self.is_used
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def mark_as_used(self):
        self.is_used = True
        self.used_at = timezone.now()
        self.save()
    
    @staticmethod
    def create_for_user(user, expiry_hours=24):
        EmailVerificationToken.objects.filter(user=user, is_used=False).delete()
        expires_at = timezone.now() + timedelta(hours=expiry_hours)
        return EmailVerificationToken.objects.create(user=user, expires_at=expires_at)
    
    @staticmethod
    def verify_token(token_string):
        try:
            token = EmailVerificationToken.objects.get(token=token_string)
            if not token.is_valid():
                return False, None
            token.mark_as_used()
            return True, token.user
        except EmailVerificationToken.DoesNotExist:
            return False, None
# from django.db import models
# from django.utils import timezone
# from datetime import timedelta
# import uuid
# import secrets


# class EmailVerificationToken(models.Model):
#     """
#     Token pour vérifier l'email lors de l'inscription
    
#     Créé automatiquement lors de la création d'un User
#     Utilisé pour valider que l'email appartient vraiment à l'utilisateur
#     """
    
#     # Identifiant unique
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
#     # Lien vers l'utilisateur
#     user = models.OneToOneField(
#         'User',
#         on_delete=models.CASCADE,
#         related_name='verification_token',
#         help_text="L'utilisateur à vérifier"
#     )
    
#     # Token unique (long et aléatoire pour la sécurité)
#     token = models.CharField(
#     max_length=255,
#     unique=True,
#     default=secrets.token_urlsafe(32),
#     help_text="Token unique de vérification"
#   )
#     # Timestamps
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     expires_at = models.DateTimeField(
#         help_text="Date d'expiration du token"
#     )
    
#     # Flag pour savoir s'il a déjà été utilisé
#     is_used = models.BooleanField(
#         default=False,
#         help_text="Token déjà utilisé"
#     )
    
#     used_at = models.DateTimeField(
#         null=True,
#         blank=True,
#         help_text="Date d'utilisation du token"
#     )
    
#     class Meta:
#         verbose_name = 'Email Verification Token'
#         verbose_name_plural = 'Email Verification Tokens'
#         indexes = [
#             models.Index(fields=['token']),
#             models.Index(fields=['user']),
#             models.Index(fields=['expires_at']),
#         ]
    
#     def __str__(self):
#         return f"Token - {self.user.email}"
    
#     # ============================================
#     # MÉTHODES UTILES
#     # ============================================
    
#     def is_valid(self):
#         """
#         Vérifie si le token est encore valide
        
#         Conditions :
#         - Pas encore expiré
#         - Pas déjà utilisé
#         """
#         now = timezone.now()
#         is_not_expired = now < self.expires_at
#         is_not_used = not self.is_used
        
#         return is_not_expired and is_not_used
    
#     def is_expired(self):
#         """Vérifie si le token est expiré"""
#         return timezone.now() > self.expires_at
    
#     def mark_as_used(self):
#         """Marquer le token comme utilisé"""
#         self.is_used = True
#         self.used_at = timezone.now()
#         self.save()
    
#     @staticmethod
#     def create_for_user(user, expiry_hours=24):
#         """
#         Crée un nouveau token de vérification pour un utilisateur
        
#         Args:
#             user: L'utilisateur à vérifier
#             expiry_hours: Nombre d'heures avant expiration (défaut: 24h)
        
#         Returns:
#             EmailVerificationToken: Le token créé
        
#         Exemple:
#             token = EmailVerificationToken.create_for_user(user, expiry_hours=24)
#             print(token.token)  # "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
#         """
#         # Supprimer tout token existant non utilisé
#         EmailVerificationToken.objects.filter(
#             user=user,
#             is_used=False
#         ).delete()
        
#         # Créer le nouveau token
#         expires_at = timezone.now() + timedelta(hours=expiry_hours)
        
#         token = EmailVerificationToken.objects.create(
#             user=user,
#             expires_at=expires_at
#         )
        
#         return token
    
#     @staticmethod
#     def verify_token(token_string):
#         """
#         Vérifie si un token est valide et le marque comme utilisé
        
#         Args:
#             token_string: Le token à vérifier
        
#         Returns:
#             tuple: (is_valid, user) ou (False, None) si invalide
        
#         Exemple:
#             is_valid, user = EmailVerificationToken.verify_token(token_string)
#             if is_valid:
#                 user.is_verified = True
#                 user.save()
#         """
#         try:
#             token = EmailVerificationToken.objects.get(token=token_string)
            
#             if not token.is_valid():
#                 return False, None
            
#             # Marquer comme utilisé
#             token.mark_as_used()
            
#             return True, token.user
        
#         except EmailVerificationToken.DoesNotExist:
#             return False, None