import stripe
import logging
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from User.models.payment_model import Payment
from User.models.stripe_model import StripeAccount
from User.configs.permissions import IsActiveCompany

stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)


class CheckoutView(APIView):
    """
    POST /api/stripe/checkout/<payment_id>/
    → Le client crée un PaymentIntent pour payer une mission acceptée.
    Retourne le client_secret au frontend pour afficher le formulaire Stripe.
    """
    permission_classes = [IsAuthenticated, IsActiveCompany]

    def post(self, request, payment_id):
        payment = get_object_or_404(Payment, id=payment_id)
        mission = payment.application.mission

        # Seul le posteur de la mission peut payer
        if mission.company != request.user.company:
            return Response(
                {"detail": "Vous n'êtes pas autorisé à effectuer ce paiement."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Vérifier que le payment est bien en attente
        if payment.status != 'pending':
            return Response(
                {"detail": f"Ce paiement ne peut pas être traité (statut : {payment.status})."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Créer ou récupérer le customer Stripe du client
        stripe_account, _ = StripeAccount.objects.get_or_create(company=request.user.company)
        if not stripe_account.stripe_customer_id:
            customer = stripe.Customer.create(
                email=request.user.company.contact_email,
                name=request.user.company.name,
                metadata={"company_id": request.user.company.id},
            )
            stripe_account.stripe_customer_id = customer.id
            stripe_account.save()

        # Créer le PaymentIntent
        # L'argent arrive entièrement sur le compte plateforme.
        # La commission est gardée automatiquement, le reste est transféré
        # au prestataire via stripe.Transfer après confirmation de la mission.
        intent = stripe.PaymentIntent.create(
            amount=int(payment.total_client_pays * 100),  # en centimes
            currency="eur",
            customer=stripe_account.stripe_customer_id,
            receipt_email=request.user.email,
            metadata={
                "payment_id": payment.id,
                "mission_id": mission.id,
            },
        )

        payment.stripe_payment_intent_id = intent.id
        payment.save(update_fields=['stripe_payment_intent_id'])

        return Response({
            "client_secret":      intent.client_secret,
            "publishable_key":    settings.STRIPE_PUBLISHABLE_KEY,
            "payment_id":         payment.id,
            "total_client_pays":  str(payment.total_client_pays),
            "platform_fee":       str(payment.platform_fee),
            "prestataire_receives": str(payment.prestataire_receives),
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    POST /api/stripe/webhook/
    → Reçoit les événements Stripe et met à jour la base.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        payload    = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return Response({"detail": "Payload invalide."}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            return Response({"detail": "Signature invalide."}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event['type']
        data       = event['data']['object']

        # Paiement confirmé → mission démarre
        if event_type == 'payment_intent.succeeded':
            self._handle_payment_succeeded(data)

        # Paiement échoué → notifier le client
        elif event_type == 'payment_intent.payment_failed':
            self._handle_payment_failed(data)

        # Onboarding prestataire terminé → déclencher le transfer si mission complétée
        elif event_type == 'account.updated':
            self._handle_account_updated(data)

        # Transfer envoyé → paiement libéré
        elif event_type == 'transfer.created':
            self._handle_transfer_created(data)

        return Response({"status": "ok"}, status=status.HTTP_200_OK)

    def _handle_payment_succeeded(self, data):
        payment_id = data.get('metadata', {}).get('payment_id')
        if not payment_id:
            return
        try:
            payment         = Payment.objects.select_related('application__mission').get(id=payment_id)
            payment.status  = 'paid'
            payment.save(update_fields=['status'])

            mission         = payment.application.mission
            mission.status  = 'in_progress'
            mission.save(update_fields=['status'])

            # Notifier le prestataire → mission peut démarrer
            from Service.notification_service import notify_mission_started
            notify_mission_started(payment.application)

            # Email de facturation → owner + contact_email de la company cliente
            from User.configs.utils import send_billing_confirmation_email
            send_billing_confirmation_email(payment)

            logger.info(f"Paiement {payment_id} confirmé — mission {mission.id} démarrée.")
        except Payment.DoesNotExist:
            logger.error(f"Payment {payment_id} introuvable.")

    def _handle_payment_failed(self, data):
        payment_id = data.get('metadata', {}).get('payment_id')
        if not payment_id:
            return
        try:
            payment = Payment.objects.get(id=payment_id)
            logger.warning(f"Paiement {payment_id} échoué.")
            # Notifier le client
            from Service.notification_service import notify_payment_failed
            notify_payment_failed(payment)
        except Payment.DoesNotExist:
            logger.error(f"Payment {payment_id} introuvable.")

    def _handle_account_updated(self, data):
        account_id    = data.get('id')
        charges_enabled = data.get('charges_enabled', False)
        payouts_enabled = data.get('payouts_enabled', False)

        if not (charges_enabled and payouts_enabled):
            return

        try:
            stripe_account = StripeAccount.objects.select_related('company').get(stripe_account_id=account_id)
            if not stripe_account.stripe_onboarded:
                stripe_account.stripe_onboarded = True
                stripe_account.save(update_fields=['stripe_onboarded'])
                logger.info(f"Onboarding terminé pour {stripe_account.company.name}.")

                # Déclencher le transfer pour toutes les missions confirmées en attente
                pending_payments = Payment.objects.filter(
                    application__company=stripe_account.company,
                    status='paid',
                    application__mission__status='completed',
                    stripe_transfer_id__isnull=True,
                ).select_related('application__mission')

                for payment in pending_payments:
                    try:
                        transfer = stripe.Transfer.create(
                            amount=int(payment.prestataire_receives * 100),
                            currency="eur",
                            destination=stripe_account.stripe_account_id,
                            transfer_group=f"MISSION_{payment.application.mission.id}",
                            metadata={
                                "payment_id": payment.id,
                                "mission_id": payment.application.mission.id,
                            },
                        )
                        payment.stripe_transfer_id = transfer.id
                        payment.status = 'released'
                        payment.save(update_fields=['stripe_transfer_id', 'status'])
                        logger.info(f"Transfer {transfer.id} déclenché pour payment {payment.id}.")
                    except stripe.error.StripeError as e:
                        logger.error(f"Erreur transfer payment {payment.id} : {str(e)}")

        except StripeAccount.DoesNotExist:
            logger.warning(f"StripeAccount introuvable pour account_id {account_id}.")

    def _handle_transfer_created(self, data):
        transfer_id = data.get('id')
        payment_id  = data.get('metadata', {}).get('payment_id')
        if not payment_id:
            return
        try:
            payment                    = Payment.objects.get(id=payment_id)
            payment.stripe_transfer_id = transfer_id
            payment.status             = 'released'
            payment.save(update_fields=['stripe_transfer_id', 'status'])
            logger.info(f"Transfer {transfer_id} créé — paiement {payment_id} libéré.")
        except Payment.DoesNotExist:
            logger.error(f"Payment {payment_id} introuvable.")


class OnboardingView(APIView):
    """
    POST /api/stripe/onboarding/
    → Génère un lien Stripe Connect Express pour que le prestataire
      renseigne son IBAN. Stripe gère ensuite le payout SEPA automatiquement.
    """
    permission_classes = [IsAuthenticated, IsActiveCompany]

    def post(self, request):
        company = request.user.company
        stripe_account, _ = StripeAccount.objects.get_or_create(company=company)

        if not stripe_account.stripe_account_id:
            account = stripe.Account.create(
                type="express",
                country="FR",
                email=company.contact_email,
                business_profile={"name": company.name},
                capabilities={"transfers": {"requested": True}},
            )
            stripe_account.stripe_account_id = account.id
            stripe_account.save(update_fields=['stripe_account_id'])

        frontend_url = settings.FRONTEND_URL

        account_link = stripe.AccountLink.create(
            account=stripe_account.stripe_account_id,
            refresh_url=f"{frontend_url}/onboarding/refresh",
            return_url=f"{frontend_url}/onboarding/success",
            type="account_onboarding",
        )

        return Response({
            "onboarding_url": account_link.url,
        }, status=status.HTTP_200_OK)


class OnboardingStatusView(APIView):
    """
    GET /api/stripe/onboarding/status/
    → Indique si la company a terminé son onboarding Stripe Connect.
    """
    permission_classes = [IsAuthenticated, IsActiveCompany]

    def get(self, request):
        try:
            stripe_account = StripeAccount.objects.get(company=request.user.company)
            return Response({
                "onboarded":   stripe_account.stripe_onboarded,
                "has_account": bool(stripe_account.stripe_account_id),
            })
        except StripeAccount.DoesNotExist:
            return Response({"onboarded": False, "has_account": False})
