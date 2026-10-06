from collections import defaultdict
from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Workout

from .models import (
    LoadLog,
    UserAchievement,
    UserGoal,
    WorkoutFavorite,
    WorkoutSession,
)
from .serializers import (
    AchievementSerializer,
    HistorySerializer,
    LoadLogSerializer,
    UserGoalSerializer,
    WorkoutSessionCreateSerializer,
    WorkoutSessionSerializer,
)


class FavoriteListView(APIView):
    def get(self, request):
        ids = list(
            WorkoutFavorite.objects.filter(user=request.user).values_list(
                "workout__public_id", flat=True
            )
        )
        return Response({"favorites": ids})

    def post(self, request):
        workout_id = request.data.get("workoutId")
        workout = Workout.objects.filter(public_id=workout_id).first()
        if not workout:
            return Response(
                {"detail": "Treino não encontrado."}, status=status.HTTP_404_NOT_FOUND
            )
        fav, created = WorkoutFavorite.objects.get_or_create(
            user=request.user, workout=workout
        )
        if not created:
            fav.delete()
            return Response({"favorited": False, "workoutId": workout_id})
        return Response({"favorited": True, "workoutId": workout_id})


class SessionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user).select_related(
            "workout"
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return WorkoutSessionCreateSerializer
        return WorkoutSessionSerializer

    def create(self, request, *args, **kwargs):
        serializer = WorkoutSessionCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        return Response(
            WorkoutSessionSerializer(session).data, status=status.HTTP_201_CREATED
        )


class HistoryListView(generics.ListAPIView):
    serializer_class = HistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(
            user=self.request.user, finished_at__isnull=False
        ).select_related("workout")


class GoalListView(generics.ListAPIView):
    serializer_class = UserGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserGoal.objects.filter(user=self.request.user)


class AchievementListView(generics.ListAPIView):
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAchievement.objects.filter(user=self.request.user).select_related(
            "achievement"
        )


class LoadLogListCreateView(generics.ListCreateAPIView):
    serializer_class = LoadLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LoadLog.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        exercise_name = request.data.get("exercise") or request.data.get(
            "exercise_name", ""
        )
        last_load = request.data.get("last") or request.data.get("last_load", "")
        obj = LoadLog.objects.create(
            user=request.user,
            exercise_name=exercise_name,
            last_load=last_load,
            note=request.data.get("note", ""),
        )
        return Response(
            LoadLogSerializer(obj).data, status=status.HTTP_201_CREATED
        )


class ProgressSummaryView(APIView):
    def get(self, request):
        sessions = WorkoutSession.objects.filter(
            user=request.user, finished_at__isnull=False
        )
        # weekly frequency last 7 days (labels Seg-Dom)
        days_pt = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
        today = timezone.localdate()
        # Monday-based week
        start = today - timedelta(days=today.weekday())
        weekly = []
        for i, label in enumerate(days_pt):
            d = start + timedelta(days=i)
            day_sessions = [s for s in sessions if s.date == d]
            weekly.append(
                {
                    "day": label,
                    "treinos": len(day_sessions),
                    "minutos": sum(s.minutes for s in day_sessions),
                }
            )

        muscle_map = defaultdict(int)
        counts = defaultdict(int)
        for s in sessions.select_related("workout"):
            for m in s.workout.muscles or []:
                muscle_map[m] += 1
                counts[m] += 1
        muscle_progress = [
            {"group": k, "value": min(100, v * 12)}
            for k, v in sorted(muscle_map.items(), key=lambda x: -x[1])[:5]
        ]
        if not muscle_progress:
            muscle_progress = [
                {"group": "Pernas", "value": 0},
                {"group": "Core", "value": 0},
            ]

        return Response(
            {
                "streakDays": request.user.streak_days,
                "weeklyFrequency": weekly,
                "muscleProgress": muscle_progress,
                "totalSessions": sessions.count(),
            }
        )
