from django.urls import path

from .views import (
    CookieTokenRefreshView,
    FormaTokenObtainPairView,
    HealthView,
    LogoutView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ProfileView,
    RegisterView,
    SessionView,
)
from .views_org import (
    AdminAssignmentEndView,
    AdminAssignmentListCreateView,
    AdminUserListView,
    AdminUserRoleView,
    StudentTeacherSharingView,
    TeacherDashboardView,
    TeacherStudentDetailView,
    TeacherStudentListView,
)

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/token/", FormaTokenObtainPairView.as_view(), name="token_obtain"),
    path(
        "auth/token/refresh/",
        CookieTokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/session/", SessionView.as_view(), name="auth-session"),
    path(
        "auth/password-reset/",
        PasswordResetRequestView.as_view(),
        name="password-reset",
    ),
    path(
        "auth/password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path("me/", MeView.as_view(), name="me"),
    path("me/profile/", ProfileView.as_view(), name="me-profile"),
    path("me/teacher-sharing/", StudentTeacherSharingView.as_view(), name="me-teacher-sharing"),
    path("teacher/dashboard/", TeacherDashboardView.as_view(), name="teacher-dashboard"),
    path("teacher/students/", TeacherStudentListView.as_view(), name="teacher-students"),
    path(
        "teacher/students/<int:student_id>/",
        TeacherStudentDetailView.as_view(),
        name="teacher-student-detail",
    ),
    path("admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path(
        "admin/users/<int:user_id>/role/",
        AdminUserRoleView.as_view(),
        name="admin-user-role",
    ),
    path(
        "admin/assignments/",
        AdminAssignmentListCreateView.as_view(),
        name="admin-assignments",
    ),
    path(
        "admin/assignments/<int:assignment_id>/end/",
        AdminAssignmentEndView.as_view(),
        name="admin-assignment-end",
    ),
]
