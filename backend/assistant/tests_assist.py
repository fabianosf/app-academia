from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import UserProfile
from assistant.models import DemoGenerationJob, ExerciseAssistRequest, ExerciseDemo
from assistant.services.demo_match import find_approved_demo, normalize_key
from assistant.services.orchestrate import refresh_generation_job, review_demo
from assistant.services.video_demo import VideoJobResult

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

    def test_normal_user_cannot_list_review_demos(self):
        ExerciseDemo.objects.create(
            public_id="drev-list",
            exercise_key="teste",
            exercise_name="Teste",
            status=ExerciseDemo.Status.REVIEW,
            duration_sec=8,
        )
        denied = self.client.get("/api/assistant/demos/?status=review")
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_list_review_demos(self):
        ExerciseDemo.objects.create(
            public_id="drev-list2",
            exercise_key="teste2",
            exercise_name="Teste 2",
            status=ExerciseDemo.Status.REVIEW,
            duration_sec=8,
        )
        self.client.force_authenticate(user=self.staff)
        ok = self.client.get("/api/assistant/demos/?status=review")
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        self.assertTrue(any(d["id"] == "drev-list2" for d in ok.data))

    @override_settings(
        VIDEO_DEMO_PROVIDER="http",
        VIDEO_DEMO_BASE_URL="https://vid.test",
        VIDEO_DEMO_API_KEY="test-key",
    )
    @patch("assistant.services.orchestrate.get_video_demo_provider")
    def test_get_job_polls_provider_and_persists(self, mock_provider):
        req = ExerciseAssistRequest.objects.create(
            public_id="ar-poll",
            user=self.user,
            text="elevação",
            status=ExerciseAssistRequest.Status.ANSWERED,
        )
        demo = ExerciseDemo.objects.create(
            public_id="d-poll",
            exercise_key="elevacao",
            exercise_name="Elevação",
            status=ExerciseDemo.Status.DRAFT,
            duration_sec=8,
        )
        job = DemoGenerationJob.objects.create(
            public_id="j-poll",
            request=req,
            demo=demo,
            status=DemoGenerationJob.Status.PROCESSING,
            provider="http",
            provider_job_id="ext-99",
            persona="neutral",
        )
        provider = mock_provider.return_value
        provider.poll.return_value = VideoJobResult(
            status="done",
            media_url="https://cdn.example.com/demo.mp4",
            provider_job_id="ext-99",
        )
        res = self.client.get(f"/api/assistant/demos/jobs/{job.public_id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "done")
        job.refresh_from_db()
        demo.refresh_from_db()
        self.assertEqual(job.status, DemoGenerationJob.Status.DONE)
        self.assertEqual(demo.media_url, "https://cdn.example.com/demo.mp4")
        self.assertEqual(demo.status, ExerciseDemo.Status.REVIEW)

    def test_refresh_marks_not_configured_without_provider(self):
        req = ExerciseAssistRequest.objects.create(
            public_id="ar-nc",
            user=self.user,
            text="x",
            status=ExerciseAssistRequest.Status.ANSWERED,
        )
        job = DemoGenerationJob.objects.create(
            public_id="j-nc",
            request=req,
            status=DemoGenerationJob.Status.PENDING,
            provider="",
            provider_job_id="x",
        )
        out = refresh_generation_job(job)
        self.assertEqual(out.status, DemoGenerationJob.Status.NOT_CONFIGURED)

    @override_settings(VIDEO_DEMO_PROVIDER="local")
    @patch("assistant.services.orchestrate.interpret_request", side_effect=_fake_interpret)
    def test_local_provider_job_can_complete_with_media(self, _mock_interp):
        res = self.client.post(
            "/api/assistant/exercise-assist/",
            {
                "message": "Como faço aquele de levantar os braços para os lados?",
                "persona": "neutral",
                "requestVideo": True,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        jobs = res.data.get("jobs") or []
        self.assertTrue(jobs)
        self.assertIn(jobs[0]["status"], ("pending", "processing"))
        job_id = jobs[0]["id"]
        polled = self.client.get(f"/api/assistant/demos/jobs/{job_id}/")
        self.assertEqual(polled.status_code, status.HTTP_200_OK)
        self.assertEqual(polled.data["status"], "done")
        self.assertTrue(polled.data["demo"]["media_url"])
        self.assertIn("/api/assistant/demo-media/", polled.data["demo"]["media_url"])

    @override_settings(
        VIDEO_DEMO_PROVIDER="heygen",
        VIDEO_DEMO_API_KEY="hk_test",
        VIDEO_DEMO_AVATAR_NEUTRAL="av_n",
    )
    @patch("assistant.services.orchestrate.interpret_request", side_effect=_fake_interpret)
    @patch("assistant.services.orchestrate.get_video_demo_provider")
    def test_heygen_start_persists_provider_job_id(self, mock_get, _mock_interp):
        provider = mock_get.return_value
        provider.start_generation.return_value = VideoJobResult(
            status="processing",
            provider_job_id="v_hey_1",
        )
        res = self.client.post(
            "/api/assistant/exercise-assist/",
            {
                "message": "Como faço aquele de levantar os braços para os lados?",
                "persona": "neutral",
                "requestVideo": True,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        jobs = res.data.get("jobs") or []
        self.assertTrue(jobs)
        self.assertEqual(jobs[0]["status"], "processing")
        self.assertEqual(jobs[0].get("provider_job_id"), "v_hey_1")
        provider.start_generation.assert_called_once()
        kwargs = provider.start_generation.call_args.kwargs
        self.assertEqual(kwargs["duration_sec"], 7)
        self.assertTrue(kwargs["exercise_name"])
