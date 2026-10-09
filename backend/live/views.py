from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsPlatformAdmin, IsTeacherOrAdmin
from accounts.services_org import content_visible_to_student_q
from catalog.models import PublishStatus

from .models import ClassReservation, Instructor, LiveClass
from .serializers import (
    ClassReservationSerializer,
    InstructorSerializer,
    LiveClassSerializer,
    LiveClassWriteSerializer,
)


class InstructorListView(APIView):
    def get(self, request):
        qs = Instructor.objects.all()
        return Response(InstructorSerializer(qs, many=True).data)


class LiveClassListView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        user = request.user
        role = getattr(user, "role", "student")
        qs = LiveClass.objects.select_related("instructor")
        if role == "admin" or user.is_superuser:
            qs = qs.all()
        elif role == "teacher":
            qs = qs.filter(
                Q(publish_status=PublishStatus.PUBLISHED)
                | Q(created_by=user, publish_status=PublishStatus.DRAFT)
            )
        else:
            qs = qs.filter(
                content_visible_to_student_q(user, content_type="live_class")
            )
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(LiveClassSerializer(qs, many=True).data)

    def post(self, request):
        serializer = LiveClassWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        publish = PublishStatus.DRAFT
        if getattr(request.user, "role", None) == "admin" or request.user.is_superuser:
            raw = request.data.get("publishStatus") or PublishStatus.DRAFT
            if raw in PublishStatus.values:
                publish = raw
        obj = serializer.save()
        obj.created_by = request.user
        obj.publish_status = publish
        obj.save(update_fields=["created_by", "publish_status"])
        return Response(
            LiveClassSerializer(obj).data, status=status.HTTP_201_CREATED
        )


class LiveClassDetailView(APIView):
    def get(self, request, public_id):
        obj = LiveClass.objects.select_related("instructor").filter(
            public_id=public_id
        ).first()
        if not obj:
            return Response({"detail": "Não encontrado."}, status=404)
        user = request.user
        role = getattr(user, "role", "student")
        if role == "student":
            allowed = LiveClass.objects.filter(
                content_visible_to_student_q(user, content_type="live_class"),
                pk=obj.pk,
            ).exists()
            if not allowed:
                return Response({"detail": "Não encontrado."}, status=404)
        return Response(LiveClassSerializer(obj).data)


class ReservationListView(APIView):
    def get(self, request):
        qs = ClassReservation.objects.filter(user=request.user).select_related(
            "live_class"
        )
        return Response(ClassReservationSerializer(qs, many=True).data)

    def post(self, request):
        class_id = request.data.get("classId")
        live_class = LiveClass.objects.filter(public_id=class_id).first()
        if not live_class:
            return Response({"detail": "Aula não encontrada."}, status=404)
        reservation, created = ClassReservation.objects.get_or_create(
            user=request.user,
            live_class=live_class,
            defaults={"reminder": bool(request.data.get("reminder", True))},
        )
        if not created:
            reservation.delete()
            return Response({"reserved": False, "classId": class_id})
        return Response(
            {
                "reserved": True,
                **ClassReservationSerializer(reservation).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ReservationReminderView(APIView):
    def patch(self, request, class_id):
        reservation = ClassReservation.objects.filter(
            user=request.user, live_class__public_id=class_id
        ).first()
        if not reservation:
            return Response({"detail": "Reserva não encontrada."}, status=404)
        if "reminder" in request.data:
            reservation.reminder = bool(request.data["reminder"])
        else:
            reservation.reminder = not reservation.reminder
        reservation.save(update_fields=["reminder"])
        return Response(ClassReservationSerializer(reservation).data)
