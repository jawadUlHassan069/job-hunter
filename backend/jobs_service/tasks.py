import asyncio
import sys
from pathlib import Path
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

# Add ml/ to Python path
TASKS_FILE = Path(__file__).resolve()
BACKEND_DIR = TASKS_FILE.parent.parent
PROJECT_DIR = BACKEND_DIR.parent
ML_PATH = PROJECT_DIR / 'ml'

if str(ML_PATH) not in sys.path:
    sys.path.insert(0, str(ML_PATH))


@shared_task
def scrape_jobs_periodic():
    """
    Periodic job scraper that runs daily via Celery Beat.
    Scrapes multiple job categories from multiple sources.
    
    ⚠️  SETUP REQUIRED FOR ASYNC EXECUTION:
    1. Ensure Redis is running: redis-server
    2. Ensure Celery worker is running: celery -A config worker -l info
    3. Ensure Celery beat is running: celery -A config beat -l info
    4. Set CELERY_ALWAYS_EAGER=False in .env for production
    
    If CELERY_ALWAYS_EAGER=True, tasks run synchronously (blocking).
    """
    from django.conf import settings
    
    if getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
        print("⚠️  WARNING: CELERY_TASK_ALWAYS_EAGER=True - Tasks are running synchronously!")
        print("   Set CELERY_ALWAYS_EAGER=False in .env and start Celery worker for async execution")
    
    from agents.multi_source_scraper import run_multi_source_scraping
    from jobs_service.models import Job
    from matching_service.tasks import embed_job_task
    
    queries = [
        'python developer',
        'frontend developer',
        'backend developer',
        'full stack developer',
        'data scientist',
        'machine learning engineer',
        'devops engineer',
        'software engineer',
    ]
    
    total_new = 0
    total_embedded = 0
    
    for query in queries:
        try:
            print(f"Scraping: {query}")
            jobs = asyncio.run(run_multi_source_scraping(query, location="Pakistan", max_jobs=5))
            
            for job in jobs:
                try:
                    if not job.get('url') or not job.get('title'):
                        continue
                    
                    obj, created = Job.objects.get_or_create(
                        url=job['url'],
                        defaults={
                            'title': job.get('title', '')[:255],
                            'company': job.get('company', 'Unknown')[:200],
                            'location': job.get('location', 'Pakistan')[:200],
                            'description': job.get('description', ''),
                            'required_skills': job.get('required_skills', []),
                            'source': job.get('source', 'unknown'),
                        }
                    )
                    
                    if created:
                        total_new += 1
                        # Embed new job
                        embed_job_task.delay(obj.id)
                        total_embedded += 1
                        
                except Exception as e:
                    print(f"Error saving job: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error scraping {query}: {e}")
            continue
    
    print(f"Periodic scraping complete: {total_new} new jobs, {total_embedded} embedded")
    return {'new_jobs': total_new, 'embedded': total_embedded}


@shared_task
def scrape_jobs_on_demand(user_id=None):
    """
    On-demand job scraper triggered by manual request.
    Scrapes fresh jobs if database has old/no jobs.
    
    ⚠️  NOTE: This task is no longer triggered on login to prevent UI blocking.
    Jobs are now scraped only via periodic Celery Beat task (daily at 2 AM).
    
    To manually trigger: python manage.py shell
    >>> from jobs_service.tasks import scrape_jobs_on_demand
    >>> scrape_jobs_on_demand.delay()
    """
    from django.conf import settings
    
    if getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
        print("⚠️  WARNING: CELERY_TASK_ALWAYS_EAGER=True - Tasks are running synchronously!")
        print("   Set CELERY_ALWAYS_EAGER=False in .env and start Celery worker for async execution")
    
    from agents.multi_source_scraper import run_multi_source_scraping
    from jobs_service.models import Job
    from matching_service.tasks import embed_job_task
    
    # Check if we need to scrape (no jobs or jobs older than 24 hours)
    recent_jobs = Job.objects.filter(
        scraped_at__gte=timezone.now() - timedelta(hours=24)
    ).count()
    
    if recent_jobs >= 10:
        print(f"Database has {recent_jobs} recent jobs, skipping scrape")
        return {'status': 'skipped', 'reason': 'sufficient_recent_jobs'}
    
    print(f"Only {recent_jobs} recent jobs found, triggering scrape")
    
    # Scrape a few categories quickly from multiple sources
    queries = [
        'python developer',
        'frontend developer',
        'backend developer',
    ]
    
    total_new = 0
    total_embedded = 0
    
    for query in queries:
        try:
            jobs = asyncio.run(run_multi_source_scraping(query, location="Pakistan", max_jobs=3))
            
            for job in jobs:
                try:
                    if not job.get('url') or not job.get('title'):
                        continue
                    
                    obj, created = Job.objects.get_or_create(
                        url=job['url'],
                        defaults={
                            'title': job.get('title', '')[:255],
                            'company': job.get('company', 'Unknown')[:200],
                            'location': job.get('location', 'Pakistan')[:200],
                            'description': job.get('description', ''),
                            'required_skills': job.get('required_skills', []),
                            'source': job.get('source', 'unknown'),
                        }
                    )
                    
                    if created:
                        total_new += 1
                        embed_job_task.delay(obj.id)
                        total_embedded += 1
                        
                except Exception as e:
                    print(f"Error saving job: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error scraping {query}: {e}")
            continue
    
    print(f"On-demand scraping complete: {total_new} new jobs")
    return {'status': 'completed', 'new_jobs': total_new, 'embedded': total_embedded}
