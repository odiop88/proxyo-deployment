from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from User.models.payment_model import Payment
from User.serializers.payment_serializer import PaymentSerializer
from User.configs.permissions import IsActiveCompany


class PaymentDetailView(APIView):
    """
    GET /api/payments/{id}/
    → Détail d'une facture (accessible par le client ou le prestataire concerné)
    """
    permission_classes = [IsAuthenticated, IsActiveCompany]

    def get(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk)
        company = request.user.company

        # Seuls le client (posteur) et le prestataire (candidat) peuvent voir la facture
        is_client      = payment.application.mission.company == company
        is_prestataire = payment.application.company == company

        if not (is_client or is_prestataire):
            return Response(
                {"detail": "Vous n'êtes pas autorisé à consulter cette facture."},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response(PaymentSerializer(payment).data)


class PaymentListView(APIView):
    """
    GET /api/payments/
    → Liste de toutes les factures liées à ma company (client ou prestataire)
    """
    permission_classes = [IsAuthenticated, IsActiveCompany]

    def get(self, request):
        company = request.user.company

        payments = Payment.objects.filter(
            application__mission__company=company  # factures où je suis client
        ) | Payment.objects.filter(
            application__company=company            # factures où je suis prestataire
        )

        payments = payments.select_related(
            'application__mission',
            'application__mission__company',
            'application__company',
        ).order_by('-created_at')

        return Response(PaymentSerializer(payments, many=True).data)
