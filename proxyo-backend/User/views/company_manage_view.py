from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from User.models.company_model import Company
from User.configs.permissions import IsActiveCompany


class CompanyLogoUploadView(APIView):
    """
    PATCH /api/company/logo/  -> Uploader le logo de l'entreprise
    DELETE /api/company/logo/ -> Supprimer le logo
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _get_company(self, request):
        return request.user.company

    def patch(self, request):
        company = self._get_company(request)
        if not company:
            return Response({'detail': 'Entreprise introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if 'logo' not in request.FILES:
            return Response({'detail': 'Fichier logo manquant.'}, status=status.HTTP_400_BAD_REQUEST)
        if company.logo:
            company.logo.delete(save=False)
        company.logo = request.FILES['logo']
        company.save(update_fields=['logo'])
        logo_url = request.build_absolute_uri(company.logo.url)
        return Response({'logo_url': logo_url}, status=status.HTTP_200_OK)

    def delete(self, request):
        company = self._get_company(request)
        if not company:
            return Response({'detail': 'Entreprise introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if company.logo:
            company.logo.delete(save=False)
            company.logo = None
            company.save(update_fields=['logo'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class CompanyBannerUploadView(APIView):
    """
    PATCH /api/company/banner/  -> Uploader la bannière de l'entreprise
    DELETE /api/company/banner/ -> Supprimer la bannière
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _get_company(self, request):
        return request.user.company

    def patch(self, request):
        company = self._get_company(request)
        if not company:
            return Response({'detail': 'Entreprise introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if 'banner' not in request.FILES:
            return Response({'detail': 'Fichier bannière manquant.'}, status=status.HTTP_400_BAD_REQUEST)
        if company.banner:
            company.banner.delete(save=False)
        company.banner = request.FILES['banner']
        company.save(update_fields=['banner'])
        banner_url = request.build_absolute_uri(company.banner.url)
        return Response({'banner_url': banner_url}, status=status.HTTP_200_OK)

    def delete(self, request):
        company = self._get_company(request)
        if not company:
            return Response({'detail': 'Entreprise introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if company.banner:
            company.banner.delete(save=False)
            company.banner = None
            company.save(update_fields=['banner'])
        return Response(status=status.HTTP_204_NO_CONTENT)
