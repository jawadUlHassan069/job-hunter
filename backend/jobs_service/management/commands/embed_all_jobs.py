"""
Django management command to embed all existing jobs into ChromaDB.
Usage: python manage.py embed_all_jobs
"""
import sys
from pathlib import Path
from django.core.management.base import BaseCommand

# Add ml/ to Python path
COMMAND_FILE = Path(__file__).resolve()
BACKEND_DIR = COMMAND_FILE.parent.parent.parent.parent
PROJECT_DIR = BACKEND_DIR.parent
ML_PATH = PROJECT_DIR / 'ml'

if str(ML_PATH) not in sys.path:
    sys.path.insert(0, str(ML_PATH))


class Command(BaseCommand):
    help = 'Embed all existing jobs from PostgreSQL into ChromaDB'

    def handle(self, *args, **options):
        from jobs_service.models import Job
        from matching_service.tasks import embed_job
        from rag.embedder import job_collection
        
        self.stdout.write("=" * 60)
        self.stdout.write("Embedding All Jobs into ChromaDB")
        self.stdout.write("=" * 60)
        
        # Get all jobs from PostgreSQL
        all_jobs = Job.objects.all()
        total_jobs = all_jobs.count()
        
        self.stdout.write(f"\n📊 Found {total_jobs} jobs in PostgreSQL")
        self.stdout.write(f"📊 ChromaDB currently has {job_collection.count()} jobs\n")
        
        if total_jobs == 0:
            self.stdout.write(self.style.WARNING("⚠️  No jobs found in database!"))
            self.stdout.write("💡 Load jobs first by clicking 'Refresh Jobs' button")
            return
        
        success_count = 0
        fail_count = 0
        
        self.stdout.write("🔧 Starting embedding process...\n")
        
        for i, job in enumerate(all_jobs, 1):
            try:
                embed_job(job.id)
                success_count += 1
                self.stdout.write(
                    f"  [{i}/{total_jobs}] ✅ {job.title} at {job.company}"
                )
            except Exception as e:
                fail_count += 1
                self.stdout.write(
                    self.style.ERROR(f"  [{i}/{total_jobs}] ❌ Failed: {job.title} - {e}")
                )
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("Summary")
        self.stdout.write("=" * 60)
        self.stdout.write(f"✅ Successfully embedded: {success_count} jobs")
        if fail_count > 0:
            self.stdout.write(self.style.ERROR(f"❌ Failed: {fail_count} jobs"))
        
        final_count = job_collection.count()
        self.stdout.write(f"\n📊 ChromaDB now has {final_count} jobs indexed")
        
        if final_count > 0:
            self.stdout.write(self.style.SUCCESS("\n🎉 Job matching should now work!"))
        else:
            self.stdout.write(self.style.ERROR("\n❌ No jobs in ChromaDB - matching will still fail"))
