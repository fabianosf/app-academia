"""Orquestra interpretação → pesquisa → match → job de vídeo."""

from __future__ import annotations

import uuid
from typing import Any

from catalog.models import Exercise
from django.contrib.auth import get_user_model
from django.utils import timezone

from assistant.models import (
    ConsultedSource,
    DemoGenerationJob,
    ExerciseAssistRequest,
    ExerciseDemo,
)
from assistant.services.demo_match import find_approved_demo, normalize_key
from assistant.services.interpret import interpret_request
from assistant.services.video_demo import get_video_demo_provider, is_video_demo_configured
from assistant.services.web_search import (
    WebSearchNotConfigured,
    get_web_search_provider,
    is_web_search_configured,
)

User = get_user_model()

MAX_TEXT_LEN = 2000


def _new_id(prefix: str) -> str:
    return f"{prefix}{uuid.uuid4().hex[:12]}"


def _profile_context(user) -> dict[str, Any]:
    profile = getattr(user, "profile", None)
    if not profile:
        return {}
    return {
        "goal": profile.goal,
        "level": profile.level,
        "place": profile.place,
        "equipment": profile.equipment,
        "limitations": (profile.limitations or "")[:500],
    }


def _link_catalog(interp: dict) -> Exercise | None:
    pid = (interp.get("catalog_exercise_id") or "").strip()
    if pid:
        hit = Exercise.objects.filter(public_id=pid).first()
        if hit:
            return hit
    name = (interp.get("exercise_name") or "").strip()
    if name:
        return Exercise.objects.filter(name__iexact=name).first()
    return None


def _apply_interpretation(req: ExerciseAssistRequest, interp: dict) -> None:
    req.interpretation = interp
    req.health_caution = bool(interp.get("health_caution"))
    req.personalized_from_profile = bool(interp.get("personalized_from_profile"))
    req.clarifying_question = (interp.get("clarifying_question") or "")[:1000]
    req.answer_text = (interp.get("answer_text") or "")[:8000]
    req.steps = interp.get("steps") or []
    req.cautions = interp.get("cautions") or []
    req.catalog_exercise = _link_catalog(interp)


def _maybe_search(req: ExerciseAssistRequest, interp: dict) -> None:
    needs = bool(interp.get("needs_research")) or (
        float(interp.get("confidence") or 0) < 0.55
        and interp.get("intent") in ("specific_exercise", "goal_or_muscle")
        and not interp.get("needs_clarification")
    )
    if not needs:
        req.search_status = "not_needed"
        return
    if not is_web_search_configured():
        req.search_status = "search_unavailable"
        if not req.answer_text:
            req.answer_text = (
                "Não tenho pesquisa web configurada neste ambiente. "
                "Segue orientação geral com base no pedido; confirma a técnica "
                "com um profissional se tiveres dúvidas."
            )
        return

    req.status = ExerciseAssistRequest.Status.SEARCHING
    req.search_status = "searching"
    req.save(update_fields=["status", "search_status", "updated_at"])

    query = (
        f"{interp.get('exercise_name') or interp.get('muscle_group') or req.text} "
        f"exercício técnica execução"
    ).strip()
    provider = get_web_search_provider()
    try:
        hits = provider.search(query, max_results=5)
    except WebSearchNotConfigured:
        req.search_status = "search_unavailable"
        return

    for hit in hits:
        ConsultedSource.objects.create(
            request=req,
            title=hit.title,
            url=hit.url,
            authorship=hit.authorship,
            summary=hit.snippet[:1500],
        )
    req.search_status = "searched" if hits else "no_reliable_sources"
    if not hits:
        req.answer_text = (
            (req.answer_text or "")
            + "\n\nNão encontrei fontes suficientemente fiáveis na pesquisa. "
            "Prefiro não afirmar a técnica com certeza total."
        ).strip()


def _match_or_enqueue(
    req: ExerciseAssistRequest,
    interp: dict,
    *,
    persona: str,
    request_video: bool,
) -> DemoGenerationJob | None:
    name = (interp.get("exercise_name") or "").strip()
    if not name:
        return None

    demo = find_approved_demo(
        exercise_name=name,
        variation=interp.get("variation") or "",
        equipment=interp.get("equipment") or [],
        level=interp.get("level") or "",
        goal=interp.get("goal") or "",
        persona=persona if persona != "auto" else "",
    )
    if demo:
        req.matched_demo = demo
        return None

    if not request_video:
        return None

    job = DemoGenerationJob.objects.create(
        public_id=_new_id("j"),
        request=req,
        persona=persona
        if persona in dict(ExerciseDemo.Persona.choices)
        else ExerciseDemo.Persona.NEUTRAL,
        provider=(getattr(__import__("django.conf", fromlist=["settings"]).settings, "VIDEO_DEMO_PROVIDER", "") or "none"),
        status=DemoGenerationJob.Status.PENDING,
    )

    if not is_video_demo_configured():
        job.status = DemoGenerationJob.Status.NOT_CONFIGURED
        job.safe_error = (
            "Geração de vídeo não configurada. Enquanto isso, usa os passos escritos."
        )
        job.save(update_fields=["status", "safe_error", "updated_at"])
        return job

    # Cria demo em review e tenta iniciar provider
    draft = ExerciseDemo.objects.create(
        public_id=_new_id("d"),
        exercise_key=normalize_key(name) or _new_id("ex"),
        exercise_name=name[:255],
        muscle_group=(interp.get("muscle_group") or "")[:64],
        variation=(interp.get("variation") or "")[:128],
        equipment=interp.get("equipment") or [],
        level=(interp.get("level") or "")[:40],
        goal=(interp.get("goal") or "")[:64],
        persona=job.persona,
        language="pt-BR",
        duration_sec=7,
        status=ExerciseDemo.Status.REVIEW,
        structured_script=interp.get("steps") or [],
        source_notes=[
            {"title": s.title, "url": s.url}
            for s in req.sources.all()[:5]
        ],
        ai_generated=True,
        created_by=req.user,
        prompt_version="v1",
    )
    job.demo = draft
    provider = get_video_demo_provider()
    result = provider.start_generation(
        script_steps=list(interp.get("steps") or [])[:12],
        exercise_name=name,
        persona=job.persona,
        duration_sec=7,
    )
    if result.provider_job_id:
        job.provider_job_id = result.provider_job_id
    if result.status == "not_configured":
        job.status = DemoGenerationJob.Status.NOT_CONFIGURED
        job.safe_error = result.safe_error or "Geração de vídeo não configurada."
    elif result.status == "failed":
        job.status = DemoGenerationJob.Status.FAILED
        job.safe_error = result.safe_error or "Falha na geração."
    elif result.status == "done" and result.media_url:
        job.status = DemoGenerationJob.Status.DONE
        draft.media_url = result.media_url
        draft.status = ExerciseDemo.Status.REVIEW  # ainda precisa aprovação
        draft.save(update_fields=["media_url", "status", "updated_at"])
    else:
        job.status = DemoGenerationJob.Status.PROCESSING
        job.safe_error = ""
    job.save()
    return job


def refresh_generation_job(job: DemoGenerationJob) -> DemoGenerationJob:
    """Atualiza job pending/processing via poll do provider (se configurado)."""
    if job.status not in (
        DemoGenerationJob.Status.PENDING,
        DemoGenerationJob.Status.PROCESSING,
    ):
        return job
    if not is_video_demo_configured():
        job.status = DemoGenerationJob.Status.NOT_CONFIGURED
        job.safe_error = job.safe_error or "Geração de vídeo não configurada."
        job.save(update_fields=["status", "safe_error", "updated_at"])
        return job
    if not job.provider_job_id:
        return job

    provider = get_video_demo_provider()
    result = provider.poll(job.provider_job_id)
    if result.status == "failed":
        job.status = DemoGenerationJob.Status.FAILED
        job.safe_error = result.safe_error or "Falha na geração."
        job.save(update_fields=["status", "safe_error", "updated_at"])
        return job
    if result.status == "done":
        job.status = DemoGenerationJob.Status.DONE
        if job.demo_id and result.media_url:
            demo = job.demo
            demo.media_url = result.media_url
            demo.status = ExerciseDemo.Status.REVIEW
            demo.save(update_fields=["media_url", "status", "updated_at"])
        job.safe_error = ""
        job.save(update_fields=["status", "safe_error", "updated_at"])
        return job
    job.status = DemoGenerationJob.Status.PROCESSING
    job.save(update_fields=["status", "updated_at"])
    return job


def create_assist_request(
    user,
    text: str,
    *,
    persona: str = "neutral",
    request_video: bool = True,
) -> tuple[ExerciseAssistRequest, DemoGenerationJob | None]:
    text = (text or "").strip()
    if not text:
        raise ValueError("message é obrigatório.")
    if len(text) > MAX_TEXT_LEN:
        raise ValueError(f"message excede {MAX_TEXT_LEN} caracteres.")

    req = ExerciseAssistRequest.objects.create(
        public_id=_new_id("a"),
        user=user,
        text=text,
        status=ExerciseAssistRequest.Status.READY,
    )

    interp = interpret_request(text, profile_context=_profile_context(user))
    _apply_interpretation(req, interp)

    if interp.get("needs_clarification") or interp.get("intent") == "ambiguous":
        req.status = ExerciseAssistRequest.Status.CLARIFYING
        if not req.clarifying_question:
            req.clarifying_question = (
                "Podes concretizar o movimento ou o equipamento que tens?"
            )
        req.save()
        return req, None

    if interp.get("health_caution") and interp.get("needs_clarification"):
        req.status = ExerciseAssistRequest.Status.CLARIFYING
        req.save()
        return req, None

    _maybe_search(req, interp)
    job = _match_or_enqueue(
        req, interp, persona=persona or "neutral", request_video=request_video
    )
    req.status = ExerciseAssistRequest.Status.ANSWERED
    req.save()
    return req, job


def clarify_assist_request(
    req: ExerciseAssistRequest,
    answer: str,
    *,
    persona: str = "neutral",
    request_video: bool = True,
) -> tuple[ExerciseAssistRequest, DemoGenerationJob | None]:
    answer = (answer or "").strip()
    if not answer:
        raise ValueError("answer é obrigatório.")
    if len(answer) > MAX_TEXT_LEN:
        raise ValueError(f"answer excede {MAX_TEXT_LEN} caracteres.")

    combined = f"{req.text}\n\nClarificação do utilizador: {answer}"
    interp = interpret_request(
        combined,
        profile_context=_profile_context(req.user),
        clarification_answer=answer,
    )
    _apply_interpretation(req, interp)

    if interp.get("needs_clarification") and float(interp.get("confidence") or 0) < 0.6:
        req.status = ExerciseAssistRequest.Status.CLARIFYING
        req.save()
        return req, None

    _maybe_search(req, interp)
    job = _match_or_enqueue(
        req, interp, persona=persona or "neutral", request_video=request_video
    )
    req.status = ExerciseAssistRequest.Status.ANSWERED
    req.save()
    return req, job


def review_demo(demo: ExerciseDemo, *, approve: bool, reviewer) -> ExerciseDemo:
    demo.status = (
        ExerciseDemo.Status.APPROVED if approve else ExerciseDemo.Status.REJECTED
    )
    demo.reviewed_by = reviewer
    demo.reviewed_at = timezone.now()
    demo.save(
        update_fields=["status", "reviewed_by", "reviewed_at", "updated_at"]
    )
    return demo


def enqueue_demo_for_request(
    req: ExerciseAssistRequest,
    *,
    persona: str = "neutral",
) -> DemoGenerationJob | None:
    """API pública para gerar/associar demo a um pedido já interpretado."""
    return _match_or_enqueue(
        req,
        req.interpretation or {},
        persona=persona or "neutral",
        request_video=True,
    )
