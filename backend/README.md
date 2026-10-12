# Backend — Forma com Fabiano

Django 6 + Django REST Framework + SimpleJWT (cookies HttpOnly).

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # ajuste OPENAI_* / DJANGO_* conforme necessário
python manage.py migrate
python manage.py seed_demo          # só com DEBUG=true; conta aluno fabiano/forma123
# python manage.py promote_admin fabiano   # opcional: role=admin + is_staff
python manage.py runserver 8000
```

`seed_demo` **não** cria admin nem promove `is_staff` automaticamente. Papéis: ver `docs/PAPEIS_E_ADMIN.md`.

Demo aluno: `fabiano` / `forma123` (apenas DEBUG).

Apps: `accounts`, `catalog`, `training`, `live`, `assistant`, `movement`, `notifications`, `branding`.

```bash
python manage.py test
python manage.py check
```
