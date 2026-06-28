import asyncio
import sys
from pathlib import Path
from django.utils import timezone
from datetime import timedelta

# Add ml/ to Python path
TASKS_FILE = Path(__file__).resolve()
BACKEND_DIR = TASKS_FILE.parent.parent
PROJECT_DIR = BACKEND_DIR.parent
ML_PATH = PROJECT_DIR / 'ml'

if str(ML_PATH) not in sys.path:
    sys.path.insert(0, str(ML_PATH))


def scrape_jobs():
    """
    Job scraper that can be triggered on-demand via API endpoint.
    Scrapes multiple job categories from multiple sources.
    
    Returns a dictionary with scraping results:
    {
        'status': 'completed',
        'new_jobs': int,
        'updated_jobs': int,
        'embedded': int
    }
    """
    from agents.multi_source_scraper import run_multi_source_scraping
    from jobs_service.models import Job
    from matching_service.tasks import embed_job
    
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
    total_updated = 0
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
                        try:
                            embed_job(obj.id)
                            total_embedded += 1
                        except Exception as e:
                            print(f"Error embedding job {obj.id}: {e}")
                    else:
                        # Update existing job if data has changed
                        updated = False
                        if obj.description != job.get('description', ''):
                            obj.description = job.get('description', '')
                            updated = True
                        if obj.required_skills != job.get('required_skills', []):
                            obj.required_skills = job.get('required_skills', [])
                            updated = True
                        if updated:
                            obj.save()
                            total_updated += 1
                        
                except Exception as e:
                    print(f"Error saving job: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error scraping {query}: {e}")
            continue
    
    print(f"Scraping complete: {total_new} new jobs, {total_updated} updated, {total_embedded} embedded")
    return {
        'status': 'completed',
        'new_jobs': total_new,
        'updated_jobs': total_updated,
        'embedded': total_embedded
    }


def get_last_scrape_info():
    """
    Returns information about the last scrape.
    Returns {
        'last_scrape_time': datetime or None,
        'total_jobs': int,
        'recent_jobs_24h': int,
        'needs_refresh': bool
    }
    """
    from jobs_service.models import Job
    
    last_job = Job.objects.order_by('-scraped_at').first()
    last_scrape_time = last_job.scraped_at if last_job else None
    
    total_jobs = Job.objects.count()
    recent_jobs = Job.objects.filter(
        scraped_at__gte=timezone.now() - timedelta(hours=24)
    ).count()
    
    # Consider refresh needed if no jobs or last scrape > 24 hours ago
    needs_refresh = (
        total_jobs == 0 or 
        (last_scrape_time and (timezone.now() - last_scrape_time) > timedelta(hours=24))
    )
    
    return {
        'last_scrape_time': last_scrape_time,
        'total_jobs': total_jobs,
        'recent_jobs_24h': recent_jobs,
        'needs_refresh': needs_refresh
    }
