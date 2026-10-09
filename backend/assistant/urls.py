from django.urls import path

from .views import NinaChatView
from .views_assist import (
    ApprovedDemoListView,
    AssistFeedbackCreateView,
    DemoGenerateView,
    DemoJobDetailView,
    DemoLocalMediaView,
    DemoReviewView,
    ExerciseAssistClarifyView,
    ExerciseAssistCreateView,
    ExerciseAssistDetailView,
)

urlpatterns = [
    path("nina/chat/", NinaChatView.as_view(), name="nina-chat"),
    path(
        "exercise-assist/",
        ExerciseAssistCreateView.as_view(),
        name="exercise-assist-create",
    ),
    path(
        "exercise-assist/<str:public_id>/",
        ExerciseAssistDetailView.as_view(),
        name="exercise-assist-detail",
    ),
    path(
        "exercise-assist/<str:public_id>/clarify/",
        ExerciseAssistClarifyView.as_view(),
        name="exercise-assist-clarify",
    ),
    path("demos/", ApprovedDemoListView.as_view(), name="demos-list"),
    path("demos/generate/", DemoGenerateView.as_view(), name="demos-generate"),
    path(
        "demos/jobs/<str:public_id>/",
        DemoJobDetailView.as_view(),
        name="demos-job-detail",
    ),
    path(
        "demos/<str:public_id>/review/",
        DemoReviewView.as_view(),
        name="demos-review",
    ),
    path(
        "demo-media/<str:filename>",
        DemoLocalMediaView.as_view(),
        name="demo-local-media",
    ),
    path("feedback/", AssistFeedbackCreateView.as_view(), name="assist-feedback"),
]
