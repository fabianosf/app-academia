from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    notifications = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "goal",
            "level",
            "place",
            "weekly_frequency",
            "session_minutes",
            "equipment",
            "limitations",
            "notifications",
            "camera_consent",
            "notify_reminders",
            "notify_live",
            "notify_nina",
        ]
        extra_kwargs = {
            "notify_reminders": {"write_only": True, "required": False},
            "notify_live": {"write_only": True, "required": False},
            "notify_nina": {"write_only": True, "required": False},
        }

    def get_notifications(self, obj):
        return {
            "reminders": obj.notify_reminders,
            "live": obj.notify_live,
            "nina": obj.notify_nina,
        }

    def update(self, instance, validated_data):
        notifications = self.initial_data.get("notifications")
        if isinstance(notifications, dict):
            if "reminders" in notifications:
                instance.notify_reminders = bool(notifications["reminders"])
            if "live" in notifications:
                instance.notify_live = bool(notifications["live"])
            if "nina" in notifications:
                instance.notify_nina = bool(notifications["nina"])
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["weeklyFrequency"] = data.pop("weekly_frequency")
        data["sessionMinutes"] = data.pop("session_minutes")
        data["cameraConsent"] = data.pop("camera_consent")
        data.pop("notify_reminders", None)
        data.pop("notify_live", None)
        data.pop("notify_nina", None)
        return data


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "name",
            "avatar_initials",
            "streak_days",
            "plan",
            "subscription_status",
            "onboarded",
            "theme",
            "profile",
        ]
        read_only_fields = [
            "id",
            "username",
            "plan",
            "subscription_status",
            "streak_days",
            "avatar_initials",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["avatarInitials"] = data.pop("avatar_initials")
        data["streakDays"] = data.pop("streak_days")
        data["subscriptionStatus"] = data.pop("subscription_status")
        data["isStaff"] = bool(instance.is_staff)
        return data


class UserMeUpdateSerializer(serializers.ModelSerializer):
    """Campos editáveis pelo próprio utilizador — nunca plan/subscription."""

    class Meta:
        model = User
        fields = ["name", "email", "theme", "onboarded"]

    def validate_email(self, value):
        value = (value or "").strip()
        if not value:
            return value
        qs = User.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este e-mail já está em uso.")
        return value

    def validate_theme(self, value):
        if value not in ("light", "dark"):
            raise serializers.ValidationError("Tema inválido.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "name"]

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        UserProfile.objects.get_or_create(user=user)
        return user
