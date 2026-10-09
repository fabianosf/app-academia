"""Seed database with Forma com Fabiano demo data (from frontend mock)."""

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from accounts.models import UserProfile
from assistant.models import ChatThread
from branding.models import SiteSettings
from catalog.models import Exercise, Workout, WorkoutExercise
from live.models import ClassReservation, Instructor, LiveClass
from notifications.models import Notification
from training.models import (
    Achievement,
    LoadLog,
    UserAchievement,
    UserGoal,
    WorkoutFavorite,
    WorkoutSession,
)

User = get_user_model()
TZ = ZoneInfo("America/Sao_Paulo")

EXERCISES = [
    {"public_id": "e1", "name": "Agachamento com peso corporal", "sets": 3, "reps": "12", "rest_seconds": 45, "tip": "Desça até as coxas ficarem quase paralelas ao chão e empurre o chão com o pé inteiro.", "focus": "Pernas", "place": "Ambos"},
    {"public_id": "e2", "name": "Prancha frontal", "sets": 3, "reps": "30 s", "rest_seconds": 30, "tip": "Mantenha costelas baixas e pescoço longo. Não prenda a respiração.", "focus": "Core", "place": "Ambos"},
    {"public_id": "e3", "name": "Flexão inclinada", "sets": 3, "reps": "10", "rest_seconds": 40, "tip": "Corpo em linha. Se precisar, use um apoio mais alto.", "focus": "Peito", "place": "Casa"},
    {"public_id": "e4", "name": "Ponte de glúteo", "sets": 3, "reps": "15", "rest_seconds": 40, "tip": "Pause no topo sem arquear a lombar.", "focus": "Glúteos", "place": "Casa"},
    {"public_id": "e5", "name": "Mobilidade de quadril", "sets": 2, "reps": "40 s", "rest_seconds": 20, "tip": "Movimento lento. Pare se houver pinçamento.", "focus": "Mobilidade", "place": "Ambos"},
    {"public_id": "e6", "name": "Polichinelo suave", "sets": 3, "reps": "30 s", "rest_seconds": 30, "tip": "Aterrize com joelhos macios. Reduza a amplitude se o impacto incomodar.", "focus": "Cardio", "place": "Casa"},
    {"public_id": "e7", "name": "Afundo alternado", "sets": 3, "reps": "10 cada", "rest_seconds": 45, "tip": "Passo confortável. Joelho da frente acompanha a direção do pé.", "focus": "Pernas", "place": "Ambos"},
    {"public_id": "e8", "name": "Remada com halter", "sets": 3, "reps": "12", "rest_seconds": 50, "suggested_load": "8–12 kg", "tip": "Puxe o cotovelo para trás, sem girar o tronco.", "focus": "Costas", "place": "Ambos"},
    {"public_id": "e9", "name": "Desenvolvimento sentado", "sets": 3, "reps": "10", "rest_seconds": 60, "suggested_load": "6–10 kg", "tip": "Suba sem travar o cotovelo no topo.", "focus": "Ombros", "place": "Academia"},
    {"public_id": "e10", "name": "Leg press", "sets": 4, "reps": "10", "rest_seconds": 75, "suggested_load": "carga moderada", "tip": "Não trave os joelhos. Controle a descida.", "focus": "Pernas", "place": "Academia"},
    {"public_id": "e11", "name": "Supino com halteres", "sets": 4, "reps": "8–10", "rest_seconds": 75, "suggested_load": "12–16 kg", "tip": "Escápulas apoiadas no banco. Desça até o conforto do ombro.", "focus": "Peito", "place": "Academia"},
    {"public_id": "e12", "name": "Tríceps pulley", "sets": 3, "reps": "12", "rest_seconds": 45, "suggested_load": "leve a moderada", "tip": "Cotovelos próximos do corpo.", "focus": "Braços", "place": "Academia"},
    {"public_id": "e13", "name": "Puxada frontal", "sets": 4, "reps": "10", "rest_seconds": 70, "suggested_load": "moderada", "tip": "Puxe até a altura do peito, sem jogar o tronco para trás.", "focus": "Costas", "place": "Academia"},
    {"public_id": "e14", "name": "Rosca direta", "sets": 3, "reps": "12", "rest_seconds": 45, "suggested_load": "6–10 kg", "tip": "Evite balançar o tronco para subir a carga.", "focus": "Braços", "place": "Academia"},
    {"public_id": "e15", "name": "Stiff com halteres", "sets": 3, "reps": "10", "rest_seconds": 60, "suggested_load": "8–14 kg", "tip": "Joelhos levemente flexionados. Sinta o posterior, não a lombar.", "focus": "Posterior", "place": "Ambos"},
    {"public_id": "e16", "name": "Abdução de quadril", "sets": 3, "reps": "15", "rest_seconds": 40, "tip": "Movimento controlado. Não arqueie a lombar.", "focus": "Glúteos", "place": "Academia"},
    {"public_id": "e17", "name": "Dead bug", "sets": 3, "reps": "8 cada", "rest_seconds": 30, "tip": "Lombar apoiada no colchonete durante todo o movimento.", "focus": "Core", "place": "Casa"},
    {"public_id": "e18", "name": "Alongamento de peitoral", "sets": 2, "reps": "40 s", "rest_seconds": 15, "tip": "Respire devagar. Sem dor aguda.", "focus": "Mobilidade", "place": "Ambos"},
    {"public_id": "e19", "name": "Gato-camelo", "sets": 2, "reps": "8", "rest_seconds": 20, "tip": "Mobilize a coluna sem forçar o pescoço.", "focus": "Mobilidade", "place": "Casa"},
    {"public_id": "e20", "name": "Caminhada no lugar", "sets": 1, "reps": "3 min", "rest_seconds": 0, "tip": "Ritmo conversável. Braços soltos.", "focus": "Cardio", "place": "Casa"},
    {"public_id": "e21", "name": "Elevação lateral", "sets": 3, "reps": "12", "rest_seconds": 40, "suggested_load": "3–6 kg", "tip": "Cotovelos levemente flexionados. Suba até a linha do ombro.", "focus": "Ombros", "place": "Ambos"},
    {"public_id": "e22", "name": "Agachamento goblet", "sets": 3, "reps": "12", "rest_seconds": 50, "suggested_load": "8–14 kg", "tip": "Halter próximo do peito. Joelhos acompanham os pés.", "focus": "Pernas", "place": "Ambos"},
]

WORKOUTS = [
    {"public_id": "w1", "name": "Funcional em casa", "description": "Circuito equilibrado para força geral, core e mobilidade, sem depender de máquinas.", "place": "Casa", "level": "Intermediário", "duration_min": 25, "calories": 210, "focus": ["Corpo inteiro", "Core"], "equipment": ["Colchonete"], "muscles": ["Pernas", "Core", "Glúteos", "Peito"], "safety": ["Mantenha o ritmo controlado.", "Interrompa se sentir dor articular."], "exercise_ids": ["e1", "e3", "e4", "e2", "e5"], "tone": "from-orange-200 to-amber-100"},
    {"public_id": "w2", "name": "HIIT sem equipamentos", "description": "Intervalos curtos para elevar o condicionamento com impacto moderado.", "place": "Casa", "level": "Intermediário", "duration_min": 20, "calories": 240, "focus": ["Cardio", "Corpo inteiro"], "equipment": ["Nenhum"], "muscles": ["Pernas", "Core"], "safety": ["Adapte a amplitude.", "Hidrate-se entre os blocos."], "exercise_ids": ["e6", "e1", "e3", "e7"], "tone": "from-rose-200 to-orange-100"},
    {"public_id": "w3", "name": "Pernas na academia", "description": "Sessão de membros inferiores com máquinas e halteres, foco em controle.", "place": "Academia", "level": "Intermediário", "duration_min": 45, "calories": 380, "focus": ["Pernas"], "equipment": ["Máquinas de academia", "Halteres"], "muscles": ["Quadríceps", "Glúteos", "Posterior"], "safety": ["Não trave as articulações.", "Peça auxílio para ajustar a máquina."], "exercise_ids": ["e10", "e7", "e15", "e22"], "tone": "from-stone-200 to-orange-100"},
    {"public_id": "w4", "name": "Peito e tríceps", "description": "Empurrar com amplitude confortável e finalização de tríceps.", "place": "Academia", "level": "Intermediário", "duration_min": 50, "calories": 340, "focus": ["Peito", "Braços"], "equipment": ["Banco", "Halteres", "Máquinas de academia"], "muscles": ["Peito", "Tríceps", "Ombros"], "safety": ["Evite amplitude que gere pinçamento no ombro."], "exercise_ids": ["e11", "e3", "e12", "e21"], "tone": "from-amber-200 to-orange-50"},
    {"public_id": "w5", "name": "Costas e bíceps", "description": "Puxadas e remadas para postura e força de membros superiores.", "place": "Academia", "level": "Intermediário", "duration_min": 50, "calories": 330, "focus": ["Costas", "Braços"], "equipment": ["Máquinas de academia", "Halteres"], "muscles": ["Costas", "Bíceps"], "safety": ["Inicie com carga que permita técnica estável."], "exercise_ids": ["e13", "e8", "e14"], "tone": "from-teal-100 to-stone-100"},
    {"public_id": "w6", "name": "Glúteos e posterior", "description": "Trabalho de cadeia posterior com atenção à lombar.", "place": "Academia", "level": "Intermediário", "duration_min": 45, "calories": 320, "focus": ["Glúteos", "Pernas"], "equipment": ["Halteres", "Máquinas de academia", "Colchonete"], "muscles": ["Glúteos", "Posterior"], "safety": ["Se a lombar cansar antes do glúteo, reduza a carga."], "exercise_ids": ["e4", "e15", "e16", "e7"], "tone": "from-orange-100 to-rose-100"},
    {"public_id": "w7", "name": "Core e mobilidade", "description": "Estabilidade de tronco e amplitude suave para o dia a dia.", "place": "Casa", "level": "Iniciante", "duration_min": 20, "calories": 120, "focus": ["Core", "Mobilidade"], "equipment": ["Colchonete"], "muscles": ["Core", "Quadril"], "safety": ["Movimentos lentos. Sem prender a respiração."], "exercise_ids": ["e2", "e17", "e5", "e19"], "tone": "from-lime-100 to-emerald-50"},
    {"public_id": "w8", "name": "Alongamento pós-treino", "description": "Desaceleração de 15 minutos para soltar ombros, quadril e coluna.", "place": "Casa", "level": "Iniciante", "duration_min": 15, "calories": 60, "focus": ["Mobilidade"], "equipment": ["Colchonete"], "muscles": ["Corpo inteiro"], "safety": ["Alongue até sentir tensão confortável, nunca dor."], "exercise_ids": ["e18", "e5", "e19"], "tone": "from-sky-100 to-stone-100"},
    {"public_id": "w9", "name": "Treino rápido de braços", "description": "Sessão curta de ombros e braços, útil entre compromissos.", "place": "Academia", "level": "Iniciante", "duration_min": 20, "calories": 150, "focus": ["Braços"], "equipment": ["Halteres"], "muscles": ["Bíceps", "Tríceps", "Ombros"], "safety": ["Priorize controle sobre carga."], "exercise_ids": ["e14", "e12", "e21"], "tone": "from-orange-100 to-amber-50"},
    {"public_id": "w10", "name": "Corpo inteiro com halteres", "description": "Força geral usando apenas halteres e um espaço pequeno.", "place": "Casa", "level": "Intermediário", "duration_min": 35, "calories": 280, "focus": ["Corpo inteiro"], "equipment": ["Halteres", "Colchonete"], "muscles": ["Pernas", "Costas", "Peito", "Core"], "safety": ["Apoie os halteres com segurança ao trocar de exercício."], "exercise_ids": ["e22", "e8", "e11", "e15", "e2"], "tone": "from-stone-200 to-orange-100"},
    {"public_id": "w11", "name": "Cardio leve para iniciantes", "description": "Entrada suave no movimento, com intensidade conversável.", "place": "Casa", "level": "Iniciante", "duration_min": 25, "calories": 160, "focus": ["Cardio"], "equipment": ["Nenhum"], "muscles": ["Pernas", "Cardio"], "safety": ["Pare se sentir tontura ou falta de ar desproporcional."], "exercise_ids": ["e20", "e6", "e5"], "tone": "from-emerald-100 to-lime-50"},
    {"public_id": "w12", "name": "Mobilidade para quem fica sentado", "description": "Quadril, coluna e ombros para quem passa o dia na cadeira.", "place": "Casa", "level": "Iniciante", "duration_min": 15, "calories": 50, "focus": ["Mobilidade"], "equipment": ["Nenhum"], "muscles": ["Quadril", "Coluna", "Ombros"], "safety": ["Faça em ritmo respiratório. Não force o final da amplitude."], "exercise_ids": ["e19", "e5", "e18"], "tone": "from-amber-100 to-stone-100"},
]

HISTORY = [
    {"public_id": "h1", "workout_id": "w1", "date": "2026-10-05", "minutes": 26, "calories": 210, "place": "Casa"},
    {"public_id": "h2", "workout_id": "w7", "date": "2026-10-04", "minutes": 20, "calories": 120, "place": "Casa"},
    {"public_id": "h3", "workout_id": "w3", "date": "2026-10-02", "minutes": 47, "calories": 390, "place": "Academia"},
    {"public_id": "h4", "workout_id": "w12", "date": "2026-10-01", "minutes": 15, "calories": 50, "place": "Casa"},
    {"public_id": "h5", "workout_id": "w10", "date": "2026-09-29", "minutes": 36, "calories": 280, "place": "Casa"},
    {"public_id": "h6", "workout_id": "w11", "date": "2026-09-27", "minutes": 25, "calories": 160, "place": "Casa"},
]


class Command(BaseCommand):
    help = "Popula o banco com dados demo do Forma com Fabiano"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Apaga dados demo relacionados antes de semear",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError(
                "seed_demo só é permitido com DJANGO_DEBUG=true (ambiente local)."
            )
        if options["flush"]:
            self.stdout.write("Limpando dados demos...")
            WorkoutSession.objects.all().delete()
            WorkoutFavorite.objects.all().delete()
            ClassReservation.objects.all().delete()
            Notification.objects.all().delete()
            LoadLog.objects.all().delete()
            UserGoal.objects.all().delete()
            UserAchievement.objects.all().delete()
            Achievement.objects.all().delete()
            WorkoutExercise.objects.all().delete()
            Workout.objects.all().delete()
            Exercise.objects.all().delete()
            LiveClass.objects.all().delete()
            Instructor.objects.all().delete()

        # Conta demo: aluno por omissão (sem promoção automática a admin).
        # Para gestão: python manage.py promote_admin fabiano
        user, created = User.objects.get_or_create(
            username="fabiano",
            defaults={
                "email": "fabiano@postay.com.br",
                "name": "Fabiano",
                "avatar_initials": "FF",
                "streak_days": 4,
                "plan": User.Plan.COMPLETO,
                "subscription_status": User.SubscriptionStatus.ATIVO,
                "onboarded": True,
                "role": User.Role.STUDENT,
                "is_staff": False,
                "is_superuser": False,
            },
        )
        if created or not user.has_usable_password():
            user.set_password("forma123")
            user.is_superuser = False
            user.save()
        else:
            user.email = "fabiano@postay.com.br"
            user.name = "Fabiano"
            user.avatar_initials = "FF"
            user.streak_days = 4
            user.plan = User.Plan.COMPLETO
            user.onboarded = True
            user.is_superuser = False
            user.save()
        self.stdout.write(
            self.style.WARNING(
                "Demo aluno: fabiano / forma123 (apenas DEBUG). "
                "Admin: promote_admin fabiano — não use em produção."
            )
        )

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.goal = UserProfile.Goal.CONDICIONAMENTO
        profile.level = UserProfile.Level.INTERMEDIARIO
        profile.place = UserProfile.Place.AMBOS
        profile.weekly_frequency = 4
        profile.session_minutes = 30
        profile.equipment = ["Colchonete", "Halteres"]
        profile.limitations = ""
        profile.notify_reminders = True
        profile.notify_live = True
        profile.notify_nina = True
        profile.camera_consent = False
        profile.save()

        SiteSettings.objects.update_or_create(
            pk=1,
            defaults={
                "brand_name": "Forma com Fabiano",
                "nina_avatar_note": "Avatar da Nina",
            },
        )

        for data in EXERCISES:
            Exercise.objects.update_or_create(
                public_id=data["public_id"],
                defaults={k: v for k, v in data.items() if k != "public_id"},
            )

        exercise_map = {e.public_id: e for e in Exercise.objects.all()}

        for data in WORKOUTS:
            exercise_ids = data["exercise_ids"]
            workout, _ = Workout.objects.update_or_create(
                public_id=data["public_id"],
                defaults={
                    k: v
                    for k, v in data.items()
                    if k not in ("public_id", "exercise_ids")
                },
            )
            workout.workout_exercises.all().delete()
            for order, eid in enumerate(exercise_ids):
                WorkoutExercise.objects.create(
                    workout=workout,
                    exercise=exercise_map[eid],
                    order=order,
                )

        for i in [
            {"public_id": "i1", "name": "Marina Costa", "specialty": "Funcional e mobilidade"},
            {"public_id": "i2", "name": "Rafael Lima", "specialty": "Força na academia"},
            {"public_id": "i3", "name": "Lívia Nunes", "specialty": "Condicionamento"},
        ]:
            Instructor.objects.update_or_create(
                public_id=i["public_id"], defaults={"name": i["name"], "specialty": i["specialty"]}
            )

        instructors = {i.public_id: i for i in Instructor.objects.all()}
        classes = [
            {"public_id": "c1", "title": "Mobilidade de manhã", "category": "Mobilidade", "date_label": "Hoje", "time_label": "07:30", "duration_min": 30, "instructor": "i1", "level": "Iniciante", "spots": 40, "participants": 28, "status": "live", "tone": "from-orange-200 to-amber-100"},
            {"public_id": "c2", "title": "Força em casa sem pressa", "category": "Casa", "date_label": "Hoje", "time_label": "19:00", "duration_min": 40, "instructor": "i1", "level": "Intermediário", "spots": 50, "participants": 31, "status": "upcoming", "tone": "from-rose-100 to-orange-50"},
            {"public_id": "c3", "title": "Pernas com técnica", "category": "Academia", "date_label": "Amanhã", "time_label": "18:30", "duration_min": 45, "instructor": "i2", "level": "Intermediário", "spots": 35, "participants": 22, "status": "upcoming", "tone": "from-stone-200 to-orange-100"},
            {"public_id": "c4", "title": "Cardio conversável", "category": "Cardio", "date_label": "Quarta", "time_label": "12:15", "duration_min": 25, "instructor": "i3", "level": "Iniciante", "spots": 60, "participants": 18, "status": "upcoming", "tone": "from-lime-100 to-emerald-50"},
            {"public_id": "c5", "title": "Core estável", "category": "Core", "date_label": "Ontem", "time_label": "20:00", "duration_min": 20, "instructor": "i1", "level": "Iniciante", "spots": 40, "participants": 36, "status": "recorded", "tone": "from-teal-100 to-stone-100"},
            {"public_id": "c6", "title": "Glúteos com controle", "category": "Glúteos", "date_label": "Sábado", "time_label": "09:00", "duration_min": 40, "instructor": "i2", "level": "Intermediário", "spots": 40, "participants": 40, "status": "recorded", "tone": "from-orange-100 to-rose-50"},
        ]
        for c in classes:
            LiveClass.objects.update_or_create(
                public_id=c["public_id"],
                defaults={
                    "title": c["title"],
                    "category": c["category"],
                    "date_label": c["date_label"],
                    "time_label": c["time_label"],
                    "duration_min": c["duration_min"],
                    "instructor": instructors[c["instructor"]],
                    "level": c["level"],
                    "spots": c["spots"],
                    "participants": c["participants"],
                    "status": c["status"],
                    "tone": c["tone"],
                },
            )

        workouts = {w.public_id: w for w in Workout.objects.all()}
        for h in HISTORY:
            d = datetime.strptime(h["date"], "%Y-%m-%d").date()
            started = timezone.make_aware(datetime.combine(d, time(18, 0)), TZ)
            finished = started + timedelta(minutes=h["minutes"])
            WorkoutSession.objects.update_or_create(
                public_id=h["public_id"],
                defaults={
                    "user": user,
                    "workout": workouts[h["workout_id"]],
                    "started_at": started,
                    "finished_at": finished,
                    "completed_exercises": 5,
                    "difficulty": "Ideal",
                    "minutes": h["minutes"],
                    "calories": h["calories"],
                    "place": h["place"],
                    "date": d,
                },
            )

        for wid in ("w1", "w7"):
            WorkoutFavorite.objects.get_or_create(user=user, workout=workouts[wid])

        ClassReservation.objects.get_or_create(
            user=user,
            live_class=LiveClass.objects.get(public_id="c2"),
            defaults={"reminder": True},
        )

        goals = [
            {"public_id": "g1", "label": "Treinar 4x na semana", "current": 3, "target": 4, "unit": "treinos"},
            {"public_id": "g2", "label": "Completar 12 treinos no mês", "current": 6, "target": 12, "unit": "treinos"},
            {"public_id": "g3", "label": "Mobilidade 3x por semana", "current": 1, "target": 3, "unit": "sessões"},
        ]
        for g in goals:
            UserGoal.objects.update_or_create(
                public_id=g["public_id"],
                defaults={
                    "user": user,
                    "label": g["label"],
                    "current": g["current"],
                    "target": g["target"],
                    "unit": g["unit"],
                },
            )

        achievements = [
            {"public_id": "a1", "title": "Primeiro treino", "description": "Você começou. Isso já conta.", "unlocked": True},
            {"public_id": "a2", "title": "7 dias em movimento", "description": "Uma semana com presença constante.", "unlocked": False},
            {"public_id": "a3", "title": "10 treinos concluídos", "description": "Consistência acima de intensidade.", "unlocked": False},
            {"public_id": "a4", "title": "Consistência mensal", "description": "12 treinos no mesmo mês.", "unlocked": False},
        ]
        for a in achievements:
            ach, _ = Achievement.objects.update_or_create(
                public_id=a["public_id"],
                defaults={"title": a["title"], "description": a["description"]},
            )
            ua, _ = UserAchievement.objects.get_or_create(user=user, achievement=ach)
            if a["unlocked"] and not ua.unlocked_at:
                ua.unlocked_at = timezone.now()
                ua.save(update_fields=["unlocked_at"])

        notifications = [
            {"public_id": "n1", "title": "Treino de hoje", "body": "Funcional em casa está pronto para começar.", "time_label": "há 1 h", "read": False},
            {"public_id": "n2", "title": "Aula às 19h", "body": "Força em casa sem pressa ainda tem vagas.", "time_label": "há 3 h", "read": False},
            {"public_id": "n3", "title": "Nina", "body": "Ontem foi pernas. Hoje, mobilidade pode equilibrar a semana.", "time_label": "ontem", "read": True},
        ]
        for n in notifications:
            Notification.objects.update_or_create(
                public_id=n["public_id"],
                defaults={
                    "user": user,
                    "title": n["title"],
                    "body": n["body"],
                    "time_label": n["time_label"],
                    "read": n["read"],
                },
            )

        loads = [
            {"exercise_name": "Leg press", "last_load": "80 kg", "note": "10 reps confortáveis", "exercise_id": "e10"},
            {"exercise_name": "Supino com halteres", "last_load": "14 kg", "note": "controle na descida", "exercise_id": "e11"},
            {"exercise_name": "Remada com halter", "last_load": "12 kg", "note": "sem balanço", "exercise_id": "e8"},
        ]
        if not LoadLog.objects.filter(user=user).exists():
            for row in loads:
                LoadLog.objects.create(
                    user=user,
                    exercise=exercise_map.get(row["exercise_id"]),
                    exercise_name=row["exercise_name"],
                    last_load=row["last_load"],
                    note=row["note"],
                )

        ChatThread.objects.get_or_create(user=user)

        self.stdout.write(self.style.SUCCESS("Seed concluído."))
        self.stdout.write("Usuário: fabiano / senha: forma123")
        self.stdout.write("POST /api/auth/token/  {\"username\":\"fabiano\",\"password\":\"forma123\"}")
