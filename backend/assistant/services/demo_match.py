"""Correspondência auditável de demos aprovadas por atributos (não por identidade)."""

from __future__ import annotations

from assistant.models import ExerciseDemo


def normalize_key(name: str) -> str:
    return (
        (name or "")
        .strip()
        .lower()
        .replace("á", "a")
        .replace("à", "a")
        .replace("ã", "a")
        .replace("â", "a")
        .replace("é", "e")
        .replace("ê", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ô", "o")
        .replace("õ", "o")
        .replace("ú", "u")
        .replace("ç", "c")
    )


def find_approved_demo(
    *,
    exercise_name: str,
    variation: str = "",
    equipment: list | None = None,
    level: str = "",
    goal: str = "",
    persona: str = "",
    language: str = "pt-BR",
) -> ExerciseDemo | None:
    """
    Regras explícitas (ordem de preferência):
    1. exercise_key + variation + status approved
    2. exercise_key + equipment overlap + approved
    3. exercise_key + approved (qualquer variação)
    """
    key = normalize_key(exercise_name)
    if not key:
        return None

    base = ExerciseDemo.objects.filter(
        status=ExerciseDemo.Status.APPROVED,
        exercise_key=key,
        language=language,
    )
    if persona:
        with_persona = base.filter(persona=persona)
        if with_persona.exists():
            base = with_persona

    if variation:
        var_key = normalize_key(variation)
        hit = base.filter(variation__iexact=variation).first()
        if hit:
            return hit
        hit = base.filter(variation__icontains=var_key[:40]).first()
        if hit:
            return hit

    equipment = equipment or []
    if equipment:
        for demo in base.iterator():
            demo_eq = {normalize_key(str(x)) for x in (demo.equipment or [])}
            want = {normalize_key(str(x)) for x in equipment}
            if demo_eq & want:
                return demo

    if level:
        hit = base.filter(level__iexact=level).first()
        if hit:
            return hit

    if goal:
        hit = base.filter(goal__iexact=goal).first()
        if hit:
            return hit

    return base.first()
