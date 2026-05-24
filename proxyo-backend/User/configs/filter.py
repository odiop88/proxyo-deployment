import django_filters
from User.models.missions_model import Mission


class MissionFilter(django_filters.FilterSet):
    sector         = django_filters.CharFilter(field_name='sector',     lookup_expr='exact')
    city           = django_filters.CharFilter(field_name='city',       lookup_expr='icontains')
    status         = django_filters.CharFilter(field_name='status',     lookup_expr='exact')
    budget_min     = django_filters.NumberFilter(field_name='budget_min', lookup_expr='gte')
    budget_max     = django_filters.NumberFilter(field_name='budget_max', lookup_expr='lte')
    deadline_after = django_filters.DateFilter(field_name='deadline',   lookup_expr='gte')

    class Meta:
        model  = Mission
        fields = ['sector', 'city', 'status', 'budget_min', 'budget_max']