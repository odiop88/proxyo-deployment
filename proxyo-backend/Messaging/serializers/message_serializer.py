from rest_framework import serializers
from Messaging.models.message_model import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_id   = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_logo = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = ['id', 'sender_id', 'sender_name', 'sender_logo', 'body', 'is_read', 'created_at']

    def get_sender_logo(self, obj):
        request = self.context.get('request')
        if obj.sender.logo and request:
            return request.build_absolute_uri(obj.sender.logo.url)
        return None
