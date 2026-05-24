from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from User.models.notifications_model import Notification
from User.serializers.notification_serializer import NotificationSerializer


class NotificationListView(APIView):
    """
    GET /api/notifications/
    → Liste des notifications de ma company (non lues en premier)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(
            company=request.user.company
        )
        return Response({
            'unread_count':  notifications.filter(is_read=False).count(),
            'notifications': NotificationSerializer(notifications, many=True).data,
        })


class NotificationMarkReadView(APIView):
    """
    PATCH /api/notifications/{id}/read/
    → Marquer une notification comme lue
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notif = get_object_or_404(
            Notification,
            pk=pk,
            company=request.user.company
        )
        notif.is_read = True
        notif.save()
        return Response({'id': notif.id, 'is_read': True})


class NotificationMarkAllReadView(APIView):
    """
    PATCH /api/notifications/read-all/
    → Tout marquer comme lu
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        Notification.objects.filter(
            company=request.user.company,
            is_read=False,
        ).update(is_read=True)
        return Response({'detail': 'Toutes les notifications ont été marquées comme lues.'})

