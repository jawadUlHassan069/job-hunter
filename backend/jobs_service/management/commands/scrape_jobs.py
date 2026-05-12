import asyncio
import sys
from pathlib import Path
from django.core.management.base import BaseCommand

# add ml/ to path so we can import agent
ML_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / 'ml'
sys.path.insert(0, str(ML_PATH))


class Command(BaseCommand):
    help = 'Scrape jobs from configured sources'

    def add_arguments(self, parser):
        parser.add_argument(
            '--query',
            type=str,
            default='python developer',
            help='Job search query'
        )
        parser.add_argument(
            '--max-jobs',
            type=int,
            default=20,
            help='Maximum number of jobs to scrape'
        )

    def handle(self, *args, **options):
        from agents.job_scraper_agent import run_scraping_agent, save_scraped_jobs

        self.stdout.write('Starting scraping agent...')

        jobs = asyncio.run(run_scraping_agent(
            query    = options['query'],
            max_jobs = options['max_jobs'],
        ))

        self.stdout.write(f'Scraped {len(jobs)} jobs. Saving...')
        count = save_scraped_jobs(jobs)

        self.stdout.write(
            self.style.SUCCESS(f'Done. Saved {count} new jobs to database.')
        )