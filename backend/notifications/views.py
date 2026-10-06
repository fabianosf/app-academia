from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification


class NotificationListView(APIView):
    def get(self, request):
        qs = Notification.objects.filter(user=request.user)
        return Response(
            [
                {
                    "id": n.public_id,
                    "title": n.title,
                    "body": n.body,
                    "time": n.time_label,
                    "read": n.read,
                }
                for n in qs
            ]
        )


class NotificationReadView(APIView):
    def patch(self, request, public_id):
        n = Notification.objects.filter(
            user=request.user, public_id=public_id
        ).first()
        if not n:
            return Response({"detail": "Não encontrado."}, status=404)
        n.read = True
        n.save(update_fields=["read"])
        return Response({"id": n.public_id, "read": True})


class NotificationReadAllView(APIView):
    def post(self, request):
        updated = Notification.objects.filter(
            user=request.user, read=False
        ).update(read=True)
        return Response({"updated": updated})
