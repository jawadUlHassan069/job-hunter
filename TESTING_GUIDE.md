# Testing Guide - Job Hunter

Quick reference for testing all features.

---

## 🚀 Quick Start

### 1. Start All Services

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Celery Worker
cd backend
celery -A config worker -l info --pool=solo

# Terminal 3: Celery Beat (optional - for periodic tasks)
cd backend
celery -A config beat -l info

# Terminal 4: Django
cd backend
python manage.py runserver

# Terminal 5: Frontend
cd frontend
npm run dev
```

---

## 🧪 Test Scenarios

### Scenario 1: New User Registration + Job Scraping

**Steps:**
1. Go to http://localhost:5173/register
2. Register with email/password
3. **Expected**: Login triggers `scrape_jobs_on_demand()`
4. Check Celery worker terminal - should see scraping logs
5. Go to Dashboard - should see job stats indicator

**Verify:**
```bash
# Check if jobs were scraped
cd backend
python manage.py shell
>>> from jobs_service.models import Job
>>> Job.objects.count()  # Should be >0
>>> Job.objects.latest('scraped_at')  # Should be recent
```

---

### Scenario 2: CV Upload + Parsing

**Steps:**
1. Login to http://localhost:5173/login
2. Go to "Upload CV" (or `/cv-analysis`)
3. Upload a PDF CV
4. **Expected**: 
   - Loading spinner
   - Gemini API call (check backend terminal)
   - ATS score displayed (0-100%)
   - Parsed data shown (name, email, skills)

**Verify:**
```bash
# Check CV in database
python manage.py shell
>>> from cv_service.models import CV
>>> cv = CV.objects.latest('uploaded_at')
>>> cv.parsed  # Should have structured JSON
>>> cv.raw_text[:100]  # Should have extracted text
```

---

### Scenario 3: Job Matching

**Steps:**
1. Upload CV first (see Scenario 2)
2. Click "Find Matches" or go to `/cv-analysis`
3. **Expected**:
   - Top 10 matched jobs displayed
   - Each job has match score (0-100%)
   - Jobs sorted by score (highest first)

**Verify ChromaDB:**
```bash
python manage.py shell
>>> from ml.rag.embedder import cv_collection, job_collection
>>> cv_collection.count()  # Should be ≥1
>>> job_collection.count()  # Should be ≥10
>>> 
>>> # Test similarity search
>>> from ml.rag.embedder import get_similarity_scores
>>> scores = get_similarity_scores(cv_id=1, top_k=5)
>>> scores  # Should return list with job_id, title, similarity
```

---

### Scenario 4: Manual Job Scraping

**Test scraper directly:**
```bash
cd backend
python manage.py scrape_jobs --query "python developer" --max-jobs 5
```

**Expected output:**
```
Starting scrape for: 'python developer' (max 5 jobs)
Visiting: https://www.rozee.pk/job/jsearch/q/python-developer
Found 5 job links
[1/5] Scraping https://...
  ✓ Saved + embedded: Senior Python Developer at Acme Corp
[2/5] Scraping https://...
  ✓ Saved + embedded: Backend Engineer at Tech Solutions
...
✅ Done! Scraped: 5 | New in DB: 5 | Embedded: 5 | Already existed: 0 | Errors: 0
```

---

### Scenario 5: CV Builder (LLM Chat)

**Steps:**
1. Login and go to `/cv-maker`
2. Choose a template (Apex, Atlas, or Aire)
3. Click "Start Building"
4. Chat with AI:
   - "My name is John Doe"
   - "Email: john@example.com"
   - "I worked at Google as a software engineer"
   - etc.
5. **Expected**: AI asks follow-up questions
6. When done, AI generates `<CV_COMPLETE>` signal
7. See generated CV preview
8. Download as PDF

**Verify:**
```bash
# Check Groq API logs in backend terminal
# Should see multiple API calls
```

---

### Scenario 6: Dashboard Features

**Steps:**
1. Login to http://localhost:5173/dashboard
2. **Check Stats Cards**:
   - Total Applications
   - Active Pipeline
   - Offers Received
   - Saved Jobs
   - CVs Uploaded

3. **Check Job Freshness Indicator**:
   - Should show green ✓ if jobs are fresh
   - Should show red ⚠️ if jobs are stale

4. **Test Application Tracking**:
   - Click any job → "Update" button
   - Change status: applied → interview → offer

5. **Test Tabs**:
   - Applications tab
   - Saved Jobs tab
   - My CVs tab

---

### Scenario 7: Celery Periodic Task

**Test daily scraping:**

```bash
# Trigger manually (don't wait for 2 AM)
python manage.py shell
>>> from jobs_service.tasks import scrape_jobs_periodic
>>> result = scrape_jobs_periodic()
>>> result  # {'new_jobs': X, 'embedded': X}
```

**Or test Celery Beat:**
```bash
# Check beat schedule
celery -A config inspect scheduled

# Force run immediately (requires celery beat running)
# Edit celery.py temporarily: crontab(hour=2) → crontab(minute='*/1')
# This will run every minute instead of 2 AM
```

---

## 🔍 Debug Commands

### Check Redis Connection
```bash
redis-cli ping
# Expected: PONG
```

### Check Celery Worker
```bash
celery -A config inspect active
celery -A config inspect registered
```

### Check Database
```bash
python manage.py dbshell
# PostgreSQL
SELECT COUNT(*) FROM jobs_service_job;
SELECT COUNT(*) FROM cv_service_cv;
```

### Check ChromaDB
```bash
python manage.py shell
>>> from ml.rag.embedder import cv_collection, job_collection
>>> print(f"CVs: {cv_collection.count()}, Jobs: {job_collection.count()}")
>>> 
>>> # Peek at data
>>> cv_collection.peek(limit=1)
>>> job_collection.peek(limit=1)
```

### Clear All Data (Reset)
```bash
# Clear PostgreSQL
python manage.py flush --noinput

# Clear ChromaDB
rm -rf ml/rag/chroma_store/
# Or on Windows:
# rmdir /s /q ml\rag\chroma_store

# Clear Celery tasks
celery -A config purge
```

---

## 🐛 Common Issues & Fixes

### Issue: "Module not found: ml.agents"
**Fix:**
```python
# Add to settings.py (already done)
sys.path.insert(0, str(BASE_DIR.parent / 'ml'))
```

### Issue: Celery tasks not running
**Fix:**
```bash
# Check worker is running
celery -A config inspect active

# Restart worker
# Kill process and restart:
celery -A config worker -l info --pool=solo
```

### Issue: Jobs not embedding
**Fix:**
```bash
# Manually trigger embedding
python manage.py shell
>>> from jobs_service.models import Job
>>> from matching_service.tasks import embed_job_task
>>> for job in Job.objects.all():
...     embed_job_task.delay(job.id)
```

### Issue: Gemini quota error
**Fix:**
```bash
# Wait 1 minute (free tier: 15 requests/min)
# Or switch to paid tier
# Or use fallback parsing (already implemented)
```

### Issue: Playwright browser not found
**Fix:**
```bash
playwright install chromium
# Or force reinstall:
playwright install --force chromium
```

---

## 📊 Monitor Performance

### Check Scraping Speed
```bash
# Time a scrape
time python manage.py scrape_jobs --query "developer" --max-jobs 10
# Should complete in 30-60 seconds (depends on network)
```

### Check Embedding Speed
```bash
python -m timeit -s "from ml.rag.embedder import embedder; text='test'*100" "embedder.encode(text)"
# Should be ~10-50ms per embedding
```

### Check Matching Speed
```bash
python manage.py shell
>>> import time
>>> from ml.rag.embedder import get_similarity_scores
>>> 
>>> start = time.time()
>>> scores = get_similarity_scores(cv_id=1, top_k=10)
>>> elapsed = time.time() - start
>>> print(f"Matching took {elapsed:.3f}s")
# Should be <100ms for 10 results
```

---

## ✅ Feature Checklist

Test each feature:

- [ ] User registration
- [ ] User login (triggers job scraping)
- [ ] 2FA login (also triggers scraping)
- [ ] Job scraping (manual command)
- [ ] Job scraping (periodic - Celery Beat)
- [ ] Job scraping (on-demand - login trigger)
- [ ] Job embedding (automatic after scrape)
- [ ] CV upload (PDF)
- [ ] CV text extraction (PyMuPDF)
- [ ] CV parsing (Gemini LLM)
- [ ] ATS score calculation
- [ ] CV embedding (automatic after upload)
- [ ] Job matching (cosine similarity)
- [ ] Match score display (0-100%)
- [ ] Dashboard stats
- [ ] Job freshness indicator
- [ ] Application tracking
- [ ] Save jobs
- [ ] CV Builder chat
- [ ] CV template selection
- [ ] CV PDF export
- [ ] Skill gap analysis
- [ ] Theme toggle (light/dark)
- [ ] Rate limiting (try 10+ logins rapidly)

---

## 🔐 Security Tests

### Test Rate Limiting
```bash
# Try multiple rapid logins
for i in {1..20}; do
  curl -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrongpass"}'
  echo ""
done
# Should get 429 Too Many Requests after 5-10 attempts
```

### Test JWT Auth
```bash
# Without token (should fail)
curl http://localhost:8000/api/jobs/applications/
# Expected: 401 Unauthorized

# With token (should work)
TOKEN="your_jwt_token_here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/jobs/applications/
# Expected: 200 OK + data
```

---

## 📈 Load Testing (Optional)

### Simple Load Test
```bash
# Install apache bench
apt-get install apache2-utils

# Test login endpoint (100 requests, 10 concurrent)
ab -n 100 -c 10 -p login.json -T application/json http://localhost:8000/api/auth/login/

# login.json:
{"email":"test@test.com","password":"testpass"}
```

---

## 📝 Test Data

### Sample CV Text
```
John Doe
john.doe@email.com
+1-555-0100
New York, NY

EXPERIENCE
Software Engineer at Google (2020-2023)
- Developed microservices using Python and Django
- Led team of 5 engineers
- Improved performance by 40%

EDUCATION
BS Computer Science, MIT (2016-2020)

SKILLS
Python, Django, React, JavaScript, AWS, Docker, PostgreSQL
```

### Sample Job Data
```json
{
  "title": "Senior Python Developer",
  "company": "Tech Corp",
  "location": "Karachi",
  "description": "Looking for experienced Python developer...",
  "required_skills": ["Python", "Django", "PostgreSQL"],
  "url": "https://rozee.pk/job/12345"
}
```

---

## 🎯 Success Criteria

System is working correctly if:

1. ✅ Jobs scrape without errors
2. ✅ Jobs are embedded to ChromaDB
3. ✅ CVs upload and parse successfully
4. ✅ CVs are embedded to ChromaDB
5. ✅ Matching returns relevant jobs (>50% similarity)
6. ✅ Match scores are reasonable (not all 0% or all 100%)
7. ✅ Dashboard loads without errors
8. ✅ Job stats show correct counts
9. ✅ Application tracking works
10. ✅ CV Builder completes successfully

---

**Happy Testing! 🚀**
