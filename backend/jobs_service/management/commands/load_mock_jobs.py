"""
Django management command to manually load mock job data.
Usage: python manage.py load_mock_jobs
"""

from django.core.management.base import BaseCommand
from jobs_service.seed_data import load_mock_jobs


class Command(BaseCommand):
    help = 'Load mock job data into the database'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Loading mock job data...'))
        
        try:
            count = load_mock_jobs()
            self.stdout.write(
                self.style.SUCCESS(f'✅ Successfully loaded {count} mock jobs!')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error loading mock jobs: {e}')
            )
            raise
