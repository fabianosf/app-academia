# Papéis, acessos, atribuições e primeiro administrador

## Papéis

| role | Descrição |
|------|-----------|
| `student` | Aluno (padrão em novos registos e na migração inicial) |
| `teacher` | Professor — área `/professor`, só alunos atribuídos |
| `admin` | Administrador global — `/admin` + APIs de gestão |

A migração **não** promove automaticamente contas com `is_staff=True`. Todas ficam `student` até revisão manual.

`is_staff` fica alinhado com `role=admin` (ou superuser). Um professor **não** é staff/admin global só por usar a área de gestão.

## Dois acessos no frontend

| URL | Público | Destino após login |
|-----|---------|--------------------|
| `/login` | Alunos (`portal=student`) | `/` |
| `/admin/login` | Professores e administradores (`portal=management`) | `/professor` ou `/admin` |

O campo `portal` no `POST /api/auth/token/` **nunca atribui permissões**. O backend confirma o `role` real da conta e rejeita (403) se não corresponder à porta, **sem** definir cookies de sessão.

Recuperação de senha: `/esqueci-senha` (comum às contas existentes).

## Promover o primeiro administrador

No ambiente do servidor (backend + venv):

```bash
cd backend
source .venv/bin/activate   # ou o teu venv
python manage.py promote_admin NOME_DE_UTILIZADOR
```

Isto define `role=admin` e `is_staff=True`. Não existem credenciais predefinidas no código.

Depois, no `/admin` da app (ou `POST /api/admin/users/<id>/role/`), atribui `teacher` / `student` às restantes contas staff antigas, após revisão manual.

Conta demo local (`seed_demo`, só com `DEBUG`): `fabiano` / `forma123` permanece **aluno**. Para testar gestão: `promote_admin fabiano` ou criar outro utilizador e promover.

## Regras de partilha (produto)

- Novo professor só vê dados **desde** o início da atribuição ativa.
- Consentimento explícito e revogável por categoria: `frequency`, `completed_sessions`, `minutes`, `goals`.
- Revogar impede consultas futuras; registos de auditoria (`AdminAuditLog` e histórico de atribuições/consentimentos) mantêm-se.
- Professores criam/editam **rascunhos**; só admin publica / despublica / arquiva.
- Conteúdo publicado sem atribuições continua visível a todos os alunos (catálogo legado). Com ≥1 atribuição, só os alunos atribuídos o veem.
- Dados de saúde/limitações, notas privadas e conversas com a Nina **não** são expostos ao professor nesta fase.

## Retenção e auditoria

- Atribuições: encerrar (`ended_at`), não apagar linhas.
- Consentimentos: revogar (`revoked_at`), não apagar o histórico de grants.
- `AdminAuditLog`: retenção mínima recomendada de **24 meses**; não apagar sem política explícita escrita.
- Exportação em massa de dados: fora de âmbito nesta fase.

## Indicadores do professor

- Contam apenas sessões com `finished_at` (treino concluído), nunca só iniciadas.
- Períodos: `7d`, `30d`, `90d` a partir de agora, intersectados com o início da atribuição ativa e categorias consentidas.
