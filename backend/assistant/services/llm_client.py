"""Cliente LLM partilhado (OpenAI-compatible)."""

from __future__ import annotations

from django.conf import settings
from openai import APIError, AuthenticationError, OpenAI, OpenAIError


class LlmConfigError(Exception):
    pass


class LlmCallError(Exception):
    pass


def get_client() -> OpenAI:
    api_key = (settings.OPENAI_API_KEY or "").strip()
    if not api_key:
        raise LlmConfigError(
            "Configure OPENAI_API_KEY no backend (.env) para usar o assistente."
        )
    return OpenAI(api_key=api_key, base_url=settings.OPENAI_BASE_URL)


def chat_json(system: str, user: str, *, max_tokens: int = 900) -> str:
    client = get_client()
    try:
        completion = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            temperature=0.2,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
    except AuthenticationError as exc:
        raise LlmCallError("Falha de autenticação no LLM.") from exc
    except (APIError, OpenAIError) as exc:
        raise LlmCallError("LLM indisponível neste momento.") from exc

    content = (completion.choices[0].message.content or "").strip()
    if not content:
        raise LlmCallError("O modelo retornou resposta vazia.")
    return content
