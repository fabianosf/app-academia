from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class BrandingPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="brand_stu",
            email="brand_stu@example.com",
            password="SenhaSegura1!",
            role=User.Role.STUDENT,
        )
        self.admin = User.objects.create_user(
            username="brand_adm",
            email="brand_adm@example.com",
            password="SenhaSegura1!",
            role=User.Role.ADMIN,
        )

    def test_student_can_read_settings(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get("/api/branding/settings/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_student_cannot_patch_settings(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.patch(
            "/api/branding/settings/",
            {"brandName": "Hack"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_patch_settings(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.patch(
            "/api/branding/settings/",
            {"brandName": "Forma Teste"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["brandName"], "Forma Teste")
