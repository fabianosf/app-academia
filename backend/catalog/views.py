from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsPlatformAdmin, IsTeacherOrAdmin
from accounts.services_org import audit, content_visible_to_student_q

from .models import ContentAssignment, Exercise, PublishStatus, Workout
from .permissions import IsAuthenticatedReadOrTeacherDraftOrAdminWrite
from .serializers import ExerciseSerializer, WorkoutSerializer, WorkoutWriteSerializer


def _role(user):
    return getattr(user, "role", "student")


class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticatedReadOrTeacherDraftOrAdminWrite]
    lookup_field = "public_id"
    search_fields = ["name", "focus"]
    filterset_fields = ["place", "focus"]

    def get_queryset(self):
        user = self.request.user
        qs = Exercise.objects.all()
        role = _role(user)
        if role == "admin" or user.is_superuser:
            return qs
        if role == "teacher":
            return qs.filter(
                Q(publish_status=PublishStatus.PUBLISHED)
                | Q(created_by=user, publish_status=PublishStatus.DRAFT)
            )
        return qs.filter(publish_status=PublishStatus.PUBLISHED)

    def perform_create(self, serializer):
        user = self.request.user
        status_val = PublishStatus.DRAFT
        if _role(user) == "admin" or user.is_superuser:
            status_val = self.request.data.get("publishStatus") or PublishStatus.DRAFT
            if status_val not in PublishStatus.values:
                status_val = PublishStatus.DRAFT
        serializer.save(created_by=user, publish_status=status_val)


class WorkoutViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedReadOrTeacherDraftOrAdminWrite]
    lookup_field = "public_id"
    search_fields = ["name", "description"]
    filterset_fields = ["place", "level"]

    def get_queryset(self):
        user = self.request.user
        qs = Workout.objects.prefetch_related(
            "workout_exercises__exercise", "exercises"
        )
        role = _role(user)
        if role == "admin" or user.is_superuser:
            return qs.all()
        if role == "teacher":
            return qs.filter(
                Q(publish_status=PublishStatus.PUBLISHED)
                | Q(created_by=user, publish_status=PublishStatus.DRAFT)
            )
        # student: published + assignment rule
        return qs.filter(content_visible_to_student_q(user, content_type="workout"))

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return WorkoutWriteSerializer
        return WorkoutSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        publish = PublishStatus.DRAFT
        if _role(user) == "admin" or user.is_superuser:
            raw = request.data.get("publishStatus") or PublishStatus.DRAFT
            if raw in PublishStatus.values:
                publish = raw
        serializer.save(created_by=user, publish_status=publish)
        out = WorkoutSerializer(
            serializer.instance, context=self.get_serializer_context()
        )
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        user = request.user
        role = _role(user)
        # Professores só editam os próprios rascunhos
        if role == "teacher":
            if instance.created_by_id != user.id or instance.publish_status != PublishStatus.DRAFT:
                return Response(
                    {"detail": "Só podes editar os teus rascunhos."}, status=403
                )
            if "publishStatus" in request.data and request.data.get("publishStatus") != PublishStatus.DRAFT:
                return Response(
                    {"detail": "Apenas administradores podem publicar ou arquivar."},
                    status=403,
                )
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            WorkoutSerializer(instance, context=self.get_serializer_context()).data
        )


class ContentPublishView(APIView):
    """Só admin: publish | unpublish(draft) | archive."""

    permission_classes = [IsPlatformAdmin]

    def post(self, request):
        content_type = (request.data.get("contentType") or "").strip()
        content_id = (request.data.get("contentId") or "").strip()
        action = (request.data.get("action") or "").strip().lower()
        mapping = {
            "publish": PublishStatus.PUBLISHED,
            "unpublish": PublishStatus.DRAFT,
            "archive": PublishStatus.ARCHIVED,
        }
        if action not in mapping:
            return Response({"detail": "action inválida."}, status=400)
        obj = None
        if content_type == "workout":
            obj = Workout.objects.filter(public_id=content_id).first()
        elif content_type == "exercise":
            obj = Exercise.objects.filter(public_id=content_id).first()
        else:
            from live.models import LiveClass

            if content_type == "live_class":
                obj = LiveClass.objects.filter(public_id=content_id).first()
            elif content_type == "link":
                from .models import ExternalLink

                obj = ExternalLink.objects.filter(public_id=content_id).first()
        if not obj:
            return Response({"detail": "Conteúdo não encontrado."}, status=404)
        obj.publish_status = mapping[action]
        obj.save(update_fields=["publish_status"])
        audit(
            request.user,
            f"content.{action}",
            target_type=content_type,
            target_id=content_id,
        )
        return Response({"ok": True, "publishStatus": obj.publish_status})


class ContentAssignView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request):
        content_type = (request.data.get("contentType") or "").strip()
        content_id = (request.data.get("contentId") or "").strip()
        student_id = request.data.get("studentId")
        if content_type not in ContentAssignment.ContentType.values:
            return Response({"detail": "contentType inválido."}, status=400)
        from django.contrib.auth import get_user_model

        student = get_user_model().objects.filter(pk=student_id, role="student").first()
        if not student:
            return Response({"detail": "Aluno inválido."}, status=400)
        # Professor só atribui aos seus alunos
        if getattr(request.user, "role", None) == "teacher":
            from accounts.services_org import teacher_can_access_student

            if not teacher_can_access_student(request.user, student):
                return Response({"detail": "Aluno não atribuído a ti."}, status=403)
        row, _ = ContentAssignment.objects.get_or_create(
            content_type=content_type,
            content_id=content_id,
            student=student,
            defaults={"assigned_by": request.user},
        )
        audit(
            request.user,
            "content.assign",
            target_type=content_type,
            target_id=content_id,
            detail={"student_id": student.pk},
        )
        return Response({"ok": True, "id": row.pk}, status=201)
