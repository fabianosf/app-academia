from django.urls import path

from .views import (
    InstructorListView,
    LiveClassDetailView,
    LiveClassListView,
    ReservationListView,
    ReservationReminderView,
)

urlpatterns = [
    path("instructors/", InstructorListView.as_view(), name="instructors"),
    path("classes/", LiveClassListView.as_view(), name="live-classes"),
    path("classes/<str:public_id>/", LiveClassDetailView.as_view(), name="live-class"),
    path("reservations/", ReservationListView.as_view(), name="reservations"),
    path(
        "reservations/<str:class_id>/reminder/",
        ReservationReminderView.as_view(),
        name="reservation-reminder",
    ),
]
