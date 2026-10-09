from datetime import timedelta

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import TeacherDataConsent, TeacherStudentAssignment, User, UserProfile
from accounts.services_org import assign_student_to_teacher, grant_consent, revoke_consent
from catalog.models import PublishStatus, Workout
from training.models import WorkoutSession


class RolesAssignmentConsentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin1", email="a@t.com", password="SenhaSegura1!", role=User.Role.ADMIN
        )
        self.teacher = User.objects.create_user(
            username="prof1", email="p@t.com", password="SenhaSegura1!", role=User.Role.TEACHER
        )
        self.teacher2 = User.objects.create_user(
            username="prof2", email="p2@t.com", password="SenhaSegura1!", role=User.Role.TEACHER
        )
        self.student = User.objects.create_user(
            username="aluno1", email="s@t.com", password="SenhaSegura1!", role=User.Role.STUDENT
        )
        self.other = User.objects.create_user(
            username="aluno2", email="s2@t.com", password="SenhaSegura1!", role=User.Role.STUDENT
        )
        UserProfile.objects.get_or_create(user=self.student)
        UserProfile.objects.get_or_create(user=self.other)
        self.workout = Workout.objects.create(
            public_id="w-role-1",
            name="Treino teste",
            place="Casa",
            level="Iniciante",
            duration_min=30,
            publish_status=PublishStatus.PUBLISHED,
        )

    def test_student_cannot_access_teacher_endpoints(self):
        self.client.force_authenticate(user=self.student)
        self.assertEqual(self.client.get("/api/teacher/dashboard/").status_code, 403)
        self.assertEqual(self.client.get("/api/teacher/students/").status_code, 403)
        self.assertEqual(self.client.get("/api/admin/users/").status_code, 403)

    def test_teacher_only_sees_assigned_students(self):
        assign_student_to_teacher(
            admin=self.admin, teacher=self.teacher, student=self.student
        )
        self.client.force_authenticate(user=self.teacher)
        res = self.client.get("/api/teacher/students/")
        self.assertEqual(res.status_code, 200)
        ids = [r["id"] for r in res.data["results"]]
        self.assertIn(self.student.pk, ids)
        self.assertNotIn(self.other.pk, ids)

        denied = self.client.get(f"/api/teacher/students/{self.other.pk}/")
        self.assertEqual(denied.status_code, 403)

    def test_teacher_cannot_change_roles(self):
        self.client.force_authenticate(user=self.teacher)
        res = self.client.post(
            f"/api/admin/users/{self.student.pk}/role/",
            {"role": "admin"},
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_admin_can_assign_and_history_preserved(self):
        self.client.force_authenticate(user=self.admin)
        r1 = self.client.post(
            "/api/admin/assignments/",
            {"teacherId": self.teacher.pk, "studentId": self.student.pk},
            format="json",
        )
        self.assertEqual(r1.status_code, 201)
        r2 = self.client.post(
            "/api/admin/assignments/",
            {"teacherId": self.teacher2.pk, "studentId": self.student.pk},
            format="json",
        )
        self.assertEqual(r2.status_code, 201)
        active = TeacherStudentAssignment.objects.filter(
            student=self.student, ended_at__isnull=True
        )
        self.assertEqual(active.count(), 1)
        self.assertEqual(active.first().teacher_id, self.teacher2.pk)
        self.assertEqual(
            TeacherStudentAssignment.objects.filter(student=self.student).count(), 2
        )

    def test_consent_scopes_teacher_detail(self):
        assign_student_to_teacher(
            admin=self.admin, teacher=self.teacher, student=self.student
        )
        WorkoutSession.objects.create(
            public_id="sess1",
            user=self.student,
            workout=self.workout,
            started_at=timezone.now(),
            finished_at=timezone.now(),
            minutes=40,
            date=timezone.localdate(),
        )
        self.client.force_authenticate(user=self.teacher)
        before = self.client.get(f"/api/teacher/students/{self.student.pk}/")
        self.assertEqual(before.status_code, 200)
        self.assertIn("Sessões concluídas não partilhadas", " ".join(before.data["gaps"]))

        grant_consent(
            student=self.student,
            teacher=self.teacher,
            category=TeacherDataConsent.Category.COMPLETED_SESSIONS,
        )
        after = self.client.get(f"/api/teacher/students/{self.student.pk}/")
        self.assertIn("completedSessions", after.data["metrics"])
        self.assertGreaterEqual(after.data["metrics"]["completedSessions"], 1)

    def test_draft_workout_hidden_from_student(self):
        draft = Workout.objects.create(
            public_id="w-draft",
            name="Rascunho",
            place="Casa",
            level="Iniciante",
            duration_min=20,
            publish_status=PublishStatus.DRAFT,
            created_by=self.teacher,
        )
        self.client.force_authenticate(user=self.student)
        res = self.client.get("/api/workouts/")
        self.assertEqual(res.status_code, 200)
        payload = res.data
        rows = payload["results"] if isinstance(payload, dict) and "results" in payload else payload
        ids = [w["id"] for w in rows]
        self.assertNotIn(draft.public_id, ids)
        self.assertIn(self.workout.public_id, ids)

    def test_me_exposes_role(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get("/api/me/")
        self.assertEqual(res.data["role"], "student")

    def test_existing_accounts_remain_authenticable(self):
        """Contas migradas (role=student) continuam a autenticar-se."""
        res = self.client.post(
            "/api/auth/token/",
            {"username": "aluno1", "password": "SenhaSegura1!"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data.get("role"), "student")
        self.assertIn("forma_access", res.cookies)

    def test_teacher_cannot_publish_admin_can(self):
        draft = Workout.objects.create(
            public_id="w-pub",
            name="Rascunho pub",
            place="Casa",
            level="Iniciante",
            duration_min=20,
            publish_status=PublishStatus.DRAFT,
            created_by=self.teacher,
        )
        self.client.force_authenticate(user=self.teacher)
        denied = self.client.post(
            "/api/content/publish/",
            {
                "contentType": "workout",
                "contentId": draft.public_id,
                "action": "publish",
            },
            format="json",
        )
        self.assertEqual(denied.status_code, 403)

        self.client.force_authenticate(user=self.admin)
        ok = self.client.post(
            "/api/content/publish/",
            {
                "contentType": "workout",
                "contentId": draft.public_id,
                "action": "publish",
            },
            format="json",
        )
        self.assertEqual(ok.status_code, 200)
        draft.refresh_from_db()
        self.assertEqual(draft.publish_status, PublishStatus.PUBLISHED)

    def test_revoke_consent_blocks_future_queries(self):
        assign_student_to_teacher(
            admin=self.admin, teacher=self.teacher, student=self.student
        )
        grant_consent(
            student=self.student,
            teacher=self.teacher,
            category=TeacherDataConsent.Category.MINUTES,
        )
        WorkoutSession.objects.create(
            public_id="sess-rev",
            user=self.student,
            workout=self.workout,
            started_at=timezone.now(),
            finished_at=timezone.now(),
            minutes=25,
            date=timezone.localdate(),
        )
        self.client.force_authenticate(user=self.teacher)
        before = self.client.get(f"/api/teacher/students/{self.student.pk}/")
        self.assertIn("minutesTrained", before.data["metrics"])

        revoke_consent(
            student=self.student,
            teacher=self.teacher,
            category=TeacherDataConsent.Category.MINUTES,
        )
        after = self.client.get(f"/api/teacher/students/{self.student.pk}/")
        self.assertNotIn("minutesTrained", after.data.get("metrics") or {})
        self.assertTrue(
            TeacherDataConsent.objects.filter(
                student=self.student,
                teacher=self.teacher,
                category=TeacherDataConsent.Category.MINUTES,
            ).exists()
        )

    def test_new_teacher_only_sees_data_since_assignment(self):
        old = assign_student_to_teacher(
            admin=self.admin, teacher=self.teacher, student=self.student
        )
        past = timezone.now() - timedelta(days=10)
        WorkoutSession.objects.create(
            public_id="sess-old",
            user=self.student,
            workout=self.workout,
            started_at=past,
            finished_at=past,
            minutes=50,
            date=past.date(),
        )
        # muda para teacher2
        assign_student_to_teacher(
            admin=self.admin, teacher=self.teacher2, student=self.student
        )
        grant_consent(
            student=self.student,
            teacher=self.teacher2,
            category=TeacherDataConsent.Category.COMPLETED_SESSIONS,
        )
        grant_consent(
            student=self.student,
            teacher=self.teacher2,
            category=TeacherDataConsent.Category.MINUTES,
        )
        self.client.force_authenticate(user=self.teacher2)
        detail = self.client.get(f"/api/teacher/students/{self.student.pk}/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["metrics"].get("completedSessions", 0), 0)
        self.assertTrue(old.ended_at or TeacherStudentAssignment.objects.get(pk=old.pk).ended_at)


@override_settings(JWT_COOKIE_SECURE=False)
class PortalLoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username="portal_aluno",
            email="portal_a@t.com",
            password="SenhaSegura1!",
            role=User.Role.STUDENT,
        )
        self.teacher = User.objects.create_user(
            username="portal_prof",
            email="portal_p@t.com",
            password="SenhaSegura1!",
            role=User.Role.TEACHER,
        )
        self.admin = User.objects.create_user(
            username="portal_admin",
            email="portal_ad@t.com",
            password="SenhaSegura1!",
            role=User.Role.ADMIN,
        )

    def test_student_portal_rejects_teacher(self):
        res = self.client.post(
            "/api/auth/token/",
            {
                "username": "portal_prof",
                "password": "SenhaSegura1!",
                "portal": "student",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data.get("code"), "portal_management_required")
        self.assertNotIn("forma_access", res.cookies)

    def test_management_portal_rejects_student(self):
        res = self.client.post(
            "/api/auth/token/",
            {
                "username": "portal_aluno",
                "password": "SenhaSegura1!",
                "portal": "management",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data.get("code"), "portal_student_required")
        self.assertNotIn("forma_access", res.cookies)

    def test_management_portal_accepts_teacher_and_admin(self):
        for username, home in (("portal_prof", "/professor"), ("portal_admin", "/admin")):
            res = self.client.post(
                "/api/auth/token/",
                {
                    "username": username,
                    "password": "SenhaSegura1!",
                    "portal": "management",
                },
                format="json",
            )
            self.assertEqual(res.status_code, 200, username)
            self.assertEqual(res.data.get("home"), home)
            self.assertIn("forma_access", res.cookies)

    def test_student_portal_accepts_student(self):
        res = self.client.post(
            "/api/auth/token/",
            {
                "username": "portal_aluno",
                "password": "SenhaSegura1!",
                "portal": "student",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data.get("home"), "/")
        self.assertIn("forma_access", res.cookies)

    def test_wrong_password_still_401(self):
        res = self.client.post(
            "/api/auth/token/",
            {
                "username": "portal_aluno",
                "password": "errada",
                "portal": "student",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
