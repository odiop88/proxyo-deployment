from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics

from User.models.company_model import Company
from User.serializers.company_public_serializer import CompanyPublicSerializer, CompanyPublicDetailSerializer
from django.shortcuts import get_object_or_404


class CompanyPublicListView(generics.ListAPIView):
    """
    GET /api/companies/?city=Lyon&postal_code=69000&sector=nettoyage&search=...
    → Liste publique des entreprises actives avec filtres.
    """
    permission_classes = [AllowAny]
    serializer_class   = CompanyPublicSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['city', 'postal_code', 'sector']
    search_fields      = ['name', 'city', 'description']
    ordering_fields    = ['name', 'created_at']
    ordering           = ['name']

    def get_queryset(self):
        return Company.objects.filter(is_active=True)


class CompanyPublicDetailView(APIView):
    """
    GET /api/companies/<id>/
    → Détail public d'une entreprise.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        company = get_object_or_404(Company, pk=pk, is_active=True)
        return Response(CompanyPublicDetailSerializer(company, context={'request': request}).data)
