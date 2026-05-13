import sys
from pathlib import Path
from celery import shared_task

# __file__ is backend/matching_service/tasks.py
# parents[0] = backend/matching_service/
# parents[1] = backend/
# parents[2] = job-hunter/      ← this is where ml/ lives
# so ML_PATH should be parents[2] / 'ml'

# BUT on Windows resolve() can behave differently
# safest approach is to build the path explicitly:

TASKS_FILE  = Path(__file__).resolve()           # backend/matching_service/tasks.py
BACKEND_DIR = TASKS_FILE.parent.parent           # backend/
PROJECT_DIR = BACKEND_DIR.parent                 # job-hunter/
ML_PATH     = PROJECT_DIR / 'ml'                 # job-hunter/ml/

if str(ML_PATH) not in sys.path:
    sys.path.insert(0, str(ML_PATH))


@shared_task
def embed_cv_task(cv_id: int):
    try:
        from cv_service.models import CV
        from rag.embedder import embed_cv

        cv = CV.objects.get(id=cv_id)
        embed_cv(cv_id, cv.raw_text, cv.parsed)
        print(f'CV {cv_id} embedded successfully')
    except Exception as e:
        print(f'embed_cv_task failed for CV {cv_id}: {e}')
        raise   # re-raise so Celery marks task as FAILED not SUCCESS


@shared_task
def embed_job_task(job_id: int):
    try:
        from jobs_service.models import Job
        from rag.embedder import embed_job

        job = Job.objects.get(id=job_id)
        embed_job(job_id, job.title, job.description, job.required_skills)
        print(f'Job {job_id} embedded successfully')
    except Exception as e:
        print(f'embed_job_task failed for Job {job_id}: {e}')
        raise