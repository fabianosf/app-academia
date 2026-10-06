from django.urls import path

from .views import MovementAnalyzeView, MovementEndView

urlpatterns = [
    path("analyze/", MovementAnalyzeView.as_view(), name="movement-analyze"),
    path(
        "sessions/<int:session_id>/end/",
        MovementEndView.as_view(),
        name="movement-end",
    ),
]
