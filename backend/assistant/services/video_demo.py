"""Adapter de geração de vídeo com avatar — sem fingir conclusão."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from django.conf import settings


@dataclass
class VideoJobResult:
    status: str  # pending | processing | done | failed | not_configured
    media_url: str = ""
    provider_job_id: str = ""
    safe_error: str = ""


class VideoDemoProvider(Protocol):
    def start_generation(
        self,
        *,
        script_steps: list[str],
        exercise_name: str,
        persona: str,
        duration_sec: int,
    ) -> VideoJobResult:
        ...

    def poll(self, provider_job_id: str) -> VideoJobResult:
        ...


class VideoDemoNotConfigured(Exception):
    pass


class NullVideoDemo:
    def start_generation(self, **kwargs) -> VideoJobResult:
        return VideoJobResult(
            status="not_configured",
            safe_error=(
                "Geração de vídeo não configurada. Defina VIDEO_DEMO_PROVIDER e "
                "VIDEO_DEMO_API_KEY no .env."
            ),
        )

    def poll(self, provider_job_id: str) -> VideoJobResult:
        return VideoJobResult(
            status="not_configured",
            safe_error="Geração de vídeo não configurada.",
        )


class HttpVideoDemo:
    """
    Provider HTTP genérico.
    POST {base}/generate  -> { job_id, status, media_url? }
    GET  {base}/jobs/{id} -> { status, media_url?, error? }
    """

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def _request(self, method: str, path: str, body: dict | None = None) -> dict:
        import json
        import urllib.error
        import urllib.request

        data = None
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if body is not None:
            data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}{path}", data=data, headers=headers, method=method
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise VideoDemoNotConfigured(
                "Falha ao contactar o serviço de vídeo configurado."
            ) from exc

    def start_generation(
        self,
        *,
        script_steps: list[str],
        exercise_name: str,
        persona: str,
        duration_sec: int,
    ) -> VideoJobResult:
        data = self._request(
            "POST",
            "/generate",
            {
                "exercise_name": exercise_name,
                "persona": persona,
                "duration_sec": max(7, int(duration_sec)),
                "steps": script_steps,
            },
        )
        status = (data.get("status") or "pending").lower()
        return VideoJobResult(
            status=status if status in ("pending", "processing", "done", "failed") else "pending",
            media_url=(data.get("media_url") or "")[:1024],
            provider_job_id=str(data.get("job_id") or "")[:128],
            safe_error=(data.get("error") or "")[:512],
        )

    def poll(self, provider_job_id: str) -> VideoJobResult:
        data = self._request("GET", f"/jobs/{provider_job_id}")
        status = (data.get("status") or "processing").lower()
        return VideoJobResult(
            status=status if status in ("pending", "processing", "done", "failed") else "processing",
            media_url=(data.get("media_url") or "")[:1024],
            provider_job_id=provider_job_id,
            safe_error=(data.get("error") or "")[:512],
        )


def get_video_demo_provider() -> VideoDemoProvider:
    provider = (getattr(settings, "VIDEO_DEMO_PROVIDER", "") or "").strip().lower()
    api_key = (getattr(settings, "VIDEO_DEMO_API_KEY", "") or "").strip()
    base_url = (getattr(settings, "VIDEO_DEMO_BASE_URL", "") or "").strip()
    if provider in ("", "none", "null"):
        return NullVideoDemo()
    if provider == "http" and api_key and base_url:
        return HttpVideoDemo(base_url, api_key)
    return NullVideoDemo()


def is_video_demo_configured() -> bool:
    provider = (getattr(settings, "VIDEO_DEMO_PROVIDER", "") or "").strip().lower()
    api_key = (getattr(settings, "VIDEO_DEMO_API_KEY", "") or "").strip()
    base_url = (getattr(settings, "VIDEO_DEMO_BASE_URL", "") or "").strip()
    return provider == "http" and bool(api_key and base_url)
