from rest_framework import serializers
from User.models import EmailVerificationToken


class VerifyEmailSerializer(serializers.Serializer):
    """
    Serializer pour vérifier l'email avec un token
    
    Utilisation:
        POST /api/auth/verify-email/
        Body: {
            "token": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
        }
    """
    
    token = serializers.CharField(
        max_length=255,
        required=True,
        error_messages={
            'required': 'Le token est obligatoire',
            'blank': 'Le token ne peut pas être vide'
        }
    )
    
    def validate_token(self, value):
        """Valider que le token existe et est valide"""
        try:
            token_obj = EmailVerificationToken.objects.get(token=value)
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Token invalide ou introuvable.")
        
        if not token_obj.is_valid():
            if token_obj.is_expired():
                raise serializers.ValidationError("Token expiré.")
            if token_obj.is_used:
                raise serializers.ValidationError("Token déjà utilisé.")
        
        return value