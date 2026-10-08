from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MovementSample, MovementSession

DISCLAIMER = (
    "Análise demonstrativa. Não substitui avaliação profissional. "
    "Imagens não são armazenadas neste endpoint."
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
                {"detail": "Aceite o consentimento para usar a análise demonstrativa."},
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

        score = 78
        reps = elapsed // 4
        cues = [
            "Mantenha o tronco estável.",
            "Controle a fase excêntrica.",
            "Respire de forma contínua.",
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
