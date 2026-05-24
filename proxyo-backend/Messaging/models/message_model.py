from django.db import models
from User.models.company_model import Company
from .channel_model import MissionChannel


class Message(models.Model):
    channel = models.ForeignKey(
        MissionChannel,
        on_delete=models.CASCADE,
        related_name='messages',
    )

    sender = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )

    body = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['channel']),
            models.Index(fields=['sender']),
            models.Index(fields=['is_read']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.sender.name} → {self.channel.mission.title} ({self.created_at:%d/%m/%Y %H:%M})"
