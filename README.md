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
cp .env.example .env   # defina OPENAI_API_KEY para a Nina
python manage.py seed_demo   # só com DJANGO_DEBUG=true; conta staff (não superuser)
python manage.py runserver 8000
```

> Segurança: `seed_demo` aborta se `DEBUG=false`. Credenciais demo são só para ambiente local. Em produção use `DJANGO_DEBUG=false`, `DJANGO_SECRET_KEY` forte e `DJANGO_ALLOWED_HOSTS` explícitos.

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

A sessão usa cookies **HttpOnly** (`forma_access` / `forma_refresh`). O frontend chama a API com `credentials: "include"` (via proxy `/api`). Logout: `POST /api/auth/logout/`.

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
| Assist. exercício | `POST /api/assistant/exercise-assist/`, `…/{id}/clarify/`, `GET …/{id}/` |
| Demos | `GET /api/assistant/demos/`, `POST …/generate/`, `GET …/jobs/{id}/`, `POST …/{id}/review/` (staff) |
| Feedback | `POST /api/assistant/feedback/` |
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

## CI

GitHub Actions (`.github/workflows/ci.yml`) em push/PR para `main`:

- Backend: `pip install`, `manage.py check`, `manage.py test`
- Frontend: `npm ci`, `npm audit` (aviso), `tsc --noEmit`, `npm run build`

### Assistente de exercícios (texto + voz)

Na Nina, modo **Demonstrar exercício**: linguagem natural, clarificação, passos escritos, match de demos aprovadas e jobs de vídeo. Sem `WEB_SEARCH_*` / `VIDEO_DEMO_*` a API responde de forma honesta (`search_unavailable` / `not_configured`) — não simula pesquisa nem vídeo pronto. Vídeos novos ficam em `review` até aprovação staff. Voz usa Web Speech no browser; áudio bruto não é guardado.

## Observações

- SQLite em desenvolvimento (`backend/db.sqlite3`).
- CORS liberado para `http://localhost:5173`.
- Sessão em cookies HttpOnly; Admin de conteúdo exige conta staff.
- Sala ao vivo e análise por câmera são demonstrativas; imagens não são armazenadas.
- Conteúdo educativo — não substitui avaliação profissional.
