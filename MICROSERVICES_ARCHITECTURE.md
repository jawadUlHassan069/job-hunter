# Job Hunter - Microservices Architecture

## Overview

This project now uses a **microservices architecture** to separate heavy ML processing from the main backend, enabling full features on free-tier hosting.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Frontend (React + Vite)                                  │  │
│  │  • User Interface                                         │  │
│  │  • Job browsing                                           │  │
│  │  │  • CV upload                                           │  │
│  │  Hosted on: Vercel (Free)                                 │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Main API (Django + DRF)                                  │  │
│  │  • Authentication & Authorization                         │  │
│  │  • CV parsing (PyMuPDF + LLM)                            │  │
│  │  • Job management                                         │  │
│  │  • Skill gap analysis (Gemini API)                       │  │
│  │  • Job scraping (Playwright)                             │  │
│  │  Memory: ~200-300MB                                       │  │
│  │  Hosted on: Render (512MB free tier) ✅                  │  │
│  └───────────────┬────────────────────┬─────────────────────┘  │
│                  │                    │                         │
│                  │ API Call           │ Direct                  │
│                  │ (embeddings)       │ (database)              │
│                  ▼                    ▼                         │
│  ┌─────────────────────────┐  ┌───────────────────────────┐   │
│  │  Embedding Service      │  │  PostgreSQL Database      │   │
│  │  (SentenceTransformer)  │  │  • User data              │   │
│  │  • Generate embeddings  │  │  • CVs & parsed data      │   │
│  │  • Stateless API        │  │  • Jobs & applications    │   │
│  │  Memory: ~400MB         │  │  • ChromaDB vectors       │   │
│  │  Hosted on:             │  │  Hosted on: Neon          │   │
│  │  HuggingFace Spaces ✅  │  │  (Free tier) ✅           │   │
│  └─────────────────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Breakdown

### 1. Frontend Service
**Technology:** React + Vite  
**Hosting:** Vercel (Free)  
**Memory:** N/A  
**Responsibilities:**
- User interface
- Client-side routing
- API calls to backend
- State management

**Why Vercel:**
- Free tier generous for static sites
- Automatic deployments from Git
- Built-in CDN
- Zero config

---

### 2. Main Backend Service
**Technology:** Django + Django REST Framework  
**Hosting:** Render (512MB free tier)  
**Memory Usage:** ~200-300MB  
**Responsibilities:**
- User authentication (JWT + 2FA)
- CV upload & parsing (PyMuPDF + LLM)
- Job management (CRUD operations)
- Job scraping (Playwright)
- Skill gap analysis (Gemini API calls)
- API endpoints for frontend

**Why This Works Now:**
- Embedding generation offloaded → Saves ~400MB RAM
- Can run on free tier without OOM errors
- Fast response times for most operations

---

### 3. Embedding Service (NEW!)
**Technology:** FastAPI + SentenceTransformers  
**Hosting:** HuggingFace Spaces (Free)  
**Memory Usage:** ~400MB  
**Responsibilities:**
- Generate text embeddings using `all-MiniLM-L6-v2`
- Return 384-dimensional vectors
- Stateless operation (no database)

**API Endpoints:**
- `GET /` - Service info
- `GET /health` - Health check
- `POST /embed` - Generate embeddings

**Why HuggingFace Spaces:**
- Free tier with GPU support
- Purpose-built for ML models
- Auto-scaling
- No credit card required

**Tradeoffs:**
- Sleeps after 48h inactivity on free tier
- First request after sleep: ~15-30s wake-up time
- Subsequent requests: Fast (~200-500ms)

---

### 4. Database Service
**Technology:** PostgreSQL  
**Hosting:** Neon (Free tier)  
**Storage:** 0.5GB  
**Responsibilities:**
- Store all application data
- User accounts
- CV data & parsed information
- Job listings
- Applications & saved jobs
- ChromaDB vectors

**Why Neon:**
- Free tier sufficient for development
- Auto-pause when inactive (saves resources)
- Fast resume time
- Compatible with Django

---

## Data Flow

### CV Upload & Matching Flow

```
1. User uploads CV
   ↓
2. Frontend → Main Backend (POST /api/cv/)
   ↓
3. Main Backend:
   - Extracts text from PDF (PyMuPDF)
   - Parses with LLM (Gemini)
   - Calls Embedding Service API
   ↓
4. Embedding Service:
   - Loads SentenceTransformer model (lazy)
   - Generates embedding vector
   - Returns [384 floats]
   ↓
5. Main Backend:
   - Stores embedding in ChromaDB
   - Saves CV to PostgreSQL
   - Returns success to frontend
   ↓
6. Frontend shows success + CV quality score
```

### Job Matching Flow

```
1. User views "Matched Jobs"
   ↓
2. Frontend → Main Backend (GET /api/match/)
   ↓
3. Main Backend:
   - Retrieves CV embedding from ChromaDB
   - Queries similar job embeddings
   - Calculates semantic similarity scores
   - Calls Gemini for skill gap analysis
   - Combines scores (30% semantic + 70% skills)
   ↓
4. Returns ranked job list to frontend
```

---

## Configuration

### Environment Variables

#### Main Backend (.env on Render)
```env
# Django
SECRET_KEY=...
DEBUG=False
ALLOWED_HOSTS=job-hunter-du0n.onrender.com

# Database
DB_HOST=ep-nameless-feather-atua473m.c-9.us-east-1.aws.neon.tech
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=...

# ML Configuration
ENABLE_ML_MATCHING=true
USE_REMOTE_EMBEDDER=true
EMBEDDING_SERVICE_URL=https://YOUR-USERNAME-embedding-service.hf.space

# LLM APIs
GEMINI_API_KEY=...
GROQ_API_KEY=...
```

#### Local Development (.env.local)
```env
# Use local model instead of remote service
USE_REMOTE_EMBEDDER=false
ENABLE_ML_MATCHING=true

# Everything else same as production
```

---

## Deployment Strategy

### Current Setup (All Free Tiers)
| Service | Platform | Cost | Memory | Features |
|---------|----------|------|--------|----------|
| Frontend | Vercel | $0 | N/A | Full |
| Backend | Render | $0 | 512MB | Full ✅ |
| Embeddings | HF Spaces | $0 | N/A | With sleep |
| Database | Neon | $0 | 0.5GB | Full |
| **Total** | | **$0/mo** | | |

### Recommended Upgrade (Production-Ready)
| Service | Platform | Cost | Memory | Features |
|---------|----------|------|--------|----------|
| Frontend | Vercel | $0 | N/A | Full |
| Backend | Render | $7 | 2GB | Full + faster |
| Embeddings | HF Spaces | $0.60 | N/A | Always on |
| Database | Neon | $0 | 0.5GB | Full |
| **Total** | | **$7.60/mo** | | |

---

## Performance Metrics

### Latency

| Operation | Free Tier | With Upgrades |
|-----------|-----------|---------------|
| CV upload | ~3-5s | ~2-3s |
| Embedding (warm) | ~0.5s | ~0.2s |
| Embedding (cold) | ~20-30s | ~0.2s |
| Job matching | ~2-3s | ~1-2s |
| Job scraping | ~30-60s | ~20-30s |

### Memory Usage

| Service | Before | After |
|---------|--------|-------|
| Main Backend | ~700MB (❌ OOM) | ~250MB (✅ Works) |
| Embedding Service | Included | ~400MB (separate) |

---

## Benefits of This Architecture

### ✅ Cost Efficiency
- Run full features on $0/month
- Pay only when you need "always-on" performance

### ✅ Scalability
- Each service can be upgraded independently
- Embedding service can handle multiple backends
- Can add caching layer easily

### ✅ Reliability
- Fallback to local model if remote service fails
- Services fail independently (no cascade failures)
- Can deploy updates without full downtime

### ✅ Development
- Run everything locally for development
- Use remote services in production
- Same codebase, different config

---

## Monitoring & Maintenance

### Health Checks
- Main Backend: `https://job-hunter-du0n.onrender.com/admin/`
- Embedding Service: `https://YOUR-USERNAME-embedding-service.hf.space/health`
- Database: Check Neon dashboard

### Logs
- Render: View in Render dashboard
- HF Spaces: View in Space logs tab
- Neon: Query logs in dashboard

### Common Issues

**Embedding service timeout:**
- Service went to sleep (free tier)
- Solution: Visit URL to wake up, or upgrade to always-on

**High latency:**
- Check if embedding service is warm
- Check Render memory usage
- Consider upgrading tiers

---

## Future Improvements

1. **Add caching layer** (Redis) for embeddings
2. **Batch embedding generation** for better performance
3. **Add monitoring** (Sentry, LogRocket)
4. **Implement rate limiting** on embedding service
5. **Add embedding service health checks** in main backend

---

## Summary

This architecture solves the memory constraint problem by:
1. **Separating concerns** - ML processing separate from business logic
2. **Using free tiers strategically** - Right tool for right job
3. **Maintaining flexibility** - Can run locally or use remote services
4. **Enabling full features** - No compromises on functionality

**Result: Full-featured ML-powered job matching on $0/month! 🎉**
