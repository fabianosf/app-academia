# Backend — Aster Coach

Django 6 + Django REST Framework + SimpleJWT (cookies HttpOnly).

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # ajuste OPENAI_* / DJANGO_* conforme necessário
# opcional em DEBUG local: export DEMO_USERNAME=aluno DEMO_PASSWORD='aster123'
python manage.py migrate
python manage.py seed_demo          # só com DEBUG=true
# python manage.py promote_admin aluno   # opcional: role=admin + is_staff
python manage.py runserver 8000
```

`seed_demo` **não** cria admin nem promove `is_staff` automaticamente. Papéis: ver `docs/PAPEIS_E_ADMIN.md`.

Demo local: usa `DEMO_USERNAME`/`DEMO_PASSWORD` para aluno, `DEMO_TEACHER_USERNAME`/`DEMO_TEACHER_PASSWORD` para professor e `DEMO_ADMIN_USERNAME`/`DEMO_ADMIN_PASSWORD` para admin (padrões locais: `aluno` / `aster123`, `professor` / `aster123`, `admin` / `aster123` apenas em DEBUG).

Apps: `accounts`, `catalog`, `training`, `live`, `assistant`, `movement`, `notifications`, `branding`.

```bash
python manage.py test
python manage.py check
```
