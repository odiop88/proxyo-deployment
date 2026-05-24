from django.urls import path
from User.views.company_public_view import CompanyPublicListView, CompanyPublicDetailView
from User.views.company_manage_view import CompanyLogoUploadView, CompanyBannerUploadView

urlpatterns = [
    path('companies/',              CompanyPublicListView.as_view(),   name='companies-public-list'),
    path('companies/<int:pk>/',     CompanyPublicDetailView.as_view(), name='companies-public-detail'),
    path('company/logo/',           CompanyLogoUploadView.as_view(),   name='company-logo-upload'),
    path('company/banner/',         CompanyBannerUploadView.as_view(), name='company-banner-upload'),
]
