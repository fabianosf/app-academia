from rest_framework import serializers

from .models import ClassReservation, Instructor, LiveClass


class InstructorSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id")

    class Meta:
        model = Instructor
        fields = ["id", "name", "specialty"]


class LiveClassSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id")
    date = serializers.CharField(source="date_label")
    time = serializers.CharField(source="time_label")
    durationMin = serializers.IntegerField(source="duration_min")
    instructorId = serializers.CharField(source="instructor.public_id")
    instructor = InstructorSerializer(read_only=True)

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
        ]


class ClassReservationSerializer(serializers.ModelSerializer):
    classId = serializers.CharField(source="live_class.public_id")

    class Meta:
        model = ClassReservation
        fields = ["id", "classId", "reminder"]
