from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from User.configs.utils import send_verification_email
from User.models import User, EmailVerificationToken
from User.serializers.auth_user_serializer import (
    RegisterSerializer,
    VerifyEmailSerializer,
    LoginSerializer
)

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            result = serializer.save()
            
            company = result['company']
            user = result['user']
            
            return Response({
                'message': 'Inscription réussie. Email de vérification envoyé.',
                'company': {
                    'id': str(company.id),
                    'name': company.name,
                    'siret': company.siret,
                    'contact_email': company.contact_email,
                    'sector': company.sector,
                    'city': company.city,
                    'status': company.status,
                    'is_active': company.is_active,
                },
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                    'is_verified': user.is_verified,
                },
                'verification_required': True,
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        
        if serializer.is_valid():
            token_string = serializer.validated_data['token']
            is_valid, user = EmailVerificationToken.verify_token(token_string)
            
            if not is_valid:
                return Response({
                    'detail': 'Token invalide ou expiré.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.is_verified = True
            user.save()
            
            return Response({
                'message': 'Email vérifié avec succès',
                'user_id': str(user.id),
                'email': user.email,
                'is_verified': user.is_verified,
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({'detail': 'Email est requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        if user.is_verified:
            return Response({'detail': 'Email déjà vérifié'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = EmailVerificationToken.create_for_user(user, expiry_hours=24)
        send_verification_email(user, token.token)
        
        return Response({'message': 'Email de vérification renvoyé'}, status=status.HTTP_200_OK)    

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            company = user.company
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Connexion réussie',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                    'is_verified': user.is_verified,
                    'is_active': user.is_active,
                    'company_id': str(company.id),
                },
                'company': {
                    'id': str(company.id),
                    'name': company.name,
                    'siret': company.siret,
                    'sector': company.sector,
                    'city': company.city,
                    'status': company.status,
                    'is_active': company.is_active,
                    'users_count': company.users.count(),
                },
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)