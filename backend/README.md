# Backend — Forma com Fabiano

Django 6 + Django REST Framework + SimpleJWT.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 8000
```

Demo: `fabiano` / `forma123`

Apps: `accounts`, `catalog`, `training`, `live`, `assistant`, `movement`, `notifications`, `branding`.
