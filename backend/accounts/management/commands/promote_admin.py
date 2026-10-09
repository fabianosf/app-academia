"""
Promove manualmente uma conta a administrador da plataforma.

Uso (no diretório backend, com venv ativo):

  python manage.py promote_admin NOME_DE_UTILIZADOR

Não há promoção automática na migração de papéis. Contas com is_staff antigo
permanecem como student até revisão manual.
"""

from django.core.management.base import BaseCommand, CommandError

from accounts.models import User
from accounts.services_org import set_user_role


class Command(BaseCommand):
    help = "Promove um utilizador existente a role=admin (processo seguro, manual)."

    def add_arguments(self, parser):
        parser.add_argument("username", type=str, help="Username da conta a promover")

    def handle(self, *args, **options):
        username = options["username"].strip()
        user = User.objects.filter(username=username).first()
        if not user:
            raise CommandError(f"Utilizador '{username}' não encontrado.")
        set_user_role(admin=user, user=user, role=User.Role.ADMIN)
        self.stdout.write(
            self.style.SUCCESS(
                f"OK: {username} agora é admin (role=admin, is_staff=True)."
            )
        )
