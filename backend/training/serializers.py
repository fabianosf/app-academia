from rest_framework import serializers

from catalog.models import Exercise, Workout

from .models import (
    Achievement,
    LoadLog,
    UserAchievement,
    UserGoal,
    WorkoutFavorite,
    WorkoutSession,
)


class WorkoutFavoriteSerializer(serializers.ModelSerializer):
    workoutId = serializers.CharField(source="workout.public_id", read_only=True)

    class Meta:
        model = WorkoutFavorite
        fields = ["id", "workoutId", "created_at"]


class WorkoutSessionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    workoutId = serializers.CharField(source="workout.public_id", read_only=True)
    startedAt = serializers.DateTimeField(source="started_at")
    finishedAt = serializers.DateTimeField(
        source="finished_at", required=False, allow_null=True
    )
    completedExercises = serializers.IntegerField(source="completed_exercises")

    class Meta:
        model = WorkoutSession
        fields = [
            "id",
            "workoutId",
            "startedAt",
            "finishedAt",
            "completedExercises",
            "difficulty",
            "note",
            "minutes",
            "calories",
            "place",
            "date",
        ]


class WorkoutSessionCreateSerializer(serializers.Serializer):
    workoutId = serializers.CharField()
    startedAt = serializers.DateTimeField()
    finishedAt = serializers.DateTimeField(required=False, allow_null=True)
    completedExercises = serializers.IntegerField(default=0)
    difficulty = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)
    minutes = serializers.IntegerField(default=0)
    calories = serializers.IntegerField(default=0)
    place = serializers.CharField(required=False, allow_blank=True)
    date = serializers.DateField(required=False)

    def create(self, validated_data):
        from datetime import date as date_cls
        import uuid

        user = self.context["request"].user
        workout = Workout.objects.get(public_id=validated_data["workoutId"])
        session_date = validated_data.get("date") or (
            validated_data["startedAt"].date()
            if hasattr(validated_data["startedAt"], "date")
            else date_cls.today()
        )
        return WorkoutSession.objects.create(
            public_id=f"h{uuid.uuid4().hex[:8]}",
            user=user,
            workout=workout,
            started_at=validated_data["startedAt"],
            finished_at=validated_data.get("finishedAt"),
            completed_exercises=validated_data.get("completedExercises", 0),
            difficulty=validated_data.get("difficulty", ""),
            note=validated_data.get("note", ""),
            minutes=validated_data.get("minutes", workout.duration_min),
            calories=validated_data.get("calories", workout.calories),
            place=validated_data.get("place") or workout.place,
            date=session_date,
        )


class HistorySerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id")
    workoutId = serializers.CharField(source="workout.public_id")

    class Meta:
        model = WorkoutSession
        fields = ["id", "workoutId", "date", "minutes", "calories", "place"]


class LoadLogSerializer(serializers.ModelSerializer):
    exercise = serializers.CharField(source="exercise_name")
    last = serializers.CharField(source="last_load")

    class Meta:
        model = LoadLog
        fields = ["id", "exercise", "last", "note"]


class UserGoalSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id")

    class Meta:
        model = UserGoal
        fields = ["id", "label", "current", "target", "unit"]


class AchievementSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="achievement.public_id")
    title = serializers.CharField(source="achievement.title")
    description = serializers.CharField(source="achievement.description")
    unlocked = serializers.SerializerMethodField()

    class Meta:
        model = UserAchievement
        fields = ["id", "title", "description", "unlocked"]

    def get_unlocked(self, obj):
        return obj.unlocked_at is not None
