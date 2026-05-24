from django.urls import re_path
from Messaging.consumers import MissionChatConsumer

websocket_urlpatterns = [
    re_path(r'^ws/missions/(?P<mission_id>\d+)/channel/$', MissionChatConsumer.as_asgi()),
]
