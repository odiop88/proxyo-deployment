from rest_framework import serializers
from User.models.notifications_model import Notification


class NotificationSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model  = Notification
        fields = [
            'id', 'type', 'type_label',
            'title', 'message', 'data',
            'is_read', 'created_at',
        ]