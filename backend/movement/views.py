from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MovementSample, MovementSession

DISCLAIMER = (
    "Análise orientativa com pose estimada no dispositivo. "
    "Não substitui avaliação profissional. Imagens não são armazenadas neste endpoint."
)


class MovementAnalyzeView(APIView):
    def post(self, request):
        if "consentAccepted" not in request.data:
            return Response(
                {"detail": "Consentimento explícito é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        consent = bool(request.data.get("consentAccepted"))
        if not consent:
            return Response(
                {"detail": "Aceite o consentimento para usar a análise."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exercise = request.data.get("exercise") or "Exercício"
        try:
            elapsed = int(request.data.get("elapsedSeconds") or 0)
        except (TypeError, ValueError):
            return Response(
                {"detail": "elapsedSeconds inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        elapsed = max(0, min(elapsed, 86_400))

        session_id = request.data.get("sessionId")
        session = None
        if session_id:
            session = MovementSession.objects.filter(
                id=session_id, user=request.user
            ).first()
        if not session:
            session = MovementSession.objects.create(
                user=request.user,
                exercise_label=exercise,
                consent_accepted=True,
            )

        # Métricas calculadas no cliente (MediaPipe). Sem inventar se não vierem.
        source = (request.data.get("source") or "").strip().lower()
        client_score = request.data.get("score")
        client_reps = request.data.get("reps")
        client_cues = request.data.get("cues")

        if source in ("client_pose", "mediapipe") and client_score is not None:
            try:
                score = max(0, min(100, int(client_score)))
            except (TypeError, ValueError):
                return Response({"detail": "score inválido."}, status=400)
            try:
                reps = max(0, min(10_000, int(client_reps or 0)))
            except (TypeError, ValueError):
                return Response({"detail": "reps inválido."}, status=400)
            if isinstance(client_cues, list):
                cues = [str(c)[:200] for c in client_cues[:8]]
            else:
                cues = ["Pose detetada no dispositivo."]
            if not cues:
                cues = ["Pose detetada no dispositivo."]
        else:
            # Sem CV no cliente: não fingimos análise biomecânica.
            score = 0
            reps = 0
            cues = [
                "Visão computacional local não enviou métricas.",
                "Ativa a câmera com consentimento para análise por pose no dispositivo.",
                "Conteúdo educativo — não substitui profissional.",
            ]

        sample = MovementSample.objects.create(
            session=session,
            elapsed_seconds=elapsed,
            score=score,
            reps=reps,
            cues=cues,
            disclaimer=DISCLAIMER,
        )
        return Response(
            {
                "sessionId": session.id,
                "score": sample.score,
                "reps": sample.reps,
                "cues": sample.cues,
                "disclaimer": sample.disclaimer,
                "source": source or "none",
            }
        )


class MovementEndView(APIView):
    def post(self, request, session_id):
        session = MovementSession.objects.filter(
            id=session_id, user=request.user
        ).first()
        if not session:
            return Response({"detail": "Sessão não encontrada."}, status=404)
        session.ended_at = timezone.now()
        session.save(update_fields=["ended_at"])
        return Response({"ok": True, "sessionId": session.id})
