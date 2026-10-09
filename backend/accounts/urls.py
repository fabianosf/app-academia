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
]
