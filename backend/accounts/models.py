from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Plan(models.TextChoices):
        ESSENCIAL = "Essencial", "Essencial"
        COMPLETO = "Completo", "Completo"

    class SubscriptionStatus(models.TextChoices):
        ATIVO = "Ativo", "Ativo"
        PAUSA = "Pausa", "Pausa"

    name = models.CharField(max_length=255, blank=True)
    avatar_initials = models.CharField(max_length=4, blank=True, default="")
    streak_days = models.PositiveIntegerField(default=0)
    plan = models.CharField(
        max_length=20, choices=Plan.choices, default=Plan.ESSENCIAL
    )
    subscription_status = models.CharField(
        max_length=20,
        choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.ATIVO,
    )
    onboarded = models.BooleanField(default=False)
    theme = models.CharField(max_length=10, default="light")

    def save(self, *args, **kwargs):
        if not self.name and (self.first_name or self.last_name):
            self.name = f"{self.first_name} {self.last_name}".strip()
        if not self.avatar_initials and self.name:
            parts = self.name.split()
            self.avatar_initials = (
                "".join(p[0] for p in parts[:2]).upper() if parts else ""
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name or self.username


class UserProfile(models.Model):
    class Goal(models.TextChoices):
        EMAGRECER = "Emagrecer", "Emagrecer"
        MASSA = "Ganhar massa muscular", "Ganhar massa muscular"
        CONDICIONAMENTO = "Condicionamento físico", "Condicionamento físico"
        MOBILIDADE = "Mobilidade", "Mobilidade"
        SAUDE = "Saúde e bem-estar", "Saúde e bem-estar"

    class Level(models.TextChoices):
        INICIANTE = "Iniciante", "Iniciante"
        INTERMEDIARIO = "Intermediário", "Intermediário"
        AVANCADO = "Avançado", "Avançado"

    class Place(models.TextChoices):
        CASA = "Casa", "Casa"
        ACADEMIA = "Academia", "Academia"
        AMBOS = "Ambos", "Ambos"

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile"
    )
    goal = models.CharField(
        max_length=40, choices=Goal.choices, default=Goal.CONDICIONAMENTO
    )
    level = models.CharField(
        max_length=20, choices=Level.choices, default=Level.INICIANTE
    )
    place = models.CharField(
        max_length=20, choices=Place.choices, default=Place.AMBOS
    )
    weekly_frequency = models.PositiveSmallIntegerField(default=3)
    session_minutes = models.PositiveSmallIntegerField(default=30)
    equipment = models.JSONField(default=list, blank=True)
    limitations = models.TextField(blank=True, default="")
    notify_reminders = models.BooleanField(default=True)
    notify_live = models.BooleanField(default=True)
    notify_nina = models.BooleanField(default=True)
    camera_consent = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile({self.user})"
