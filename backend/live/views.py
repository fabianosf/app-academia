from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ClassReservation, Instructor, LiveClass
from .serializers import (
    ClassReservationSerializer,
    InstructorSerializer,
    LiveClassSerializer,
)


class InstructorListView(APIView):
    def get(self, request):
        qs = Instructor.objects.all()
        return Response(InstructorSerializer(qs, many=True).data)


class LiveClassListView(APIView):
    def get(self, request):
        qs = LiveClass.objects.select_related("instructor").all()
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(LiveClassSerializer(qs, many=True).data)


class LiveClassDetailView(APIView):
    def get(self, request, public_id):
        obj = LiveClass.objects.select_related("instructor").filter(
            public_id=public_id
        ).first()
        if not obj:
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
