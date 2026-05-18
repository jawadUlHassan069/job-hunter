from django.db import models
from django.conf import settings
from jobs_service.models import Job


class SkillGapCache(models.Model):
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='skill_gap_cache'
    )
    job        = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='skill_gap_cache'
    )
    result     = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'job']

    def __str__(self):
        return f'Gap cache: {self.user.email} → {self.job.title}'