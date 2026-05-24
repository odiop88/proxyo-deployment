from rest_framework import serializers
from User.models.payment_model import Payment


class PaymentSerializer(serializers.ModelSerializer):
    mission_title      = serializers.CharField(source='application.mission.title',        read_only=True)
    mission_id         = serializers.IntegerField(source='application.mission.id',        read_only=True)
    prestataire_name   = serializers.CharField(source='application.company.name',         read_only=True)
    client_name        = serializers.CharField(source='application.mission.company.name', read_only=True)
    status_label       = serializers.CharField(source='get_status_display',               read_only=True)

    class Meta:
        model  = Payment
        fields = [
            'id',
            'mission_id', 'mission_title',
            'client_name', 'prestataire_name',
            'proposed_price',
            'tva_rate', 'tva_amount',
            'platform_fee',
            'prestataire_receives',
            'total_client_pays',
            'status', 'status_label',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields
