from django.urls import path
from Messaging.views.message_view import MessageListView, MessageMarkReadView

urlpatterns = [
    path('missions/<int:mission_id>/channel/messages/', MessageListView.as_view(), name='channel-messages'),
    path('missions/<int:mission_id>/channel/messages/<int:message_id>/read/', MessageMarkReadView.as_view(), name='message-mark-read'),
]
