from django.contrib import admin

from .models import MovementSample, MovementSession


class MovementSampleInline(admin.TabularInline):
    model = MovementSample
    extra = 0


@admin.register(MovementSession)
class MovementSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "exercise_label", "started_at", "consent_accepted")
    inlines = [MovementSampleInline]
