"""Atribuições, consentimento e auditoria — regras de produto fechadas."""

from __future__ import annotations

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .models import AdminAuditLog, TeacherDataConsent, TeacherStudentAssignment, User


CONSENT_CATEGORIES = [c.value for c in TeacherDataConsent.Category]


def audit(actor, action: str, *, target_type: str = "", target_id: str = "", detail=None):
    AdminAuditLog.objects.create(
        actor=actor if getattr(actor, "pk", None) else None,
        action=action[:64],
        target_type=(target_type or "")[:64],
        target_id=str(target_id or "")[:64],
        detail=detail or {},
    )


def active_assignment_for_student(student) -> TeacherStudentAssignment | None:
    return (
        TeacherStudentAssignment.objects.filter(student=student, ended_at__isnull=True)
        .select_related("teacher")
        .order_by("-started_at")
        .first()
    )


def active_students_for_teacher(teacher):
    return TeacherStudentAssignment.objects.filter(
        teacher=teacher, ended_at__isnull=True
    ).select_related("student", "student__profile")


def teacher_can_access_student(teacher, student) -> TeacherStudentAssignment | None:
    """Apenas atribuição ativa. Admin usa endpoints admin, não este helper."""
    return (
        TeacherStudentAssignment.objects.filter(
            teacher=teacher, student=student, ended_at__isnull=True
        )
        .order_by("-started_at")
        .first()
    )


def active_consents(student, teacher) -> set[str]:
    return set(
        TeacherDataConsent.objects.filter(
            student=student, teacher=teacher, revoked_at__isnull=True
        ).values_list("category", flat=True)
    )


def has_consent(student, teacher, category: str) -> bool:
    return TeacherDataConsent.objects.filter(
        student=student,
        teacher=teacher,
        category=category,
        revoked_at__isnull=True,
    ).exists()


@transaction.atomic
def assign_student_to_teacher(*, admin, teacher, student, note: str = ""):
    if teacher.role != User.Role.TEACHER and not teacher.is_superuser:
        raise ValueError("O utilizador indicado não é professor.")
    if student.role != User.Role.STUDENT:
        raise ValueError("O utilizador indicado não é aluno.")
    now = timezone.now()
    # Encerrar atribuição ativa anterior do aluno (outro professor).
    previous = TeacherStudentAssignment.objects.filter(
        student=student, ended_at__isnull=True
    )
    for row in previous:
        row.ended_at = now
        row.ended_by = admin
        row.save(update_fields=["ended_at", "ended_by"])
        audit(
            admin,
            "assignment.end",
            target_type="TeacherStudentAssignment",
            target_id=str(row.pk),
            detail={"student_id": student.pk, "teacher_id": row.teacher_id},
        )
    row = TeacherStudentAssignment.objects.create(
        teacher=teacher,
        student=student,
        started_at=now,
        created_by=admin,
        note=(note or "")[:255],
    )
    audit(
        admin,
        "assignment.create",
        target_type="TeacherStudentAssignment",
        target_id=str(row.pk),
        detail={"student_id": student.pk, "teacher_id": teacher.pk},
    )
    return row


@transaction.atomic
def end_assignment(*, admin, assignment: TeacherStudentAssignment):
    if assignment.ended_at:
        return assignment
    assignment.ended_at = timezone.now()
    assignment.ended_by = admin
    assignment.save(update_fields=["ended_at", "ended_by"])
    audit(
        admin,
        "assignment.end",
        target_type="TeacherStudentAssignment",
        target_id=str(assignment.pk),
        detail={
            "student_id": assignment.student_id,
            "teacher_id": assignment.teacher_id,
        },
    )
    return assignment


@transaction.atomic
def grant_consent(*, student, teacher, category: str):
    if category not in CONSENT_CATEGORIES:
        raise ValueError("Categoria de consentimento inválida.")
    assignment = teacher_can_access_student(teacher, student)
    if not assignment:
        raise ValueError("Só podes partilhar dados com o teu professor atual.")
    # Revogar ativo anterior da mesma categoria (manter histórico).
    TeacherDataConsent.objects.filter(
        student=student, teacher=teacher, category=category, revoked_at__isnull=True
    ).update(revoked_at=timezone.now())
    row = TeacherDataConsent.objects.create(
        student=student,
        teacher=teacher,
        category=category,
        granted_at=timezone.now(),
    )
    audit(
        student,
        "consent.grant",
        target_type="TeacherDataConsent",
        target_id=str(row.pk),
        detail={"category": category, "teacher_id": teacher.pk},
    )
    return row


@transaction.atomic
def revoke_consent(*, student, teacher, category: str):
    rows = TeacherDataConsent.objects.filter(
        student=student, teacher=teacher, category=category, revoked_at__isnull=True
    )
    now = timezone.now()
    for row in rows:
        row.revoked_at = now
        row.save(update_fields=["revoked_at"])
        audit(
            student,
            "consent.revoke",
            target_type="TeacherDataConsent",
            target_id=str(row.pk),
            detail={"category": category, "teacher_id": teacher.pk},
        )
    return rows.count()


@transaction.atomic
def set_user_role(*, admin, user: User, role: str):
    if role not in User.Role.values:
        raise ValueError("Papel inválido.")
    old = user.role
    user.role = role
    user.save()
    audit(
        admin,
        "user.role_change",
        target_type="User",
        target_id=str(user.pk),
        detail={"from": old, "to": role},
    )
    return user


def content_visible_to_student_q(student, *, content_type: str, id_field: str = "public_id"):
    """
    published AND (sem atribuições no conteúdo OU aluno atribuído).
    Se nenhum conteúdo desse tipo tem atribuições → todo o catálogo published.
    """
    from catalog.models import ContentAssignment, PublishStatus

    assigned_ids = list(
        ContentAssignment.objects.filter(
            content_type=content_type, student=student
        ).values_list("content_id", flat=True)
    )
    restricted_ids = list(
        ContentAssignment.objects.filter(content_type=content_type)
        .values_list("content_id", flat=True)
        .distinct()
    )
    published = Q(publish_status=PublishStatus.PUBLISHED)
    if not restricted_ids:
        return published
    return published & (
        Q(**{f"{id_field}__in": assigned_ids})
        | ~Q(**{f"{id_field}__in": restricted_ids})
    )
