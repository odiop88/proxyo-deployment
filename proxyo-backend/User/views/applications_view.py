from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from User.models import Mission, Application, Payment
from User.serializers.applications_serializer import (
    ApplicationCreateSerializer,
    ApplicationActionSerializer,
    ApplicationSentSerializer,
)
from User.configs.permissions import IsActiveCompany



class ApplicationCreateView(APIView):
    """
    POST /api/missions/{id}/apply/
    → Candidater à une mission (company active uniquement)
    """
    permission_classes = [IsAuthenticated, IsActiveCompany]

    def post(self, request, pk):
        mission = get_object_or_404(Mission, pk=pk)

        # La mission doit être ouverte
        if mission.status != 'open':
            return Response(
                {"detail": "Cette mission n'accepte plus de candidatures."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Pas candidater à sa propre mission
        if mission.company == request.user.company:
            return Response(
                {"detail": "Vous ne pouvez pas candidater à votre propre mission."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Pas déjà candidaté
        already_applied = Application.objects.filter(
            mission=mission,
            company=request.user.company
        ).exists()

        if already_applied:
            return Response(
                {"detail": "Vous avez déjà candidaté à cette mission."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ApplicationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save(
            mission=mission,
            company=request.user.company,
        )

        # Notifier le posteur (décommenté quand notifications sera fait)
        from Service.notification_service import notify_new_application
        notify_new_application(application)

        return Response({
            "id":             application.id,
            "mission_id":     mission.id,
            "mission_title":  mission.title,
            "status":         application.status,
            "proposed_price": str(application.proposed_price),
            "estimated_days": application.estimated_days,
            "applied_at":     application.created_at,
        }, status=status.HTTP_201_CREATED)


class ApplicationActionView(APIView):
    """
    PATCH /api/applications/{id}/
    → Accepter ou rejeter une candidature (posteur de la mission uniquement)

    Quand on accepte :
    - application.status = 'accepted'
    - mission.status     = 'in_progress'
    - toutes les autres candidatures → status = 'rejected'
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        application = get_object_or_404(Application, pk=pk)
        mission     = application.mission

        # Seul le posteur de la mission peut agir
        if mission.company != request.user.company:
            return Response(
                {"detail": "Vous n'êtes pas autorisé à effectuer cette action."},
                status=status.HTTP_403_FORBIDDEN
            )

        # La mission doit encore être ouverte
        if mission.status != 'open':
            return Response(
                {"detail": "Cette mission n'est plus ouverte."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ApplicationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']

        if action == 'accept':
            application.status = 'accepted'
            application.save()

            # Rejeter toutes les autres candidatures de cette mission
            Application.objects.filter(
                mission=mission
            ).exclude(pk=application.pk).update(status='rejected')

            # Mission en attente de paiement
            mission.status = 'pending_payment'
            mission.save(update_fields=['status'])

            # Créer la facture
            payment = Payment.create_from_application(application)

            from Service.notification_service import notify_application_accepted
            notify_application_accepted(application)

            return Response({
                "detail":         "Candidature acceptée. Le paiement est requis pour démarrer la mission.",
                "application_id": application.id,
                "status":         "accepted",
                "mission_status": mission.status,
                "payment": {
                    "id":                   payment.id,
                    "proposed_price":       str(payment.proposed_price),
                    "tva_rate":             str(payment.tva_rate),
                    "tva_amount":           str(payment.tva_amount),
                    "platform_fee":         str(payment.platform_fee),
                    "prestataire_receives": str(payment.prestataire_receives),
                    "total_client_pays":    str(payment.total_client_pays),
                    "status":               payment.status,
                },
            })

        # action == 'reject'
        application.status = 'rejected'
        application.save()

        from Service.notification_service import notify_application_rejected
        notify_application_rejected(application)

        return Response({
            "detail":         "Candidature rejetée.",
            "application_id": application.id,
            "status":         "rejected",
        })


class ApplicationWithdrawView(APIView):
    """
    DELETE /api/applications/{id}/withdraw/
    → Le candidat retire sa propre candidature
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        application = get_object_or_404(
            Application,
            pk=pk,
            company=request.user.company 
        )

        if application.status == 'accepted':
            return Response(
                {"detail": "Impossible de retirer une candidature déjà acceptée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        application.status = 'withdrawn'
        application.save()

        return Response(
            {"detail": "Candidature retirée avec succès."},
            status=status.HTTP_200_OK
        )

        

class ApplicationSentView(generics.ListAPIView):
    """
    GET /api/applications/mes-candidatures/
    → Liste des candidatures envoyées par ma company
    """
    serializer_class   = ApplicationSentSerializer
    permission_classes = [IsAuthenticated, IsActiveCompany]

    def get_queryset(self):
        return Application.objects.select_related('mission', 'mission__company').filter(
            company=self.request.user.company
        ).order_by('-created_at')

