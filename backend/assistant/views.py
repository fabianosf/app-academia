import uuid

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .ans_engine import AnsConfigError, AnsLlmError, reply as ans_reply
from .models import ChatMessage, ChatThread


class NinaChatView(APIView):
    def get(self, request):
        thread, _ = ChatThread.objects.get_or_create(user=request.user)
        messages = thread.messages.all()
        return Response(
            [
                {
                    "id": m.public_id,
                    "role": m.role,
                    "content": m.content,
                    "createdAt": m.created_at.isoformat(),
                }
                for m in messages
            ]
        )

    def post(self, request):
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response({"detail": "message é obrigatório."}, status=400)
        context = request.data.get("context") or {}
        thread, _ = ChatThread.objects.get_or_create(user=request.user)

        user_msg = ChatMessage.objects.create(
            public_id=f"m{uuid.uuid4().hex[:10]}",
            thread=thread,
            role=ChatMessage.Role.USER,
            content=message,
        )

        try:
            ans = ans_reply(message, context)
        except AnsConfigError as exc:
            user_msg.delete()
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except AnsLlmError as exc:
            user_msg.delete()
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        assistant_msg = ChatMessage.objects.create(
            public_id=f"m{uuid.uuid4().hex[:10]}",
            thread=thread,
            role=ChatMessage.Role.ASSISTANT,
            content=ans.text,
        )
        return Response(
            {
                "message": {
                    "id": assistant_msg.public_id,
                    "role": assistant_msg.role,
                    "content": assistant_msg.content,
                    "createdAt": assistant_msg.created_at.isoformat(),
                },
                "userMessage": {
                    "id": user_msg.public_id,
                    "role": user_msg.role,
                    "content": user_msg.content,
                    "createdAt": user_msg.created_at.isoformat(),
                },
                "knowledgeHash": ans.knowledge_hash,
                "model": ans.model,
            },
            status=status.HTTP_201_CREATED,
        )
