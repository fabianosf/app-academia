from django.conf import settings
from django.db import models


class PublishStatus(models.TextChoices):
    DRAFT = "draft", "Rascunho"
    PUBLISHED = "published", "Publicado"
    ARCHIVED = "archived", "Arquivado"


class Exercise(models.Model):
    class Place(models.TextChoices):
        CASA = "Casa", "Casa"
        ACADEMIA = "Academia", "Academia"
        AMBOS = "Ambos", "Ambos"

    public_id = models.CharField(max_length=32, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    sets = models.PositiveSmallIntegerField(default=3)
    reps = models.CharField(max_length=64)
    rest_seconds = models.PositiveIntegerField(default=45)
    suggested_load = models.CharField(max_length=64, blank=True, default="")
    tip = models.TextField(blank=True, default="")
    focus = models.CharField(max_length=64)
    place = models.CharField(max_length=20, choices=Place.choices, default=Place.AMBOS)
    publish_status = models.CharField(
        max_length=20,
        choices=PublishStatus.choices,
        default=PublishStatus.PUBLISHED,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_exercises",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Workout(models.Model):
    class Place(models.TextChoices):
        CASA = "Casa", "Casa"
        ACADEMIA = "Academia", "Academia"

    class Level(models.TextChoices):
        INICIANTE = "Iniciante", "Iniciante"
        INTERMEDIARIO = "Intermediário", "Intermediário"
        AVANCADO = "Avançado", "Avançado"

    public_id = models.CharField(max_length=32, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    place = models.CharField(max_length=20, choices=Place.choices)
    level = models.CharField(max_length=20, choices=Level.choices)
    duration_min = models.PositiveSmallIntegerField()
    calories = models.PositiveIntegerField(default=0)
    focus = models.JSONField(default=list, blank=True)
    equipment = models.JSONField(default=list, blank=True)
    muscles = models.JSONField(default=list, blank=True)
    safety = models.JSONField(default=list, blank=True)
    tone = models.CharField(max_length=128, blank=True, default="")
    publish_status = models.CharField(
        max_length=20,
        choices=PublishStatus.choices,
        default=PublishStatus.PUBLISHED,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_workouts",
    )
    exercises = models.ManyToManyField(
        Exercise, through="WorkoutExercise", related_name="workouts"
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class WorkoutExercise(models.Model):
    workout = models.ForeignKey(
        Workout, on_delete=models.CASCADE, related_name="workout_exercises"
    )
    exercise = models.ForeignKey(
        Exercise, on_delete=models.CASCADE, related_name="workout_links"
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        unique_together = [("workout", "exercise")]

    def __str__(self):
        return f"{self.workout} → {self.exercise} ({self.order})"


class ContentAssignment(models.Model):
    """
    Atribuição de conteúdo a um aluno.
    Regra de visibilidade: se o conteúdo não tem nenhuma atribuição,
    alunos veem-no quando published (catálogo legado). Se tem ≥1 atribuição,
    só os alunos atribuídos o veem.
    """

    class ContentType(models.TextChoices):
        WORKOUT = "workout", "Treino"
        LIVE_CLASS = "live_class", "Aula ao vivo"
        LINK = "link", "Link / vídeo externo"

    content_type = models.CharField(max_length=20, choices=ContentType.choices)
    content_id = models.CharField(max_length=64, db_index=True)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="content_assignments",
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="content_assigned",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("content_type", "content_id", "student")]
        indexes = [models.Index(fields=["content_type", "content_id"])]

    def __str__(self):
        return f"{self.content_type}:{self.content_id}→{self.student_id}"


class ExternalLink(models.Model):
    """Link/vídeo externo gerido por staff (embed só de domínios permitidos)."""

    public_id = models.CharField(max_length=32, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    url = models.URLField(max_length=1024)
    description = models.TextField(blank=True, default="")
    publish_status = models.CharField(
        max_length=20,
        choices=PublishStatus.choices,
        default=PublishStatus.DRAFT,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_links",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title
