import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

from Messaging.models.channel_model import MissionChannel
from Messaging.models.message_model import Message
from User.models.missions_model import Mission
from User.models.applications_model import Application

User = get_user_model()


class MissionChatConsumer(AsyncWebsocketConsumer):

    # ------------------------------------------------------------------ #
    #  Connexion                                                           #
    # ------------------------------------------------------------------ #

    async def connect(self):
        self.mission_id = self.scope['url_route']['kwargs']['mission_id']
        self.group_name = f"mission_{self.mission_id}"

        # 1. Authentifier l'utilisateur via le token JWT (query param)
        user = await self.get_user_from_token()
        if user is None:
            await self.close(code=4001)
            return

        # 2. Vérifier que l'utilisateur a accès au canal (client ou prestataire)
        authorized, channel = await self.check_access(user, self.mission_id)
        if not authorized:
            await self.close(code=4003)
            return

        # 3. Vérifier que le canal n'est pas fermé
        if channel.is_closed:
            await self.close(code=4004)
            return

        self.user = user
        self.channel_obj = channel

        # 4. Rejoindre le groupe Redis
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    # ------------------------------------------------------------------ #
    #  Déconnexion                                                         #
    # ------------------------------------------------------------------ #

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # ------------------------------------------------------------------ #
    #  Réception d'un message depuis le client WebSocket                  #
    # ------------------------------------------------------------------ #

    async def receive(self, text_data):
        # Vérifier que le canal n'est pas fermé au moment de l'envoi
        if self.channel_obj.is_closed:
            await self.send(text_data=json.dumps({
                'error': 'Ce canal est fermé.',
            }))
            return

        try:
            data = json.loads(text_data)
            body = data.get('body', '').strip()
        except (json.JSONDecodeError, KeyError):
            await self.send(text_data=json.dumps({'error': 'Format invalide.'}))
            return

        if not body:
            await self.send(text_data=json.dumps({'error': 'Le message ne peut pas être vide.'}))
            return

        # Sauvegarder en base de données
        message = await self.save_message(body)

        # Diffuser à tous les participants du groupe
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_message',
                'id': message.id,
                'sender_id': self.user.company.id,
                'sender_name': self.user.company.name,
                'sender_logo': self.user.company.logo.url if self.user.company.logo else None,
                'body': message.body,
                'created_at': message.created_at.isoformat(),
            }
        )

    # ------------------------------------------------------------------ #
    #  Envoi d'un message vers le client WebSocket                        #
    # ------------------------------------------------------------------ #

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'sender_logo': event['sender_logo'],
            'body': event['body'],
            'created_at': event['created_at'],
        }))

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    async def get_user_from_token(self):
        """Décode le token JWT passé en query param (?token=<jwt>)."""
        query_string = self.scope.get('query_string', b'').decode()
        params = dict(p.split('=') for p in query_string.split('&') if '=' in p)
        token_key = params.get('token')

        if not token_key:
            return None

        try:
            token = AccessToken(token_key)
            user_id = token['user_id']
            return await self.get_user(user_id)
        except (TokenError, KeyError):
            return None

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.select_related('company').get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def check_access(self, user, mission_id):
        """
        Retourne (True, channel) si l'utilisateur est :
        - le client (auteur de la mission), ou
        - le prestataire (candidature acceptée)
        Retourne (False, None) sinon.
        """
        try:
            mission = Mission.objects.get(pk=mission_id, status__in=['in_progress', 'completed'])
            channel = MissionChannel.objects.get(mission=mission)
        except (Mission.DoesNotExist, MissionChannel.DoesNotExist):
            return False, None

        company = user.company

        # Client = auteur de la mission
        if mission.company == company:
            return True, channel

        # Prestataire = candidature acceptée sur cette mission
        is_prestataire = Application.objects.filter(
            mission=mission,
            company=company,
            status='accepted',
        ).exists()

        if is_prestataire:
            return True, channel

        return False, None

    @database_sync_to_async
    def save_message(self, body):
        return Message.objects.create(
            channel=self.channel_obj,
            sender=self.user.company,
            body=body,
        )
