from django.db import models
from django.conf import settings


class CV(models.Model):
    user        = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cv'
    )
    file        = models.FileField(upload_to='cvs/')
    raw_text    = models.TextField(blank=True)
    parsed      = models.JSONField(default=dict)
    uploaded_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'CV of {self.user.email}'