from django.urls import path
from User.views.support_view import*

urlpatterns = [
    # Auth support
    path('support/auth/login/',SupportLoginView.as_view(),         name='support-login'),

    # Companies
    path('support/companies/',SupportCompanyListView.as_view(),   name='support-company-list'),
    path('support/companies/<int:pk>/',SupportCompanyDetailView.as_view(), name='support-company-detail'),
    path('support/companies/<int:pk>/status/',SupportCompanyStatusView.as_view(), name='support-company-status'),
]