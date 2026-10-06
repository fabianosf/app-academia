from django.conf import settings
from django.db import models


class MovementSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="movement_sessions",
    )
    exercise_label = models.CharField(max_length=255)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    consent_accepted = models.BooleanField(default=False)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.user} · {self.exercise_label}"


class MovementSample(models.Model):
    session = models.ForeignKey(
        MovementSession, on_delete=models.CASCADE, related_name="samples"
    )
    elapsed_seconds = models.PositiveIntegerField()
    score = models.PositiveSmallIntegerField()
    reps = models.PositiveIntegerField(default=0)
    cues = models.JSONField(default=list, blank=True)
    disclaimer = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"sample t={self.elapsed_seconds}s score={self.score}"
