from rest_framework import serializers

from catalog.models import Workout

from .models import (
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
    workoutId = serializers.SlugRelatedField(
        source="workout",
        queryset=Workout.objects.all(),
        slug_field="public_id",
    )
    startedAt = serializers.DateTimeField()
    finishedAt = serializers.DateTimeField(required=False, allow_null=True)
    completedExercises = serializers.IntegerField(
        required=False, default=0, min_value=0, max_value=500
    )
    difficulty = serializers.CharField(
        required=False, allow_blank=True, default="", max_length=40
    )
    note = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    minutes = serializers.IntegerField(
        required=False, allow_null=True, min_value=0, max_value=600
    )
    calories = serializers.IntegerField(
        required=False, allow_null=True, min_value=0, max_value=5000
    )
    place = serializers.CharField(required=False, allow_blank=True, max_length=40)
    date = serializers.DateField(required=False)

    def create(self, validated_data):
        from datetime import date as date_cls
        import uuid

        user = self.context["request"].user
        workout = validated_data["workout"]
        started = validated_data["startedAt"]
        session_date = validated_data.get("date") or (
            started.date() if hasattr(started, "date") else date_cls.today()
        )
        minutes = validated_data.get("minutes")
        if minutes is None:
            minutes = workout.duration_min
        calories = validated_data.get("calories")
        if calories is None:
            calories = workout.calories
        return WorkoutSession.objects.create(
            public_id=f"h{uuid.uuid4().hex[:8]}",
            user=user,
            workout=workout,
            started_at=started,
            finished_at=validated_data.get("finishedAt"),
            completed_exercises=validated_data.get("completedExercises", 0),
            difficulty=validated_data.get("difficulty", ""),
            note=validated_data.get("note", ""),
            minutes=minutes,
            calories=calories,
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
