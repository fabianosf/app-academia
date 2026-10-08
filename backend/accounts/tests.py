from django.contrib.auth import get_user_model
from django.test import TestCase
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
