from rest_framework import serializers
from django.contrib.auth import authenticate

from User.models import Company, User, EmailVerificationToken
from User.configs.utils import (
    validate_siret,
    validate_email,
    validate_password,
    send_verification_email
)

class RegisterSerializer(serializers.Serializer):
    company_name = serializers.CharField(
        max_length=255, min_length=3, required=True,
        error_messages={
            'required': 'Le nom de l\'entreprise est obligatoire',
            'blank': 'Le nom de l\'entreprise ne peut pas être vide',
            'max_length': 'Le nom ne doit pas dépasser 255 caractères',
            'min_length': 'Le nom doit contenir au moins 3 caractères'
        }
    )
    
    siret = serializers.CharField(
        max_length=14, min_length=14, required=True,
        error_messages={
            'required': 'Le SIRET est obligatoire',
            'max_length': 'Le SIRET doit contenir exactement 14 chiffres',
            'min_length': 'Le SIRET doit contenir exactement 14 chiffres'
        }
    )
    
    contact_email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'L\'email de l\'entreprise est obligatoire',
            'invalid': 'Format email invalide'
        }
    )
    
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    sector = serializers.ChoiceField(choices=Company.SECTOR_CHOICES, required=True)
    address = serializers.CharField(max_length=255, required=True)
    city = serializers.CharField(max_length=100, required=True)
    postal_code = serializers.CharField(max_length=5, min_length=5, required=True)
    
    owner_first_name = serializers.CharField(max_length=150, min_length=2, required=True)
    owner_last_name = serializers.CharField(max_length=150, min_length=2, required=True)
    owner_email = serializers.EmailField(required=True)
    owner_tel = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8, required=True)
    password_confirm = serializers.CharField(write_only=True, min_length=8, required=True)
    
    def validate_siret(self, value):
        if not value.isdigit() or len(value) != 14:
            raise serializers.ValidationError("Le SIRET doit contenir exactement 14 chiffres.")
        if Company.objects.filter(siret=value).exists():
            raise serializers.ValidationError("Une entreprise avec ce SIRET est déjà inscrite.")
        return value
    
    def validate_contact_email(self, value):
        if Company.objects.filter(contact_email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé pour une entreprise.")
        return value
    
    def validate_postal_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Le code postal doit contenir uniquement des chiffres.")
        return value
    
    def validate_company_name(self, value):
        if Company.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("Une entreprise avec ce nom existe déjà.")
        return value
    
    def validate_owner_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé par un autre utilisateur.")
        return value
    
    def validate(self, data):
        password = data.get('password')
        password_confirm = data.get('password_confirm')
        
        if password != password_confirm:
            raise serializers.ValidationError({
                'password': 'Les mots de passe ne correspondent pas.'
            })
        
        if not validate_password(password):
            raise serializers.ValidationError({
                'password': 'Le mot de passe doit contenir des majuscules, des minuscules et des chiffres.'
            })
        
        return data
    
    def create(self, validated_data):
        company = Company.objects.create(
            name=validated_data['company_name'],
            siret=validated_data['siret'],
            contact_email=validated_data['contact_email'],
            phone=validated_data.get('phone', ''),
            sector=validated_data['sector'],
            address=validated_data['address'],
            city=validated_data['city'],
            postal_code=validated_data['postal_code'],
            status='pending',
            is_active=True,
        )
        
        user = User.objects.create_user(
            email=validated_data['owner_email'],
            username=validated_data['owner_email'],
            tel=validated_data['owner_tel'],
            password=validated_data['password'],
            first_name=validated_data['owner_first_name'],
            last_name=validated_data['owner_last_name'],
            company=company,
            role='owner',
        )
        
        token = EmailVerificationToken.create_for_user(user, expiry_hours=24)
        send_verification_email(user, token.token)
        
        return {
            'company': company,
            'user': user,
        }

class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField(
        max_length=255, required=True,
        error_messages={
            'required': 'Le token est obligatoire',
            'blank': 'Le token ne peut pas être vide'
        }
    )
    
    def validate_token(self, value):
        try:
            token_obj = EmailVerificationToken.objects.get(token=value)
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Token invalide ou introuvable.")
        
        if not token_obj.is_valid():
            if token_obj.is_expired():
                raise serializers.ValidationError("Token expiré.")
            if token_obj.is_used:
                raise serializers.ValidationError("Token déjà utilisé.")
        
        return value

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'L\'email est obligatoire',
            'invalid': 'Format email invalide'
        }
    )
    
    password = serializers.CharField(
        write_only=True, required=True,
        error_messages={
            'required': 'Le mot de passe est obligatoire',
            'blank': 'Le mot de passe ne peut pas être vide'
        }
    )
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Email ou mot de passe incorrect.")
        
        if not user.check_password(password):
            raise serializers.ValidationError("Email ou mot de passe incorrect.")
        
        if not user.is_active:
            raise serializers.ValidationError("Ce compte est désactivé.")
        
        if not user.company.is_active:
            raise serializers.ValidationError("Votre entreprise a été désactivée.")
        
        data['user'] = user
        return data