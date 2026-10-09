from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """Lê Bearer header; se ausente, usa cookie HttpOnly de access."""

    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            return super().authenticate(request)

        raw = request.COOKIES.get(settings.JWT_ACCESS_COOKIE)
        if not raw:
            return None
        validated = self.get_validated_token(raw)
        return self.get_user(validated), validated


class SoftCookieJWTAuthentication(CookieJWTAuthentication):
    """Igual ao cookie JWT, mas tokens inválidos/expirados → anónimo (sem 401)."""

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError, AuthenticationFailed):
            return None
