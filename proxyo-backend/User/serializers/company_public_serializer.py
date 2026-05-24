from rest_framework import serializers
from User.models.company_model import Company
from User.models.missions_model import Mission


class CompanyPublicSerializer(serializers.ModelSerializer):
    sector_label   = serializers.CharField(source='get_sector_display', read_only=True)
    missions_count = serializers.SerializerMethodField()
    logo_url       = serializers.SerializerMethodField()

    def get_missions_count(self, obj):
        return Mission.objects.filter(company=obj, status='open').count()

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
        return None

    class Meta:
        model  = Company
        fields = [
            'id', 'name', 'sector', 'sector_label',
            'city', 'postal_code', 'country',
            'description', 'logo_url',
            'missions_count', 'created_at',
        ]


class CompanyPublicDetailSerializer(CompanyPublicSerializer):
    open_missions = serializers.SerializerMethodField()
    banner_url    = serializers.SerializerMethodField()

    def get_banner_url(self, obj):
        if obj.banner:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.banner.url) if request else obj.banner.url
        return None

    def get_open_missions(self, obj):
        missions = Mission.objects.filter(company=obj, status='open').values(
            'id', 'title', 'budget_min', 'budget_max', 'city', 'deadline', 'description'
        )[:10]
        return list(missions)

    class Meta(CompanyPublicSerializer.Meta):
        fields = CompanyPublicSerializer.Meta.fields + [
            'phone', 'address', 'banner_url', 'open_missions',
        ]
