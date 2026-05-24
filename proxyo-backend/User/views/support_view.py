import jwt
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from User.models.support_model import SupportAdmin
from User.models.company_model import Company
from User.serializers.support_serializer import (
    SupportLoginSerializer,
    CompanyStatusSerializer,
    CompanyListSerializer,
    CompanyDetailSerializer,
)
from User.configs.permissions import IsSupportAdmin
from User.configs.support_auth import SupportAdminAuthentication


def get_support_admin_from_request(request):
    """Extrait et vérifie le token support depuis le header Authorization."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token   = auth_header.split(' ')[1]
    payload = SupportAdminAuthentication.decode_token(token)
    if not payload:
        return None
    try:
        return SupportAdmin.objects.get(
            id=payload['support_admin_id'],
            is_active=True
        )
    except SupportAdmin.DoesNotExist:
        return None


class SupportLoginView(APIView):
    """
    POST /api/support/login/
    → Connexion du superadmin
    """
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        serializer = SupportLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email    = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            admin = SupportAdmin.objects.get(email=email, is_active=True)
        except SupportAdmin.DoesNotExist:
            return Response(
                {"detail": "Email ou mot de passe incorrect."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not admin.check_password(password):
            return Response(
                {"detail": "Email ou mot de passe incorrect."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        access_token, refresh_token = SupportAdminAuthentication.generate_tokens(admin)

        return Response({
            "access":  access_token,
            "refresh": refresh_token,
            "admin": {
                "id":         admin.id,
                "first_name": admin.first_name,
                "last_name":  admin.last_name,
                "email":      admin.email,
            }
        })


class SupportCompanyListView(APIView):
    """
    GET /api/support/companies/
    → Liste toutes les companies (filtre par status possible)
    """
    authentication_classes = []
    permission_classes     = []

    def get(self, request):
        admin = get_support_admin_from_request(request)
        if not admin:
            return Response({"detail": "Non autorisé."}, status=status.HTTP_401_UNAUTHORIZED)

        companies = Company.objects.all().order_by('-created_at')

        # Filtre optionnel par status : ?status=pending
        status_filter = request.query_params.get('status')
        if status_filter:
            companies = companies.filter(status=status_filter)

        return Response({
            "total":     companies.count(),
            "companies": CompanyListSerializer(companies, many=True).data,
        })


class SupportCompanyDetailView(APIView):
    """
    GET   /api/support/companies/{id}/  → Détail
    PATCH /api/support/companies/{id}/status/  → Changer le status
    """
    authentication_classes = []
    permission_classes     = []

    def get(self, request, pk):
        admin = get_support_admin_from_request(request)
        if not admin:
            return Response({"detail": "Non autorisé."}, status=status.HTTP_401_UNAUTHORIZED)

        company = get_object_or_404(Company, pk=pk)
        return Response(CompanyDetailSerializer(company).data)


class SupportCompanyStatusView(APIView):
    """
    PATCH /api/support/companies/{id}/status/
    → Activer / Suspendre / Désactiver une company
    """
    authentication_classes = []
    permission_classes     = []

    def patch(self, request, pk):
        admin = get_support_admin_from_request(request)
        if not admin:
            return Response({"detail": "Non autorisé."}, status=status.HTTP_401_UNAUTHORIZED)

        company    = get_object_or_404(Company, pk=pk)
        serializer = CompanyStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status         = company.status
        company.status     = serializer.validated_data['status']
        company.save()

        return Response({
            "detail":     f"Statut mis à jour : {old_status} → {company.status}",
            "company_id": company.id,
            "name":       company.name,
            "status":     company.status,
        })