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
python manage.py seed_demo   # só com DJANGO_DEBUG=true; cria aluno demo (não admin)
python manage.py promote_admin fabiano   # opcional: promove a role=admin + is_staff
python manage.py runserver 8000
```

> Segurança: `seed_demo` aborta se `DEBUG=false`. Credenciais demo são só para ambiente local. Em produção use `DJANGO_DEBUG=false`, `DJANGO_SECRET_KEY` forte e `DJANGO_ALLOWED_HOSTS` explícitos. `is_staff` Django ≠ papel de professor; ver `docs/PAPEIS_E_ADMIN.md`.

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

Usuário demo (aluno): `fabiano` / `forma123`. Para gestão: `python manage.py promote_admin fabiano`.

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
| Demos | `GET /api/assistant/demos/`, `POST …/generate/`, `GET …/jobs/{id}/`, `POST …/{id}/review/` (admin da plataforma) |
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

Abra **https://localhost:5173** (plugin `basic-ssl`; HTTP em `:5173` não serve a UI). O Vite faz proxy de `/api` para `http://127.0.0.1:8000`.

No boot, se não houver sessão JWT, o app abre `/login` (aluno). Conta demo aluno: `fabiano` / `forma123`. Gestão: `/admin/login` (professores e administradores; o papel vem do backend — use `promote_admin`).

Rotas de autenticação: `/login`, `/admin/login`, `/esqueci-senha`, `/redefinir-senha`. Ver `docs/PAPEIS_E_ADMIN.md`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) em push/PR para `main`:

- Backend: `pip install`, `manage.py check`, `manage.py test`
- Frontend: `npm ci`, `npm audit` (aviso), `tsc --noEmit`, `npm run build`

### Assistente de exercícios (texto + voz)

Na Nina, modo **Demonstrar exercício**: linguagem natural, clarificação, passos escritos, match de demos aprovadas e jobs de vídeo. Sem `WEB_SEARCH_*` / `VIDEO_DEMO_*` a API responde de forma honesta (`search_unavailable` / `not_configured`) — não simula pesquisa nem vídeo pronto. Em modo local o MP4 gerado é **placeholder educativo** (texto no vídeo), não biomecânica real. Vídeos novos ficam em `review` até aprovação de administrador na página **Administração**. Voz usa Web Speech no browser; áudio bruto não é guardado.

Guia de fornecedores (contrato HTTP): [`docs/INTEGRACOES_ASSISTENTE.md`](docs/INTEGRACOES_ASSISTENTE.md).

## Testes

```bash
cd backend && source .venv/bin/activate && python manage.py test
cd frontend && npm run lint   # se existir
cd frontend && npx tsc --noEmit && npm run build
```

## Produção (checklist — não automatizado neste repositório)

O default de desenvolvimento **não** é pronto para produção:

| Área | Dev atual | Produção esperada |
|------|-----------|-------------------|
| Banco | SQLite (`db.sqlite3`) | PostgreSQL (ou equivalente) + backups |
| E-mail | Console (`EMAIL_BACKEND` console) | SMTP/API real |
| Segredos | `.env` local | `DJANGO_SECRET_KEY` forte, sem commit |
| Debug | `DJANGO_DEBUG=true` | `false` + `DJANGO_ALLOWED_HOSTS` |
| CORS/CSRF | localhost | Origens HTTPS reais |
| Estáticos/mídia | `runserver` / Vite | `collectstatic` + storage/CDN |
| Deploy/backup | não documentado no repo | procedimento operacional externo |

Não há playbook de deploy nem restauração neste repositório. Ver também `docs/PAPEIS_E_ADMIN.md` e `docs/INTEGRACOES_ASSISTENTE.md`.

## Observações

- SQLite em desenvolvimento (`backend/db.sqlite3`).
- CORS liberado para `http://localhost:5173` (e HTTPS do Vite com `@vitejs/plugin-basic-ssl` quando ativo).
- Sessão em cookies HttpOnly; gestão de conteúdo exige `role=admin` ou professor conforme permissões da app (não confiar só em `is_staff`).
- Sala ao vivo: chat **local no browser**; transmissão só com `streamUrl` configurada. Análise por câmera é demonstrativa; imagens não são armazenadas.
- Conteúdo educativo — não substitui avaliação profissional.
