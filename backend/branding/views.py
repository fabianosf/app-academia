from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteSettings


class SiteSettingsView(APIView):
    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]

    def get(self, request):
        s = SiteSettings.get_solo()
        return Response(
            {
                "brandName": s.brand_name,
                "ninaAvatarNote": s.nina_avatar_note,
            }
        )

    def patch(self, request):
        s = SiteSettings.get_solo()
        if "brandName" in request.data:
            s.brand_name = request.data["brandName"]
        if "ninaAvatarNote" in request.data:
            s.nina_avatar_note = request.data["ninaAvatarNote"]
        s.save()
        return Response(
            {
                "brandName": s.brand_name,
                "ninaAvatarNote": s.nina_avatar_note,
            }
        )
