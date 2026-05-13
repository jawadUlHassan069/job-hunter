import asyncio
import sys
from pathlib import Path
from django.core.management.base import BaseCommand

from pathlib import Path
import sys

COMMAND_FILE = Path(__file__).resolve()

# this gives .../job-hunter/job-hunter/backend
BACKEND_DIR = COMMAND_FILE.parents[3]

# go up one more level to .../job-hunter/job-hunter
PROJECT_DIR = BACKEND_DIR.parent

ML_PATH = PROJECT_DIR / "ml"

if str(ML_PATH) not in sys.path:
    sys.path.insert(0, str(ML_PATH))

print("ML_PATH:", ML_PATH)
print("sys.path[0]:", sys.path[0])


class Command(BaseCommand):
    help = 'Scrape jobs from configured sources'

    def add_arguments(self, parser):
        parser.add_argument('--query',    type=str, default='python developer')
        parser.add_argument('--max-jobs', type=int, default=20)

    def handle(self, *args, **options):
        from agents.job_scraper_agent import run_scraping_agent, save_scraped_jobs

        self.stdout.write('Starting scraping agent...')
        jobs = asyncio.run(run_scraping_agent(
            query    = options['query'],
            max_jobs = options['max_jobs'],
        ))
        count = save_scraped_jobs(jobs)
        self.stdout.write(self.style.SUCCESS(f'Done. Saved {count} new jobs.'))