"""Django settings for Forma com Fabiano API."""

from datetime import timedelta
from pathlib import Path
import os

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

INSECURE_DEV_SECRET = "django-insecure-forma-dev-only-change-in-production"

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", INSECURE_DEV_SECRET)

DEBUG = os.getenv("DJANGO_DEBUG", "true").lower() == "true"

ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv(
        "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver"
    ).split(",")
    if h.strip()
]
if DEBUG and "*" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append("*")

# Produção: falha cedo se configuração insegura.
if not DEBUG:
    if not SECRET_KEY or SECRET_KEY == INSECURE_DEV_SECRET:
        raise ImproperlyConfigured(
            "Defina DJANGO_SECRET_KEY forte; o valor de desenvolvimento não é "
            "permitido com DJANGO_DEBUG=false."
        )
    if not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS:
        raise ImproperlyConfigured(
            "Com DJANGO_DEBUG=false, defina DJANGO_ALLOWED_HOSTS explícitos "
            "(sem '*')."
        )

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party
    "corsheaders",
    "django_filters",
    "rest_framework",
    "rest_framework_simplejwt",
    # local
    "accounts",
    "catalog",
    "training",
    "live",
    "assistant",
    "movement",
    "notifications",
    "branding",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTH_USER_MODEL = "accounts.User"

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if o.strip()
]
# Em DEBUG, libera origens da LAN (celular na mesma Wi‑Fi), HTTP e HTTPS.
CORS_ALLOWED_ORIGIN_REGEXES = (
    [
        r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        r"^https?://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$",
        r"^https?://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$",
    ]
    if DEBUG
    else []
)
CORS_ALLOW_CREDENTIALS = True

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "CSRF_TRUSTED_ORIGINS",
        ",".join(CORS_ALLOWED_ORIGINS) if CORS_ALLOWED_ORIGINS else FRONTEND_URL,
    ).split(",")
    if o.strip()
]

# JWT em cookies HttpOnly (SameSite=Lax mitiga CSRF cross-site em POST).
JWT_ACCESS_COOKIE = "forma_access"
JWT_REFRESH_COOKIE = "forma_refresh"
JWT_COOKIE_PATH = "/"
JWT_COOKIE_SAMESITE = "Lax"
JWT_COOKIE_SECURE = os.getenv(
    "JWT_COOKIE_SECURE",
    "true" if FRONTEND_URL.startswith("https") else "false",
).lower() in ("1", "true", "yes")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "accounts.authentication.CookieJWTAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_THROTTLE_RATES": {
        "auth": "30/min",
        "anon": "120/min",
        "user": "600/min",
        "assistant": "20/min",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=12),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@formacomfabiano.local")
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
)

# Nina / ANS LLM (OpenAI-compatible)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
ANS_KNOWLEDGE_PATH = BASE_DIR / "assistant" / "knowledge" / "ans_academia_nutricao_saude_v1.md"
ANS_HASH = (
    "###ΩΨΧ.ANS.ACADEMIA.NUTRICAO.SAUDE.v1.0.ALPHALANG.NATIVE."
    "35BLOCOS.∇∆∞.20260424.ΨΧΩMASTER###"
)

# Pesquisa web (adapter HTTP genérico). Vazio = search_unavailable.
WEB_SEARCH_PROVIDER = os.getenv("WEB_SEARCH_PROVIDER", "")
WEB_SEARCH_API_KEY = os.getenv("WEB_SEARCH_API_KEY", "")
WEB_SEARCH_BASE_URL = os.getenv("WEB_SEARCH_BASE_URL", "")

# Geração de vídeo avatar. Vazio = not_configured.
# local (grátis) | heygen | http | (vazio)
VIDEO_DEMO_PROVIDER = os.getenv("VIDEO_DEMO_PROVIDER", "")
VIDEO_DEMO_API_KEY = os.getenv("VIDEO_DEMO_API_KEY", "")
VIDEO_DEMO_BASE_URL = os.getenv("VIDEO_DEMO_BASE_URL", "")
VIDEO_DEMO_LOCAL_DIR = os.getenv("VIDEO_DEMO_LOCAL_DIR", "media/demo_samples")
# HeyGen: IDs do dashboard / GET /v3/avatars e /v3/voices
VIDEO_DEMO_AVATAR_NEUTRAL = os.getenv("VIDEO_DEMO_AVATAR_NEUTRAL", "")
VIDEO_DEMO_AVATAR_WOMAN = os.getenv("VIDEO_DEMO_AVATAR_WOMAN", "")
VIDEO_DEMO_AVATAR_MAN = os.getenv("VIDEO_DEMO_AVATAR_MAN", "")
VIDEO_DEMO_VOICE_NEUTRAL = os.getenv("VIDEO_DEMO_VOICE_NEUTRAL", "")
VIDEO_DEMO_VOICE_WOMAN = os.getenv("VIDEO_DEMO_VOICE_WOMAN", "")
VIDEO_DEMO_VOICE_MAN = os.getenv("VIDEO_DEMO_VOICE_MAN", "")
