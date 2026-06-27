import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('jobhunter')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Periodic task schedule
app.conf.beat_schedule = {
    'scrape-jobs-daily': {
        'task': 'jobs_service.tasks.scrape_jobs_periodic',
        'schedule': crontab(hour=2, minute=0),  # Run daily at 2 AM
    },
}