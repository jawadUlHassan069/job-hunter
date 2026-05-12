# Job Hunter 

A cloud-based Smart CV and Job Matching Platform built for CSL 220 Cloud Computing.

**Bahria University Karachi Campus — BSE 6A Spring 2026**

## Team
| Name | Role | Enrollment |
|------|------|------------|
| Salman Khan (Lead) | Backend + ML | 02-131232-121 |
| Zohaib Arshad Noor | Skill Gap + Testing | 02-131232-066 |
| Keyan Majid | Frontend + CV Maker | 02-131232-021 |
| Jawad Ul Hassan | Jobs + ATS | 02-131232-069 |

---

## What it does

- Upload your CV → system parses it with AI
- Get job recommendations matched to your skills via RAG
- See exactly which skills you're missing per job
- Track all your applications in one place
- Get alerts before job deadlines close

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django + Django REST Framework |
| Frontend | React + Vite + Tailwind |
| Database | PostgreSQL (Azure managed) |
| Vector DB | ChromaDB |
| AI/LLM | Claude API (Anthropic) |
| Agents | LangChain + Playwright |
| Queue | Redis + Celery |
| Auth | JWT + 2FA (TOTP) |
| Cloud | Azure App Service |
| Load Balancer | Nginx (dev) + Azure App Gateway (prod) |
| Monitoring | Sentry |

---

## Cloud Concepts Applied

| Concept | Implementation |
|---------|---------------|
| API & Microservices | 5 independent Django apps with REST endpoints |
| 2FA | TOTP via django-otp + Google Authenticator |
| SQL Cloud Database | Azure Database for PostgreSQL |
| Monitoring & Logging | Sentry + Django logging + Azure Monitor |
| Load Balancing | Nginx (dev) + Azure App Service scaling (prod) |

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL
- Redis

### Backend

```bash
# clone the repo
git clone https://github.com/yourname/job-hunter.git
cd job-hunter

# create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# install dependencies
pip install -r backend/requirements.txt

# setup environment variables
cp backend/.env.example backend/.env
# open backend/.env and fill in your values
# ask Salman for DB password and API keys

# run migrations
cd backend
python manage.py migrate

# create admin user
python manage.py createsuperuser

# start server
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Run with Docker (recommended)

```bash
# runs everything — DB, Redis, Django x2, Celery, Nginx, React
docker-compose up --build
```

App will be at: http://localhost

---

## Branch Rules