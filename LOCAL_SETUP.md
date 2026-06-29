# Local Development Setup Guide

This guide helps you run the Job Hunter project locally to avoid Render's 512MB memory limit.

## Why Run Locally?

**Memory Requirements:**
- Django + dependencies: ~150MB
- Gunicorn workers: ~200MB
- SentenceTransformer ML model: ~400MB
- Playwright Chromium: ~200MB
- **Total: ~950MB**

Render's free tier only provides 512MB RAM, which causes crashes and CORS errors. Running locally removes these limits.

---

## Prerequisites

1. **Python 3.11** (check with `python --version`)
2. **Node.js 18+** (for frontend)
3. **Git** (to clone/update repo)

---

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create virtual environment
```bash
python -m venv venv
```

### 3. Activate virtual environment

**Windows (CMD):**
```bash
venv\Scripts\activate
```

**Windows (PowerShell):**
```bash
venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

### 5. Install Playwright browsers
```bash
playwright install chromium
```

### 6. Verify .env.local exists
The file `backend/.env.local` should already exist with Neon PostgreSQL credentials.

**If it doesn't exist, create it with:**
```env
DEBUG=True
SECRET_KEY=gATQsdFJ4tcijJuEdJOQKCKi0liqLuBqCMxjjiNQcTMpwP7UI9RG4mgttZY4VhSnSVw

# Cloud Database (Neon PostgreSQL)
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=your_neon_password
DB_HOST=your-neon-host.neon.tech
DB_PORT=5432

ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOW_ALL_ORIGINS=True

# API Keys (get from your accounts)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

JWT_SECRET_KEY=your_jwt_secret_key
ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

OTP_TOTP_ISSUER=JobHunter
```

### 7. Run Django migrations (if needed)
```bash
python manage.py migrate
```

### 8. Start the backend server
```bash
python manage.py runserver
```

**Backend should now be running at:** `http://localhost:8000`

---

## Frontend Setup

### 1. Open a NEW terminal (keep backend running)

### 2. Navigate to frontend directory
```bash
cd frontend
```

### 3. Install dependencies
```bash
npm install
```

### 4. Create .env.local for frontend

Create `frontend/.env.local` with:
```env
VITE_API_URL=http://localhost:8000
```

### 5. Start the frontend dev server
```bash
npm run dev
```

**Frontend should now be running at:** `http://localhost:5173`

---

## Testing the Setup

### 1. Open browser
Navigate to `http://localhost:5173`

### 2. Test login
- Use your existing credentials
- Should see dashboard with jobs

### 3. Test job scraping
- Click "Refresh Jobs" button
- Should load mock data (if < 10 jobs) or scrape new jobs (if >= 10 jobs)

### 4. Test CV upload
- Upload a CV
- Should process without memory errors
- Check job matching works

---

## Common Issues

### Issue: "ModuleNotFoundError: No module named 'X'"
**Solution:** Make sure virtual environment is activated and run `pip install -r requirements.txt`

### Issue: "Playwright browsers not found"
**Solution:** Run `playwright install chromium`

### Issue: "Connection refused" on backend
**Solution:** Make sure backend is running on port 8000. Check for error messages in the terminal.

### Issue: "Network Error" on frontend
**Solution:** 
- Verify backend is running at `http://localhost:8000`
- Verify `frontend/.env.local` has `VITE_API_URL=http://localhost:8000`
- Restart frontend dev server after creating/changing `.env.local`

### Issue: Database connection error
**Solution:** Verify Neon PostgreSQL credentials in `backend/.env.local` are correct

---

## Development Workflow

### Making Changes

1. **Backend changes:**
   - Edit Python files in `backend/`
   - Django auto-reloads on file changes
   - No need to restart server

2. **Frontend changes:**
   - Edit React files in `frontend/src/`
   - Vite auto-reloads on file changes
   - Changes appear immediately in browser

3. **Database changes:**
   - Create migrations: `python manage.py makemigrations`
   - Apply migrations: `python manage.py migrate`

### Testing Features

**Test job scraping:**
```bash
# In backend directory
python manage.py scrape_jobs
```

**Load mock data manually:**
```bash
# In backend directory
python manage.py load_mock_jobs
```

**Access Django admin:**
1. Create superuser: `python manage.py createsuperuser`
2. Navigate to: `http://localhost:8000/admin/`

---

## Deployment vs Local Development

### Local (Development)
- Uses `.env.local` (overrides `.env`)
- Connects to Neon cloud database
- No memory limits
- Django dev server (auto-reload)
- Vite dev server (hot module replacement)
- Full ML features + Playwright scraping

### Render (Production)
- Uses `.env` 
- 512MB RAM limit (causes crashes)
- Gunicorn WSGI server
- Static files served by Gunicorn
- Same Neon cloud database

**Recommendation:** Develop locally, deploy to Render only for testing deployment, or upgrade Render to $7/month plan for 2GB RAM.

---

## Next Steps

1. ✅ Backend running on `http://localhost:8000`
2. ✅ Frontend running on `http://localhost:5173`
3. ✅ Test all features locally
4. 🔄 Make changes without memory constraints
5. 🚀 When ready, push to Git → Render auto-deploys

---

## Memory Optimization for Render (Future)

If you want to keep using Render free tier, options:

1. **Reduce workers to 1** in `gunicorn.conf.py` (slower but uses less memory)
2. **Remove Playwright scraping** (use only mock data)
3. **Remove ML matching** (use simple keyword search)
4. **Upgrade to Render $7/month plan** (2GB RAM - recommended)

Currently, all features are enabled so you need to run locally or upgrade Render.
