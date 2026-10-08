from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import UserProfile
from .serializers import (
    RegisterSerializer,
    UserMeUpdateSerializer,
    UserProfileSerializer,
    UserSerializer,
)

User = get_user_model()


class FormaTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Aceita username ou e-mail no campo username."""

    def validate(self, attrs):
        login = (attrs.get("username") or "").strip()
        if "@" in login:
            user = User.objects.filter(email__iexact=login).first()
            if user:
                attrs["username"] = user.get_username()
        return super().validate(attrs)


class FormaTokenObtainPairView(TokenObtainPairView):
    serializer_class = FormaTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    def get(self, request):
        UserProfile.objects.get_or_create(user=request.user)
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        me_serializer = UserMeUpdateSerializer(
            user, data=request.data, partial=True
        )
        me_serializer.is_valid(raise_exception=True)
        me_serializer.save()

        profile_data = request.data.get("profile")
        if profile_data is not None:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            serializer = UserProfileSerializer(
                profile, data=profile_data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            if request.data.get("onboarded") is True or profile_data:
                user.onboarded = True
                user.save(update_fields=["onboarded"])
        return Response(UserSerializer(user).data)


class ProfileView(APIView):
    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        request.user.onboarded = True
        request.user.save(update_fields=["onboarded"])
        return Response(serializer.data)


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok", "service": "forma-com-fabiano-api"})


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        payload = {
            "detail": (
                "Se existir uma conta com este e-mail, enviaremos instruções "
                "para redefinir a senha."
            )
        }
        if not email:
            return Response(
                {"detail": "Informe um e-mail."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = (
            User.objects.filter(email__iexact=email).first()
            or User.objects.filter(username__iexact=email).first()
        )
        if user and user.email:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            frontend = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
            reset_url = f"{frontend}/redefinir-senha?uid={uid}&token={token}"
            subject = "Redefinir senha — Forma com Fabiano"
            body = (
                f"Olá, {user.name or user.username}.\n\n"
                f"Recebemos um pedido para redefinir sua senha.\n"
                f"Abra o link abaixo (válido por tempo limitado):\n\n"
                f"{reset_url}\n\n"
                f"Se você não pediu isso, ignore este e-mail.\n"
            )
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
            if settings.DEBUG:
                payload["devResetUrl"] = reset_url

        return Response(payload)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get("uid") or ""
        token = request.data.get("token") or ""
        password = request.data.get("password") or ""
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response(
                {"detail": "Link inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "Link inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            validate_password(password, user=user)
        except DjangoValidationError as exc:
            return Response(
                {"detail": list(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(password)
        user.save()
        return Response({"detail": "Senha atualizada. Você já pode entrar."})
