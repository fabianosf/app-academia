from django.contrib import admin

from .models import Exercise, Workout, WorkoutExercise


class WorkoutExerciseInline(admin.TabularInline):
    model = WorkoutExercise
    extra = 0


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ("public_id", "name", "focus", "place", "sets")
    search_fields = ("name", "public_id", "focus")
    list_filter = ("place", "focus")


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ("public_id", "name", "place", "level", "duration_min")
    search_fields = ("name", "public_id")
    list_filter = ("place", "level")
    inlines = [WorkoutExerciseInline]
