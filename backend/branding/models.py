from django.db import models


class SiteSettings(models.Model):
    brand_name = models.CharField(max_length=255, default="Aster Coach")
    nina_avatar_note = models.CharField(max_length=255, default="Aster · IA de treino")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "site settings"

    def __str__(self):
        return self.brand_name

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
