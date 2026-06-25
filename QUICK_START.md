# Job Hunter - Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites
- Python 3.11+ installed
- Node.js 20+ installed
- PostgreSQL running
- Redis running (optional for dev)

---

## 🚀 Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file (copy from .env.example)
cp .env.example .env

# 6. Edit .env with your values
# Required minimal config:
DB_NAME=jobhunter
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=django-insecure-change-me-in-production
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key

# 7. Create database
createdb jobhunter
# or via psql:
psql -U postgres -c "CREATE DATABASE jobhunter;"

# 8. Run migrations
python manage.py migrate

# 9. Create superuser
python manage.py createsuperuser

# 10. Start server
python manage.py runserver
```

**Backend now running at: http://localhost:8000** ✅

---

## 🎨 Frontend Setup

```bash
# 1. Navigate to frontend directory (new terminal)
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

**Frontend now running at: http://localhost:5173** ✅

---

## ✅ Verify Installation

### Test Backend
```bash
# Test authentication endpoint
curl http://localhost:8000/api/auth/login/

# Expected: Method not allowed (GET request)
# This means the endpoint exists and is responding
```

### Test Frontend
1. Open browser: http://localhost:5173
2. You should see the landing page with particle effects
3. Click "Get Started" → should navigate to register page
4. Toggle theme (sun/moon icon) → should switch light/dark mode

---

## 🧪 Test Authentication (VERIFIED ✅)

### Register New User
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "test1234"}'
```

**Expected Response:**
```json
{
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "is_2fa_enabled": false,
    "created_at": "2024-..."
  },
  "tokens": {
    "refresh": "eyJhbGciOi...",
    "access": "eyJhbGciOi..."
  }
}
```

### Login Existing User
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test1234"}'
```

**Expected Response:** Same structure as register

---

## 🎯 Quick Test Checklist

### Backend Tests
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] Migrations applied
- [ ] Admin panel accessible at http://localhost:8000/admin/
- [ ] Register endpoint returns JWT tokens
- [ ] Login endpoint returns JWT tokens

### Frontend Tests
- [ ] Page loads at http://localhost:5173
- [ ] No console errors in browser DevTools
- [ ] Three.js particles render
- [ ] Theme toggle works
- [ ] Navigation works (click buttons)
- [ ] Register page loads
- [ ] Login page loads

---

## 🐛 Common Issues & Solutions

### Backend won't start

**Issue:** `django.db.utils.OperationalError: could not connect to server`
```bash
# Solution: Start PostgreSQL
# Windows:
net start postgresql

# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

**Issue:** `ModuleNotFoundError: No module named 'dotenv'`
```bash
# Solution: Reinstall dependencies
pip install -r requirements.txt
```

**Issue:** `django.db.utils.ProgrammingError: relation "auth_service_user" does not exist`
```bash
# Solution: Run migrations
python manage.py migrate
```

---

### Frontend won't start

**Issue:** `Error: Cannot find module`
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue:** `EADDRINUSE: address already in use :::5173`
```bash
# Solution: Kill process using port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5173 | xargs kill -9
```

**Issue:** `Failed to fetch dynamically imported module`
```bash
# Solution: Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

---

### Database Issues

**Issue:** `database "jobhunter" does not exist`
```bash
# Solution: Create database
createdb jobhunter

# or
psql -U postgres
CREATE DATABASE jobhunter;
\q
```

**Issue:** `password authentication failed for user "postgres"`
```bash
# Solution: Update .env with correct password
# Check PostgreSQL password:
psql -U postgres
# If it works, that's your password
```

---

### Authentication Issues

**Issue:** `401 Unauthorized` on API requests
```bash
# Solution: Check token in localStorage
# Open browser DevTools → Application → Local Storage
# Verify "access_token" exists
# If missing, login again
```

**Issue:** `429 Too Many Requests`
```bash
# Solution: Wait 1 minute or clear Redis cache
redis-cli FLUSHDB
```

---

## 📚 Next Steps

### 1. Explore the Application
- Register a new account via frontend
- Login and access dashboard
- Upload a CV (if you have test data)
- Browse jobs (if database has jobs)

### 2. Admin Panel
- Visit http://localhost:8000/admin/
- Login with superuser credentials
- Explore Users, CVs, Jobs tables
- Create test data manually if needed

### 3. Run Tests
```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests (if configured)
cd frontend
npm run test
```

### 4. Read Documentation
- `README.md` - Project overview
- `PROJECT_STATUS.md` - What's been completed
- `ARCHITECTURE.md` - System architecture
- `VERIFICATION_CHECKLIST.md` - Testing guide
- `COMPLETE_SUMMARY.md` - Comprehensive work log

---

## 🔐 Security Notes

### Development Mode (Current)
- ✅ DEBUG=True (shows detailed errors)
- ✅ Rate limiting active (but lenient)
- ✅ CORS allows localhost
- ✅ HTTPS not required

### Production Mode (Before Deploy)
1. Set `DEBUG=False` in .env
2. Generate strong `SECRET_KEY`
3. Configure production database
4. Enable HTTPS/SSL
5. Tighten rate limits
6. Configure Sentry for monitoring
7. Set `ALLOWED_HOSTS` to production domains
8. Update `CORS_ALLOWED_ORIGINS` to production URLs

---

## 📞 Getting Help

### Check Logs

**Backend Logs:**
```bash
# Django outputs to terminal where runserver is running
# Check for errors in red text
```

**Frontend Logs:**
```bash
# Browser DevTools → Console
# Check for errors in red
# Network tab shows API requests/responses
```

**Database Logs:**
```bash
# PostgreSQL logs location varies by OS
# Ubuntu: /var/log/postgresql/
# macOS Homebrew: /usr/local/var/log/
# Windows: C:\Program Files\PostgreSQL\<version>\data\log\
```

### Useful Commands

```bash
# Check if PostgreSQL is running
pg_isready

# Check if Redis is running
redis-cli ping
# Expected: PONG

# Check Python version
python --version

# Check Node version
node --version

# Check installed Python packages
pip list

# Check installed npm packages
npm list --depth=0

# Django shell (interactive Python with Django models)
python manage.py shell

# Create new Django migration
python manage.py makemigrations

# Show pending migrations
python manage.py showmigrations

# Reset database (⚠️ DELETES ALL DATA)
python manage.py flush
```

---

## 🎓 Learning Resources

### Django + DRF
- [Django Docs](https://docs.djangoproject.com/)
- [DRF Docs](https://www.django-rest-framework.org/)
- [JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)

### React
- [React Docs](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/)

### Database
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Django ORM Cookbook](https://books.agiliq.com/projects/django-orm-cookbook/)

### AI/ML
- [LangChain Docs](https://python.langchain.com/)
- [ChromaDB Docs](https://docs.trychroma.com/)
- [Sentence Transformers](https://www.sbert.net/)

---

## ✨ You're Ready!

✅ Backend running on http://localhost:8000  
✅ Frontend running on http://localhost:5173  
✅ Database connected  
✅ Authentication verified  

**Next:** Start building features or deploy to Azure! 🚀

---

**Pro Tip:** Keep both backend and frontend terminals open side-by-side. Watch for errors in real-time as you develop.

**Happy Coding!** 🎉
