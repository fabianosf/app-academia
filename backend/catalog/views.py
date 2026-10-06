from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Exercise, Workout
from .serializers import ExerciseSerializer, WorkoutSerializer, WorkoutWriteSerializer


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "public_id"
    search_fields = ["name", "focus"]
    filterset_fields = ["place", "focus"]


class WorkoutViewSet(viewsets.ModelViewSet):
    queryset = Workout.objects.prefetch_related(
        "workout_exercises__exercise", "exercises"
    ).all()
    permission_classes = [IsAuthenticated]
    lookup_field = "public_id"
    search_fields = ["name", "description"]
    filterset_fields = ["place", "level"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return WorkoutWriteSerializer
        return WorkoutSerializer
