from rest_framework import status, viewsets
from rest_framework.response import Response

from .models import Exercise, Workout
from .permissions import IsAuthenticatedReadOnlyOrStaffWrite
from .serializers import ExerciseSerializer, WorkoutSerializer, WorkoutWriteSerializer


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticatedReadOnlyOrStaffWrite]
    lookup_field = "public_id"
    search_fields = ["name", "focus"]
    filterset_fields = ["place", "focus"]


class WorkoutViewSet(viewsets.ModelViewSet):
    queryset = Workout.objects.prefetch_related(
        "workout_exercises__exercise", "exercises"
    ).all()
    permission_classes = [IsAuthenticatedReadOnlyOrStaffWrite]
    lookup_field = "public_id"
    search_fields = ["name", "description"]
    filterset_fields = ["place", "level"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return WorkoutWriteSerializer
        return WorkoutSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        out = WorkoutSerializer(
            serializer.instance, context=self.get_serializer_context()
        )
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)
