from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from assistant.services.video_demo import (
    HeyGenVideoDemo,
    LocalVideoDemo,
    build_demo_script,
    get_video_demo_provider,
    is_video_demo_configured,
)


class BuildDemoScriptTests(SimpleTestCase):
    def test_includes_exercise_and_steps(self):
        script = build_demo_script(
            "Elevação lateral",
            ["Fica em pé", "Eleva os braços até a linha dos ombros", "Controla a descida"],
            duration_sec=7,
        )
        self.assertIn("Elevação lateral", script)
        self.assertIn("Fica em pé", script)
        self.assertLessEqual(len(script), 280)

    def test_truncates_long_steps(self):
        long_steps = [f"Passo muito detalhado número {i} com bastante texto" for i in range(20)]
        script = build_demo_script("Agachamento", long_steps, duration_sec=7)
        self.assertLessEqual(len(script.split()), 30)


class HeyGenConfiguredTests(SimpleTestCase):
    @override_settings(
        VIDEO_DEMO_PROVIDER="heygen",
        VIDEO_DEMO_API_KEY="hk_test",
        VIDEO_DEMO_AVATAR_NEUTRAL="av_neutral",
    )
    def test_heygen_is_configured(self):
        self.assertTrue(is_video_demo_configured())
        provider = get_video_demo_provider()
        self.assertIsInstance(provider, HeyGenVideoDemo)

    @override_settings(
        VIDEO_DEMO_PROVIDER="heygen",
        VIDEO_DEMO_API_KEY="hk_test",
        VIDEO_DEMO_AVATAR_NEUTRAL="",
        VIDEO_DEMO_AVATAR_WOMAN="",
        VIDEO_DEMO_AVATAR_MAN="",
    )
    def test_heygen_without_avatar_not_configured(self):
        self.assertFalse(is_video_demo_configured())


class HeyGenVideoDemoTests(SimpleTestCase):
    def setUp(self):
        self.provider = HeyGenVideoDemo(
            "hk_test",
            avatar_neutral="av_n",
            avatar_woman="av_w",
            avatar_man="av_m",
            voice_neutral="vo_n",
        )

    @patch("assistant.services.video_demo.HeyGenVideoDemo._request")
    def test_start_maps_persona_and_returns_job_id(self, mock_req):
        mock_req.return_value = {"data": {"video_id": "v_123", "status": "waiting"}}
        result = self.provider.start_generation(
            script_steps=["Fica em pé", "Eleva os braços"],
            exercise_name="Elevação lateral",
            persona="woman",
            duration_sec=7,
        )
        self.assertEqual(result.status, "pending")
        self.assertEqual(result.provider_job_id, "v_123")
        body = mock_req.call_args.args[2]
        self.assertEqual(body["type"], "avatar")
        self.assertEqual(body["avatar_id"], "av_w")
        self.assertEqual(body["voice_id"], "vo_n")
        self.assertIn("Elevação lateral", body["script"])

    @patch("assistant.services.video_demo.HeyGenVideoDemo._request")
    def test_poll_completed_returns_media_url(self, mock_req):
        mock_req.return_value = {
            "data": {
                "status": "completed",
                "video_url": "https://cdn.heygen.com/demo.mp4",
            }
        }
        result = self.provider.poll("v_123")
        self.assertEqual(result.status, "done")
        self.assertEqual(result.media_url, "https://cdn.heygen.com/demo.mp4")

    @patch("assistant.services.video_demo.HeyGenVideoDemo._request")
    def test_poll_failed(self, mock_req):
        mock_req.return_value = {
            "data": {"status": "failed", "failure_message": "quota exceeded"}
        }
        result = self.provider.poll("v_bad")
        self.assertEqual(result.status, "failed")
        self.assertIn("quota", result.safe_error)

    def test_start_without_avatar_fails_honestly(self):
        bare = HeyGenVideoDemo("hk_test")
        result = bare.start_generation(
            script_steps=["Passo"],
            exercise_name="Teste",
            persona="neutral",
            duration_sec=7,
        )
        self.assertEqual(result.status, "failed")
        self.assertIn("Avatar", result.safe_error)


class LocalVideoDemoTests(SimpleTestCase):
    @override_settings(VIDEO_DEMO_PROVIDER="local")
    def test_local_is_configured(self):
        self.assertTrue(is_video_demo_configured())
        self.assertIsInstance(get_video_demo_provider(), LocalVideoDemo)

    def test_start_and_poll_returns_media_url(self):
        provider = LocalVideoDemo()
        started = provider.start_generation(
            script_steps=["Fica em pé", "Eleva os braços"],
            exercise_name="Elevação lateral",
            persona="neutral",
            duration_sec=7,
        )
        self.assertEqual(started.status, "processing")
        self.assertTrue(started.provider_job_id.startswith("local_"))
        done = provider.poll(started.provider_job_id)
        self.assertEqual(done.status, "done")
        self.assertTrue(done.media_url.endswith(".mp4"))
        self.assertIn("/api/assistant/demo-media/", done.media_url)