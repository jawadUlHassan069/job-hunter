# jobs_service/management/commands/scrape_jobs.py
import asyncio
import sys
from pathlib import Path
from django.core.management.base import BaseCommand

# Add ml/ to Python path
ML_PATH = Path(__file__).resolve().parents[4] / 'ml'
sys.path.insert(0, str(ML_PATH))

from agents.job_scraper_agent import run_scraping_agent


class Command(BaseCommand):
    help = 'Scrape jobs from Rozee.pk and save to database'

    def add_arguments(self, parser):
        parser.add_argument('--query', type=str, default='python developer')
        parser.add_argument('--max-jobs', type=int, default=10, dest='max_jobs')  # Important: dest='max_jobs'

    def handle(self, *args, **options):
        query = options['query']
        max_jobs = options['max_jobs']

        self.stdout.write(self.style.WARNING(f"Starting scrape for: '{query}' (max {max_jobs} jobs)"))

        try:
            jobs = asyncio.run(run_scraping_agent(query, max_jobs))

            saved_count = 0
            for job in jobs:
                try:
                    from jobs_service.models import Job
                    
                    obj, created = Job.objects.get_or_create(
                        url=job['url'],
                        defaults={
                            'title': job.get('title', ''),
                            'company': job.get('company', 'Unknown'),
                            'location': job.get('location', 'Pakistan'),
                            'description': job.get('description', ''),
                            'required_skills': job.get('required_skills', []),
                            'source': job.get('source', 'rozee'),
                        }
                    )
                    if created:
                        saved_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"DB Error for {job.get('url')}: {e}"))

            self.stdout.write(self.style.SUCCESS(
                f"✅ Done! Scraped: {len(jobs)} jobs | Saved to DB: {saved_count}"
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Scraping failed: {e}"))

