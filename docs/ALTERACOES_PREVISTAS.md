# Alterações previstas (plano — ainda não implementadas)

Documento de **pré-visualização**. Nada disto foi aplicado excepto o que já está em `main` (`eaff7ca`).  
Cada bloco só deve ser executado após aprovação explícita da tarefa.

Legenda de estado:

| Estado | Significado |
|--------|-------------|
| Pendente | Não implementado |
| Já no código | Existe em `main` (pré-auditoria / papéis) |
| Bloqueado | Espera decisão de ambiente ou aprovação |

---

## 1. Correções de código (auditoria)

### H5 — Docs seed / papéis (A-14) · esforço pequeno · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `README.md` | Corrigir L25 (“conta staff”) → aluno + `promote_admin`; alinhar menções “staff” em demos/admin |
| `backend/README.md` | Mesmo alinhamento, se ainda falar em staff automático |

Não mexe em runtime.

---

### P4 — Consentimento no detalhe do professor (A-07) · esforço pequeno · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `backend/accounts/services_teacher_metrics.py` | Deixar de expor `goal` / `level` / `place` sem consentimento (ou só com categoria acordada) |
| `backend/accounts/tests_roles.py` | Testes de ausência/presença dos campos |
| `frontend/src/pages/teacher/TeacherStudentDetailPage.tsx` | Ajustar UI se o contrato da API mudar |

---

### P3 — Visibilidade de conteúdo para aluno (A-05, A-06) · esforço médio · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `backend/catalog/views.py` | `ExerciseViewSet.get_queryset`: usar `content_visible_to_student_q` como nos workouts |
| `backend/training/serializers.py` | `WorkoutSessionCreateSerializer`: queryset só treinos published + visíveis |
| `backend/training/views.py` | Favoritos: não permitir draft / não visível |
| `backend/catalog/tests.py` e/ou `backend/training/tests.py` / `accounts/tests_roles.py` | Novos testes de authz |

---

### H1 — Unificar permissão admin (A-08) · esforço pequeno · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `backend/assistant/views_assist.py` | `DemoReviewView`: `IsAdminUser` → `IsPlatformAdmin` |
| `backend/branding/views.py` | Escrita: `IsAdminUser` → `IsPlatformAdmin` |
| Testes assist/branding | Esperar `role=admin`, não só `is_staff` |

---

### H2 — Allowlist de URLs/embeds (A-09) · esforço médio · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `backend/config/settings.py` | Lista `ALLOWED_EMBED_HOSTS` (ou similar) via env |
| `backend/.env.example` | Documentar variável (sem segredos) |
| `backend/catalog/models.py` e/ou serializers/views | Validar `ExternalLink.url` (e streams, se aplicável) |
| Testes catalog | URL fora da lista → 400 |

---

### H3 — Constraint atribuição ativa (A-12) · esforço médio · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `backend/accounts/models.py` | `UniqueConstraint` / índice parcial (1 ativa por aluno) |
| `backend/accounts/migrations/0003_*.py` | **Nova migração** (só com aprovação) |
| `backend/accounts/services_org.py` | Ajuste se a constraint exigir limpeza prévia |
| `backend/accounts/tests_roles.py` | Double-assign / integridade |

---

### H4 — ContentAssign valida existência (A-17) · esforço pequeno · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `backend/catalog/views.py` | `ContentAssignView`: 404 se conteúdo inexistente |
| Teste catalog | ID inválido → 404 |

---

### H6 — Rotular live / vídeo local (A-10, A-11) · esforço pequeno · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `frontend/src/pages/LiveRoomPage.tsx` | Copy mais clara (chat local / stream opcional) |
| `frontend/src/pages/NinaPage.tsx` (se necessário) | Badge “demo local” / placeholder |
| `backend/.env.example` / docs | Prod: não usar `VIDEO_DEMO_PROVIDER=local` sem aceite |

---

### H7 — Health + logging (A-18) · esforço pequeno–médio · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `backend/accounts/views.py` | Health com check de DB |
| `backend/config/settings.py` | `LOGGING` mínimo; opcional Sentry via env |
| Teste accounts | Health 200 / 503 |

---

### P1 — Baseline produção (A-01, A-02, A-03) · esforço médio · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `backend/config/settings.py` | Fail-fast: com `DEBUG=false` exigir SMTP + DB produção (quando existir suporte) |
| `backend/.env.example` | Variáveis obrigatórias documentadas |
| `docs/PRODUCAO.md` | **Novo** (após aprovação) — checklist env |
| Possível: suporte `DATABASE_URL` / Postgres | **Novo código** — só com aprovação explícita |

---

### P2 — Backup / restore (A-19) · esforço pequeno · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `docs/PRODUCAO.md` (secção) | Procedimento dump/restore/rollback |

---

### H8 — Testes FE portal (A-15) · esforço médio · **Pendente**

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `frontend/package.json` | Script de test (Vitest/Playwright) — **só com aprovação** (pode tocar deps) |
| Novos ficheiros de teste em `frontend/` | Login aluno vs `/admin/login` |

> Nota: atualizar dependências está **fora** do escopo até autorizares.

---

### H9 — Triagem vulnerabilidades (A-20) · **Pendente** (execução autorizada)

Sem alteração de ficheiros até haver relatório; depois eventual bump pontual de pacotes **com aprovação**.

---

## 2. Já no código (não são alterações futuras)

Incluído em `eaff7ca` e anteriores — **não** faz parte do backlog de remediação:

- Papéis `student` / `teacher` / `admin`, atribuições, consentimento (métricas), publish admin  
- Portais `/login` e `/admin/login` + `portal` no token  
- Áreas FE `/professor/*`, `/admin/*`  
- `promote_admin`, `docs/PAPEIS_E_ADMIN.md`  
- Assistente, vídeo adapters, live com `streamUrl` opcional  

---

## 3. Infraestrutura e deploy (só após preencher ambiente + aprovação)

**Ainda não criar** até aprovares e definires VPS/SO/Docker/domínio/DB.

| Artefacto possível | Conteúdo previsto |
|--------------------|-------------------|
| `Dockerfile` / `docker-compose.yml` | API + (opcional) Postgres + Nginx |
| `deploy/nginx.conf` (ou similar) | SPA `dist/` + proxy `/api` + TLS |
| `docs/PRODUCAO.md` | Env, migrate, backup, rollback, smoke |
| `backend/requirements.txt` | Acrescentar `gunicorn` / driver Postgres **só com aprovação** |
| Systemd unit (fora do repo ou em `deploy/`) | Serviço gunicorn |

Variáveis a documentar (valores secretos **nunca** no git): ver plano de implantação no chat  
(`DJANGO_*`, `FRONTEND_URL`, `CORS_*`, `CSRF_*`, `JWT_COOKIE_SECURE`, `EMAIL_*`, `OPENAI_*`, `VIDEO_DEMO_*`, DB).

---

## 4. Ordem sugerida de aprovação

```text
1) H5          → docs
2) P4          → consentimento
3) P3          → visibilidade conteúdo
4) H1, H4      → permissões / assign
5) H3          → migração constraint (cuidado dados)
6) H6, H7, H5 já feito
7) P1 + P2     → produção / backup (docs + settings)
8) Infra       → Docker/Nginx só com ambiente definido
9) H8, H9, D*  → depois
```

---

## 5. O que este ficheiro **não** autoriza

- Implementar as alterações listadas  
- Correr migrate / deploy / push  
- Ler ou gravar `.env` com segredos  
- Atualizar dependências sem pedido explícito  

Para avançar: aprovar por ID (ex. *“Aprovo H5”*) e, se quiseres testes, listar os comandos autorizados.
