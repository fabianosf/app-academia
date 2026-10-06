from django.contrib import admin

from .models import (
    Achievement,
    LoadLog,
    UserAchievement,
    UserGoal,
    WorkoutFavorite,
    WorkoutSession,
)


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ("public_id", "user", "workout", "date", "minutes", "calories")
    list_filter = ("place", "date")


admin.site.register(WorkoutFavorite)
admin.site.register(LoadLog)
admin.site.register(UserGoal)
admin.site.register(Achievement)
admin.site.register(UserAchievement)
