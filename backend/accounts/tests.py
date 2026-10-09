from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import UserProfile

User = get_user_model()


class MePlanLockTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="aluno",
            email="aluno@example.com",
            password="SenhaSegura1!",
            plan=User.Plan.ESSENCIAL,
        )
        UserProfile.objects.get_or_create(user=self.user)
        self.client.force_authenticate(user=self.user)

    def test_user_cannot_change_own_plan(self):
        response = self.client.patch(
            "/api/me/", {"plan": "Completo"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.plan, User.Plan.ESSENCIAL)
        self.assertEqual(response.data["plan"], "Essencial")

    def test_user_can_update_name(self):
        response = self.client.patch(
            "/api/me/", {"name": "Aluno Teste"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.name, "Aluno Teste")


@override_settings(JWT_COOKIE_SECURE=False)
class CookieAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="cookieuser",
            email="cookie@example.com",
            password="SenhaSegura1!",
        )
        UserProfile.objects.get_or_create(user=self.user)

    def test_login_sets_httponly_cookies_without_body_tokens(self):
        response = self.client.post(
            "/api/auth/token/",
            {"username": "cookieuser", "password": "SenhaSegura1!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)
        self.assertIn("forma_access", response.cookies)
        self.assertIn("forma_refresh", response.cookies)
        self.assertTrue(response.cookies["forma_access"]["httponly"])

    def test_me_works_with_access_cookie(self):
        login = self.client.post(
            "/api/auth/token/",
            {"username": "cookieuser", "password": "SenhaSegura1!"},
            format="json",
        )
        self.client.cookies = login.cookies
        me = self.client.get("/api/me/")
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["username"], "cookieuser")

    def test_logout_clears_cookies(self):
        login = self.client.post(
            "/api/auth/token/",
            {"username": "cookieuser", "password": "SenhaSegura1!"},
            format="json",
        )
        self.client.cookies = login.cookies
        out = self.client.post("/api/auth/logout/", {}, format="json")
        self.assertEqual(out.status_code, status.HTTP_200_OK)
        # Cookie deleted (max-age 0) or absent value
        access = out.cookies.get("forma_access")
        if access is not None:
            self.assertIn(access.value, ("", '""'))

    def test_session_endpoint_is_200_without_cookie(self):
        res = self.client.get("/api/auth/session/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["authenticated"])

    def test_session_endpoint_returns_user_when_logged_in(self):
        login = self.client.post(
            "/api/auth/token/",
            {"username": "cookieuser", "password": "SenhaSegura1!"},
            format="json",
        )
        self.client.cookies = login.cookies
        res = self.client.get("/api/auth/session/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["authenticated"])
        self.assertEqual(res.data["user"]["username"], "cookieuser")

