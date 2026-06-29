"""
Django management command to check and fix missing embeddings.
Usage: python manage.py check_embeddings [--fix]
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
    help = 'Check and optionally fix missing job and CV embeddings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Re-embed missing jobs and CVs',
        )

    def handle(self, *args, **options):
        from jobs_service.models import Job
        from cv_service.models import CV
        from rag.embedder import job_collection, cv_collection
        from matching_service.tasks import embed_job
        from matching_service.tasks import embed_cv as embed_cv_task
        
        # Check jobs
        self.stdout.write("=" * 60)
        self.stdout.write("Checking Job Embeddings...")
        self.stdout.write("=" * 60)
        
        total_jobs = Job.objects.count()
        embedded_jobs = job_collection.count()
        
        self.stdout.write(f"📊 Jobs in PostgreSQL: {total_jobs}")
        self.stdout.write(f"📊 Jobs in ChromaDB: {embedded_jobs}")
        
        if total_jobs == embedded_jobs:
            self.stdout.write(self.style.SUCCESS("✅ All jobs are embedded!"))
        else:
            missing = total_jobs - embedded_jobs
            self.stdout.write(self.style.WARNING(f"⚠️  {missing} jobs are NOT embedded"))
            
            if options['fix']:
                self.stdout.write("\n🔧 Re-embedding missing jobs...")
                
                # Get list of embedded job IDs from ChromaDB
                try:
                    all_chroma_jobs = job_collection.get(include=['metadatas'])
                    embedded_ids = {int(meta['job_id']) for meta in all_chroma_jobs['metadatas']}
                except:
                    embedded_ids = set()
                
                # Find jobs not in ChromaDB
                all_jobs = Job.objects.all()
                missing_jobs = [job for job in all_jobs if job.id not in embedded_ids]
                
                success_count = 0
                fail_count = 0
                
                for job in missing_jobs:
                    try:
                        embed_job(job.id)
                        success_count += 1
                        self.stdout.write(f"  ✓ Embedded job {job.id}: {job.title}")
                    except Exception as e:
                        fail_count += 1
                        self.stdout.write(self.style.ERROR(f"  ✗ Failed job {job.id}: {e}"))
                
                self.stdout.write(self.style.SUCCESS(f"\n✅ Embedded {success_count} jobs"))
                if fail_count > 0:
                    self.stdout.write(self.style.ERROR(f"❌ Failed {fail_count} jobs"))
            else:
                self.stdout.write(self.style.WARNING("\n💡 Run with --fix to re-embed missing jobs"))
        
        # Check CVs
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("Checking CV Embeddings...")
        self.stdout.write("=" * 60)
        
        total_cvs = CV.objects.count()
        embedded_cvs = cv_collection.count()
        
        self.stdout.write(f"📊 CVs in PostgreSQL: {total_cvs}")
        self.stdout.write(f"📊 CVs in ChromaDB: {embedded_cvs}")
        
        if total_cvs == embedded_cvs:
            self.stdout.write(self.style.SUCCESS("✅ All CVs are embedded!"))
        else:
            missing = total_cvs - embedded_cvs
            self.stdout.write(self.style.WARNING(f"⚠️  {missing} CVs are NOT embedded"))
            
            if options['fix']:
                self.stdout.write("\n🔧 Re-embedding missing CVs...")
                
                # Get list of embedded CV IDs from ChromaDB
                try:
                    all_chroma_cvs = cv_collection.get(include=['metadatas'])
                    embedded_ids = {int(meta['cv_id']) for meta in all_chroma_cvs['metadatas']}
                except:
                    embedded_ids = set()
                
                # Find CVs not in ChromaDB
                all_cvs = CV.objects.all()
                missing_cvs = [cv for cv in all_cvs if cv.id not in embedded_ids]
                
                success_count = 0
                fail_count = 0
                
                for cv in missing_cvs:
                    try:
                        embed_cv_task(cv.id)
                        success_count += 1
                        self.stdout.write(f"  ✓ Embedded CV {cv.id}")
                    except Exception as e:
                        fail_count += 1
                        self.stdout.write(self.style.ERROR(f"  ✗ Failed CV {cv.id}: {e}"))
                
                self.stdout.write(self.style.SUCCESS(f"\n✅ Embedded {success_count} CVs"))
                if fail_count > 0:
                    self.stdout.write(self.style.ERROR(f"❌ Failed {fail_count} CVs"))
            else:
                self.stdout.write(self.style.WARNING("\n💡 Run with --fix to re-embed missing CVs"))
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("Summary")
        self.stdout.write("=" * 60)
        self.stdout.write(f"Total Jobs: {total_jobs} (Embedded: {embedded_jobs})")
        self.stdout.write(f"Total CVs: {total_cvs} (Embedded: {embedded_cvs})")
        
        if total_jobs > 0 and embedded_jobs == 0:
            self.stdout.write(self.style.ERROR("\n❌ CRITICAL: No jobs are embedded! Matching will fail."))
            self.stdout.write(self.style.WARNING("Run: python manage.py check_embeddings --fix"))
        elif total_cvs > 0 and embedded_cvs == 0:
            self.stdout.write(self.style.ERROR("\n❌ CRITICAL: No CVs are embedded! Matching will fail."))
            self.stdout.write(self.style.WARNING("Run: python manage.py check_embeddings --fix"))
        elif total_jobs == embedded_jobs and total_cvs == embedded_cvs:
            self.stdout.write(self.style.SUCCESS("\n✅ All data is properly embedded. Matching should work!"))
