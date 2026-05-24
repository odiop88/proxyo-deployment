from django.urls import path
from Messaging.views.channel_view import MissionChannelView

urlpatterns = [
    path('missions/<int:mission_id>/channel/', MissionChannelView.as_view(), name='mission-channel'),
]
