from django.conf import settings
from django.db import models


class Instructor(models.Model):
    public_id = models.CharField(max_length=32, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    specialty = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class LiveClass(models.Model):
    class Level(models.TextChoices):
        INICIANTE = "Iniciante", "Iniciante"
        INTERMEDIARIO = "Intermediário", "Intermediário"
        AVANCADO = "Avançado", "Avançado"

    class Status(models.TextChoices):
        LIVE = "live", "live"
        UPCOMING = "upcoming", "upcoming"
        RECORDED = "recorded", "recorded"

    public_id = models.CharField(max_length=32, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=64)
    date_label = models.CharField(max_length=64)
    time_label = models.CharField(max_length=16)
    duration_min = models.PositiveSmallIntegerField()
    instructor = models.ForeignKey(
        Instructor, on_delete=models.PROTECT, related_name="classes"
    )
    level = models.CharField(max_length=20, choices=Level.choices)
    spots = models.PositiveIntegerField(default=40)
    participants = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices)
    tone = models.CharField(max_length=128, blank=True, default="")
    # URL de embed/HLS/página do fornecedor (LiveKit/Daily/YouTube Live/etc.)
    stream_url = models.URLField(max_length=1024, blank=True, default="")

    class Meta:
        ordering = ["status", "time_label"]
        verbose_name_plural = "live classes"

    def __str__(self):
        return self.title


class ClassReservation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reservations",
    )
    live_class = models.ForeignKey(
        LiveClass, on_delete=models.CASCADE, related_name="reservations"
    )
    reminder = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "live_class")]

    def __str__(self):
        return f"{self.user} → {self.live_class}"
