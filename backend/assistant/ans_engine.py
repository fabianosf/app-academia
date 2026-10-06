"""Nina ANS brain — LLM + Academia Nutrição Saúde v1.0 as system knowledge."""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from django.conf import settings
from openai import APIError, AuthenticationError, OpenAI, OpenAIError


DISCLAIMER = (
    "Orientação educativa. Não substitui avaliação de médico, nutricionista "
    "ou profissional de educação física. Em caso de dor, doença ou necessidade "
    "de prescrição, procure um profissional habilitado."
)

# Blocos essenciais do ANS (cabe no limite TPM da Groq free/on_demand).
PRIORITY_BLOCKS = (1, 3, 5, 6, 9, 10, 16, 21)
# ~chars de knowledge no system prompt (deixar margem para resposta + user)
MAX_KNOWLEDGE_CHARS = 9000


class AnsConfigError(Exception):
    """OPENAI_API_KEY ausente ou knowledge file inválido."""


class AnsLlmError(Exception):
    """Falha na chamada ao provedor LLM."""


@dataclass
class AnsReply:
    text: str
    knowledge_hash: str
    model: str


@lru_cache(maxsize=1)
def load_ans_document() -> str:
    path = Path(settings.ANS_KNOWLEDGE_PATH)
    if not path.exists():
        raise AnsConfigError(f"Arquivo ANS não encontrado: {path}")
    return path.read_text(encoding="utf-8")


@lru_cache(maxsize=1)
def parse_ans_blocks() -> dict[int, str]:
    """Extrai seções '# ... BLOCO N — ...' do markdown ANS."""
    text = load_ans_document()
    pattern = re.compile(
        r"^#\s+[^\n]*BLOCO\s+(\d+)\s*[—\-–]\s*([^\n]*)\n(.*?)(?=^#\s+[^\n]*BLOCO\s+\d+|\Z)",
        re.MULTILINE | re.DOTALL | re.IGNORECASE,
    )
    blocks: dict[int, str] = {}
    for match in pattern.finditer(text):
        num = int(match.group(1))
        title = match.group(2).strip()
        body = match.group(3).strip()
        blocks[num] = f"# BLOCO {num} — {title}\n\n{body}"
    return blocks


def select_ans_knowledge(message: str, context: dict | None = None) -> str:
    """Monta um recorte do cérebro ANS relevante e compacto para o LLM."""
    blocks = parse_ans_blocks()
    selected_nums = list(PRIORITY_BLOCKS)

    # Acrescenta blocos extras por palavras-chave da pergunta
    q = f"{message} {context or ''}".lower()
    extras: list[tuple[int, tuple[str, ...]]] = [
        (11, ("cardápio", "cardapio", "criativ", "plano alimentar")),
        (22, ("motor", "avaliação", "avaliacao", "pipeline")),
        (23, ("workflow", "orquestr", "fluxo")),
        (26, ("síntese", "sintese", "evidência", "evidencia")),
    ]
    for num, keys in extras:
        if any(k in q for k in keys) and num not in selected_nums:
            selected_nums.append(num)

    parts: list[str] = []
    total = 0
    for num in selected_nums:
        chunk = blocks.get(num)
        if not chunk:
            continue
        if total + len(chunk) > MAX_KNOWLEDGE_CHARS:
            remain = MAX_KNOWLEDGE_CHARS - total
            if remain > 400:
                parts.append(chunk[:remain] + "\n\n[…bloco truncado]")
            break
        parts.append(chunk)
        total += len(chunk)

    if not parts:
        # fallback: início do documento
        return load_ans_document()[:MAX_KNOWLEDGE_CHARS]

    header = (
        f"Hash ativo: {settings.ANS_HASH}\n"
        f"Blocos carregados: {', '.join(str(n) for n in selected_nums if n in blocks)}\n"
    )
    return header + "\n\n***\n\n".join(parts)


def _ensure_disclaimer(text: str) -> str:
    lowered = text.lower()
    markers = ("não substitui", "nao substitui", "orientação educativa", "orientacao educativa")
    if any(m in lowered for m in markers):
        return text.rstrip()
    return f"{text.rstrip()}\n\n— {DISCLAIMER}"


def build_system_prompt(knowledge: str) -> str:
    ans_hash = settings.ANS_HASH
    return f"""Você é a Nina, assistente de treino do app Forma com Fabiano.

ATIVACÃO OBRIGATÓRIA — use este cérebro em TODA resposta:
Hash: {ans_hash}
Identidade: ACADEMIA_NUTRIÇÃO_SAÚDE v1.0 (ANS) — agente multispecialista em saúde, nutrição, educação física e gestão de academia.

DOCUMENTO-CÉREBRO (recorte dos blocos AlphaLang — fonte de verdade):
---
{knowledge}
---

Regras de resposta:
1. Responda SEMPRE em português do Brasil, tom acessível, empático e preciso (Bloco 5).
2. Estrutura sugerida: compreensão do objetivo → caminho baseado em evidência → protocolo/orientação prática → validação de segurança.
3. Use o perfil do usuário (objetivo, nível, equipamentos, último treino) como contexto △.
4. Ética (Bloco 21): nunca invente diagnóstico médico definitivo; encaminhe a profissional quando houver risco, dor aguda, doença ou necessidade de prescrição.
5. Combata pseudociência; prefira orientação prática e segura.
6. Seja concisa o suficiente para chat (cerca de 120–220 palavras), sem perder clareza.
7. Inclua no final um aviso curto de que o conteúdo é educativo e não substitui profissionais.
"""


def build_user_prompt(message: str, context: dict | None) -> str:
    ctx = context or {}
    goal = ctx.get("goal") or "não informado"
    level = ctx.get("level") or "não informado"
    equipment = ctx.get("equipment") or []
    last = ctx.get("lastWorkout") or "não informado"
    if isinstance(equipment, list):
        eq = ", ".join(str(x) for x in equipment) if equipment else "não informado"
    else:
        eq = str(equipment)
    return (
        f"Contexto do usuário:\n"
        f"- Objetivo: {goal}\n"
        f"- Nível: {level}\n"
        f"- Equipamentos: {eq}\n"
        f"- Último treino: {last}\n\n"
        f"Pergunta do usuário:\n{message.strip()}"
    )


def reply(message: str, context: dict | None = None) -> AnsReply:
    api_key = (settings.OPENAI_API_KEY or "").strip()
    if not api_key:
        raise AnsConfigError(
            "Cérebro ANS precisa de LLM. Configure OPENAI_API_KEY no backend "
            "(.env) e reinicie o servidor."
        )

    knowledge = select_ans_knowledge(message, context)
    model = settings.OPENAI_MODEL
    client = OpenAI(api_key=api_key, base_url=settings.OPENAI_BASE_URL)

    try:
        completion = client.chat.completions.create(
            model=model,
            temperature=0.4,
            max_tokens=700,
            messages=[
                {"role": "system", "content": build_system_prompt(knowledge)},
                {"role": "user", "content": build_user_prompt(message, context)},
            ],
        )
    except AuthenticationError as exc:
        raise AnsLlmError(
            "Falha de autenticação no LLM. Verifique OPENAI_API_KEY."
        ) from exc
    except (APIError, OpenAIError) as exc:
        raise AnsLlmError(
            "Não consegui consultar o cérebro ANS agora. Tente de novo em instantes."
        ) from exc

    content = (completion.choices[0].message.content or "").strip()
    if not content:
        raise AnsLlmError("O modelo retornou resposta vazia.")

    return AnsReply(
        text=_ensure_disclaimer(content),
        knowledge_hash=settings.ANS_HASH,
        model=model,
    )
