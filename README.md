# Forma com Fabiano

Aplicativo fitness (PT-BR) com frontend React e backend Django REST + JWT.

## Estrutura

```
forma-com-fabiano/
├── frontend/   # Vite + React
├── backend/    # Django 6 + DRF + SimpleJWT + Nina/ANS LLM
├── Academia_Nutrição_Saúde v1.0.md
├── ORUS_FABIANOSF_AGENTE.md
└── yota-chefe-arquitetura.md
```

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
# Nina / ANS LLM — copie .env.example e defina OPENAI_API_KEY
cp .env.example .env
python manage.py runserver 8000
```

### Nina (cérebro ANS + LLM)

A Nina usa o arquivo `Academia_Nutrição_Saúde v1.0` como system prompt via API OpenAI-compatível.

No `backend/.env`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1   # opcional
OPENAI_MODEL=gpt-4o-mini                    # opcional
```

Hash ativado em toda pergunta:
`###ΩΨΧ.ANS.ACADEMIA.NUTRICAO.SAUDE.v1.0.ALPHALANG.NATIVE.35BLOCOS.∇∆∞.20260424.ΨΧΩMASTER###`

Usuário demo: `fabiano` / `forma123`

### Auth JWT

```bash
curl -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H 'Content-Type: application/json' \
  -d '{"username":"fabiano","password":"forma123"}'
```

Use o `access` no header: `Authorization: Bearer <token>`.

### Principais endpoints

| Área | Rotas |
|------|--------|
| Saúde | `GET /api/health/` |
| Auth | `POST /api/auth/register/`, `POST /api/auth/token/`, `POST /api/auth/token/refresh/` |
| Conta | `GET/PATCH /api/me/`, `GET/PATCH /api/me/profile/` |
| Catálogo | `/api/exercises/`, `/api/workouts/` |
| Treino | `/api/training/favorites/`, `/sessions/`, `/history/`, `/goals/`, `/achievements/`, `/load-logs/`, `/progress/` |
| Ao vivo | `/api/live/classes/`, `/instructors/`, `/reservations/` |
| Nina | `GET/POST /api/assistant/nina/chat/` |
| Movimento | `POST /api/movement/analyze/` |
| Notificações | `/api/notifications/` |
| Branding | `/api/branding/settings/` |
| Admin | `http://127.0.0.1:8000/admin/` |

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173. O Vite faz proxy de `/api` para `http://127.0.0.1:8000`.

No boot, se não houver sessão JWT, o app abre `/login`. Conta demo: `fabiano` / `forma123`.

Rotas de autenticação: `/login`, `/esqueci-senha`, `/redefinir-senha`.

## Observações

- SQLite em desenvolvimento (`backend/db.sqlite3`).
- CORS liberado para `http://localhost:5173`.
- Sala ao vivo e análise por câmera são demonstrativas; imagens não são armazenadas.
- Conteúdo educativo — não substitui avaliação profissional.
