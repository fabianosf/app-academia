# Integrações do assistente de exercícios

O backend usa **adapters HTTP genéricos**. Sem variáveis preenchidas, a API responde de forma honesta (`search_unavailable` / `not_configured`) e **não simula** pesquisa ou vídeo.

Configura em `backend/.env` (nunca commits com chaves reais).

## 1. LLM (já usado)

```bash
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.deepseek.com   # ou Groq / OpenAI
OPENAI_MODEL=deepseek-chat
```

Obrigatório para interpretação rica. Sem chave, o assistente cai num fallback de clarificação segura.

## 2. Pesquisa web

```bash
WEB_SEARCH_PROVIDER=http
WEB_SEARCH_API_KEY=sua_chave
WEB_SEARCH_BASE_URL=https://teu-gateway.example.com
```

### Contrato HTTP esperado

`POST {WEB_SEARCH_BASE_URL}/search`

Headers: `Authorization: Bearer {API_KEY}`, `Content-Type: application/json`

Body:

```json
{ "query": "...", "max_results": 5, "api_key": "..." }
```

Resposta:

```json
{
  "results": [
    {
      "title": "...",
      "url": "https://...",
      "authorship": "instituição",
      "snippet": "resumo curto"
    }
  ]
}
```

Podes pôr um **gateway próprio** (Cloud Function / FastAPI) que traduz Tavily, Serper, Bing, etc. para este contrato. O app Django **não** chama SDKs de fornecedor diretamente nesta versão.

Prioriza fontes de saúde pública, universidades e associações profissionais no teu gateway.

## 3. Vídeo com pessoa virtual (≥ 7 s)

```bash
VIDEO_DEMO_PROVIDER=http
VIDEO_DEMO_API_KEY=sua_chave
VIDEO_DEMO_BASE_URL=https://teu-gateway.example.com
```

### Contrato HTTP esperado

`POST {VIDEO_DEMO_BASE_URL}/generate`

```json
{
  "exercise_name": "Elevação lateral",
  "persona": "neutral|woman|man",
  "duration_sec": 7,
  "steps": ["passo 1", "passo 2"]
}
```

Resposta:

```json
{ "job_id": "abc", "status": "pending|processing|done|failed", "media_url": "", "error": "" }
```

`GET {VIDEO_DEMO_BASE_URL}/jobs/{job_id}` → mesmo formato, com `media_url` quando `done`.

O gateway pode encapsular HeyGen, Tavus, ou outro — **escolhe e configura no gateway**, não no frontend.

### Revisão humana

Vídeos novos ficam com `status=review` até um staff aprovar em **Administração** (ou `POST /api/assistant/demos/{id}/review/` com `{"action":"approve"}`).

Só demos `approved` são mostradas na Nina como demonstração.

## 4. Live (stream por aula)

Campo `stream_url` / `streamUrl` em cada `LiveClass` (Django admin ou `POST /api/live/classes/` staff).

- URL de embed (LiveKit/Daily/YouTube Live/etc.) → iframe na sala
- URL `.m3u8` / `.mp4` → `<video>`
- Vazio → mensagem honesta «transmissão não configurada» (chat local continua)

Não há provider global de live nesta versão: configura por aula.

## 5. Visão computacional (movimento)

MediaPipe Pose corre **no browser**. O endpoint `POST /api/movement/analyze/` só aceita métricas (`score`/`reps`/`cues` + `source=client_pose`) com consentimento — **não recebe frames**.

Sem métricas do cliente, a API devolve score 0 e cues a pedir ativação da câmera (não inventa análise).

## 6. Checklist rápido

1. Copiar `backend/.env.example` → `.env`
2. Preencher LLM
3. (Opcional) Levantar gateway de pesquisa → preencher `WEB_SEARCH_*`
4. (Opcional) Levantar gateway de vídeo → preencher `VIDEO_DEMO_*`
5. (Opcional) Definir `streamUrl` nas aulas ao vivo
6. Reiniciar Django
7. Staff: abrir `/admin` na app → fila **Demos em revisão**
