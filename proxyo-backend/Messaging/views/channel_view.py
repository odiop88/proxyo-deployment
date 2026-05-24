from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from User.models.missions_model import Mission
from User.models.applications_model import Application
from Messaging.models.channel_model import MissionChannel
from Messaging.serializers.channel_serializer import MissionChannelSerializer


class MissionChannelView(APIView):
    """
    GET /api/missions/<mission_id>/channel/
    → Infos du canal + tous les messages (accès client ou prestataire uniquement)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, mission_id):
        mission = get_object_or_404(Mission, pk=mission_id, status__in=['in_progress', 'completed'])
        channel = get_object_or_404(MissionChannel, mission=mission)

        company        = request.user.company
        is_client      = mission.company == company
        is_prestataire = Application.objects.filter(
            mission=mission, company=company, status='accepted'
        ).exists()

        if not (is_client or is_prestataire):
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = MissionChannelSerializer(channel, context={'request': request})
        return Response(serializer.data)
