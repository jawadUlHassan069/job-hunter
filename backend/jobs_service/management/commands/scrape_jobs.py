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
    help = 'Scrape jobs from Rozee.pk, save to DB, and embed into ChromaDB for matching'

    def add_arguments(self, parser):
        parser.add_argument('--query',    type=str, default='python developer')
        parser.add_argument('--max-jobs', type=int, default=10, dest='max_jobs')

    def handle(self, *args, **options):
        query    = options['query']
        max_jobs = options['max_jobs']

        self.stdout.write(self.style.WARNING(
            f"Starting scrape for: '{query}' (max {max_jobs} jobs)"
        ))

        try:
            jobs = asyncio.run(run_scraping_agent(query, max_jobs))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Scraping failed: {e}"))
            return

        saved_count   = 0
        skipped_count = 0
        embed_count   = 0

        for job in jobs:
            try:
                from jobs_service.models import Job

                obj, created = Job.objects.get_or_create(
                    url=job['url'],
                    defaults={
                        'title':          job.get('title',          ''),
                        'company':        job.get('company',        'Unknown'),
                        'location':       job.get('location',       'Pakistan'),
                        'description':    job.get('description',    ''),
                        'required_skills':job.get('required_skills', []),
                        'source':         job.get('source',         'rozee'),
                    }
                )

                if created:
                    saved_count += 1
                    # ── Embed the new job into ChromaDB so /api/match/ can find it ──
                    try:
                        from matching_service.tasks import embed_job_task
                        embed_job_task.delay(obj.id)
                        embed_count += 1
                        self.stdout.write(f"  ✓ Saved + embedded: {obj.title} at {obj.company}")
                    except Exception as embed_err:
                        self.stdout.write(self.style.WARNING(
                            f"  ⚠ Saved but embed failed for job {obj.id}: {embed_err}"
                        ))
                else:
                    skipped_count += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"  DB Error for {job.get('url')}: {e}"
                ))

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Done! Scraped: {len(jobs)} | "
            f"New in DB: {saved_count} | "
            f"Embedded: {embed_count} | "
            f"Already existed: {skipped_count}"
        ))
