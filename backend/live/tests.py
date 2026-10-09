from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from live.models import Instructor, LiveClass

User = get_user_model()


class LiveStreamUrlTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="live@test.com", email="live@test.com", password="pass12345"
        )
        self.staff = User.objects.create_user(
            username="staff@test.com",
            email="staff@test.com",
            password="pass12345",
            role="admin",
        )
        self.instructor = Instructor.objects.create(
            public_id="i1", name="Fabiano", specialty="Força"
        )

    def test_list_exposes_stream_fields(self):
        LiveClass.objects.create(
            public_id="c-stream",
            title="Live teste",
            category="Força",
            date_label="Hoje",
            time_label="19:00",
            duration_min=45,
            instructor=self.instructor,
            level=LiveClass.Level.INICIANTE,
            status=LiveClass.Status.LIVE,
            stream_url="https://example.com/embed/room",
        )
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/live/classes/")
        self.assertEqual(res.status_code, 200)
        row = next(x for x in res.data if x["id"] == "c-stream")
        self.assertEqual(row["streamUrl"], "https://example.com/embed/room")
        self.assertTrue(row["streamConfigured"])

    def test_empty_stream_is_not_configured(self):
        LiveClass.objects.create(
            public_id="c-empty",
            title="Sem stream",
            category="Força",
            date_label="Hoje",
            time_label="20:00",
            duration_min=30,
            instructor=self.instructor,
            level=LiveClass.Level.INICIANTE,
            status=LiveClass.Status.UPCOMING,
            stream_url="",
        )
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/live/classes/")
        row = next(x for x in res.data if x["id"] == "c-empty")
        self.assertEqual(row["streamUrl"], "")
        self.assertFalse(row["streamConfigured"])

    def test_staff_can_create_with_stream_url(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.post(
            "/api/live/classes/",
            {
                "title": "Nova live",
                "category": "Mobilidade",
                "date": "Amanhã",
                "time": "10:00",
                "durationMin": 40,
                "instructorId": "i1",
                "streamUrl": "https://meet.example.com/abc",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["streamUrl"], "https://meet.example.com/abc")
        self.assertTrue(res.data["streamConfigured"])
