from rest_framework import serializers

from .models import ClassReservation, Instructor, LiveClass


class InstructorSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id")

    class Meta:
        model = Instructor
        fields = ["id", "name", "specialty"]


class LiveClassSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id", read_only=True)
    date = serializers.CharField(source="date_label")
    time = serializers.CharField(source="time_label")
    durationMin = serializers.IntegerField(source="duration_min")
    instructorId = serializers.CharField(source="instructor.public_id", read_only=True)
    instructor = InstructorSerializer(read_only=True)
    streamUrl = serializers.URLField(source="stream_url", required=False, allow_blank=True)
    streamConfigured = serializers.SerializerMethodField()

    class Meta:
        model = LiveClass
        fields = [
            "id",
            "title",
            "category",
            "date",
            "time",
            "durationMin",
            "instructorId",
            "instructor",
            "level",
            "spots",
            "participants",
            "status",
            "tone",
            "streamUrl",
            "streamConfigured",
            "publish_status",
        ]

    def get_streamConfigured(self, obj):
        return bool((obj.stream_url or "").strip())

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["publishStatus"] = data.pop("publish_status", instance.publish_status)
        return data


class LiveClassWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    category = serializers.CharField(max_length=64, required=False, default="Geral")
    date = serializers.CharField(max_length=64, required=False, default="Em breve")
    time = serializers.CharField(max_length=16, required=False, default="19:00")
    durationMin = serializers.IntegerField(min_value=5, max_value=180, default=45)
    level = serializers.ChoiceField(
        choices=LiveClass.Level.choices, default=LiveClass.Level.INICIANTE
    )
    spots = serializers.IntegerField(min_value=1, max_value=500, default=40)
    status = serializers.ChoiceField(
        choices=LiveClass.Status.choices, default=LiveClass.Status.UPCOMING
    )
    tone = serializers.CharField(required=False, allow_blank=True, default="")
    instructorId = serializers.CharField(required=False, allow_blank=True)
    streamUrl = serializers.URLField(required=False, allow_blank=True, default="")

    def create(self, validated_data):
        import uuid

        instructor_id = validated_data.pop("instructorId", "") or ""
        stream_url = validated_data.pop("streamUrl", "") or ""
        instructor = None
        if instructor_id:
            instructor = Instructor.objects.filter(public_id=instructor_id).first()
        if not instructor:
            instructor = Instructor.objects.order_by("id").first()
        if not instructor:
            instructor = Instructor.objects.create(
                public_id=f"i{uuid.uuid4().hex[:8]}",
                name="Instrutor Forma",
                specialty="Treino geral",
            )
        return LiveClass.objects.create(
            public_id=f"c{uuid.uuid4().hex[:10]}",
            title=validated_data["title"],
            category=validated_data.get("category", "Geral"),
            date_label=validated_data.get("date", "Em breve"),
            time_label=validated_data.get("time", "19:00"),
            duration_min=validated_data.get("durationMin", 45),
            instructor=instructor,
            level=validated_data.get("level", LiveClass.Level.INICIANTE),
            spots=validated_data.get("spots", 40),
            participants=0,
            status=validated_data.get("status", LiveClass.Status.UPCOMING),
            tone=validated_data.get("tone", ""),
            stream_url=stream_url,
        )


class ClassReservationSerializer(serializers.ModelSerializer):
    classId = serializers.CharField(source="live_class.public_id")

    class Meta:
        model = ClassReservation
        fields = ["id", "classId", "reminder"]
