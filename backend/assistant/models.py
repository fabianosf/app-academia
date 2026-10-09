from django.conf import settings
from django.db import models


class ChatThread(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_threads"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Thread({self.user_id})"


class ChatMessage(models.Model):
    class Role(models.TextChoices):
        USER = "user", "user"
        ASSISTANT = "assistant", "assistant"

    public_id = models.CharField(max_length=64, unique=True, db_index=True)
    thread = models.ForeignKey(
        ChatThread, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role}: {self.content[:40]}"


class ExerciseAssistRequest(models.Model):
    class Status(models.TextChoices):
        CLARIFYING = "clarifying", "clarifying"
        READY = "ready", "ready"
        SEARCHING = "searching", "searching"
        ANSWERED = "answered", "answered"
        FAILED = "failed", "failed"

    public_id = models.CharField(max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exercise_assist_requests",
    )
    text = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.READY
    )
    # Interpretação estruturada (JSON): exercise, variation, confidence, intent, etc.
    interpretation = models.JSONField(default=dict, blank=True)
    clarifying_question = models.TextField(blank=True, default="")
    answer_text = models.TextField(blank=True, default="")
    steps = models.JSONField(default=list, blank=True)
    cautions = models.JSONField(default=list, blank=True)
    personalized_from_profile = models.BooleanField(default=False)
    health_caution = models.BooleanField(default=False)
    search_status = models.CharField(max_length=40, blank=True, default="")
    matched_demo = models.ForeignKey(
        "ExerciseDemo",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="matched_requests",
    )
    catalog_exercise = models.ForeignKey(
        "catalog.Exercise",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assist_requests",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Assist({self.public_id}, {self.status})"


class ConsultedSource(models.Model):
    request = models.ForeignKey(
        ExerciseAssistRequest, on_delete=models.CASCADE, related_name="sources"
    )
    title = models.CharField(max_length=512)
    url = models.URLField(max_length=1024)
    authorship = models.CharField(max_length=255, blank=True, default="")
    summary = models.TextField(blank=True, default="")
    consulted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["consulted_at"]

    def __str__(self):
        return self.title[:60]


class ExerciseDemo(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "draft"
        REVIEW = "review", "review"
        APPROVED = "approved", "approved"
        REJECTED = "rejected", "rejected"

    class Persona(models.TextChoices):
        WOMAN = "woman", "woman"
        MAN = "man", "man"
        NEUTRAL = "neutral", "neutral"

    public_id = models.CharField(max_length=64, unique=True, db_index=True)
    exercise_key = models.CharField(max_length=128, db_index=True)
    exercise_name = models.CharField(max_length=255)
    muscle_group = models.CharField(max_length=64, blank=True, default="")
    variation = models.CharField(max_length=128, blank=True, default="")
    equipment = models.JSONField(default=list, blank=True)
    level = models.CharField(max_length=40, blank=True, default="")
    goal = models.CharField(max_length=64, blank=True, default="")
    persona = models.CharField(
        max_length=20, choices=Persona.choices, default=Persona.NEUTRAL
    )
    language = models.CharField(max_length=16, default="pt-BR")
    duration_sec = models.PositiveSmallIntegerField(default=7)
    media_url = models.URLField(max_length=1024, blank=True, default="")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    prompt_version = models.CharField(max_length=64, blank=True, default="v1")
    structured_script = models.JSONField(default=list, blank=True)
    source_notes = models.JSONField(default=list, blank=True)
    ai_generated = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_demos",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_demos",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["exercise_key", "status"]),
            models.Index(fields=["status", "level"]),
        ]

    def __str__(self):
        return f"{self.exercise_name} [{self.status}]"


class DemoGenerationJob(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "pending"
        PROCESSING = "processing", "processing"
        DONE = "done", "done"
        FAILED = "failed", "failed"
        NOT_CONFIGURED = "not_configured", "not_configured"

    public_id = models.CharField(max_length=64, unique=True, db_index=True)
    request = models.ForeignKey(
        ExerciseAssistRequest,
        on_delete=models.CASCADE,
        related_name="generation_jobs",
    )
    demo = models.ForeignKey(
        ExerciseDemo,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="jobs",
    )
    provider = models.CharField(max_length=64, blank=True, default="")
    persona = models.CharField(
        max_length=20,
        choices=ExerciseDemo.Persona.choices,
        default=ExerciseDemo.Persona.NEUTRAL,
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    safe_error = models.CharField(max_length=512, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Job({self.public_id}, {self.status})"


class AssistFeedback(models.Model):
    public_id = models.CharField(max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assist_feedback",
    )
    request = models.ForeignKey(
        ExerciseAssistRequest,
        on_delete=models.CASCADE,
        related_name="feedback",
    )
    demo = models.ForeignKey(
        ExerciseDemo,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="feedback",
    )
    useful = models.BooleanField(null=True, blank=True)
    equipment_ok = models.BooleanField(null=True, blank=True)
    prefer_shorter = models.BooleanField(null=True, blank=True)
    comment = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Feedback({self.public_id})"
