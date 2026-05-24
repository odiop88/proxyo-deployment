from rest_framework import serializers
from User.models import Application


class ApplicationListSerializer(serializers.ModelSerializer):
    """
    Utilisé dans GET /api/missions/{id}/applications/
    Vu par le posteur de la mission — affiche les candidats.
    """
    company_name   = serializers.CharField(source='company.name',   read_only=True)
    company_sector = serializers.CharField(source='company.sector', read_only=True)
    company_city   = serializers.CharField(source='company.city',   read_only=True)
    status_label   = serializers.CharField(source='get_status_display', read_only=True)

    tva_amount           = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    platform_fee         = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    prestataire_receives = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    client_pays          = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = Application
        fields = [
            'id',
            'company_id', 'company_name', 'company_sector', 'company_city',
            'cover_letter', 'proposed_price', 'estimated_days',
            'apply_tva', 'tva_rate',
            'tva_amount', 'platform_fee', 'prestataire_receives', 'client_pays',
            'status', 'status_label',
            'created_at',
        ]


class ApplicationSentSerializer(serializers.ModelSerializer):
    """
    Utilisé dans GET /api/dashboard/missions/applied/
    Vu par le candidat — affiche les missions où il a candidaté.
    """
    mission_id     = serializers.IntegerField(source='mission.id',           read_only=True)
    mission_title  = serializers.CharField(source='mission.title',           read_only=True)
    mission_city   = serializers.CharField(source='mission.city',            read_only=True)
    mission_sector = serializers.CharField(source='mission.sector',          read_only=True)
    mission_status = serializers.CharField(source='mission.status',          read_only=True)
    posted_by      = serializers.CharField(source='mission.company.name',    read_only=True)
    status_label   = serializers.CharField(source='get_status_display',      read_only=True)
    payment_id     = serializers.SerializerMethodField()

    tva_amount           = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    platform_fee         = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    prestataire_receives = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    client_pays          = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    def get_payment_id(self, obj):
        try:
            return obj.payment.id
        except Exception:
            return None

    class Meta:
        model  = Application
        fields = [
            'id',
            'mission_id', 'mission_title', 'mission_city', 'mission_sector', 'mission_status', 'posted_by',
            'proposed_price', 'estimated_days',
            'apply_tva', 'tva_rate',
            'tva_amount', 'platform_fee', 'prestataire_receives', 'client_pays',
            'status', 'status_label',
            'payment_id',
            'created_at',
        ]


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """
    Utilisé dans POST /api/missions/{id}/apply/
    """
    class Meta:
        model  = Application
        fields = ['cover_letter', 'proposed_price', 'estimated_days', 'apply_tva', 'tva_rate']

    def validate(self, data):
        apply_tva = data.get('apply_tva', False)
        tva_rate  = data.get('tva_rate')
        if apply_tva and not tva_rate:
            raise serializers.ValidationError({
                'tva_rate': "Le taux de TVA est requis si vous appliquez la TVA."
            })
        if not apply_tva:
            data['tva_rate'] = None
        return data

    def validate_tva_rate(self, value):
        if value is not None and not (0 < value <= 100):
            raise serializers.ValidationError("Le taux de TVA doit être entre 0 et 100.")
        return value

    def validate_proposed_price(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Le prix proposé doit être supérieur à 0."
            )
        return value

    def validate_estimated_days(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Le délai estimé doit être supérieur à 0 jour."
            )
        return value


class ApplicationActionSerializer(serializers.Serializer):
    """
    Utilisé dans PATCH /api/applications/{id}/
    Le posteur accepte ou rejette une candidature.
    """
    action = serializers.ChoiceField(choices=['accept', 'reject'])

