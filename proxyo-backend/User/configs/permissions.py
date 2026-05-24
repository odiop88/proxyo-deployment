from rest_framework.permissions import BasePermission


class IsActiveCompany(BasePermission):
    """
    Autorise uniquement les utilisateurs dont l'entreprise
    a le statut 'active'.
    """
    message = "Votre entreprise doit être active pour effectuer cette action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        company = getattr(request.user, 'company', None)
        if not company:
            return False
        return company.status == 'active'


class IsMissionOwner(BasePermission):
    """
    Autorise uniquement le posteur de la mission.
    """
    message = "Vous n'êtes pas le posteur de cette mission."

    def has_object_permission(self, request, view, obj):
        return obj.company == request.user.company


class IsSupportAdmin(BasePermission):
    """
    Autorise uniquement les requêtes authentifiées
    avec un token de SupportAdmin.
    On stocke l'objet SupportAdmin dans request.support_admin
    depuis le middleware d'authentification.
    """
    message = "Accès réservé aux administrateurs de la plateforme."

    def has_permission(self, request, view):
        return bool(
            hasattr(request, 'support_admin') and
            request.support_admin is not None and
            request.support_admin.is_active
        )