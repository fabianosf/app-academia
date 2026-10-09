from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TeacherDataConsent, TeacherStudentAssignment, User
from .permissions import IsPlatformAdmin, IsTeacherOrAdmin
from .services_org import (
    CONSENT_CATEGORIES,
    active_assignment_for_student,
    active_consents,
    active_students_for_teacher,
    assign_student_to_teacher,
    end_assignment,
    grant_consent,
    revoke_consent,
    set_user_role,
)
from .services_teacher_metrics import student_detail_for_teacher, teacher_dashboard

UserModel = get_user_model()


def _user_brief(u: User) -> dict:
    return {
        "id": u.pk,
        "username": u.username,
        "name": u.name or u.username,
        "email": u.email,
        "role": u.role,
    }


class TeacherDashboardView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request):
        period = (request.query_params.get("period") or "30d").strip()
        teacher = request.user
        if teacher.role == User.Role.ADMIN and request.query_params.get("teacherId"):
            teacher = UserModel.objects.filter(
                pk=request.query_params.get("teacherId"), role=User.Role.TEACHER
            ).first() or request.user
        if teacher.role == User.Role.ADMIN and teacher == request.user:
            # Admin sem teacherId: dashboard vazio honesto
            return Response(
                {
                    "period": period,
                    "assignedStudents": 0,
                    "completedWorkouts": 0,
                    "weeklyFrequencyAvg": None,
                    "minutesTrained": 0,
                    "incomplete": [],
                    "notes": [
                        "Administradores veem métricas de um professor via ?teacherId=."
                    ],
                }
            )
        return Response(teacher_dashboard(teacher, period=period))


class TeacherStudentListView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip().lower()
        teacher = request.user
        if teacher.role == User.Role.ADMIN:
            return Response(
                {"detail": "Usa a API de administração para listar todos os alunos."},
                status=400,
            )
        rows = []
        for a in active_students_for_teacher(teacher):
            s = a.student
            if q and q not in (s.name or "").lower() and q not in (s.email or "").lower():
                continue
            consents = sorted(active_consents(s, teacher))
            rows.append(
                {
                    "id": s.pk,
                    "name": s.name or s.username,
                    "email": s.email,
                    "assignmentStartedAt": a.started_at.isoformat(),
                    "consents": consents,
                }
            )
        return Response({"results": rows})


class TeacherStudentDetailView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request, student_id):
        if request.user.role == User.Role.ADMIN:
            return Response(
                {"detail": "Endpoint reservado a professores com atribuição ativa."},
                status=403,
            )
        student = UserModel.objects.filter(pk=student_id, role=User.Role.STUDENT).first()
        if not student:
            return Response({"detail": "Aluno não encontrado."}, status=404)
        data = student_detail_for_teacher(request.user, student)
        if not data:
            return Response({"detail": "Aluno não atribuído a ti."}, status=403)
        return Response(data)


class StudentTeacherSharingView(APIView):
    """Aluno: professor atual, categorias partilhadas, conceder/revogar."""

    def get(self, request):
        if request.user.role != User.Role.STUDENT:
            return Response({"teacher": None, "categories": [], "message": "Só aplicável a alunos."})
        assignment = active_assignment_for_student(request.user)
        if not assignment:
            return Response(
                {
                    "teacher": None,
                    "categories": [
                        {"id": c.value, "label": c.label, "active": False}
                        for c in TeacherDataConsent.Category
                    ],
                    "message": "Ainda não tens professor atribuído.",
                }
            )
        teacher = assignment.teacher
        active = active_consents(request.user, teacher)
        return Response(
            {
                "teacher": _user_brief(teacher),
                "assignmentStartedAt": assignment.started_at.isoformat(),
                "categories": [
                    {
                        "id": c.value,
                        "label": c.label,
                        "active": c.value in active,
                        "description": {
                            "frequency": "Frequência de treinos concluídos por semana.",
                            "completed_sessions": "Lista e contagem de sessões concluídas.",
                            "minutes": "Soma de minutos das sessões concluídas.",
                            "goals": "Metas de treino e progresso registado.",
                        }.get(c.value, ""),
                    }
                    for c in TeacherDataConsent.Category
                ],
                "correctionRequestHint": (
                    "Para pedir correção ou remoção de dados partilhados, contacta o "
                    "administrador da plataforma ou o teu professor. A revogação impede "
                    "novas consultas; o histórico de auditoria é preservado."
                ),
            }
        )

    def post(self, request):
        if request.user.role != User.Role.STUDENT:
            return Response({"detail": "Só alunos."}, status=403)
        assignment = active_assignment_for_student(request.user)
        if not assignment:
            return Response({"detail": "Sem professor atribuído."}, status=400)
        category = (request.data.get("category") or "").strip()
        action = (request.data.get("action") or "").strip().lower()
        try:
            if action == "grant":
                grant_consent(
                    student=request.user, teacher=assignment.teacher, category=category
                )
            elif action == "revoke":
                revoke_consent(
                    student=request.user, teacher=assignment.teacher, category=category
                )
            else:
                return Response({"detail": "action deve ser grant ou revoke."}, status=400)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        return self.get(request)


class AdminUserListView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        role = (request.query_params.get("role") or "").strip()
        q = (request.query_params.get("q") or "").strip()
        qs = UserModel.objects.all().order_by("name", "username")
        if role in User.Role.values:
            qs = qs.filter(role=role)
        if q:
            qs = qs.filter(
                Q(name__icontains=q) | Q(email__icontains=q) | Q(username__icontains=q)
            )
        return Response({"results": [_user_brief(u) for u in qs[:200]]})


class AdminUserRoleView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, user_id):
        user = UserModel.objects.filter(pk=user_id).first()
        if not user:
            return Response({"detail": "Não encontrado."}, status=404)
        role = (request.data.get("role") or "").strip()
        try:
            set_user_role(admin=request.user, user=user, role=role)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(_user_brief(user))


class AdminAssignmentListCreateView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        active_only = request.query_params.get("active", "1") != "0"
        qs = TeacherStudentAssignment.objects.select_related("teacher", "student")
        if active_only:
            qs = qs.filter(ended_at__isnull=True)
        results = [
            {
                "id": a.pk,
                "teacher": _user_brief(a.teacher),
                "student": _user_brief(a.student),
                "startedAt": a.started_at.isoformat(),
                "endedAt": a.ended_at.isoformat() if a.ended_at else None,
                "active": a.is_active,
            }
            for a in qs.order_by("-started_at")[:300]
        ]
        return Response({"results": results})

    def post(self, request):
        teacher_id = request.data.get("teacherId")
        student_id = request.data.get("studentId")
        teacher = UserModel.objects.filter(pk=teacher_id).first()
        student = UserModel.objects.filter(pk=student_id).first()
        if not teacher or not student:
            return Response({"detail": "teacherId e studentId são obrigatórios."}, status=400)
        try:
            row = assign_student_to_teacher(
                admin=request.user,
                teacher=teacher,
                student=student,
                note=(request.data.get("note") or "")[:255],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(
            {
                "id": row.pk,
                "teacher": _user_brief(row.teacher),
                "student": _user_brief(row.student),
                "startedAt": row.started_at.isoformat(),
                "active": True,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminAssignmentEndView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, assignment_id):
        row = TeacherStudentAssignment.objects.filter(pk=assignment_id).first()
        if not row:
            return Response({"detail": "Não encontrado."}, status=404)
        end_assignment(admin=request.user, assignment=row)
        return Response({"ok": True, "endedAt": row.ended_at.isoformat()})
