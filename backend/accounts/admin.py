from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "name", "role", "plan", "streak_days", "is_staff")
    list_filter = ("role", "plan", "subscription_status", "is_staff")
    search_fields = ("username", "email", "name")
    inlines = [UserProfileInline]
    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "Forma",
            {
                "fields": (
                    "name",
                    "avatar_initials",
                    "role",
                    "streak_days",
                    "plan",
                    "subscription_status",
                    "onboarded",
                    "theme",
                )
            },
        ),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "goal", "level", "place", "weekly_frequency")
