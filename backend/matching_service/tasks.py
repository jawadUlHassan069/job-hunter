import sys
from pathlib import Path

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


def embed_cv(cv_id: int):
    """
    Embed a CV into the vector database.
    Called after CV upload/parsing.
    """
    try:
        from cv_service.models import CV
        from rag.embedder import embed_cv as embed_cv_func

        cv = CV.objects.get(id=cv_id)
        embed_cv_func(cv_id, cv.raw_text, cv.parsed)
        print(f'CV {cv_id} embedded successfully')
    except Exception as e:
        print(f'embed_cv failed for CV {cv_id}: {e}')
        raise


def embed_job(job_id: int):
    """
    Embed a job into the vector database.
    Called after job scraping.
    """
    try:
        from jobs_service.models import Job
        from rag.embedder import embed_job as embed_job_func

        job = Job.objects.get(id=job_id)
        embed_job_func(job_id, job.title, job.description, job.required_skills)
        print(f'Job {job_id} embedded successfully')
    except Exception as e:
        print(f'embed_job failed for Job {job_id}: {e}')
        raise
