# jobs_service/management/commands/scrape_jobs.py
import asyncio
import sys
from pathlib import Path
from django.core.management.base import BaseCommand

# Add ml/ to Python path
ML_PATH = Path(__file__).resolve().parents[4] / 'ml'
sys.path.insert(0, str(ML_PATH))

from agents.multi_source_scraper import run_multi_source_scraping


class Command(BaseCommand):
    help = 'Scrape jobs from multiple sources (Indeed, LinkedIn, Glassdoor), save to DB, and embed into ChromaDB'

    def add_arguments(self, parser):
        parser.add_argument('--query',    type=str, default='python developer')
        parser.add_argument('--location', type=str, default='Pakistan')
        parser.add_argument('--max-jobs', type=int, default=10, dest='max_jobs')

    def handle(self, *args, **options):
        query    = options['query']
        location = options['location']
        max_jobs = options['max_jobs']

        self.stdout.write(self.style.WARNING(
            f"Starting multi-source scrape for: '{query}' in '{location}' (max {max_jobs} jobs per source)"
        ))

        try:
            jobs = asyncio.run(run_multi_source_scraping(query, location, max_jobs))
            
            if not jobs:
                self.stdout.write(self.style.WARNING("No jobs scraped from any source."))
                return
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Scraping failed: {e}"))
            import traceback
            self.stdout.write(self.style.ERROR(traceback.format_exc()))
            return

        saved_count   = 0
        skipped_count = 0
        embed_count   = 0
        error_count   = 0

        for job in jobs:
            try:
                from jobs_service.models import Job

                # Validate required fields
                if not job.get('url') or not job.get('title'):
                    self.stdout.write(self.style.WARNING(f"  ⚠ Skipping invalid job: {job}"))
                    error_count += 1
                    continue

                obj, created = Job.objects.get_or_create(
                    url=job['url'],
                    defaults={
                        'title':          job.get('title', '')[:255],
                        'company':        job.get('company', 'Unknown')[:200],
                        'location':       job.get('location', 'Pakistan')[:200],
                        'description':    job.get('description', ''),
                        'required_skills':job.get('required_skills', []),
                        'source':         job.get('source', 'unknown'),
                    }
                )

                if created:
                    saved_count += 1
                    # Embed the new job into ChromaDB
                    try:
                        from matching_service.tasks import embed_job_task
                        embed_job_task.delay(obj.id)
                        embed_count += 1
                        self.stdout.write(f"  ✓ Saved + embedded: {obj.title} at {obj.company} (source: {obj.source})")
                    except Exception as embed_err:
                        self.stdout.write(self.style.WARNING(
                            f"  ⚠ Saved but embed failed for job {obj.id}: {embed_err}"
                        ))
                else:
                    skipped_count += 1
                    self.stdout.write(f"  → Already exists: {obj.title}")

            except Exception as e:
                error_count += 1
                self.stdout.write(self.style.ERROR(
                    f"  DB Error for {job.get('url', 'unknown')}: {e}"
                ))

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Done! Scraped: {len(jobs)} | "
            f"New in DB: {saved_count} | "
            f"Embedded: {embed_count} | "
            f"Already existed: {skipped_count} | "
            f"Errors: {error_count}"
        ))

