from rest_framework import serializers
from Messaging.models.channel_model import MissionChannel
from Messaging.serializers.message_serializer import MessageSerializer
from User.models.applications_model import Application


class MissionChannelSerializer(serializers.ModelSerializer):
    mission_id         = serializers.IntegerField(source='mission.id', read_only=True)
    mission_title      = serializers.CharField(source='mission.title', read_only=True)
    is_closed          = serializers.BooleanField(read_only=True)
    messages           = MessageSerializer(many=True, read_only=True)
    interlocutor_name  = serializers.SerializerMethodField()
    interlocutor_logo  = serializers.SerializerMethodField()
    last_message       = serializers.SerializerMethodField()
    unread_count       = serializers.SerializerMethodField()

    class Meta:
        model  = MissionChannel
        fields = [
            'id', 'mission_id', 'mission_title', 'is_closed', 'closed_at', 'created_at',
            'messages', 'interlocutor_name', 'interlocutor_logo', 'last_message', 'unread_count',
        ]

    def _get_interlocutor(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        my_company = request.user.company
        mission = obj.mission
        if mission.company == my_company:
            accepted = Application.objects.filter(
                mission=mission, status='accepted'
            ).select_related('company').first()
            return accepted.company if accepted else None
        return mission.company

    def get_interlocutor_name(self, obj):
        interlocutor = self._get_interlocutor(obj)
        return interlocutor.name if interlocutor else None

    def get_interlocutor_logo(self, obj):
        interlocutor = self._get_interlocutor(obj)
        if not interlocutor or not interlocutor.logo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(interlocutor.logo.url) if request else None

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if not last:
            return None
        return {'body': last.body, 'sender_name': last.sender.name, 'created_at': last.created_at}

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        my_company = request.user.company
        return obj.messages.filter(is_read=False).exclude(sender=my_company).count()
