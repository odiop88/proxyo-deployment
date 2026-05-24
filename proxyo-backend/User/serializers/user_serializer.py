from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    """
    Lecture + mise à jour du profil utilisateur.
    Les champs email et role sont en lecture seule.
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'tel',
            'avatar',
            'job_title',
            'bio',
            'role',
            'is_verified',
            'company_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_verified', 'company_name', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def validate_tel(self, value):
        if value:
            validator = RegexValidator(
                r'^[\d\s\+\-\(\)]+$',
                'Format de téléphone invalide'
            )
            validator(value)
        return value

    def validate_first_name(self, value):
        if value and len(value.strip()) < 2:
            raise serializers.ValidationError("Le prénom doit contenir au moins 2 caractères.")
        return value.strip() if value else value

    def validate_last_name(self, value):
        if value and len(value.strip()) < 2:
            raise serializers.ValidationError("Le nom doit contenir au moins 2 caractères.")
        return value.strip() if value else value


class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['avatar']

    def validate_avatar(self, value):
        max_size = 2 * 1024 * 1024  # 2 MB
        if value.size > max_size:
            raise serializers.ValidationError("L'image ne doit pas dépasser 2 MB.")
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Format accepté : JPEG, PNG, WebP.")
        return value
