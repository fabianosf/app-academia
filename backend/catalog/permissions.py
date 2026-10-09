from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAuthenticatedReadOrTeacherDraftOrAdminWrite(BasePermission):
    """
    GET: autenticado.
    POST/PATCH (conteúdo): teacher ou admin (rascunhos).
    Publicar/arquivar: só admin (validado nas views).
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        role = getattr(user, "role", None)
        return role in ("teacher", "admin") or user.is_superuser


# Compatibilidade com imports antigos
IsAuthenticatedReadOnlyOrStaffWrite = IsAuthenticatedReadOrTeacherDraftOrAdminWrite
