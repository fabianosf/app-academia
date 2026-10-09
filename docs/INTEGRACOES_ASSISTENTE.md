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

## 3. Vídeo com pessoa virtual (~7 s)

### Opção A — local (grátis, para testar o fluxo)

```bash
VIDEO_DEMO_PROVIDER=local
```

Sem API key. O backend gera um MP4 ~7s com o **nome do exercício e passos em texto** (placeholder educativo — **não** é biomecânica real).  
A Nina mostra esse vídeo como **pré-visualização** no teu pedido; para entrar no catálogo partilhado continua a ser preciso aprovação staff.

Requisitos Python: `pillow`, `imageio`, `imageio-ffmpeg` (no `requirements.txt`).

### Opção B — HeyGen nativo

1. Cria conta em [HeyGen](https://www.heygen.com/) e gera uma API key.
2. Lista avatares (`GET https://api.heygen.com/v3/avatars`) e vozes (`GET https://api.heygen.com/v3/voices`) com header `X-Api-Key`.
3. No `backend/.env`:

```bash
VIDEO_DEMO_PROVIDER=heygen
VIDEO_DEMO_API_KEY=sua_chave_heygen
VIDEO_DEMO_AVATAR_NEUTRAL=avatar_id_aqui
```

O backend chama `POST /v3/videos` e faz poll em `GET /v3/videos/{id}`. Custo: cobrado pela HeyGen.

### Opção C — gateway HTTP genérico

```bash
VIDEO_DEMO_PROVIDER=http
VIDEO_DEMO_API_KEY=sua_chave
VIDEO_DEMO_BASE_URL=https://teu-gateway.example.com
```

`POST {BASE}/generate` → `{ "job_id", "status", "media_url?", "error?" }`  
`GET {BASE}/jobs/{id}` → mesmo formato quando `done`.

### Revisão humana

Vídeos novos ficam com `status=review` até staff aprovar em **Administração**.  
Na Nina, o **pedido atual** pode pré-visualizar o `media_url` em revisão; só demos `approved` entram no catálogo partilhado (`matchedDemo`).

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
4. (Opcional) Vídeo: `VIDEO_DEMO_PROVIDER=local` (grátis) ou `heygen` / `http`
5. (Opcional) Definir `streamUrl` nas aulas ao vivo
6. Reiniciar Django
7. Staff: abrir `/admin` na app → fila **Demos em revisão**
