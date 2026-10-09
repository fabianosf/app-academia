from rest_framework import serializers

from .models import Exercise, Workout, WorkoutExercise


class ExerciseSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    restSeconds = serializers.IntegerField(source="rest_seconds")
    suggestedLoad = serializers.CharField(
        source="suggested_load", required=False, allow_blank=True
    )

    class Meta:
        model = Exercise
        fields = [
            "id",
            "name",
            "sets",
            "reps",
            "restSeconds",
            "suggestedLoad",
            "tip",
            "focus",
            "place",
        ]

    def create(self, validated_data):
        import uuid

        validated_data.setdefault("public_id", f"e{uuid.uuid4().hex[:10]}")
        return super().create(validated_data)


class WorkoutSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    durationMin = serializers.IntegerField(source="duration_min")
    exerciseIds = serializers.SerializerMethodField()
    exercises = ExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = Workout
        fields = [
            "id",
            "name",
            "description",
            "place",
            "level",
            "durationMin",
            "calories",
            "focus",
            "equipment",
            "muscles",
            "safety",
            "tone",
            "exerciseIds",
            "exercises",
        ]

    def get_exerciseIds(self, obj):
        return list(
            obj.workout_exercises.order_by("order").values_list(
                "exercise__public_id", flat=True
            )
        )


class WorkoutWriteSerializer(serializers.ModelSerializer):
    public_id = serializers.CharField(required=False)
    duration_min = serializers.IntegerField(required=False)
    exercise_ids = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )

    class Meta:
        model = Workout
        fields = [
            "public_id",
            "name",
            "description",
            "place",
            "level",
            "duration_min",
            "calories",
            "focus",
            "equipment",
            "muscles",
            "safety",
            "tone",
            "exercise_ids",
        ]

    def to_internal_value(self, data):
        payload = dict(data)
        if "durationMin" in payload and "duration_min" not in payload:
            payload["duration_min"] = payload.pop("durationMin")
        if "exerciseIds" in payload and "exercise_ids" not in payload:
            payload["exercise_ids"] = payload.pop("exerciseIds")
        return super().to_internal_value(payload)

    def validate(self, attrs):
        if self.instance is None and not attrs.get("duration_min"):
            attrs["duration_min"] = 30
        if self.instance is None and "calories" not in attrs:
            attrs["calories"] = 200
        if self.instance is None and not attrs.get("place"):
            attrs["place"] = Workout.Place.CASA
        if self.instance is None and not attrs.get("level"):
            attrs["level"] = Workout.Level.INICIANTE
        if self.instance is None and not attrs.get("focus"):
            attrs["focus"] = "Geral"
        return attrs

    def create(self, validated_data):
        import uuid

        exercise_ids = validated_data.pop("exercise_ids", [])
        if not validated_data.get("public_id"):
            validated_data["public_id"] = f"w{uuid.uuid4().hex[:10]}"
        workout = Workout.objects.create(**validated_data)
        self._set_exercises(workout, exercise_ids)
        return workout

    def update(self, instance, validated_data):
        exercise_ids = validated_data.pop("exercise_ids", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if exercise_ids is not None:
            self._set_exercises(instance, exercise_ids)
        return instance

    def _set_exercises(self, workout, exercise_ids):
        workout.workout_exercises.all().delete()
        for order, pid in enumerate(exercise_ids):
            exercise = Exercise.objects.filter(public_id=pid).first()
            if exercise:
                WorkoutExercise.objects.create(
                    workout=workout, exercise=exercise, order=order
                )
