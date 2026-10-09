from django.contrib import admin

from .models import (
    AssistFeedback,
    ChatMessage,
    ChatThread,
    ConsultedSource,
    DemoGenerationJob,
    ExerciseAssistRequest,
    ExerciseDemo,
)


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0


@admin.register(ChatThread)
class ChatThreadAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "updated_at")
    inlines = [ChatMessageInline]


@admin.register(ExerciseAssistRequest)
class ExerciseAssistRequestAdmin(admin.ModelAdmin):
    list_display = ("public_id", "user", "status", "health_caution", "created_at")
    list_filter = ("status", "health_caution")
    search_fields = ("public_id", "text", "user__username")


@admin.register(ExerciseDemo)
class ExerciseDemoAdmin(admin.ModelAdmin):
    list_display = (
        "public_id",
        "exercise_name",
        "status",
        "persona",
        "duration_sec",
        "updated_at",
    )
    list_filter = ("status", "persona", "ai_generated")
    search_fields = ("public_id", "exercise_name", "exercise_key")


@admin.register(DemoGenerationJob)
class DemoGenerationJobAdmin(admin.ModelAdmin):
    list_display = ("public_id", "status", "provider", "created_at")
    list_filter = ("status",)


admin.site.register(ChatMessage)
admin.site.register(ConsultedSource)
admin.site.register(AssistFeedback)
