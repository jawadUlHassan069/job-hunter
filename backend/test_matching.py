import os
import sys
import django

# setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, r'C:\Users\ANONYMOUUSS\Desktop\job-hunter\job-hunter\ml')
django.setup()

# disable ChromaDB telemetry noise
os.environ['ANONYMIZED_TELEMETRY'] = 'False'

from rag.embedder import (
    embed_cv,
    embed_job,
    find_matching_jobs,
    cv_collection,
    job_collection,
    CHROMA_PATH
)
from cv_service.models import CV
from jobs_service.models import Job

print("=" * 60)
print("JOB HUNTER — MATCHING SERVICE TEST")
print("=" * 60)

# ── STEP 1: Check ChromaDB path ──────────────────────────────
print(f"\nChromaDB path: {CHROMA_PATH}")
print(f"Path exists:   {CHROMA_PATH.exists()}")

# ── STEP 2: Embed all CVs ────────────────────────────────────
print("\n" + "=" * 60)
print("EMBEDDING CVs")
print("=" * 60)

cvs = CV.objects.all()
print(f"CVs in PostgreSQL: {cvs.count()}")

for cv in cvs:
    if cv.raw_text and cv.parsed and 'error' not in cv.parsed:
        embed_cv(cv.id, cv.raw_text, cv.parsed)
        print(f"  Embedded CV {cv.id} — {cv.user.email}")
        print(f"  Skills: {cv.parsed.get('skills', [])}")
    else:
        print(f"  Skipped CV {cv.id} — no data (re-upload needed)")

print(f"\nCVs in ChromaDB: {cv_collection.get()['ids']}")

# ── STEP 3: Embed all Jobs ───────────────────────────────────
print("\n" + "=" * 60)
print("EMBEDDING JOBS")
print("=" * 60)

jobs = Job.objects.all()
print(f"Jobs in PostgreSQL: {jobs.count()}")

for job in jobs:
    embed_job(job.id, job.title, job.description, job.required_skills)
    print(f"  Embedded Job {job.id} — {job.title} at {job.company}")

print(f"\nJobs in ChromaDB: {job_collection.get()['ids']}")

# ── STEP 4: Test Matching ────────────────────────────────────
print("\n" + "=" * 60)
print("MATCHING TEST")
print("=" * 60)

for cv in CV.objects.all():
    print(f"\nUser:       {cv.user.email}")
    print(f"CV skills:  {cv.parsed.get('skills', [])}")

    matched_ids = find_matching_jobs(cv.id, top_k=5)
    print(f"Matched IDs: {matched_ids}")

    if matched_ids:
        print("Matched jobs (best match first):")
        for i, job_id in enumerate(matched_ids):
            try:
                job = Job.objects.get(id=job_id)
                print(f"  {i+1}. {job.title} at {job.company}")
                print(f"     Required: {job.required_skills}")
            except Job.DoesNotExist:
                print(f"  {i+1}. Job {job_id} not found in DB")
    else:
        print("No matches found — check ChromaDB has jobs embedded")

# ── STEP 5: Similarity Scores ────────────────────────────────
print("\n" + "=" * 60)
print("SIMILARITY SCORES")
print("=" * 60)

from rag.embedder import get_similarity_scores

for cv in CV.objects.all():
    print(f"\nUser: {cv.user.email}")
    print(f"Skills: {cv.parsed.get('skills', [])}")

    scores = get_similarity_scores(cv.id, top_k=5)

    if scores:
        print("Ranked matches:")
        for s in scores:
            print(f"  {s['similarity']}% — {s['title']} (Job {s['job_id']})")
    else:
        print("No scores — CV not in ChromaDB")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)