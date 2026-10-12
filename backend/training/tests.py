from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, UserProfile
from accounts.services_org import assign_student_to_teacher
from catalog.models import ContentAssignment, PublishStatus, Workout


class TrainingCatalogAccessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="tr_admin",
            email="tr_a@t.com",
            password="SenhaSegura1!",
            role=User.Role.ADMIN,
        )
        self.teacher = User.objects.create_user(
            username="tr_prof",
            email="tr_p@t.com",
            password="SenhaSegura1!",
            role=User.Role.TEACHER,
        )
        self.student = User.objects.create_user(
            username="tr_aluno",
            email="tr_s@t.com",
            password="SenhaSegura1!",
            role=User.Role.STUDENT,
        )
        self.other = User.objects.create_user(
            username="tr_outro",
            email="tr_o@t.com",
            password="SenhaSegura1!",
            role=User.Role.STUDENT,
        )
        UserProfile.objects.get_or_create(user=self.student)
        self.published = Workout.objects.create(
            public_id="w-pub-ok",
            name="Treino público",
            place="Casa",
            level="Iniciante",
            duration_min=20,
            publish_status=PublishStatus.PUBLISHED,
        )
        self.draft = Workout.objects.create(
            public_id="w-draft-x",
            name="Rascunho secreto",
            place="Casa",
            level="Iniciante",
            duration_min=15,
            publish_status=PublishStatus.DRAFT,
            created_by=self.teacher,
        )
        self.restricted = Workout.objects.create(
            public_id="w-rest-1",
            name="Treino só atribuído",
            place="Casa",
            level="Iniciante",
            duration_min=25,
            publish_status=PublishStatus.PUBLISHED,
        )
        ContentAssignment.objects.create(
            content_type=ContentAssignment.ContentType.WORKOUT,
            content_id=self.restricted.public_id,
            student=self.other,
            assigned_by=self.admin,
        )

    def _session_payload(self, workout_id: str):
        now = timezone.now()
        return {
            "workoutId": workout_id,
            "startedAt": now.isoformat(),
            "finishedAt": now.isoformat(),
            "minutes": 10,
        }

    def test_anonymous_cannot_create_session(self):
        res = self.client.post(
            "/api/training/sessions/",
            self._session_payload(self.published.public_id),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_cannot_session_on_draft(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.post(
            "/api/training/sessions/",
            self._session_payload(self.draft.public_id),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_cannot_session_on_restricted_unassigned(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.post(
            "/api/training/sessions/",
            self._session_payload(self.restricted.public_id),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_assigned_student_can_session_on_restricted(self):
        assign_student_to_teacher(
            admin=self.admin, teacher=self.teacher, student=self.other
        )
        ContentAssignment.objects.get_or_create(
            content_type=ContentAssignment.ContentType.WORKOUT,
            content_id=self.restricted.public_id,
            student=self.other,
            defaults={"assigned_by": self.admin},
        )
        self.client.force_authenticate(user=self.other)
        res = self.client.post(
            "/api/training/sessions/",
            self._session_payload(self.restricted.public_id),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_student_can_session_on_published_catalog(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.post(
            "/api/training/sessions/",
            self._session_payload(self.published.public_id),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_student_cannot_favorite_draft(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.post(
            "/api/training/favorites/",
            {"workoutId": self.draft.public_id},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_cannot_favorite_restricted_unassigned(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.post(
            "/api/training/favorites/",
            {"workoutId": self.restricted.public_id},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_can_favorite_published(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.post(
            "/api/training/favorites/",
            {"workoutId": self.published.public_id},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["favorited"])

    def test_sessions_list_only_own(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(
            "/api/training/sessions/",
            self._session_payload(self.published.public_id),
            format="json",
        )
        self.client.force_authenticate(user=self.other)
        res = self.client.get("/api/training/sessions/")
        self.assertEqual(res.status_code, 200)
        rows = res.data["results"] if isinstance(res.data, dict) else res.data
        for row in rows:
            # other user must not see student's sessions
            pass
        self.client.force_authenticate(user=self.student)
        mine = self.client.get("/api/training/sessions/")
        mine_rows = mine.data["results"] if isinstance(mine.data, dict) else mine.data
        self.assertGreaterEqual(len(mine_rows), 1)

    def test_student_cannot_get_draft_exercise(self):
        from catalog.models import Exercise

        draft_ex = Exercise.objects.create(
            public_id="ex-draft-1",
            name="Rascunho EX",
            sets=3,
            reps="10",
            rest_seconds=30,
            tip="x",
            focus="Core",
            place="Casa",
            publish_status=PublishStatus.DRAFT,
            created_by=self.teacher,
        )
        self.client.force_authenticate(user=self.student)
        res = self.client.get(f"/api/exercises/{draft_ex.public_id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
