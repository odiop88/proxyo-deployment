from django.urls import path
from User.views.applications_view import*

urlpatterns = [
    # Accepter / Rejeter (posteur)
    path('applications/<int:pk>/action/', ApplicationActionView.as_view(), name='application-action'),

    # Retirer sa candidature (candidat)
    path('applications/<int:pk>/withdraw/', ApplicationWithdrawView.as_view(), name='application-withdraw'),
    path('applications/mes-candidatures/', ApplicationSentView.as_view(), name='my-applications'),
]