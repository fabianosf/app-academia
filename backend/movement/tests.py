from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class MovementAnalyzeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="move@test.com", email="move@test.com", password="pass12345"
        )
        self.client.force_authenticate(user=self.user)

    def test_requires_consent(self):
        res = self.client.post("/api/movement/analyze/", {"exercise": "Agachamento"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_without_client_metrics_does_not_invent_score(self):
        res = self.client.post(
            "/api/movement/analyze/",
            {
                "exercise": "Agachamento",
                "elapsedSeconds": 5,
                "consentAccepted": True,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["score"], 0)
        self.assertEqual(res.data["reps"], 0)
        self.assertTrue(any("Visão computacional" in c for c in res.data["cues"]))

    def test_accepts_client_pose_metrics(self):
        res = self.client.post(
            "/api/movement/analyze/",
            {
                "exercise": "Agachamento",
                "elapsedSeconds": 12,
                "consentAccepted": True,
                "source": "client_pose",
                "score": 88,
                "reps": 4,
                "cues": ["Boa profundidade"],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["score"], 88)
        self.assertEqual(res.data["reps"], 4)
        self.assertEqual(res.data["source"], "client_pose")
        self.assertIn("Boa profundidade", res.data["cues"])
