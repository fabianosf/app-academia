"""Helpers para JWT em cookies HttpOnly."""

from django.conf import settings


def _cookie_common():
    return {
        "httponly": True,
        "secure": getattr(settings, "JWT_COOKIE_SECURE", False),
        "samesite": getattr(settings, "JWT_COOKIE_SAMESITE", "Lax"),
        "path": getattr(settings, "JWT_COOKIE_PATH", "/"),
    }


def set_jwt_cookies(response, access: str, refresh: str | None = None):
    common = _cookie_common()
    access_name = settings.JWT_ACCESS_COOKIE
    refresh_name = settings.JWT_REFRESH_COOKIE
    access_max = int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds())
    response.set_cookie(
        access_name,
        access,
        max_age=access_max,
        **common,
    )
    if refresh is not None:
        refresh_max = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
        response.set_cookie(
            refresh_name,
            refresh,
            max_age=refresh_max,
            **common,
        )
    return response


def clear_jwt_cookies(response):
    common = _cookie_common()
    response.delete_cookie(
        settings.JWT_ACCESS_COOKIE,
        path=common["path"],
        samesite=common["samesite"],
    )
    response.delete_cookie(
        settings.JWT_REFRESH_COOKIE,
        path=common["path"],
        samesite=common["samesite"],
    )
    return response
