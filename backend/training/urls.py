from django.urls import path

from .views import (
    AchievementListView,
    FavoriteListView,
    GoalListView,
    HistoryListView,
    LoadLogListCreateView,
    ProgressSummaryView,
    SessionListCreateView,
)

urlpatterns = [
    path("favorites/", FavoriteListView.as_view(), name="favorites"),
    path("sessions/", SessionListCreateView.as_view(), name="sessions"),
    path("history/", HistoryListView.as_view(), name="history"),
    path("goals/", GoalListView.as_view(), name="goals"),
    path("achievements/", AchievementListView.as_view(), name="achievements"),
    path("load-logs/", LoadLogListCreateView.as_view(), name="load-logs"),
    path("progress/", ProgressSummaryView.as_view(), name="progress"),
]
