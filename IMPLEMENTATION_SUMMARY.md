# Job Hunter - Complete Implementation Summary

## Overview
This document summarizes the complete job scraping and CV matching implementation for the Cloud-Based Smart CV and Job Matching Platform.

---

## 🎯 System Flow (Implemented)

### 1. Job Scraping & Storage
```
Internet (Rozee.pk) 
    ↓ [Playwright scraping]
Jobs Data (title, company, location, description, skills)
    ↓ [Save to PostgreSQL]
Database (jobs_service.Job model)
    ↓ [Celery task: embed_job_task]
ChromaDB Embeddings (job_collection)
```

### 2. CV Upload & Parsing
```
User uploads PDF
    ↓ [PyMuPDF extraction]
Raw Text
    ↓ [Gemini LLM parsing]
Structured JSON (name, email, skills, experience, education)
    ↓ [Save to PostgreSQL]
Database (cv_service.CV model)
    ↓ [Celery task: embed_cv_task]
ChromaDB Embeddings (cv_collection)
```

### 3. Job Matching
```
User requests matches (GET /api/match/)
    ↓ [Retrieve CV embedding from ChromaDB]
CV Vector (384 dimensions)
    ↓ [Cosine similarity search in job_collection]
Top K Similar Job Vectors
    ↓ [Convert distance to percentage: (1 - dist/2) * 100]
Match Scores (0-100%)
    ↓ [Fetch job details from PostgreSQL]
Ranked Job List with Match Scores
```

---

## 📁 Files Modified/Created

### Backend Files

#### **NEW: `backend/jobs_service/tasks.py`**
- `scrape_jobs_periodic()` - Celery Beat task, runs daily at 2 AM
- `scrape_jobs_on_demand()` - Triggered on user login if jobs are stale
- Both scrape multiple job categories and auto-embed into ChromaDB

#### **MODIFIED: `backend/config/celery.py`**
```python
# Added Celery Beat schedule for periodic scraping
app.conf.beat_schedule = {
    'scrape-jobs-daily': {
        'task': 'jobs_service.tasks.scrape_jobs_periodic',
        'schedule': crontab(hour=2, minute=0),
    },
}
```

#### **MODIFIED: `backend/auth_service/views.py`**
- Added login-triggered job scraping in `LoginView.post()`
- Added 2FA-triggered job scraping in `Verify2FAView.post()`
- Calls `scrape_jobs_on_demand.delay()` after successful auth

#### **MODIFIED: `backend/jobs_service/views.py`**
- Added `JobStatsView` - returns job database freshness metrics
  - `total_jobs`: Total count in database
  - `recent_jobs_24h`: Jobs scraped in last 24 hours
  - `latest_scrape`: Timestamp of last scrape
  - `needs_refresh`: Boolean (true if <10 recent jobs)

#### **MODIFIED: `backend/jobs_service/urls.py`**
```python
path('stats/', views.JobStatsView.as_view()),
```

### Frontend Files

#### **MODIFIED: `frontend/src/pages/Dashboard.jsx`**
- Added `jobStats` state variable
- Fetches `/api/jobs/stats/` on mount
- Displays job database freshness indicator:
  - ✓ Green if fresh (≥10 jobs in last 24h)
  - ⚠️ Red if stale (<10 jobs in last 24h)
  - Shows total jobs, recent jobs, last scrape time
  - Note: "Jobs will refresh on your next login"

---

## 🔧 Technical Details

### Embeddings (ml/rag/embedder.py)
- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Dimensions**: 384
- **Similarity Metric**: Cosine similarity
- **Score Conversion**: `(1 - distance / 2) * 100` → 0-100%
- **Storage**: ChromaDB with persistent storage

### Job Scraper (ml/agents/job_scraper_agent.py)
- **Site**: Rozee.pk (Pakistan jobs portal)
- **Browser**: Playwright (Chromium, headless)
- **Skill Extraction**: 50+ tech keywords (Python, React, Django, etc.)
- **Retry Logic**: 3 attempts with exponential backoff
- **Rate Limiting**: 2 seconds between job detail scrapes

### CV Parser (backend/cv_service/parser.py)
- **LLM**: Google Gemini 2.0 Flash Lite
- **Quota Handling**: 5 retries with 10-50s backoff
- **Output**: Structured JSON (name, email, skills, experience, education)
- **Fallback**: Returns error object if parsing fails

### ATS Score Calculation (backend/cv_service/views.py)
```python
Score breakdown (max 100):
- 40 pts: Skills (3 pts each, capped at 40)
- 20 pts: Experience present
- 15 pts: Education present
- 15 pts: Name + Email present
- 10 pts: Certifications present
```

---

## 🚀 How It Works (User Journey)

### First-Time User
1. **Register/Login** → Triggers `scrape_jobs_on_demand()`
   - Backend checks: Are there ≥10 jobs scraped in last 24 hours?
   - If NO → Scrape 3 categories × 3 jobs = 9 new jobs
   - Each job → saved to DB → embedded to ChromaDB

2. **Upload CV** → `/api/cv/` endpoint
   - Extract text from PDF (PyMuPDF)
   - Parse with Gemini LLM → structured JSON
   - Calculate ATS score
   - Embed CV → ChromaDB
   - Return: CV data + ATS score

3. **View Matches** → `/api/match/` endpoint
   - Retrieve CV embedding from ChromaDB
   - Query job_collection for top 10 similar jobs
   - Calculate match scores (cosine similarity → percentage)
   - Return: Ranked jobs with match scores

4. **View Dashboard** → Shows job stats
   - Displays total jobs, recent jobs count
   - Indicator shows if jobs need refresh

### Returning User
1. **Login** → `scrape_jobs_on_demand()` checks freshness
   - If jobs are stale (≥24h old) → scrapes fresh jobs
   - If jobs are fresh → skips scraping

2. **Dashboard** → Real-time job stats
   - Green indicator: Database has fresh jobs
   - Red indicator: Jobs will refresh on next login

---

## 📊 Database Schema

### Job Model (jobs_service.models.Job)
```python
title                 CharField(255)
company               CharField(255)
location              CharField(255)
description           TextField
url                   URLField (unique)
source                CharField(100)
required_skills       JSONField (list)
deadline              DateField (nullable)
is_deadline_confirmed BooleanField
chroma_id             CharField(100)
posted_at             DateTimeField (nullable)
scraped_at            DateTimeField (auto)
```

### CV Model (cv_service.models.CV)
```python
user        OneToOneField → User
file        FileField
raw_text    TextField
parsed      JSONField (structured data)
uploaded_at DateTimeField (auto)
```

### ChromaDB Collections
```python
cv_collection:
  - ids: [str(cv_id)]
  - embeddings: [384-dim vector]
  - documents: [cv_text + skills]
  - metadatas: [{cv_id, skills, name}]

job_collection:
  - ids: [str(job_id)]
  - embeddings: [384-dim vector]
  - documents: [title + description + skills]
  - metadatas: [{job_id, title, skills}]
```

---

## 🔄 Celery Tasks

### Periodic Tasks (Celery Beat)
- `scrape_jobs_periodic` - Runs daily at 2 AM
  - Scrapes 8 job categories × 5 jobs each = 40 jobs/day
  - Categories: python, frontend, backend, fullstack, data scientist, ML engineer, devops, software engineer

### On-Demand Tasks
- `scrape_jobs_on_demand(user_id)` - Triggered on login
  - Only runs if <10 jobs in last 24h
  - Scrapes 3 categories × 3 jobs = 9 jobs
  - Fast execution for better UX

- `embed_cv_task(cv_id)` - Triggered after CV upload
  - Retrieves CV from database
  - Generates embedding
  - Stores in ChromaDB

- `embed_job_task(job_id)` - Triggered after job save
  - Retrieves job from database
  - Generates embedding
  - Stores in ChromaDB

---

## 🛠️ Setup & Testing

### Prerequisites
```bash
# Backend dependencies (already in requirements.txt)
- celery
- redis
- playwright
- beautifulsoup4
- sentence-transformers
- chromadb
- PyMuPDF (fitz)
- google-generativeai

# Install Playwright browsers
playwright install chromium

# Redis server (for Celery)
# Windows: Download from https://github.com/tporadowski/redis/releases
# Linux/Mac: apt-get install redis-server / brew install redis
```

### Running the System

#### 1. Start Redis
```bash
# Windows
redis-server

# Linux/Mac
redis-server
```

#### 2. Start Celery Worker
```bash
cd backend
celery -A config worker -l info --pool=solo
```

#### 3. Start Celery Beat (for periodic tasks)
```bash
cd backend
celery -A config beat -l info
```

#### 4. Start Django Server
```bash
cd backend
python manage.py runserver
```

#### 5. Start Frontend
```bash
cd frontend
npm run dev
```

### Manual Testing

#### Test Job Scraping (Manual)
```bash
cd backend
python manage.py scrape_jobs --query "python developer" --max-jobs 5
```

Expected output:
```
✅ Done! Scraped: 5 | New in DB: 5 | Embedded: 5 | Already existed: 0 | Errors: 0
```

#### Test CV Upload
1. Go to `/cv-analysis`
2. Upload a PDF CV
3. Wait for parsing (Gemini API)
4. See ATS score and parsed data

#### Test Job Matching
1. Upload CV first
2. Click "Find Matches"
3. See top 10 matched jobs with scores

#### Check Job Stats
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/jobs/stats/
```

Response:
```json
{
  "total_jobs": 25,
  "recent_jobs_24h": 15,
  "latest_scrape": "2024-01-15T10:30:00Z",
  "needs_refresh": false
}
```

---

## 🎨 Frontend Indicators

### Dashboard Job Freshness Indicator
- **Green (✓)**: "Job Database Fresh"
  - ≥10 jobs scraped in last 24h
  - Shows: total jobs, recent count, last scrape time

- **Red (⚠️)**: "Job Database Needs Refresh"
  - <10 jobs scraped in last 24h
  - Shows: "Jobs will refresh on your next login"

### CV Analysis Page
- ATS Score badge (0-100%)
- Parsed skills displayed as chips
- Matched jobs with percentage scores
- Color-coded: 80-100% green, 60-79% yellow, <60% red

---

## 🔐 Security & Performance

### Security
- API keys stored in `.env` (never in source)
- JWT authentication for all endpoints
- Rate limiting on auth endpoints
- CSRF protection disabled for JWT-only API
- Constant-time password checks (timing attack prevention)

### Performance
- Celery async tasks (non-blocking)
- ChromaDB persistent storage (no re-embedding)
- Embeddings cached in vector DB
- Skill gap analysis cached per user-job pair
- Redis caching for rate limiting

### Error Handling
- Retry logic in job scraper (3 attempts)
- Gemini quota handling (5 retries with backoff)
- Graceful degradation (CV builder falls back if JSON fails)
- Login doesn't fail if scraping fails

---

## 📈 Monitoring & Logs

### Check Celery Tasks
```bash
# View task status
celery -A config inspect active

# View registered tasks
celery -A config inspect registered

# Purge all tasks (reset)
celery -A config purge
```

### Check ChromaDB Collections
```python
from ml.rag.embedder import cv_collection, job_collection

# Count embeddings
print(f"CVs: {cv_collection.count()}")
print(f"Jobs: {job_collection.count()}")

# View sample
print(cv_collection.peek(limit=1))
print(job_collection.peek(limit=1))
```

### Django Admin
- Jobs: http://localhost:8000/admin/jobs_service/job/
- CVs: http://localhost:8000/admin/cv_service/cv/
- Applications: http://localhost:8000/admin/jobs_service/application/

---

## 🐛 Troubleshooting

### Issue: Jobs not scraping
**Check:**
1. Is Redis running? `redis-cli ping` → should return "PONG"
2. Is Celery worker running? Check terminal logs
3. Is Playwright installed? `playwright install chromium`
4. Is Rozee.pk accessible? Check network/VPN

**Fix:**
```bash
# Reinstall Playwright
playwright install --force chromium

# Clear Celery tasks
celery -A config purge

# Restart worker
celery -A config worker -l info --pool=solo
```

### Issue: CV embeddings not found
**Check:**
1. Was `embed_cv_task` called after upload?
2. Is ChromaDB path correct? `ml/rag/chroma_store/`
3. Are embeddings persisted? Check folder size

**Fix:**
```bash
# Re-embed all CVs
python manage.py shell
>>> from cv_service.models import CV
>>> from matching_service.tasks import embed_cv_task
>>> for cv in CV.objects.all():
...     embed_cv_task.delay(cv.id)
```

### Issue: Match scores are 0% or very low
**Check:**
1. Are both CV and jobs embedded?
2. Is CV parsing successful? (not `{'error': ...}`)
3. Are job skills extracted correctly?

**Fix:**
- Re-upload CV with better formatting
- Check `parsed` field in database
- Verify job descriptions contain keywords

### Issue: Gemini quota exhausted
**Symptom:** `QuotaException` or 429 errors

**Fix:**
- Wait 1 minute (free tier: 15 RPM)
- Use Gemini 2.0 Flash Lite (free tier has higher quota)
- Or upgrade to paid tier

---

## 🎓 Course Project Context

**Course**: CSL 220 - Cloud Computing  
**Institution**: University  
**Semester**: Spring 2026  
**Section**: BSE-6A

### Team Responsibilities
- **Salman Khan (Lead)**: Backend, CV processing, matching logic ✅
- **Jawad Ul Hassan**: Job scraping, ATS, integration ✅
- **Keyan Majid**: Frontend, CV Maker, Dashboard, DB design ✅
- **Zohaib Arshad Noor**: Skill gap analysis, testing, documentation ✅

### Technologies Used
- **Backend**: Django 4.x, Django REST Framework
- **Frontend**: React 18, Vite, Three.js
- **Database**: PostgreSQL (relational), ChromaDB (vector)
- **Task Queue**: Celery + Redis
- **ML/AI**: Sentence Transformers, Google Gemini
- **Web Scraping**: Playwright, BeautifulSoup
- **Authentication**: JWT (SimpleJWT)
- **Cloud**: (Deployment pending)

---

## ✅ Implementation Status

### Completed Features
- ✅ Job scraping from Rozee.pk
- ✅ Periodic scraping (Celery Beat)
- ✅ Login-triggered scraping
- ✅ CV upload and PDF parsing
- ✅ LLM-based CV structuring (Gemini)
- ✅ ATS score calculation
- ✅ Vector embeddings (Sentence Transformers)
- ✅ ChromaDB storage
- ✅ Cosine similarity matching
- ✅ Match score percentage display
- ✅ Job stats API endpoint
- ✅ Frontend job freshness indicator
- ✅ Dashboard with stats
- ✅ Application tracking
- ✅ Saved jobs functionality
- ✅ Skill gap analysis
- ✅ CV Builder (LLM-powered)
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ 2FA support

### Pending (Next Phase)
- ⏳ Cloud deployment (AWS/Azure)
- ⏳ Containerization (Docker)
- ⏳ CI/CD pipeline
- ⏳ Production monitoring
- ⏳ Scalability testing
- ⏳ Documentation for deployment

---

## 📝 Notes

### Why Login-Triggered Scraping?
- **UX**: Ensures users always have fresh jobs when they visit
- **Efficiency**: Only scrapes when jobs are stale (>24h old)
- **Balance**: Periodic scraping (daily) + on-demand (login)

### Why ChromaDB?
- **Local**: Runs on your machine, no external API
- **Fast**: HNSW index for similarity search
- **Persistent**: Data survives server restart
- **Free**: No API costs unlike Pinecone/Weaviate

### Why Sentence Transformers?
- **CPU-friendly**: No GPU required
- **Small model**: all-MiniLM-L6-v2 (80MB)
- **Good quality**: 384 dims, 58M params
- **Fast inference**: ~10ms per embedding

### Why Two Scraping Strategies?
1. **Periodic (Celery Beat)**: Keeps database fresh overnight
2. **On-demand (Login)**: Handles edge cases + better UX

---

## 🚀 Production Checklist

Before deploying to cloud:
- [ ] Set `DEBUG=False` in `.env`
- [ ] Set `CELERY_ALWAYS_EAGER=False`
- [ ] Use strong `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Configure PostgreSQL (not SQLite)
- [ ] Set up Redis cluster
- [ ] Configure HTTPS/SSL
- [ ] Set CORS origins to production URLs
- [ ] Configure file storage (S3/Azure Blob)
- [ ] Set up Sentry for error tracking
- [ ] Configure backup strategy
- [ ] Load test with 100+ concurrent users
- [ ] Document deployment steps

---

## 📚 Additional Resources

- **Django Celery**: https://docs.celeryq.dev/
- **Sentence Transformers**: https://sbert.net/
- **ChromaDB**: https://docs.trychroma.com/
- **Playwright**: https://playwright.dev/python/
- **Google Gemini**: https://ai.google.dev/

---

**Last Updated**: January 2024  
**Status**: Core features complete ✅  
**Next Steps**: Testing → Deployment → Documentation
