import stripe
import logging
from django.conf import settings
from rest_framework import generics, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)

from User.models.missions_model import Mission
from User.serializers.missions_serializer import (
    MissionListSerializer,
    MissionDetailSerializer,
    MissionCreateSerializer,
    MissionUpdateSerializer,
)
from User.configs.permissions import IsActiveCompany, IsMissionOwner
from User.configs.filter import MissionFilter
from User.serializers.applications_serializer import ApplicationListSerializer



class MissionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/mission/publier/  → Mes missions (connecté uniquement)
    POST /api/mission/publier/  → Publier une mission (company active)
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MissionFilter
    search_fields   = ['title', 'description', 'city']
    ordering_fields = ['created_at', 'deadline', 'budget_min', 'budget_max']
    ordering        = ['-created_at']

    def get_queryset(self):
        Mission.expire_overdue()
        return Mission.objects.select_related('company').filter(
            company=self.request.user.company
        ).order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MissionCreateSerializer
        return MissionListSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsActiveCompany()]

    def perform_create(self, serializer):
        mission = serializer.save(company=self.request.user.company)
        from Service.notification_service import notify_new_mission
        notify_new_mission(mission)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        mission = Mission.objects.filter(
            company=request.user.company
        ).order_by('-created_at').first()
        return Response(
            MissionDetailSerializer(mission).data,
            status=status.HTTP_201_CREATED
        )





class MissionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/missions/{id}/  → Détail (tout le monde)
    PATCH  /api/missions/{id}/  → Modifier (posteur, company active)
    DELETE /api/missions/{id}/  → Supprimer (posteur, company active)
    """
    lookup_field = 'pk'

    def get_queryset(self):
        Mission.expire_overdue()
        return Mission.objects.select_related('company').all()

    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return MissionUpdateSerializer
        return MissionDetailSerializer

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [IsAuthenticated(), IsActiveCompany(), IsMissionOwner()]
        return []

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.applications.exists():
            return Response(
                {"detail": "Impossible de modifier une mission qui a déjà reçu des candidatures."},
                status=status.HTTP_400_BAD_REQUEST
            )
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.applications.exists():
            return Response(
                {"detail": "Impossible de supprimer une mission qui a déjà reçu des candidatures."},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.delete()
        return Response(
            {"detail": "Mission supprimée avec succès."},
            status=status.HTTP_200_OK
        )


class MissionCompleteView(APIView):
    """
    PATCH /api/missions/<id>/complete/
    → Le prestataire marque la mission comme terminée.
    → Mission passe en 'pending_confirmation', le client doit confirmer.
    """
    permission_classes = [IsAuthenticated, IsActiveCompany]

    def patch(self, request, pk):
        mission = get_object_or_404(Mission, pk=pk)

        # Vérifier que c'est bien le prestataire (company de la candidature acceptée)
        accepted_application = mission.applications.filter(status='accepted').first()
        if not accepted_application or accepted_application.company != request.user.company:
            return Response(
                {"detail": "Vous n'êtes pas autorisé à effectuer cette action."},
                status=status.HTTP_403_FORBIDDEN
            )

        if mission.status != 'in_progress':
            return Response(
                {"detail": "La mission doit être en cours pour être marquée terminée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        mission.status = 'pending_confirmation'
        mission.save(update_fields=['status'])

        # Notifier le client
        from Service.notification_service import notify_mission_pending_confirmation
        notify_mission_pending_confirmation(accepted_application)

        return Response({
            "detail":         "Mission marquée comme terminée. En attente de confirmation du client.",
            "mission_id":     mission.id,
            "mission_status": mission.status,
        }, status=status.HTTP_200_OK)


class MissionConfirmView(APIView):
    """
    PATCH /api/missions/<id>/confirm/
    → Le client confirme que la mission est terminée.
    → Si le prestataire est onboardé Stripe : transfer immédiat → payout SEPA automatique.
    → Sinon : transfer déclenché dès que le prestataire termine son onboarding.
    """
    permission_classes = [IsAuthenticated, IsActiveCompany]

    def patch(self, request, pk):
        from User.models.payment_model import Payment
        from User.models.stripe_model import StripeAccount

        mission = get_object_or_404(Mission, pk=pk)

        if mission.company != request.user.company:
            return Response(
                {"detail": "Vous n'êtes pas autorisé à confirmer cette mission."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if mission.status != 'pending_confirmation':
            return Response(
                {"detail": "La mission n'est pas en attente de confirmation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mission.status = 'completed'
        mission.save(update_fields=['status'])

        accepted_application = mission.applications.filter(status='accepted').first()
        transfer_triggered   = False

        if accepted_application:
            from Service.notification_service import notify_mission_confirmed
            notify_mission_confirmed(accepted_application)

            # Déclencher le Transfer Stripe → Payout SEPA automatique par Stripe
            try:
                payment = accepted_application.payment
                if payment.status == 'paid' and not payment.stripe_transfer_id:
                    stripe_account = StripeAccount.objects.filter(
                        company=accepted_application.company,
                    ).first()

                    if stripe_account and stripe_account.stripe_account_id:
                        # Vérifier directement l'état réel du compte Stripe
                        # (au cas où le webhook account.updated aurait été manqué)
                        account = stripe.Account.retrieve(stripe_account.stripe_account_id)
                        if account.charges_enabled and account.payouts_enabled:
                            if not stripe_account.stripe_onboarded:
                                stripe_account.stripe_onboarded = True
                                stripe_account.save(update_fields=['stripe_onboarded'])

                            transfer = stripe.Transfer.create(
                                amount=int(payment.prestataire_receives * 100),
                                currency="eur",
                                destination=stripe_account.stripe_account_id,
                                transfer_group=f"MISSION_{mission.id}",
                                metadata={
                                    "payment_id": payment.id,
                                    "mission_id": mission.id,
                                },
                            )
                            payment.stripe_transfer_id = transfer.id
                            payment.status = 'released'
                            payment.save(update_fields=['stripe_transfer_id', 'status'])
                            transfer_triggered = True
                            logger.info(
                                f"Transfer {transfer.id} déclenché — mission {mission.id}, "
                                f"prestataire {accepted_application.company.name}."
                            )
            except stripe.error.StripeError as e:
                logger.error(f"Erreur Stripe transfer mission {pk}: {str(e)}")
            except Exception as e:
                logger.error(f"Erreur transfer mission {pk}: {str(e)}")

        return Response({
            "detail": (
                "Mission confirmée. Le virement SEPA vers le prestataire est en cours (1-2 jours ouvrés)."
                if transfer_triggered else
                "Mission confirmée. Le prestataire recevra son virement dès qu'il aura configuré son IBAN."
            ),
            "transfer_triggered": transfer_triggered,
            "mission_id":         mission.id,
            "mission_status":     mission.status,
        }, status=status.HTTP_200_OK)


class MissionApplicationsView(APIView):
    """
    GET /api/missions/{id}/applications/
    → Liste des candidatures reçues (posteur uniquement)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        mission = get_object_or_404(Mission, pk=pk)

        if mission.company != request.user.company:
            return Response(
                {"detail": "Vous n'êtes pas autorisé à voir ces candidatures."},
                status=status.HTTP_403_FORBIDDEN
            )

      
        applications = mission.applications.select_related('company').all()

        return Response({
            "mission_id":         mission.id,
            "mission_title":      mission.title,
            "total_applications": applications.count(),
            "applications":       ApplicationListSerializer(applications, many=True).data,
        })
