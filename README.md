<div align="center">

# 🎯 Job Hunter

### AI-Powered CV Optimization & Smart Job Matching Platform

[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat&logo=django)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-FF6B6B?style=flat)](https://www.trychroma.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*Built for CSL 220 Cloud Computing - Bahria University Karachi Campus BSE 6A Spring 2026*

[Features](#-features) • [Tech Stack](#-tech-stack) • [Setup](#-quick-start) • [Architecture](#-architecture) • [Team](#-team)

</div>

---

## 🚀 What Makes This Special?

Job Hunter isn't just another job board - it's an intelligent career assistant that:

- 🤖 **AI-Powered CV Analysis**: Upload your CV and get instant AI-powered parsing using Gemini API
- 🎯 **Smart Job Matching**: RAG-based recommendation engine with ChromaDB vector search delivers personalized job matches
- 📊 **Skill Gap Analysis**: Know exactly what skills you need for your dream job with detailed gap reports
- 💬 **AI Career Assistant**: Chat with an AI agent powered by Groq API for career guidance
- 🔒 **Enterprise-Grade Security**: JWT authentication + 2FA (TOTP) with Google Authenticator
- 🎨 **Beautiful UI**: Modern React frontend with Three.js particles and GSAP animations
- ⚡ **Real-Time Job Scraping**: Automated job collection from multiple platforms using Playwright

---

## ✨ Features

### For Job Seekers
- **Intelligent CV Parser**: Extracts skills, experience, and education using Gemini AI
- **ATS Score Calculator**: Optimize your CV for Applicant Tracking Systems
- **Personalized Job Recommendations**: Vector similarity matching using sentence-transformers
- **Skill Gap Analysis**: See what you need to learn for each position
- **Application Tracking**: Manage all applications in one dashboard
- **Deadline Alerts**: Never miss an application deadline

### For Developers
- **Microservices Architecture**: 5 independent Django apps (auth, cv, jobs, matching, chat)
- **Vector Database Integration**: ChromaDB for semantic search
- **Async Task Processing**: Celery + Redis for background jobs
- **Rate Limiting**: Redis-backed rate limiting on all endpoints
- **Comprehensive API**: RESTful API with 15+ endpoints
- **Docker Support**: Full containerization with docker-compose

---

## 🛠 Tech Stack

<table>
<tr>
<td width="50%">

### Backend
- **Framework**: Django 4.2 + DRF 3.15
- **AI/ML**: 
  - Gemini API (CV parsing)
  - Groq API (AI chat)
  - sentence-transformers (embeddings)
  - LangChain (RAG orchestration)
- **Vector DB**: ChromaDB 0.4.24
- **Task Queue**: Celery + Redis
- **Auth**: JWT + django-otp (2FA)
- **Scraping**: Playwright + BeautifulSoup

</td>
<td width="50%">

### Frontend
- **Framework**: React 18 + Vite 5
- **Styling**: Tailwind CSS + Custom CSS
- **Animations**: 
  - Three.js (particle effects)
  - GSAP (smooth transitions)
- **State**: React Hooks + Context API
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router DOM 6

</td>
</tr>
<tr>
<td width="50%">

### Infrastructure
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Reverse Proxy**: Nginx
- **Monitoring**: Sentry
- **Cloud**: Azure (App Service + Database)

</td>
<td width="50%">

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions ready
- **Load Balancing**: Nginx (dev) + Azure Gateway (prod)
- **Logging**: Django logging + Azure Monitor

</td>
</tr>
</table>

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Vite + Tailwind)            │
│  • Three.js Particles  • GSAP Animations  • Dark Mode   │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JWT)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                Django Backend (5 Microservices)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Auth   │ │    CV    │ │   Jobs   │ │ Matching │  │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│       │             │             │             │        │
│       └─────────────┼─────────────┼─────────────┘        │
│                     ▼             ▼             ▼        │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐        │
│  │  PostgreSQL  │ │  Redis   │ │   ChromaDB   │        │
│  │   Database   │ │  Cache   │ │ Vector Store │        │
│  └──────────────┘ └──────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────┘
```

**Key Highlights:**
- 🔐 **Security Layers**: CORS → Rate Limiting → JWT → Authorization → Data Protection
- 🎯 **RAG Pipeline**: CV embeddings + Job embeddings → Cosine similarity → Top matches
- ⚡ **Async Jobs**: Celery workers handle scraping and heavy processing
- 📊 **Caching Strategy**: Redis for rate limits, sessions, and skill gap results

---

## 🎓 Cloud Computing Concepts Implemented

| Requirement | Implementation | Status |
|------------|----------------|--------|
| **API & Microservices** | 5 Django apps with 15+ REST endpoints | ✅ |
| **2FA Authentication** | TOTP via django-otp + Google Authenticator | ✅ |
| **SQL Cloud Database** | PostgreSQL (Azure-ready) | ✅ |
| **Monitoring & Logging** | Sentry + Django logging + Azure Monitor | ✅ |
| **Load Balancing** | Nginx (dev) + Azure App Service (prod) | ✅ |
| **Cloud Deployment** | Azure App Service + Static Web Apps | 🔜 |

---

## 🚀 Quick Start

### Prerequisites
```bash
Python 3.11+
Node.js 20+
PostgreSQL 15+
Redis 7+
```

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/job-hunter.git
cd job-hunter
```

### 2️⃣ Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys and database credentials

# Run migrations
cd backend
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4️⃣ Docker Setup (Recommended)
```bash
# Start all services (PostgreSQL, Redis, Django, Celery, Nginx, React)
docker-compose up --build
```

Access the app at: **http://localhost:3000**

---

## 📡 API Endpoints

<details>
<summary><b>Authentication</b></summary>

- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login with credentials
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user profile
- `GET /api/auth/2fa/setup/` - Get QR code for 2FA
- `POST /api/auth/2fa/verify/` - Verify 2FA code

</details>

<details>
<summary><b>CV Management</b></summary>

- `GET /api/cv/` - Get user's CV
- `POST /api/cv/upload/` - Upload new CV (PDF/DOCX)
- `DELETE /api/cv/` - Delete CV
- `GET /api/cv/ats-score/` - Get ATS optimization score

</details>

<details>
<summary><b>Jobs</b></summary>

- `GET /api/jobs/` - List all jobs
- `GET /api/jobs/?search=python` - Search jobs
- `GET /api/jobs/<id>/` - Get job details

</details>

<details>
<summary><b>Matching & AI</b></summary>

- `GET /api/match/jobs/` - Get personalized job matches
- `GET /api/match/skill-gap/<id>/` - Get skill gap analysis
- `POST /api/chat/` - Chat with AI career assistant

</details>

---

## 🎨 Screenshots

<div align="center">

### Landing Page with Three.js Particles
![Landing](https://via.placeholder.com/800x400?text=Landing+Page+Preview)

### AI-Powered Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Preview)

### Smart Job Matching
![Matching](https://via.placeholder.com/800x400?text=Job+Matching+Preview)

</div>

---

## 👥 Team

| Name | Role | Enrollment | GitHub |
|------|------|------------|--------|
| **Jawad Ul Hassan** | Lead Developer + ML/AI | 02-131232-069 | [@jawad](https://github.com/jawad) |
| **Salman Khan** | Jobs Service + ATS Scoring | 02-131232-121 | [@salman](https://github.com/salman) |
| **Zohaib Arshad Noor** | Skill Gap Analysis + Testing | 02-131232-066 | [@zohaib](https://github.com/zohaib) |
| **Keyan Majid** | Frontend + CV Maker | 02-131232-021 | [@keyan](https://github.com/keyan) |

---

## 📝 Recent Updates

### 🎉 Latest Features (v1.0)
- ✅ Complete microservices architecture with 5 Django apps
- ✅ AI-powered CV parsing using Gemini API
- ✅ RAG-based job matching with ChromaDB vector store
- ✅ Real-time AI chat assistant powered by Groq
- ✅ Secure JWT authentication with 2FA support
- ✅ Modern React UI with Three.js and GSAP animations
- ✅ Automated job scraping with Playwright
- ✅ Redis-backed rate limiting and caching
- ✅ Docker containerization with docker-compose
- ✅ Production-ready with Nginx and Sentry monitoring

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/yourusername/job-hunter/issues).

---

## 📧 Contact

For questions or support, reach out to the team:
- **Email**: jawadulhassan@example.com
- **University**: Bahria University Karachi Campus

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by Team Job Hunter

</div>
