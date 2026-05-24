from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from User.models.missions_model import Mission
from User.models.applications_model import Application
from Messaging.models.channel_model import MissionChannel
from Messaging.models.message_model import Message
from Messaging.serializers.message_serializer import MessageSerializer


def get_channel_or_403(mission_id, company):
    """Retourne le canal si la company est client ou prestataire, sinon None."""
    mission = get_object_or_404(Mission, pk=mission_id, status__in=['in_progress', 'completed'])
    channel = get_object_or_404(MissionChannel, mission=mission)

    is_client      = mission.company == company
    is_prestataire = Application.objects.filter(
        mission=mission, company=company, status='accepted'
    ).exists()

    if not (is_client or is_prestataire):
        return None, None

    return channel, mission


class MessageListView(APIView):
    """
    GET /api/missions/<mission_id>/channel/messages/
    → Historique des messages (chargé au démarrage du chat)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, mission_id):
        channel, _ = get_channel_or_403(mission_id, request.user.company)
        if channel is None:
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

        messages = channel.messages.select_related('sender').all()
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)


class MessageMarkReadView(APIView):
    """
    POST /api/missions/<mission_id>/channel/messages/<message_id>/read/
    → Marquer un message comme lu
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, mission_id, message_id):
        channel, _ = get_channel_or_403(mission_id, request.user.company)
        if channel is None:
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

        message = get_object_or_404(Message, pk=message_id, channel=channel)

        if message.sender == request.user.company:
            return Response(
                {'detail': 'Vous ne pouvez pas marquer vos propres messages comme lus.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        message.is_read = True
        message.save(update_fields=['is_read'])
        return Response({'detail': 'Message marqué comme lu.'})
