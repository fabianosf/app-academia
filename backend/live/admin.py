from django.contrib import admin

from .models import ClassReservation, Instructor, LiveClass


@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display = ("public_id", "name", "specialty")


@admin.register(LiveClass)
class LiveClassAdmin(admin.ModelAdmin):
    list_display = ("public_id", "title", "status", "date_label", "time_label", "stream_url")
    list_filter = ("status", "level")
    search_fields = ("title", "public_id", "stream_url")


@admin.register(ClassReservation)
class ClassReservationAdmin(admin.ModelAdmin):
    list_display = ("user", "live_class", "reminder")
