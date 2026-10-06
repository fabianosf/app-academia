from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from catalog.views import ExerciseViewSet, WorkoutViewSet

router = DefaultRouter()
router.register(r"exercises", ExerciseViewSet, basename="exercise")
router.register(r"workouts", WorkoutViewSet, basename="workout")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include(router.urls)),
    path("api/training/", include("training.urls")),
    path("api/live/", include("live.urls")),
    path("api/assistant/", include("assistant.urls")),
    path("api/movement/", include("movement.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/branding/", include("branding.urls")),
]
