from rest_framework import serializers
from User.models.company_model import Company


class SupportLoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField()


class CompanyStatusSerializer(serializers.Serializer):
    """Pour changer le status d'une company."""
    status = serializers.ChoiceField(choices=[
        'active', 'inactive', 'suspended', 'pending'
    ])


class CompanyListSerializer(serializers.ModelSerializer):
    """Liste des companies pour le panel support."""
    users_count = serializers.SerializerMethodField()

    class Meta:
        model  = Company
        fields = [
            'id', 'name', 'siret', 'contact_email',
            'sector', 'city', 'status', 'is_active',
            'users_count', 'created_at',
        ]

    def get_users_count(self, obj):
        return obj.users.count()


class CompanyDetailSerializer(serializers.ModelSerializer):
    """Détail d'une company pour le panel support."""
    users_count = serializers.SerializerMethodField()

    class Meta:
        model  = Company
        fields = [
            'id', 'name', 'siret', 'contact_email', 'phone',
            'sector', 'address', 'city', 'postal_code', 'country',
            'description', 'status', 'is_active',
            'users_count', 'created_at', 'updated_at',
        ]

    def get_users_count(self, obj):
        return obj.users.count()