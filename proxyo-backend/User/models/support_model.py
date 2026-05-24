from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class SupportAdmin(models.Model):
    """
    Compte superadmin de la plateforme.
    Pas de company associée — gère les entreprises depuis le panel support.
    """

    first_name = models.CharField(max_length=100)
    last_name  = models.CharField(max_length=100)
    email      = models.EmailField(unique=True)
    password   = models.CharField(max_length=255)
    is_active  = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Support Admin'
        verbose_name_plural = 'Support Admins'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)