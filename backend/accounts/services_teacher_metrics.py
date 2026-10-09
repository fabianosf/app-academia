"""Métricas do professor — só dados reais, no período da atribuição ativa + consentimento."""

from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Sum
from django.utils import timezone

from training.models import UserGoal, WorkoutSession

from .models import TeacherDataConsent
from .services_org import active_consents, active_students_for_teacher, has_consent


def _period_bounds(period: str):
    now = timezone.now()
    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)
    start = now - timedelta(days=days)
    return start, now, days


def completed_sessions_qs(student, *, since, until):
    return WorkoutSession.objects.filter(
        user=student,
        finished_at__isnull=False,
        finished_at__gte=since,
        finished_at__lte=until,
    )


def teacher_dashboard(teacher, *, period: str = "30d") -> dict:
    start, end, days = _period_bounds(period)
    assignments = list(active_students_for_teacher(teacher))
    student_count = len(assignments)

    completed_total = 0
    minutes_total = 0
    # Frequência: média de sessões concluídas por aluno / semanas no período
    weeks = max(days / 7.0, 1.0)
    freq_sum = 0.0
    freq_n = 0
    incomplete = []

    for a in assignments:
        student = a.student
        consents = active_consents(student, teacher)
        since = max(start, a.started_at)
        if "completed_sessions" not in consents and "minutes" not in consents and "frequency" not in consents:
            incomplete.append(
                {
                    "studentId": student.pk,
                    "reason": "Sem consentimento para métricas de treino.",
                }
            )
            continue
        qs = completed_sessions_qs(student, since=since, until=end)
        if "completed_sessions" in consents or "frequency" in consents:
            n = qs.count()
            if "completed_sessions" in consents:
                completed_total += n
            if "frequency" in consents:
                freq_sum += n / weeks
                freq_n += 1
        if "minutes" in consents:
            minutes_total += qs.aggregate(s=Sum("minutes"))["s"] or 0

    return {
        "period": period,
        "periodDays": days,
        "assignedStudents": student_count,
        "completedWorkouts": completed_total,
        "weeklyFrequencyAvg": round(freq_sum / freq_n, 2) if freq_n else None,
        "minutesTrained": minutes_total,
        "incomplete": incomplete,
        "notes": [
            "Treino concluído = sessão com finished_at definido.",
            "Dados só desde o início da atribuição ativa e categorias com consentimento.",
            "Sem consentimento, o indicador correspondente fica omitido ou incompleto.",
        ],
    }


def student_detail_for_teacher(teacher, student) -> dict | None:
    from .services_org import teacher_can_access_student

    assignment = teacher_can_access_student(teacher, student)
    if not assignment:
        return None
    consents = active_consents(student, teacher)
    since = assignment.started_at
    until = timezone.now()
    profile = getattr(student, "profile", None)

    # Perfil mínimo (sem limitations / saúde)
    summary = {
        "id": student.pk,
        "name": student.name or student.username,
        "email": student.email,
        "goal": profile.goal if profile else None,
        "level": profile.level if profile else None,
        "place": profile.place if profile else None,
        "assignmentStartedAt": assignment.started_at.isoformat(),
        "consents": sorted(consents),
        "sharedCategories": [
            {"id": c.value, "label": c.label, "active": c.value in consents}
            for c in TeacherDataConsent.Category
        ],
    }

    data: dict = {"student": summary, "metrics": {}, "charts": {}, "gaps": []}

    qs = completed_sessions_qs(student, since=since, until=until)

    if has_consent(student, teacher, "completed_sessions"):
        sessions = list(
            qs.order_by("-finished_at")[:50].values(
                "public_id",
                "date",
                "minutes",
                "finished_at",
                "workout__name",
                "workout__public_id",
            )
        )
        data["metrics"]["completedSessions"] = len(sessions)
        data["charts"]["sessions"] = [
            {
                "id": s["public_id"],
                "date": s["date"].isoformat() if s["date"] else None,
                "minutes": s["minutes"],
                "workoutName": s["workout__name"],
                "workoutId": s["workout__public_id"],
                "finishedAt": s["finished_at"].isoformat() if s["finished_at"] else None,
            }
            for s in sessions
        ]
    else:
        data["gaps"].append("Sessões concluídas não partilhadas (sem consentimento).")

    if has_consent(student, teacher, "minutes"):
        data["metrics"]["minutesTrained"] = qs.aggregate(s=Sum("minutes"))["s"] or 0
    else:
        data["gaps"].append("Minutos treinados não partilhados (sem consentimento).")

    if has_consent(student, teacher, "frequency"):
        # Por semana ISO desde started_at
        by_week: dict[str, int] = {}
        for row in qs.values("finished_at"):
            ft = row["finished_at"]
            if not ft:
                continue
            key = f"{ft.isocalendar().year}-W{ft.isocalendar().week:02d}"
            by_week[key] = by_week.get(key, 0) + 1
        data["charts"]["frequencyByWeek"] = [
            {"week": k, "completed": v} for k, v in sorted(by_week.items())
        ]
        data["metrics"]["weeklyFrequency"] = (
            round(sum(by_week.values()) / max(len(by_week), 1), 2) if by_week else 0
        )
    else:
        data["gaps"].append("Frequência semanal não partilhada (sem consentimento).")

    if has_consent(student, teacher, "goals"):
        goals = list(
            UserGoal.objects.filter(user=student).values(
                "public_id", "label", "current", "target", "unit"
            )
        )
        data["charts"]["goals"] = [
            {
                "id": g["public_id"],
                "label": g["label"],
                "current": g["current"],
                "target": g["target"],
                "unit": g["unit"],
            }
            for g in goals
        ]
        if not goals:
            data["gaps"].append("Sem metas registadas para este aluno.")
    else:
        data["gaps"].append("Metas não partilhadas (sem consentimento).")

    return data
