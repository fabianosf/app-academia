import uuid

from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import (
    AssistFeedback,
    DemoGenerationJob,
    ExerciseAssistRequest,
    ExerciseDemo,
)
from .serializers_assist import (
    AssistFeedbackSerializer,
    DemoGenerationJobSerializer,
    ExerciseAssistRequestSerializer,
    ExerciseDemoSerializer,
)
from .services.orchestrate import (
    MAX_TEXT_LEN,
    clarify_assist_request,
    create_assist_request,
    enqueue_demo_for_request,
    review_demo,
)


class AssistantThrottle(ScopedRateThrottle):
    scope = "assistant"


class ExerciseAssistCreateView(APIView):
    throttle_classes = [AssistantThrottle]

    def post(self, request):
        text = (request.data.get("message") or request.data.get("text") or "").strip()
        if not text:
            return Response({"detail": "message é obrigatório."}, status=400)
        if len(text) > MAX_TEXT_LEN:
            return Response(
                {"detail": f"message excede {MAX_TEXT_LEN} caracteres."},
                status=400,
            )
        persona = (request.data.get("persona") or "neutral").strip()
        request_video = bool(request.data.get("requestVideo", True))
        try:
            req, _job = create_assist_request(
                request.user,
                text,
                persona=persona,
                request_video=request_video,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(
            ExerciseAssistRequestSerializer(req).data,
            status=status.HTTP_201_CREATED,
        )


class ExerciseAssistDetailView(APIView):
    def get(self, request, public_id):
        req = ExerciseAssistRequest.objects.filter(
            public_id=public_id, user=request.user
        ).prefetch_related("sources", "generation_jobs__demo").first()
        if not req:
            return Response({"detail": "Não encontrado."}, status=404)
        return Response(ExerciseAssistRequestSerializer(req).data)


class ExerciseAssistClarifyView(APIView):
    throttle_classes = [AssistantThrottle]

    def post(self, request, public_id):
        req = ExerciseAssistRequest.objects.filter(
            public_id=public_id, user=request.user
        ).first()
        if not req:
            return Response({"detail": "Não encontrado."}, status=404)
        answer = (request.data.get("answer") or request.data.get("message") or "").strip()
        persona = (request.data.get("persona") or "neutral").strip()
        request_video = bool(request.data.get("requestVideo", True))
        try:
            req, _job = clarify_assist_request(
                req, answer, persona=persona, request_video=request_video
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(ExerciseAssistRequestSerializer(req).data)


class ApprovedDemoListView(APIView):
    def get(self, request):
        status_filter = (request.query_params.get("status") or "approved").strip().lower()
        # Utilizadores normais só veem aprovadas; staff pode pedir review/draft/rejected.
        if status_filter != "approved" and not request.user.is_staff:
            return Response(
                {"detail": "Apenas staff pode listar demos não aprovadas."},
                status=403,
            )
        allowed = {c.value for c in ExerciseDemo.Status}
        if status_filter not in allowed:
            return Response({"detail": "status inválido."}, status=400)
        qs = ExerciseDemo.objects.filter(status=status_filter)
        exercise = request.query_params.get("exercise")
        if exercise:
            qs = qs.filter(exercise_name__icontains=exercise)
        return Response(ExerciseDemoSerializer(qs[:50], many=True).data)


class DemoGenerateView(APIView):
    throttle_classes = [AssistantThrottle]

    def post(self, request):
        assist_id = (request.data.get("assistRequestId") or "").strip()
        req = ExerciseAssistRequest.objects.filter(
            public_id=assist_id, user=request.user
        ).first()
        if not req:
            return Response({"detail": "Pedido não encontrado."}, status=404)
        persona = (request.data.get("persona") or "neutral").strip()
        job = enqueue_demo_for_request(req, persona=persona)
        req.save()
        if job is None and req.matched_demo_id:
            return Response(
                {
                    "matchedDemo": ExerciseDemoSerializer(req.matched_demo).data,
                    "job": None,
                }
            )
        if job is None:
            return Response(
                {"detail": "Não há exercício identificado para gerar demo."},
                status=400,
            )
        return Response(
            DemoGenerationJobSerializer(job).data,
            status=status.HTTP_201_CREATED,
        )


class DemoJobDetailView(APIView):
    def get(self, request, public_id):
        job = (
            DemoGenerationJob.objects.filter(public_id=public_id, request__user=request.user)
            .select_related("demo")
            .first()
        )
        if not job:
            return Response({"detail": "Não encontrado."}, status=404)
        return Response(DemoGenerationJobSerializer(job).data)


class AssistFeedbackCreateView(APIView):
    throttle_classes = [AssistantThrottle]

    def post(self, request):
        assist_id = (request.data.get("assistRequestId") or "").strip()
        req = ExerciseAssistRequest.objects.filter(
            public_id=assist_id, user=request.user
        ).first()
        if not req:
            return Response({"detail": "Pedido não encontrado."}, status=404)
        demo = None
        demo_id = (request.data.get("demoId") or "").strip()
        if demo_id:
            demo = ExerciseDemo.objects.filter(public_id=demo_id).first()
        comment = (request.data.get("comment") or "")[:1000]
        fb = AssistFeedback.objects.create(
            public_id=f"f{uuid.uuid4().hex[:12]}",
            user=request.user,
            request=req,
            demo=demo,
            useful=request.data.get("useful"),
            equipment_ok=request.data.get("equipmentOk"),
            prefer_shorter=request.data.get("preferShorter"),
            comment=comment,
        )
        return Response(
            AssistFeedbackSerializer(fb).data, status=status.HTTP_201_CREATED
        )


class DemoReviewView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, public_id):
        demo = ExerciseDemo.objects.filter(public_id=public_id).first()
        if not demo:
            return Response({"detail": "Não encontrado."}, status=404)
        action = (request.data.get("action") or "").strip().lower()
        if action not in ("approve", "reject"):
            return Response(
                {"detail": "action deve ser approve ou reject."}, status=400
            )
        demo = review_demo(demo, approve=(action == "approve"), reviewer=request.user)
        return Response(ExerciseDemoSerializer(demo).data)
