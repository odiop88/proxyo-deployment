from django.urls import path
from User.views.missions_view import *
from User.views.applications_view import ApplicationCreateView

urlpatterns = [
path('mission/publier/', MissionListCreateView.as_view(), name='mission-list-create'),

    # Détail + Modifier + Supprimer
    path('mission/<int:pk>/', MissionRetrieveUpdateDestroyView.as_view(), name='mission-detail'),

    # Candidatures reçues (posteur only)
    path('missions/<int:pk>/applications/', MissionApplicationsView.as_view(), name='mission-applications'),

    # Candidater à une mission
    path('missions/<int:pk>/apply/', ApplicationCreateView.as_view(), name='mission-apply'),

    # Prestataire marque la mission terminée
    path('missions/<int:pk>/complete/', MissionCompleteView.as_view(), name='mission-complete'),

    # Client confirme que la mission est terminée
    path('missions/<int:pk>/confirm/', MissionConfirmView.as_view(), name='mission-confirm'),
]