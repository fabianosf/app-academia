from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import ContentAssignment, Exercise, PublishStatus

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
            publish_status=PublishStatus.PUBLISHED,
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

    def test_student_cannot_get_draft_exercise(self):
        draft = Exercise.objects.create(
            public_id="ex-draft-x",
            name="Rascunho",
            sets=1,
            reps="1",
            rest_seconds=10,
            tip="x",
            focus="Core",
            place="Casa",
            publish_status=PublishStatus.DRAFT,
            created_by=self.staff,
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/exercises/{draft.public_id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_cannot_get_restricted_unassigned_exercise(self):
        restricted = Exercise.objects.create(
            public_id="ex-rest-1",
            name="Só atribuído",
            sets=2,
            reps="8",
            rest_seconds=30,
            tip="x",
            focus="Core",
            place="Casa",
            publish_status=PublishStatus.PUBLISHED,
        )
        other = User.objects.create_user(
            username="other_stu",
            email="other_stu@example.com",
            password="SenhaSegura1!",
        )
        ContentAssignment.objects.create(
            content_type=ContentAssignment.ContentType.EXERCISE,
            content_id=restricted.public_id,
            student=other,
            assigned_by=self.staff,
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/exercises/{restricted.public_id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_assigned_student_can_get_restricted_exercise(self):
        restricted = Exercise.objects.create(
            public_id="ex-rest-2",
            name="Atribuído a mim",
            sets=2,
            reps="8",
            rest_seconds=30,
            tip="x",
            focus="Core",
            place="Casa",
            publish_status=PublishStatus.PUBLISHED,
        )
        ContentAssignment.objects.create(
            content_type=ContentAssignment.ContentType.EXERCISE,
            content_id=restricted.public_id,
            student=self.user,
            assigned_by=self.staff,
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/exercises/{restricted.public_id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_assign_missing_content_returns_404(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            "/api/content/assign/",
            {
                "contentType": "workout",
                "contentId": "nao-existe",
                "studentId": self.user.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_assign_existing_workout_ok(self):
        from catalog.models import Workout

        workout = Workout.objects.create(
            public_id="w-assign-ok",
            name="Treino assign",
            place="Casa",
            level="Iniciante",
            duration_min=20,
            publish_status=PublishStatus.PUBLISHED,
        )
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            "/api/content/assign/",
            {
                "contentType": "workout",
                "contentId": workout.public_id,
                "studentId": self.user.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
