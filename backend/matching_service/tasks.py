import sys
from pathlib import Path

from celery import shared_task

BASE_DIR = Path(__file__).resolve().parents[2]
ML_PATH = BASE_DIR / 'ml'

sys.path.insert(0, str(ML_PATH))


@shared_task
def embed_cv_task(cv_id: int):
    """
    Runs after CV upload.
    Embeds the CV into ChromaDB in the background.
    User doesn't wait for this.
    """
    try:
        from cv_service.models import CV
        from rag.embedder import embed_cv

        cv = CV.objects.get(id=cv_id)
        embed_cv(cv_id, cv.raw_text, cv.parsed)
        print(f'CV {cv_id} embedded successfully')
    except Exception as e:
        print(f'embed_cv_task failed for CV {cv_id}: {e}')


@shared_task
def embed_job_task(job_id: int):
    """
    Runs after a job is scraped.
    Embeds the job into ChromaDB in the background.
    """
    try:
        from jobs_service.models import Job
        from rag.embedder import embed_job

        job = Job.objects.get(id=job_id)
        embed_job(job_id, job.title, job.description, job.required_skills)
        print(f'Job {job_id} embedded successfully')
    except Exception as e:
        print(f'embed_job_task failed for Job {job_id}: {e}')