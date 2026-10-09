"""Interpretação estruturada do pedido de exercício via LLM."""

from __future__ import annotations

import json
import re
from typing import Any

from catalog.models import Exercise

from .llm_client import LlmCallError, LlmConfigError, chat_json

HEALTH_KEYWORDS = (
    "dor",
    "lesão",
    "lesao",
    "joelho",
    "ombro",
    "coluna",
    "hérnia",
    "hernia",
    "cirurgia",
    "inflam",
    "tendinite",
    "médico",
    "medico",
    "fisioterapeuta",
    "doença",
    "doenca",
)


SYSTEM = """És um assistente de exercício físico educativo (PT-BR).
NÃO diagnostiques lesões nem prescritas tratamento médico.
Responde APENAS com JSON válido (sem markdown) neste schema:
{
  "intent": "specific_exercise" | "goal_or_muscle" | "ambiguous" | "health_caution",
  "confidence": 0.0-1.0,
  "needs_clarification": true/false,
  "clarifying_question": "string curta ou vazio",
  "exercise_name": "nome técnico se conhecido ou vazio",
  "exercise_key_hint": "slug simples em minusculas",
  "variation": "variação ou vazio",
  "muscle_group": "grupo muscular principal ou vazio",
  "equipment": ["lista"],
  "level": "Iniciante|Intermediário|Avançado|",
  "goal": "objetivo curto ou vazio",
  "health_caution": true/false,
  "steps": ["passos de execução curtos"],
  "cautions": ["cuidados gerais"],
  "answer_text": "explicação educativa curta em PT-BR",
  "catalog_exercise_id": "public_id do catálogo se corresponder, senão vazio",
  "personalized_from_profile": true/false,
  "needs_research": true/false
}
Se houver dúvida, needs_clarification=true e faz UMA pergunta concreta.
Se houver dor/lesão/doença, intent=health_caution, health_caution=true,
e inclui aviso para procurar profissional — sem diagnosticar.
"""


def _extract_json(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        data = json.loads(match.group(0))
        if isinstance(data, dict):
            return data
    raise LlmCallError("Não foi possível interpretar a resposta do modelo.")


def _catalog_snippet(limit: int = 40) -> str:
    rows = Exercise.objects.all()[:limit]
    if not rows:
        return "(catálogo vazio)"
    return "\n".join(f"- {e.public_id}: {e.name} ({e.focus}, {e.place})" for e in rows)


def _heuristic_health(text: str) -> bool:
    low = text.lower()
    return any(k in low for k in HEALTH_KEYWORDS)


def interpret_request(
    message: str,
    *,
    profile_context: dict | None = None,
    clarification_answer: str | None = None,
) -> dict[str, Any]:
    ctx = profile_context or {}
    catalog = _catalog_snippet()
    user_blob = (
        f"Pedido do utilizador:\n{message.strip()}\n\n"
        f"Resposta de clarificação (se houver):\n{(clarification_answer or '').strip() or '(nenhuma)'}\n\n"
        f"Perfil (usar só se relevante; marcar personalized_from_profile):\n"
        f"- objetivo: {ctx.get('goal') or 'não informado'}\n"
        f"- nível: {ctx.get('level') or 'não informado'}\n"
        f"- local: {ctx.get('place') or 'não informado'}\n"
        f"- equipamento: {ctx.get('equipment') or 'não informado'}\n"
        f"- limitações declaradas: {ctx.get('limitations') or 'não informado'}\n\n"
        f"Catálogo local (referência):\n{catalog}\n"
    )
    try:
        raw = chat_json(SYSTEM, user_blob)
        data = _extract_json(raw)
    except (LlmConfigError, LlmCallError):
        # Fallback seguro sem LLM: clarificação / cautela
        health = _heuristic_health(message)
        if health:
            return {
                "intent": "health_caution",
                "confidence": 0.4,
                "needs_clarification": True,
                "clarifying_question": (
                    "O desconforto foi avaliado por um profissional de saúde? "
                    "Posso apenas dar informação geral educativa."
                ),
                "exercise_name": "",
                "exercise_key_hint": "",
                "variation": "",
                "muscle_group": "",
                "equipment": [],
                "level": "",
                "goal": "",
                "health_caution": True,
                "steps": [],
                "cautions": [
                    "Conteúdo educativo — não substitui avaliação profissional.",
                    "Em caso de dor, procure um profissional habilitado.",
                ],
                "answer_text": (
                    "Percebi menção a desconforto ou condição de saúde. "
                    "Não faço diagnóstico nem prescrição. Posso sugerir opções gerais "
                    "depois de confirmares o contexto com um profissional."
                ),
                "catalog_exercise_id": "",
                "personalized_from_profile": False,
                "needs_research": False,
                "llm_unavailable": True,
            }
        return {
            "intent": "ambiguous",
            "confidence": 0.2,
            "needs_clarification": True,
            "clarifying_question": (
                "Podes descrever o movimento ou o objetivo com mais um detalhe? "
                "Ex.: grupo muscular e se tens halteres."
            ),
            "exercise_name": "",
            "exercise_key_hint": "",
            "variation": "",
            "muscle_group": "",
            "equipment": [],
            "level": "",
            "goal": "",
            "health_caution": False,
            "steps": [],
            "cautions": [
                "Conteúdo educativo — não substitui avaliação profissional.",
            ],
            "answer_text": (
                "Preciso de um pouco mais de detalhe para identificar o exercício "
                "com segurança. O assistente de linguagem não está disponível agora."
            ),
            "catalog_exercise_id": "",
            "personalized_from_profile": False,
            "needs_research": False,
            "llm_unavailable": True,
        }

    # Normalização mínima
    data.setdefault("needs_clarification", False)
    data.setdefault("clarifying_question", "")
    data.setdefault("steps", [])
    data.setdefault("cautions", [])
    data.setdefault("equipment", [])
    data.setdefault("health_caution", False)
    data.setdefault("needs_research", False)
    data.setdefault("personalized_from_profile", False)
    if _heuristic_health(message) and not data.get("health_caution"):
        data["health_caution"] = True
        if data.get("intent") != "health_caution":
            data["intent"] = "health_caution"
    if not any("educativ" in str(c).lower() or "profissional" in str(c).lower() for c in data["cautions"]):
        data["cautions"] = list(data["cautions"]) + [
            "Orientação educativa. Não substitui médico, fisioterapeuta ou educador físico."
        ]
    return data
