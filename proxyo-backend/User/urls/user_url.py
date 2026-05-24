from django.urls import path
from User.views.user_view import ProfileView, AvatarUploadView

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/avatar/', AvatarUploadView.as_view(), name='profile-avatar'),
]
