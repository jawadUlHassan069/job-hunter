from django.db import models
from django.conf import settings


class Job(models.Model):
    title                 = models.CharField(max_length=255)
    company               = models.CharField(max_length=255)
    location              = models.CharField(max_length=255, blank=True)
    description           = models.TextField()
    url                   = models.URLField(unique=True, max_length=500)
    source                = models.CharField(max_length=100)
    required_skills       = models.JSONField(default=list)
    deadline              = models.DateField(null=True, blank=True)
    is_deadline_confirmed = models.BooleanField(default=False)
    chroma_id             = models.CharField(max_length=100, blank=True)
    posted_at             = models.DateTimeField(null=True, blank=True)
    scraped_at            = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['deadline', '-scraped_at']

    def __str__(self):
        return f'{self.title} at {self.company}'


class SavedJob(models.Model):
    user     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_jobs'
    )
    job      = models.ForeignKey(Job, on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'job']

    def __str__(self):
        return f'{self.user.email} saved {self.job.title}'


class Application(models.Model):
    STATUS_CHOICES = [
        ('applied',   'Applied'),
        ('interview', 'Interview'),
        ('offer',     'Offer'),
        ('rejected',  'Rejected'),
    ]
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    job        = models.ForeignKey(Job, on_delete=models.CASCADE)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    notes      = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'job']

    def __str__(self):
        return f'{self.user.email} → {self.job.title} ({self.status})'