import jwt
from django.conf import settings
from User.models.support_model import SupportAdmin


class SupportAdminAuthentication:
    """
    Authentification custom pour les SupportAdmin.
    À appeler dans les views support avant IsSupportAdmin.
    """

    @staticmethod
    def generate_tokens(support_admin):
        from datetime import datetime, timedelta

        access_payload = {
            'support_admin_id': support_admin.id,
            'email':            support_admin.email,
            'type':             'support',           # ← claim important
            'exp':              datetime.utcnow() + timedelta(hours=8),
        }

        refresh_payload = {
            'support_admin_id': support_admin.id,
            'type':             'support_refresh',
            'exp':              datetime.utcnow() + timedelta(days=1),
        }

        access_token  = jwt.encode(access_payload,  settings.SECRET_KEY, algorithm='HS256')
        refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')

        return access_token, refresh_token

    @staticmethod
    def decode_token(token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            if payload.get('type') != 'support':
                return None
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

