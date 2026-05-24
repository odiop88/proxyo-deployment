from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from User.serializers.user_serializer import ProfileSerializer, AvatarSerializer
from User.configs.permissions import IsActiveCompany


class ProfileView(APIView):
    """
    GET  /api/profile/  -> Récupérer son profil
    PATCH /api/profile/ -> Mettre à jour son profil (first_name, last_name, tel, job_title, bio)
    """
    permission_classes = [IsAuthenticated, IsActiveCompany]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = ProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AvatarUploadView(APIView):
    """
    PATCH /api/profile/avatar/ -> Uploader ou remplacer son avatar
    DELETE /api/profile/avatar/ -> Supprimer son avatar
    """
    permission_classes = [IsAuthenticated, IsActiveCompany]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request):
        serializer = AvatarSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            # Supprimer l'ancien avatar du stockage
            user = request.user
            if user.avatar:
                user.avatar.delete(save=False)
            serializer.save()
            return Response(
                {'avatar': request.build_absolute_uri(serializer.instance.avatar.url) if serializer.instance.avatar else None},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        if user.avatar:
            user.avatar.delete(save=False)
            user.avatar = None
            user.save(update_fields=['avatar'])
        return Response(status=status.HTTP_204_NO_CONTENT)
