from django.urls import path
from User.views.stripe_view import CheckoutView, StripeWebhookView, OnboardingView, OnboardingStatusView

urlpatterns = [
    path('stripe/checkout/<int:payment_id>/', CheckoutView.as_view(),        name='stripe-checkout'),
    path('stripe/webhook/',                   StripeWebhookView.as_view(),    name='stripe-webhook'),
    path('stripe/onboarding/',                OnboardingView.as_view(),       name='stripe-onboarding'),
    path('stripe/onboarding/status/',         OnboardingStatusView.as_view(), name='stripe-onboarding-status'),
]
