from rest_framework import serializers

from .models import (
    AssistFeedback,
    ConsultedSource,
    DemoGenerationJob,
    ExerciseAssistRequest,
    ExerciseDemo,
)


class ConsultedSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultedSource
        fields = ["title", "url", "authorship", "summary", "consulted_at"]


class ExerciseDemoSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)

    class Meta:
        model = ExerciseDemo
        fields = [
            "id",
            "exercise_key",
            "exercise_name",
            "muscle_group",
            "variation",
            "equipment",
            "level",
            "goal",
            "persona",
            "language",
            "duration_sec",
            "media_url",
            "status",
            "ai_generated",
            "structured_script",
            "source_notes",
            "prompt_version",
            "created_at",
            "updated_at",
        ]


class DemoGenerationJobSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    demo = ExerciseDemoSerializer(read_only=True)

    class Meta:
        model = DemoGenerationJob
        fields = [
            "id",
            "status",
            "provider",
            "persona",
            "safe_error",
            "demo",
            "created_at",
            "updated_at",
        ]


class ExerciseAssistRequestSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    sources = ConsultedSourceSerializer(many=True, read_only=True)
    matchedDemo = ExerciseDemoSerializer(source="matched_demo", read_only=True)
    catalogExerciseId = serializers.SerializerMethodField()
    jobs = serializers.SerializerMethodField()

    class Meta:
        model = ExerciseAssistRequest
        fields = [
            "id",
            "text",
            "status",
            "interpretation",
            "clarifying_question",
            "answer_text",
            "steps",
            "cautions",
            "personalized_from_profile",
            "health_caution",
            "search_status",
            "sources",
            "matchedDemo",
            "catalogExerciseId",
            "jobs",
            "created_at",
            "updated_at",
        ]

    def get_catalogExerciseId(self, obj):
        return obj.catalog_exercise.public_id if obj.catalog_exercise_id else None

    def get_jobs(self, obj):
        qs = obj.generation_jobs.all()[:5]
        return DemoGenerationJobSerializer(qs, many=True).data


class AssistFeedbackSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)

    class Meta:
        model = AssistFeedback
        fields = [
            "id",
            "useful",
            "equipment_ok",
            "prefer_shorter",
            "comment",
            "created_at",
        ]
