from rest_framework import serializers
from django.utils import timezone
from User.models.missions_model import Mission


class MissionListSerializer(serializers.ModelSerializer):
    """
    Léger — utilisé pour le catalogue public et les listes dashboard.
    """
    company_name       = serializers.CharField(source='company.name', read_only=True)
    sector_label       = serializers.CharField(source='get_sector_display', read_only=True)
    status_label       = serializers.CharField(source='get_status_display', read_only=True)
    applications_count = serializers.SerializerMethodField()
    payment_id         = serializers.SerializerMethodField()

    class Meta:
        model  = Mission
        fields = [
            'id',
            'title',
            'sector', 'sector_label',
            'city', 'postal_code',
            'budget_min', 'budget_max',
            'deadline',
            'status', 'status_label',
            'company_id', 'company_name',
            'applications_count',
            'payment_id',
            'created_at',
        ]

    def get_applications_count(self, obj):
        return obj.applications.count()

    def get_payment_id(self, obj):
        try:
            return obj.applications.get(status='accepted').payment.id
        except Exception:
            return None


class MissionDetailSerializer(serializers.ModelSerializer):
    """
    Complet — utilisé pour le détail d'une mission.
    """
    company_name   = serializers.CharField(source='company.name', read_only=True)
    company_sector = serializers.CharField(source='company.sector', read_only=True)
    company_city   = serializers.CharField(source='company.city', read_only=True)
    sector_label   = serializers.CharField(source='get_sector_display', read_only=True)
    status_label   = serializers.CharField(source='get_status_display', read_only=True)
    is_expired     = serializers.BooleanField(read_only=True)
    applications_count = serializers.SerializerMethodField()
    payment_id         = serializers.SerializerMethodField()

    class Meta:
        model  = Mission
        fields = [
            'id',
            'title', 'description',
            'sector', 'sector_label',
            'city', 'postal_code',
            'budget_min', 'budget_max',
            'deadline',
            'status', 'status_label',
            'is_expired',
            'company_id', 'company_name', 'company_sector', 'company_city',
            'applications_count',
            'payment_id',
            'created_at', 'updated_at',
        ]

    def get_applications_count(self, obj):
        return obj.applications.count()

    def get_payment_id(self, obj):
        try:
            return obj.applications.get(status='accepted').payment.id
        except Exception:
            return None


class MissionCreateSerializer(serializers.ModelSerializer):
    """
    Créer une mission.
    """
    class Meta:
        model  = Mission
        fields = [
            'title', 'description',
            'sector',
            'city', 'postal_code',
            'budget_min', 'budget_max',
            'deadline',
        ]

    def validate_deadline(self, value):
        if value <= timezone.now().date():
            raise serializers.ValidationError(
                "La deadline doit être une date dans le futur."
            )
        return value

    def validate_budget_min(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Le budget minimum doit être supérieur à 0."
            )
        return value

    def validate(self, data):
        budget_min = data.get('budget_min')
        budget_max = data.get('budget_max')
        if budget_min and budget_max and budget_min >= budget_max:
            raise serializers.ValidationError({
                'budget_max': "Le budget maximum doit être supérieur au budget minimum."
            })
        return data


class MissionUpdateSerializer(serializers.ModelSerializer):
    """
    Modifier une mission — PATCH partiel.
    Le posteur peut modifier tant que la mission est 'open'.
    Il peut aussi annuler sa mission (status → cancelled).
    """
    class Meta:
        model  = Mission
        fields = [
            'title', 'description',
            'sector',
            'city', 'postal_code',
            'budget_min', 'budget_max',
            'deadline',
            'status',
        ]

    def validate_status(self, value):
        # Le posteur peut uniquement annuler sa mission
        if value not in ['open', 'cancelled']:
            raise serializers.ValidationError(
                "Vous pouvez uniquement passer le statut à 'open' ou 'cancelled'."
            )
        return value

    def validate_deadline(self, value):
        if value <= timezone.now().date():
            raise serializers.ValidationError(
                "La deadline doit être une date dans le futur."
            )
        return value

    def validate(self, data):
        instance   = self.instance
        budget_min = data.get('budget_min', instance.budget_min)
        budget_max = data.get('budget_max', instance.budget_max)

        if budget_min >= budget_max:
            raise serializers.ValidationError({
                'budget_max': "Le budget maximum doit être supérieur au budget minimum."
            })
        return data