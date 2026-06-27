# Job Hunter - Architecture Overview

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                  │
│                      http://localhost:5173                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Landing    │  │     Auth     │  │  Dashboard   │         │
│  │     Page     │  │     Page     │  │     Page     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  CV Maker    │  │ CV Analysis  │  │  Job Match   │         │
│  │     Page     │  │     Page     │  │     Page     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Components:                                                     │
│  • Three.js particle background                                 │
│  • GSAP animations                                               │
│  • Light/Dark theme toggle                                      │
│  • Protected route guards                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              │ JWT Authentication
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Django + DRF)                    │
│                      http://localhost:8000                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    MIDDLEWARE LAYER                       │  │
│  │  • CORS Handler                                           │  │
│  │  • JWT Authentication (djangorestframework-simplejwt)     │  │
│  │  • Rate Limiting (django-ratelimit + Redis)              │  │
│  │  • Session Management                                     │  │
│  │  • CSRF Protection                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  MICROSERVICES (Django Apps)              │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │auth_service │  │ cv_service  │  │jobs_service │      │  │
│  │  │             │  │             │  │             │      │  │
│  │  │ • Register  │  │ • Upload CV │  │ • Scraping  │      │  │
│  │  │ • Login     │  │ • Parse CV  │  │ • Filter    │      │  │
│  │  │ • 2FA TOTP  │  │ • Store     │  │ • Search    │      │  │
│  │  │ • JWT Token │  │ • Retrieve  │  │ • CRUD      │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐                        │  │
│  │  │matching_    │  │  cv_agent   │                        │  │
│  │  │  service    │  │             │                        │  │
│  │  │             │  │ • AI Chat   │                        │  │
│  │  │ • RAG Match │  │ • Groq API  │                        │  │
│  │  │ • Skill Gap │  │ • Context   │                        │  │
│  │  │ • Scoring   │  │ • Streaming │                        │  │
│  │  └─────────────┘  └─────────────┘                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │    Redis     │  │    ChromaDB      │
│   Database       │  │    Cache     │  │  Vector Store    │
│                  │  │              │  │                  │
│ • Users          │  │ • Rate Limit │  │ • CV Embeddings  │
│ • CVs            │  │ • Sessions   │  │ • Job Embeddings │
│ • Jobs           │  │ • Celery     │  │ • Similarity     │
│ • Applications   │  │   Queue      │  │   Search         │
└──────────────────┘  └──────────────┘  └──────────────────┘
```

---

## 🔄 DATA FLOW

### 1. Authentication Flow (VERIFIED ✅)

```
User Register/Login
       │
       ▼
Frontend sends {email, password} 
       │
       ▼
axios.post('/api/auth/register/')
       │
       ▼
Backend: Rate Limit Check (Redis)
       │
       ├─> Too many requests → 429 Error
       │
       ▼
Backend: Validate & Create User
       │
       ▼
Backend: Generate JWT Tokens
       │
       ▼
Response: {user: {...}, tokens: {access, refresh}}
       │
       ▼
Frontend: Store in localStorage
       │
       ▼
Frontend: Redirect to /dashboard
```

### 2. Protected API Request Flow

```
User navigates to /dashboard
       │
       ▼
ProtectedRoute checks localStorage.access_token
       │
       ├─> No token → Redirect to /login
       │
       ▼
Dashboard loads, calls API
       │
       ▼
axios.get('/api/match/jobs/')
       │
       ├─> Interceptor adds: Authorization: Bearer <token>
       │
       ▼
Backend: JWT Middleware validates token
       │
       ├─> Invalid/Expired → 401 Error
       │   │
       │   ▼
       │   Frontend: Try refresh token
       │   │
       │   ├─> Success → Retry original request
       │   │
       │   └─> Failure → Redirect to /login
       │
       ▼
Backend: Rate Limit Check
       │
       ▼
Backend: Execute business logic
       │
       ▼
Backend: Return JSON response
       │
       ▼
Frontend: Render data
```

### 3. CV Upload & Matching Flow

```
User uploads CV file
       │
       ▼
Frontend: POST /api/cv/upload/
       │
       ▼
Backend: cv_service receives file
       │
       ▼
Backend: Extract text (PyMuPDF/python-docx)
       │
       ▼
Backend: Parse with Gemini API
       │
       ▼
Backend: Extract {skills, experience, education}
       │
       ▼
Backend: Save to PostgreSQL
       │
       ▼
Backend: Generate embedding (sentence-transformers)
       │
       ▼
Backend: Store in ChromaDB
       │
       ▼
User clicks "Find Jobs"
       │
       ▼
Frontend: GET /api/match/jobs/
       │
       ▼
Backend: matching_service
       │
       ├─> Retrieve CV embedding from ChromaDB
       │
       ├─> Query similar job embeddings (cosine similarity)
       │
       ├─> Rank by similarity score (0-100)
       │
       └─> Return top 10 matches
       │
       ▼
Frontend: Display jobs with match %
```

### 4. Job Scraping Flow (Celery)

```
Admin runs: python manage.py scrape_jobs
       │
       ▼
Celery task: scrape_jobs()
       │
       ▼
Playwright launches browser
       │
       ▼
Navigate to job boards (Indeed, LinkedIn, etc.)
       │
       ▼
Extract job listings (BeautifulSoup)
       │
       ▼
For each job:
  │
  ├─> Save to PostgreSQL (jobs_service.models.Job)
  │
  ├─> Generate embedding (sentence-transformers)
  │
  └─> Store in ChromaDB
       │
       ▼
Task complete → Jobs ready for matching
```

---

## 🔒 SECURITY LAYERS

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: NETWORK (CORS + CSRF)                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ • CORS whitelist: localhost:3000, 127.0.0.1:3000  │    │
│  │ • CSRF protection: JWT-based (no cookies)          │    │
│  │ • HTTPS enforcement (production)                   │    │
│  └────────────────────────────────────────────────────┘    │
│                         ▼                                    │
│  Layer 2: RATE LIMITING (Redis)                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ • Login: 10/min per IP, 5/min per email           │    │
│  │ • Register: 5/min per IP                           │    │
│  │ • 2FA: 10/min per IP                               │    │
│  │ • Returns 429 when exceeded                        │    │
│  └────────────────────────────────────────────────────┘    │
│                         ▼                                    │
│  Layer 3: AUTHENTICATION (JWT)                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ • Access token: 60 min lifetime                    │    │
│  │ • Refresh token: 7 day lifetime                    │    │
│  │ • HMAC-SHA256 signature                            │    │
│  │ • Automatic refresh on 401                         │    │
│  └────────────────────────────────────────────────────┘    │
│                         ▼                                    │
│  Layer 4: AUTHORIZATION                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │ • IsAuthenticated permission class                 │    │
│  │ • User-specific data filtering                     │    │
│  │ • Row-level permissions                            │    │
│  └────────────────────────────────────────────────────┘    │
│                         ▼                                    │
│  Layer 5: DATA PROTECTION                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ • Password hashing: PBKDF2-SHA256                  │    │
│  │ • API keys in environment variables                │    │
│  │ • Sensitive data encryption at rest               │    │
│  │ • Input validation & sanitization                  │    │
│  └────────────────────────────────────────────────────┘    │
│                         ▼                                    │
│  Layer 6: MONITORING                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │ • Sentry error tracking                            │    │
│  │ • Django request logging                           │    │
│  │ • Azure Monitor (production)                       │    │
│  │ • Audit trail for sensitive operations             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 TECHNOLOGY STACK

### Frontend
```
┌─────────────────────────────────────────┐
│          React 18 + Vite 5              │
├─────────────────────────────────────────┤
│ • React Router DOM 6 (routing)          │
│ • Axios (HTTP client)                   │
│ • Three.js (3D effects)                 │
│ • GSAP (animations)                     │
│ • Tailwind CSS (utility styles)         │
│ • Custom CSS Variables (theming)        │
│ • Local Storage (token persistence)     │
└─────────────────────────────────────────┘
```

### Backend
```
┌─────────────────────────────────────────┐
│        Django 4.2 + DRF 3.15            │
├─────────────────────────────────────────┤
│ • djangorestframework-simplejwt         │
│ • django-cors-headers                   │
│ • django-otp (2FA)                      │
│ • django-ratelimit                      │
│ • python-decouple (config)              │
│ • psycopg2-binary (PostgreSQL)          │
│ • celery + redis (async tasks)          │
│ • django-celery-beat (scheduling)       │
└─────────────────────────────────────────┘
```

### AI/ML
```
┌─────────────────────────────────────────┐
│         AI & Machine Learning           │
├─────────────────────────────────────────┤
│ • Gemini API (CV parsing)               │
│ • Groq API (chat interface)             │
│ • ChromaDB (vector database)            │
│ • sentence-transformers (embeddings)    │
│ • langchain (RAG orchestration)         │
│ • PyMuPDF + python-docx (extraction)    │
└─────────────────────────────────────────┘
```

### Infrastructure
```
┌─────────────────────────────────────────┐
│      Database & Infrastructure          │
├─────────────────────────────────────────┤
│ • PostgreSQL 15 (primary database)      │
│ • Redis 7 (cache + queue)               │
│ • ChromaDB (vector storage)             │
│ • Nginx (reverse proxy)                 │
│ • Docker + Docker Compose               │
│ • Azure App Service (planned)           │
└─────────────────────────────────────────┘
```

---

## 🔄 STATE MANAGEMENT

### Frontend State
```
┌──────────────────────────────────────────┐
│         React Component State            │
├──────────────────────────────────────────┤
│  Global State:                           │
│  • Theme (localStorage + useState)       │
│  • Auth tokens (localStorage)            │
│                                          │
│  Component State:                        │
│  • Form inputs (useState)                │
│  • Loading states (useState)             │
│  • Error messages (useState)             │
│  • Modal visibility (useState)           │
│                                          │
│  Side Effects:                           │
│  • API calls (useEffect + axios)         │
│  • Theme persistence (useEffect)         │
│  • Animation triggers (useEffect + GSAP) │
└──────────────────────────────────────────┘
```

### Backend State
```
┌──────────────────────────────────────────┐
│         Django ORM + Cache                │
├──────────────────────────────────────────┤
│  Database (PostgreSQL):                  │
│  • User accounts (persistent)            │
│  • CVs (persistent)                      │
│  • Jobs (persistent)                     │
│  • Applications (persistent)             │
│                                          │
│  Cache (Redis):                          │
│  • Rate limit counters (TTL)             │
│  • Session data (TTL)                    │
│  • Skill gap results (cache)             │
│                                          │
│  Vector Store (ChromaDB):                │
│  • CV embeddings (persistent)            │
│  • Job embeddings (persistent)           │
└──────────────────────────────────────────┘
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Development Environment
```
┌─────────────────────────────────────────────────────┐
│              LOCAL DEVELOPMENT                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Frontend (Vite Dev Server)                         │
│  http://localhost:5173                              │
│           │                                          │
│           ▼                                          │
│  Backend (Django runserver)                         │
│  http://localhost:8000                              │
│           │                                          │
│           ├─────────────┬──────────────┐           │
│           ▼             ▼              ▼            │
│     PostgreSQL      Redis         ChromaDB          │
│     :5432          :6379          :8000             │
│                                                      │
│  Celery (inline execution)                          │
│  CELERY_ALWAYS_EAGER=True                           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Production Environment (Azure)
```
┌──────────────────────────────────────────────────────────┐
│                    AZURE PRODUCTION                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────┐     │
│  │     Azure Static Web Apps (Frontend)           │     │
│  │     https://jobhunter.azurestaticapps.net      │     │
│  └────────────────────────────────────────────────┘     │
│                        │                                  │
│                        ▼                                  │
│  ┌────────────────────────────────────────────────┐     │
│  │     Azure Application Gateway (Load Balancer)  │     │
│  │     SSL/TLS Termination                        │     │
│  └────────────────────────────────────────────────┘     │
│                        │                                  │
│                        ▼                                  │
│  ┌────────────────────────────────────────────────┐     │
│  │     Azure App Service (Django Backend)         │     │
│  │     https://jobhunter-api.azurewebsites.net    │     │
│  │     • Auto-scaling enabled                     │     │
│  │     • Health checks configured                 │     │
│  └────────────────────────────────────────────────┘     │
│                        │                                  │
│        ┌───────────────┼───────────────┐                │
│        ▼               ▼               ▼                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐         │
│  │ Azure DB │  │  Azure   │  │  ChromaDB    │         │
│  │   for    │  │  Redis   │  │  (Docker)    │         │
│  │PostgreSQL│  │  Cache   │  │              │         │
│  └──────────┘  └──────────┘  └──────────────┘         │
│                                                           │
│  ┌────────────────────────────────────────────────┐     │
│  │     Azure Monitor + Application Insights       │     │
│  │     • Performance monitoring                   │     │
│  │     • Error tracking (Sentry integration)      │     │
│  │     • Custom metrics & alerts                  │     │
│  └────────────────────────────────────────────────┘     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA (Simplified)

```sql
-- auth_service_user
CREATE TABLE auth_service_user (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password VARCHAR(128),
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- cv_service_cv
CREATE TABLE cv_service_cv (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_service_user(id),
    file VARCHAR(255),
    parsed JSONB,
    ats_score INTEGER,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- jobs_service_job
CREATE TABLE jobs_service_job (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    company VARCHAR(255),
    location VARCHAR(255),
    description TEXT,
    required_skills JSONB,
    salary_range VARCHAR(100),
    source VARCHAR(50),
    url VARCHAR(500),
    posted_date DATE,
    deadline DATE,
    scraped_at TIMESTAMP DEFAULT NOW()
);

-- matching_service_skillegapcache
CREATE TABLE matching_service_skillegapcache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_service_user(id),
    job_id INTEGER REFERENCES jobs_service_job(id),
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- django_otp_totp_totpdevice
CREATE TABLE django_otp_totp_totpdevice (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_service_user(id),
    name VARCHAR(64),
    key VARCHAR(80),
    confirmed BOOLEAN DEFAULT FALSE
);
```

---

## 🎯 API ENDPOINTS

### Authentication
```
POST   /api/auth/register/           Register new user
POST   /api/auth/login/              Login existing user
POST   /api/auth/token/refresh/      Refresh access token
GET    /api/auth/me/                 Get current user profile
GET    /api/auth/2fa/setup/          Get QR code for 2FA
POST   /api/auth/2fa/setup/          Verify and enable 2FA
POST   /api/auth/2fa/verify/         Verify 2FA code during login
```

### CV Management
```
GET    /api/cv/                      Get user's CV
POST   /api/cv/upload/               Upload new CV
DELETE /api/cv/                      Delete CV
GET    /api/cv/ats-score/            Get ATS score for CV
```

### Jobs
```
GET    /api/jobs/                    List all jobs
GET    /api/jobs/?search=python      Search jobs
GET    /api/jobs/<id>/               Get job details
```

### Matching
```
GET    /api/match/jobs/              Get matched jobs (RAG)
GET    /api/match/skill-gap/<id>/    Get skill gap for job
```

### AI Chat
```
POST   /api/chat/                    Chat with AI assistant (requires auth)
```

---

## 🔧 CONFIGURATION FILES

### Backend (.env)
```bash
# Database
DB_NAME=jobhunter
DB_USER=postgres
DB_PASSWORD=***
DB_HOST=localhost
DB_PORT=5432

# Django
SECRET_KEY=***
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT
JWT_SECRET_KEY=***
ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7

# AI APIs
GEMINI_API_KEY=***
GROQ_API_KEY=***

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_ALWAYS_EAGER=True

# Email (optional)
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# Monitoring (optional)
SENTRY_DSN=
```

### Frontend (.env.local)
```bash
VITE_API_URL=http://localhost:8000
```

---

## 📈 PERFORMANCE CONSIDERATIONS

### Frontend Optimizations
- ✅ Code splitting (React Router lazy loading)
- ✅ Three.js particle count limited to 1200
- ✅ GSAP animations use GPU acceleration
- ✅ Images optimized and lazy loaded
- ✅ CSS variables for instant theme switching

### Backend Optimizations
- ✅ Database query optimization (select_related, prefetch_related)
- ✅ Redis caching for rate limits
- ✅ Skill gap analysis cached per user-job pair
- ✅ Celery for async job scraping
- ✅ Connection pooling ready (pgbouncer compatible)

### Database Optimizations
- ✅ Indexes on frequently queried fields (email, user_id, job_id)
- ✅ JSONB for flexible schema (parsed CV, skill gap results)
- ✅ Normalized schema (3NF)
- ✅ Query optimization via Django ORM

---

## 🎓 COURSE REQUIREMENTS MET

| Requirement | Implementation | Status |
|------------|----------------|--------|
| API & Microservices | 5 Django apps with REST endpoints | ✅ |
| 2FA | TOTP via django-otp + Google Authenticator | ✅ |
| SQL Cloud Database | PostgreSQL (Azure-ready) | ✅ |
| Monitoring & Logging | Sentry + Django logging + Azure Monitor | ✅ |
| Load Balancing | Nginx (dev) + Azure App Service (prod) | ✅ |
| Cloud Deployment | Azure App Service + Static Web Apps | 🔜 |

---

**Last Updated:** Current session  
**Status:** Architecture complete and verified ✅  
**Next:** Deploy to Azure and monitor performance
