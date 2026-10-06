from django.conf import settings
from django.db import models

from catalog.models import Exercise, Workout


class WorkoutFavorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites"
    )
    workout = models.ForeignKey(
        Workout, on_delete=models.CASCADE, related_name="favorited_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "workout")]

    def __str__(self):
        return f"{self.user} ♥ {self.workout}"


class WorkoutSession(models.Model):
    class Difficulty(models.TextChoices):
        MUITO_FACIL = "Muito fácil", "Muito fácil"
        FACIL = "Fácil", "Fácil"
        IDEAL = "Ideal", "Ideal"
        DIFICIL = "Difícil", "Difícil"
        MUITO_DIFICIL = "Muito difícil", "Muito difícil"

    class Place(models.TextChoices):
        CASA = "Casa", "Casa"
        ACADEMIA = "Academia", "Academia"

    public_id = models.CharField(max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sessions"
    )
    workout = models.ForeignKey(
        Workout, on_delete=models.CASCADE, related_name="sessions"
    )
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField(null=True, blank=True)
    completed_exercises = models.PositiveSmallIntegerField(default=0)
    difficulty = models.CharField(
        max_length=20, choices=Difficulty.choices, blank=True, default=""
    )
    note = models.TextField(blank=True, default="")
    minutes = models.PositiveSmallIntegerField(default=0)
    calories = models.PositiveIntegerField(default=0)
    place = models.CharField(max_length=20, choices=Place.choices, blank=True, default="")
    date = models.DateField()

    class Meta:
        ordering = ["-date", "-started_at"]

    def __str__(self):
        return f"{self.user} · {self.workout} · {self.date}"


class LoadLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="load_logs"
    )
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="load_logs",
    )
    exercise_name = models.CharField(max_length=255)
    last_load = models.CharField(max_length=64)
    note = models.CharField(max_length=255, blank=True, default="")
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_at"]

    def __str__(self):
        return f"{self.exercise_name}: {self.last_load}"


class UserGoal(models.Model):
    public_id = models.CharField(max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="goals"
    )
    label = models.CharField(max_length=255)
    current = models.PositiveIntegerField(default=0)
    target = models.PositiveIntegerField()
    unit = models.CharField(max_length=64)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.label


class Achievement(models.Model):
    public_id = models.CharField(max_length=32, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")

    def __str__(self):
        return self.title


class UserAchievement(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_achievements",
    )
    achievement = models.ForeignKey(
        Achievement, on_delete=models.CASCADE, related_name="owners"
    )
    unlocked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [("user", "achievement")]

    @property
    def unlocked(self):
        return self.unlocked_at is not None

    def __str__(self):
        return f"{self.user} · {self.achievement}"
