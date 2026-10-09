from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Plan(models.TextChoices):
        ESSENCIAL = "Essencial", "Essencial"
        COMPLETO = "Completo", "Completo"

    class SubscriptionStatus(models.TextChoices):
        ATIVO = "Ativo", "Ativo"
        PAUSA = "Pausa", "Pausa"

    class Role(models.TextChoices):
        STUDENT = "student", "Aluno"
        TEACHER = "teacher", "Professor"
        ADMIN = "admin", "Administrador"

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
    # Migração inicial: todos → student (sem promoção automática de is_staff).
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.STUDENT, db_index=True
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
        # Manter is_staff alinhado com admin da plataforma (Django admin / IsAdminUser).
        if self.role == self.Role.ADMIN or self.is_superuser:
            self.is_staff = True
        elif self.role in (self.Role.STUDENT, self.Role.TEACHER) and not self.is_superuser:
            self.is_staff = False
        super().save(*args, **kwargs)

    @property
    def is_platform_admin(self) -> bool:
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def is_teacher_or_admin(self) -> bool:
        return (
            self.role in (self.Role.TEACHER, self.Role.ADMIN) or self.is_superuser
        )

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


class TeacherStudentAssignment(models.Model):
    """Atribuição formal professor↔aluno com histórico (encerrar, não apagar)."""

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teaching_assignments",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_assignments",
    )
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments_created",
    )
    ended_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments_ended",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    note = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["teacher", "ended_at"]),
            models.Index(fields=["student", "ended_at"]),
        ]

    @property
    def is_active(self) -> bool:
        return self.ended_at is None

    def __str__(self):
        state = "ativa" if self.is_active else "encerrada"
        return f"{self.teacher_id}→{self.student_id} ({state})"


class TeacherDataConsent(models.Model):
    """Consentimento explícito e revogável por categoria (registos de auditoria preservados)."""

    class Category(models.TextChoices):
        FREQUENCY = "frequency", "Frequência semanal"
        COMPLETED_SESSIONS = "completed_sessions", "Sessões concluídas"
        MINUTES = "minutes", "Minutos treinados"
        GOALS = "goals", "Metas"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teacher_consents_given",
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teacher_consents_received",
    )
    category = models.CharField(max_length=32, choices=Category.choices)
    granted_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-granted_at"]
        indexes = [
            models.Index(fields=["student", "teacher", "category", "revoked_at"]),
        ]

    @property
    def is_active(self) -> bool:
        return self.revoked_at is None

    def __str__(self):
        return f"{self.student_id}:{self.category}→{self.teacher_id}"


class AdminAuditLog(models.Model):
    """Ações administrativas relevantes (sem segredos)."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_actions",
    )
    action = models.CharField(max_length=64)
    target_type = models.CharField(max_length=64, blank=True, default="")
    target_id = models.CharField(max_length=64, blank=True, default="")
    detail = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} @ {self.created_at}"
