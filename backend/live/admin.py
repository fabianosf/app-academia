from django.contrib import admin

from .models import ClassReservation, Instructor, LiveClass


@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display = ("public_id", "name", "specialty")


@admin.register(LiveClass)
class LiveClassAdmin(admin.ModelAdmin):
    list_display = ("public_id", "title", "status", "date_label", "time_label")
    list_filter = ("status", "level")


@admin.register(ClassReservation)
class ClassReservationAdmin(admin.ModelAdmin):
    list_display = ("user", "live_class", "reminder")
