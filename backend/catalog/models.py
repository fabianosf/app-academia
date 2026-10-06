from django.db import models


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
