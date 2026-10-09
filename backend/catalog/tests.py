from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import Exercise

User = get_user_model()


class CatalogPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="normal",
            email="normal@example.com",
            password="SenhaSegura1!",
        )
        self.staff = User.objects.create_user(
            username="editor",
            email="editor@example.com",
            password="SenhaSegura1!",
            role="admin",
        )
        self.exercise = Exercise.objects.create(
            public_id="ex-test-1",
            name="Agachamento teste",
            sets=3,
            reps="10",
            rest_seconds=30,
            tip="Controle",
            focus="Pernas",
            place="Casa",
        )

    def test_authenticated_user_can_list(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/exercises/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_normal_user_cannot_create_exercise(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/exercises/",
            {
                "name": "Hack",
                "sets": 1,
                "reps": "1",
                "restSeconds": 10,
                "tip": "x",
                "focus": "Core",
                "place": "Casa",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_normal_user_cannot_delete_exercise(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/exercises/{self.exercise.public_id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_create_exercise(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            "/api/exercises/",
            {
                "name": "Staff Exercise",
                "sets": 2,
                "reps": "8",
                "restSeconds": 40,
                "tip": "ok",
                "focus": "Core",
                "place": "Casa",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
