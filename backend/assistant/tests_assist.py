from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import UserProfile
from assistant.models import DemoGenerationJob, ExerciseAssistRequest, ExerciseDemo
from assistant.services.demo_match import find_approved_demo, normalize_key
from assistant.services.orchestrate import create_assist_request, review_demo

User = get_user_model()


def _fake_interpret(message, profile_context=None, clarification_answer=None):
    text = (message or "").lower()
    if "joelho" in text or "dor" in text:
        return {
            "intent": "health_caution",
            "confidence": 0.7,
            "needs_clarification": True,
            "clarifying_question": "O desconforto no joelho foi avaliado por um profissional?",
            "exercise_name": "",
            "exercise_key_hint": "",
            "variation": "",
            "muscle_group": "pernas",
            "equipment": [],
            "level": "",
            "goal": "",
            "health_caution": True,
            "steps": [],
            "cautions": ["Procure um profissional habilitado."],
            "answer_text": "Não faço diagnóstico.",
            "catalog_exercise_id": "",
            "personalized_from_profile": False,
            "needs_research": False,
        }
    if "lados" in text or "lateral" in text:
        return {
            "intent": "specific_exercise",
            "confidence": 0.9,
            "needs_clarification": False,
            "clarifying_question": "",
            "exercise_name": "Elevação lateral",
            "exercise_key_hint": "elevacao lateral",
            "variation": "com halteres",
            "muscle_group": "ombros",
            "equipment": ["Halteres"],
            "level": "Iniciante",
            "goal": "fortalecer",
            "health_caution": False,
            "steps": ["Fica em pé", "Eleva os braços até a linha dos ombros", "Controla a descida"],
            "cautions": ["Orientação educativa."],
            "answer_text": "Parece elevação lateral com halteres.",
            "catalog_exercise_id": "",
            "personalized_from_profile": True,
            "needs_research": False,
        }
    return {
        "intent": "ambiguous",
        "confidence": 0.3,
        "needs_clarification": True,
        "clarifying_question": "Queres dizer elevação lateral dos ombros com halteres?",
        "exercise_name": "",
        "exercise_key_hint": "",
        "variation": "",
        "muscle_group": "",
        "equipment": [],
        "level": "",
        "goal": "",
        "health_caution": False,
        "steps": [],
        "cautions": ["Orientação educativa."],
        "answer_text": "Preciso de mais detalhe.",
        "catalog_exercise_id": "",
        "personalized_from_profile": False,
        "needs_research": False,
    }


@override_settings(
    WEB_SEARCH_PROVIDER="",
    VIDEO_DEMO_PROVIDER="",
    OPENAI_API_KEY="",
)
class ExerciseAssistApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="aluno",
            email="aluno@example.com",
            password="SenhaSegura1!",
        )
        UserProfile.objects.get_or_create(user=self.user)
        self.staff = User.objects.create_user(
            username="staffy",
            email="staff@example.com",
            password="SenhaSegura1!",
            is_staff=True,
        )
        self.client.force_authenticate(user=self.user)

    @patch("assistant.services.orchestrate.interpret_request", side_effect=_fake_interpret)
    def test_ambiguous_asks_clarification(self, _mock):
        res = self.client.post(
            "/api/assistant/exercise-assist/",
            {"message": "Quero um exercício"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "clarifying")
        self.assertTrue(res.data["clarifying_question"])

    @patch("assistant.services.orchestrate.interpret_request", side_effect=_fake_interpret)
    def test_health_caution_clarifies(self, _mock):
        res = self.client.post(
            "/api/assistant/exercise-assist/",
            {"message": "Exercício para pernas com dor no joelho"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data["health_caution"])
        self.assertEqual(res.data["status"], "clarifying")

    @patch("assistant.services.orchestrate.interpret_request", side_effect=_fake_interpret)
    def test_specific_exercise_video_not_configured(self, _mock):
        res = self.client.post(
            "/api/assistant/exercise-assist/",
            {"message": "Como faço aquele de levantar os braços para os lados?"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "answered")
        self.assertTrue(res.data["steps"])
        jobs = res.data["jobs"]
        self.assertTrue(jobs)
        self.assertEqual(jobs[0]["status"], "not_configured")

    @patch("assistant.services.orchestrate.interpret_request", side_effect=_fake_interpret)
    def test_isolation_between_users(self, _mock):
        res = self.client.post(
            "/api/assistant/exercise-assist/",
            {"message": "Quero um exercício"},
            format="json",
        )
        assist_id = res.data["id"]
        other = APIClient()
        other.force_authenticate(user=self.staff)
        # staff is different user — detail should 404 for ownership
        other_user = User.objects.create_user(
            username="outro", email="outro@example.com", password="SenhaSegura1!"
        )
        other.force_authenticate(user=other_user)
        denied = other.get(f"/api/assistant/exercise-assist/{assist_id}/")
        self.assertEqual(denied.status_code, status.HTTP_404_NOT_FOUND)

    def test_demo_match_cache(self):
        ExerciseDemo.objects.create(
            public_id="dmatch1",
            exercise_key=normalize_key("Elevação lateral"),
            exercise_name="Elevação lateral",
            variation="com halteres",
            equipment=["Halteres"],
            status=ExerciseDemo.Status.APPROVED,
            media_url="https://example.com/demo.mp4",
            duration_sec=8,
        )
        hit = find_approved_demo(
            exercise_name="Elevação lateral",
            variation="com halteres",
            equipment=["Halteres"],
        )
        self.assertIsNotNone(hit)
        self.assertEqual(hit.public_id, "dmatch1")

    def test_only_staff_can_approve(self):
        demo = ExerciseDemo.objects.create(
            public_id="drev1",
            exercise_key="elevacao lateral",
            exercise_name="Elevação lateral",
            status=ExerciseDemo.Status.REVIEW,
            media_url="https://example.com/x.mp4",
            duration_sec=8,
        )
        denied = self.client.post(
            f"/api/assistant/demos/{demo.public_id}/review/",
            {"action": "approve"},
            format="json",
        )
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.staff)
        ok = self.client.post(
            f"/api/assistant/demos/{demo.public_id}/review/",
            {"action": "approve"},
            format="json",
        )
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        demo.refresh_from_db()
        self.assertEqual(demo.status, ExerciseDemo.Status.APPROVED)

    @patch("assistant.services.orchestrate.interpret_request", side_effect=_fake_interpret)
    def test_message_too_long(self, _mock):
        res = self.client.post(
            "/api/assistant/exercise-assist/",
            {"message": "x" * 2001},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
