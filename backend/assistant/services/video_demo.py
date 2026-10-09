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


def build_demo_script(
    exercise_name: str,
    script_steps: list[str],
    *,
    duration_sec: int = 7,
) -> str:
    """
    Monta narracão curta em PT (~7s de fala).
    Ritmo aproximado: ~2,5 palavras/s → ~18 palavras para 7s.
    """
    name = (exercise_name or "exercício").strip()[:80] or "exercício"
    target_words = max(12, min(28, int(max(7, duration_sec) * 2.5)))
    parts: list[str] = [f"Demonstração: {name}."]
    word_count = len(parts[0].split())
    for raw in script_steps:
        step = " ".join(str(raw or "").split()).strip().rstrip(".")
        if not step:
            continue
        candidate = step + "."
        extra = len(candidate.split())
        if word_count + extra > target_words and word_count >= 10:
            break
        parts.append(candidate)
        word_count += extra
        if word_count >= target_words:
            break
    if len(parts) == 1:
        parts.append("Mantém o controlo e a respiração.")
    script = " ".join(parts)
    if len(script) > 280:
        script = script[:277].rsplit(" ", 1)[0].rstrip(".,;") + "."
    return script


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
        try:
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
        except VideoDemoNotConfigured as exc:
            return VideoJobResult(status="failed", safe_error=str(exc)[:512])
        status = (data.get("status") or "pending").lower()
        return VideoJobResult(
            status=status if status in ("pending", "processing", "done", "failed") else "pending",
            media_url=(data.get("media_url") or "")[:1024],
            provider_job_id=str(data.get("job_id") or "")[:128],
            safe_error=(data.get("error") or "")[:512],
        )

    def poll(self, provider_job_id: str) -> VideoJobResult:
        try:
            data = self._request("GET", f"/jobs/{provider_job_id}")
        except VideoDemoNotConfigured as exc:
            return VideoJobResult(
                status="failed",
                provider_job_id=provider_job_id,
                safe_error=str(exc)[:512],
            )
        status = (data.get("status") or "processing").lower()
        return VideoJobResult(
            status=status if status in ("pending", "processing", "done", "failed") else "processing",
            media_url=(data.get("media_url") or "")[:1024],
            provider_job_id=provider_job_id,
            safe_error=(data.get("error") or "")[:512],
        )


class HeyGenVideoDemo:
    """
    Provider HeyGen nativo (API v3).
    POST https://api.heygen.com/v3/videos
    GET  https://api.heygen.com/v3/videos/{video_id}
    """

    BASE_URL = "https://api.heygen.com"

    def __init__(
        self,
        api_key: str,
        *,
        avatar_woman: str = "",
        avatar_man: str = "",
        avatar_neutral: str = "",
        voice_woman: str = "",
        voice_man: str = "",
        voice_neutral: str = "",
    ):
        self.api_key = api_key
        self.avatars = {
            "woman": (avatar_woman or avatar_neutral or "").strip(),
            "man": (avatar_man or avatar_neutral or "").strip(),
            "neutral": (avatar_neutral or avatar_woman or avatar_man or "").strip(),
        }
        self.voices = {
            "woman": (voice_woman or voice_neutral or "").strip(),
            "man": (voice_man or voice_neutral or "").strip(),
            "neutral": (voice_neutral or voice_woman or voice_man or "").strip(),
        }

    def _persona_key(self, persona: str) -> str:
        key = (persona or "neutral").strip().lower()
        return key if key in self.avatars else "neutral"

    def _request(self, method: str, path: str, body: dict | None = None) -> dict:
        import json
        import urllib.error
        import urllib.request

        data = None
        headers = {
            "X-Api-Key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if body is not None:
            data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            f"{self.BASE_URL}{path}", data=data, headers=headers, method=method
        )
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
                return payload if isinstance(payload, dict) else {}
        except urllib.error.HTTPError as exc:
            detail = ""
            try:
                err_body = json.loads(exc.read().decode("utf-8"))
                err = err_body.get("error") if isinstance(err_body, dict) else None
                if isinstance(err, dict):
                    detail = err.get("message") or err.get("code") or ""
                elif isinstance(err, str):
                    detail = err
            except Exception:
                detail = ""
            raise VideoDemoNotConfigured(
                detail or f"HeyGen HTTP {exc.code}."
            ) from exc
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise VideoDemoNotConfigured(
                "Falha ao contactar a API HeyGen."
            ) from exc

    def start_generation(
        self,
        *,
        script_steps: list[str],
        exercise_name: str,
        persona: str,
        duration_sec: int,
    ) -> VideoJobResult:
        pkey = self._persona_key(persona)
        avatar_id = self.avatars.get(pkey) or self.avatars.get("neutral") or ""
        if not avatar_id:
            return VideoJobResult(
                status="failed",
                safe_error=(
                    "Avatar HeyGen não configurado. Define VIDEO_DEMO_AVATAR_NEUTRAL "
                    "(e opcionalmente WOMAN/MAN) no .env."
                ),
            )
        script = build_demo_script(
            exercise_name,
            list(script_steps or [])[:8],
            duration_sec=max(7, int(duration_sec or 7)),
        )
        payload: dict = {
            "type": "avatar",
            "avatar_id": avatar_id,
            "script": script,
            "title": f"Forma · {exercise_name}"[:80],
            "aspect_ratio": "9:16",
            "voice_settings": {"locale": "pt-BR", "speed": 1.05},
            "motion_prompt": (
                f"Demonstra o exercício {exercise_name} com gestos claros de "
                "instrução fitness, corpo visível, movimentos controlados."
            ),
        }
        voice_id = self.voices.get(pkey) or self.voices.get("neutral") or ""
        if voice_id:
            payload["voice_id"] = voice_id

        try:
            raw = self._request("POST", "/v3/videos", payload)
        except VideoDemoNotConfigured as exc:
            return VideoJobResult(status="failed", safe_error=str(exc)[:512])

        data = raw.get("data") if isinstance(raw.get("data"), dict) else raw
        video_id = str(data.get("video_id") or data.get("id") or "")[:128]
        if not video_id:
            return VideoJobResult(
                status="failed",
                safe_error="HeyGen não devolveu video_id.",
            )
        status_raw = (data.get("status") or "pending").lower()
        if status_raw in ("completed", "done", "success"):
            media = (data.get("video_url") or data.get("media_url") or "")[:1024]
            if media:
                return VideoJobResult(
                    status="done",
                    media_url=media,
                    provider_job_id=video_id,
                )
        if status_raw in ("failed", "error"):
            return VideoJobResult(
                status="failed",
                provider_job_id=video_id,
                safe_error=(data.get("failure_message") or data.get("error") or "Falha HeyGen.")[
                    :512
                ],
            )
        mapped = "pending"
        if status_raw in ("processing",):
            mapped = "processing"
        elif status_raw in ("pending", "waiting", "queued"):
            mapped = "pending"
        return VideoJobResult(status=mapped, provider_job_id=video_id)

    def poll(self, provider_job_id: str) -> VideoJobResult:
        try:
            raw = self._request("GET", f"/v3/videos/{provider_job_id}")
        except VideoDemoNotConfigured as exc:
            return VideoJobResult(
                status="failed",
                provider_job_id=provider_job_id,
                safe_error=str(exc)[:512],
            )
        data = raw.get("data") if isinstance(raw.get("data"), dict) else raw
        status_raw = (data.get("status") or "processing").lower()
        if status_raw in ("completed", "done", "success"):
            media = (data.get("video_url") or data.get("media_url") or "")[:1024]
            if not media:
                return VideoJobResult(
                    status="processing",
                    provider_job_id=provider_job_id,
                    safe_error="HeyGen completed sem video_url ainda.",
                )
            return VideoJobResult(
                status="done",
                media_url=media,
                provider_job_id=provider_job_id,
            )
        if status_raw in ("failed", "error"):
            return VideoJobResult(
                status="failed",
                provider_job_id=provider_job_id,
                safe_error=(
                    data.get("failure_message")
                    or data.get("error")
                    or "Falha na geração HeyGen."
                )[:512],
            )
        if status_raw in ("pending", "waiting", "queued"):
            return VideoJobResult(status="pending", provider_job_id=provider_job_id)
        return VideoJobResult(status="processing", provider_job_id=provider_job_id)


def _demo_media_root():
    from pathlib import Path

    root = Path(getattr(settings, "VIDEO_DEMO_LOCAL_DIR", "") or "")
    if not root.is_absolute():
        root = Path(settings.BASE_DIR) / (root or "media/demo_samples")
    root.mkdir(parents=True, exist_ok=True)
    return root


def _demo_jobs_root():
    from pathlib import Path

    root = Path(settings.BASE_DIR) / "media" / "demo_jobs"
    root.mkdir(parents=True, exist_ok=True)
    return root


def render_local_demo_mp4(
    dest_path,
    *,
    exercise_name: str,
    script_steps: list[str],
    duration_sec: int = 7,
) -> None:
    """Gera MP4 ~7s com título + passos (placeholder honesto, sem biomecânica)."""
    from pathlib import Path

    from PIL import Image, ImageDraw, ImageFont

    dest = Path(dest_path)
    dest.parent.mkdir(parents=True, exist_ok=True)

    try:
        import imageio.v2 as imageio
    except ImportError as exc:
        raise VideoDemoNotConfigured(
            "Dependência imageio em falta para provider local."
        ) from exc

    width, height, fps = 720, 1280, 8
    n_frames = max(fps * max(7, int(duration_sec)), fps * 7)
    title = (exercise_name or "Exercício")[:48]
    steps = [str(s).strip() for s in (script_steps or []) if str(s).strip()][:3]
    if not steps:
        steps = ["Segue os passos escritos na Nina.", "Movimento controlado.", "Respira."]

    font_title = font_body = ImageFont.load_default()
    try:
        font_title = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 42
        )
        font_body = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28
        )
    except OSError:
        try:
            font_title = ImageFont.truetype(
                "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 42
            )
            font_body = ImageFont.truetype(
                "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", 28
            )
        except OSError:
            pass

    frames = []
    for i in range(n_frames):
        img = Image.new("RGB", (width, height), (29, 42, 38))
        draw = ImageDraw.Draw(img)
        draw.rounded_rectangle(
            [36, 180, width - 36, height - 180], radius=28, fill=(247, 244, 239)
        )
        draw.text((56, 220), "Forma · demo local", fill=(177, 96, 61), font=font_body)
        draw.text((56, 290), title, fill=(29, 42, 38), font=font_title)
        draw.text(
            (56, 370),
            "Pré-visualização educativa (não é vídeo biomecânico).",
            fill=(100, 90, 80),
            font=font_body,
        )
        y = 460
        # Mostra passos em sequência ao longo do tempo
        visible = max(1, min(len(steps), 1 + (i * len(steps)) // max(n_frames, 1)))
        for idx, step in enumerate(steps[:visible]):
            draw.text((56, y), f"{idx + 1}. {step[:56]}", fill=(50, 50, 50), font=font_body)
            y += 70
        # Barra de progresso
        prog = int((i + 1) / n_frames * (width - 112))
        draw.rectangle([56, height - 260, width - 56, height - 240], fill=(220, 210, 200))
        draw.rectangle([56, height - 260, 56 + prog, height - 240], fill=(177, 96, 61))
        frames.append(img)

    try:
        imageio.mimsave(
            dest,
            frames,
            fps=fps,
            codec="libx264",
            quality=7,
            ffmpeg_log_level="error",
            output_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
        )
    except Exception as exc:
        # Fallback: copia sample estático se existir
        sample = _demo_media_root() / "sample.mp4"
        if sample.is_file():
            dest.write_bytes(sample.read_bytes())
        else:
            raise VideoDemoNotConfigured(
                f"Falha ao gerar vídeo local: {exc}"
            ) from exc


def ensure_sample_mp4() -> None:
    sample = _demo_media_root() / "sample.mp4"
    if sample.is_file() and sample.stat().st_size > 1000:
        return
    render_local_demo_mp4(
        sample,
        exercise_name="Demonstração",
        script_steps=["Exemplo local", "Sem API externa", "Só para testar o fluxo"],
        duration_sec=7,
    )


class LocalVideoDemo:
    """
    Provider gratuito local: gera MP4 com título/passos (~7s).
    Sem chave externa — só para validar o fluxo na Nina.
    """

    def start_generation(
        self,
        *,
        script_steps: list[str],
        exercise_name: str,
        persona: str,
        duration_sec: int,
    ) -> VideoJobResult:
        import json
        import uuid

        job_id = f"local_{uuid.uuid4().hex[:16]}"
        meta_path = _demo_jobs_root() / f"{job_id}.json"
        meta_path.write_text(
            json.dumps(
                {
                    "exercise_name": exercise_name,
                    "steps": list(script_steps or [])[:8],
                    "persona": persona,
                    "duration_sec": max(7, int(duration_sec or 7)),
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        return VideoJobResult(status="processing", provider_job_id=job_id)

    def poll(self, provider_job_id: str) -> VideoJobResult:
        import json

        job_id = (provider_job_id or "").strip()
        if not job_id.startswith("local_") or "/" in job_id or ".." in job_id:
            return VideoJobResult(
                status="failed",
                provider_job_id=job_id,
                safe_error="Job local inválido.",
            )
        jobs = _demo_jobs_root()
        meta_path = jobs / f"{job_id}.json"
        mp4_path = jobs / f"{job_id}.mp4"
        if not meta_path.is_file():
            return VideoJobResult(
                status="failed",
                provider_job_id=job_id,
                safe_error="Job local não encontrado.",
            )
        if not mp4_path.is_file():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                render_local_demo_mp4(
                    mp4_path,
                    exercise_name=str(meta.get("exercise_name") or "Exercício"),
                    script_steps=list(meta.get("steps") or []),
                    duration_sec=int(meta.get("duration_sec") or 7),
                )
            except Exception as exc:
                # último recurso: sample
                try:
                    ensure_sample_mp4()
                    sample = _demo_media_root() / "sample.mp4"
                    mp4_path.write_bytes(sample.read_bytes())
                except Exception:
                    return VideoJobResult(
                        status="failed",
                        provider_job_id=job_id,
                        safe_error=f"Falha ao gerar vídeo local: {exc}"[:512],
                    )
        media_url = f"/api/assistant/demo-media/{job_id}.mp4"
        return VideoJobResult(
            status="done",
            media_url=media_url,
            provider_job_id=job_id,
        )


def get_video_demo_provider() -> VideoDemoProvider:
    provider = (getattr(settings, "VIDEO_DEMO_PROVIDER", "") or "").strip().lower()
    api_key = (getattr(settings, "VIDEO_DEMO_API_KEY", "") or "").strip()
    base_url = (getattr(settings, "VIDEO_DEMO_BASE_URL", "") or "").strip()
    if provider in ("", "none", "null"):
        return NullVideoDemo()
    if provider == "local":
        return LocalVideoDemo()
    if provider == "heygen" and api_key:
        return HeyGenVideoDemo(
            api_key,
            avatar_woman=getattr(settings, "VIDEO_DEMO_AVATAR_WOMAN", "") or "",
            avatar_man=getattr(settings, "VIDEO_DEMO_AVATAR_MAN", "") or "",
            avatar_neutral=getattr(settings, "VIDEO_DEMO_AVATAR_NEUTRAL", "") or "",
            voice_woman=getattr(settings, "VIDEO_DEMO_VOICE_WOMAN", "") or "",
            voice_man=getattr(settings, "VIDEO_DEMO_VOICE_MAN", "") or "",
            voice_neutral=getattr(settings, "VIDEO_DEMO_VOICE_NEUTRAL", "") or "",
        )
    if provider == "http" and api_key and base_url:
        return HttpVideoDemo(base_url, api_key)
    return NullVideoDemo()


def is_video_demo_configured() -> bool:
    provider = (getattr(settings, "VIDEO_DEMO_PROVIDER", "") or "").strip().lower()
    api_key = (getattr(settings, "VIDEO_DEMO_API_KEY", "") or "").strip()
    base_url = (getattr(settings, "VIDEO_DEMO_BASE_URL", "") or "").strip()
    if provider == "local":
        return True
    if provider == "heygen" and api_key:
        avatar = (
            (getattr(settings, "VIDEO_DEMO_AVATAR_NEUTRAL", "") or "").strip()
            or (getattr(settings, "VIDEO_DEMO_AVATAR_WOMAN", "") or "").strip()
            or (getattr(settings, "VIDEO_DEMO_AVATAR_MAN", "") or "").strip()
        )
        return bool(avatar)
    return provider == "http" and bool(api_key and base_url)
