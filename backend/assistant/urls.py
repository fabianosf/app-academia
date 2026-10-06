from django.urls import path

from .views import NinaChatView

urlpatterns = [
    path("nina/chat/", NinaChatView.as_view(), name="nina-chat"),
]
