# Job Hunter — API Specification

**Base URL (development):** `http://localhost:8000`
**Base URL (production):** `https://your-azure-app.azurewebsites.net`

All protected endpoints require this header:

```
Authorization: Bearer <access_token>
```

All request/response bodies are JSON unless stated otherwise.

---

## Table of Contents

- [Auth Service](#auth-service)
- [CV Service](#cv-service)
- [Jobs Service](#jobs-service)
- [Matching Service](#matching-service)
- [Global Errors](#global-error-responses)
- [Frontend Integration Notes](#frontend-integration-notes)

---

## AUTH SERVICE

**Base path:** `/api/auth/`

---

### POST `/api/auth/register/`

Register a new user account.

**Auth required:** No

**Request body:**

```json
{
    "email": "user@example.com",
    "name": "Full Name",
    "password": "minimum8chars"
}
```

**Success response — 201:**

```json
{
    "user": {
        "id": 1,
        "email": "user@example.com",
        "name": "Full Name",
        "is_2fa_enabled": false,
        "created_at": "2026-05-13T10:00:00Z"
    },
    "tokens": {
        "access": "eyJ0eXAiOiJKV1...",
        "refresh": "eyJ0eXAiOiJKV1..."
    }
}
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | Email already exists |
| `400` | Password less than 8 characters |
| `400` | Name or email missing |

---

### POST `/api/auth/login/`

Login with email and password.

**Auth required:** No

**Request body:**

```json
{
    "email": "user@example.com",
    "password": "yourpassword"
}
```

**Success response — 200 (2FA disabled):**

```json
{
    "user": {
        "id": 1,
        "email": "user@example.com",
        "name": "Full Name",
        "is_2fa_enabled": false,
        "created_at": "2026-05-13T10:00:00Z"
    },
    "tokens": {
        "access": "eyJ0eXAiOiJKV1...",
        "refresh": "eyJ0eXAiOiJKV1..."
    }
}
```

**Success response — 200 (2FA enabled):**

```json
{
    "requires_2fa": true,
    "user_id": 1
}
```

> Frontend must show OTP input screen and call `/api/auth/2fa/verify/` next.

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | Email or password missing |
| `401` | Invalid credentials |
| `403` | Account is disabled |

---

### POST `/api/auth/token/refresh/`

Get a new access token using a refresh token.

**Auth required:** No

**Request body:**

```json
{
    "refresh": "eyJ0eXAiOiJKV1..."
}
```

**Success response — 200:**

```json
{
    "access": "eyJ0eXAiOiJKV1..."
}
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `401` | Refresh token invalid or expired |

---

### GET `/api/auth/me/`

Get the currently logged in user's profile.

**Auth required:** Yes

**Request body:** None

**Success response — 200:**

```json
{
    "id": 1,
    "email": "user@example.com",
    "name": "Full Name",
    "is_2fa_enabled": false,
    "created_at": "2026-05-13T10:00:00Z"
}
```

---

### GET `/api/auth/2fa/setup/`

Generate a QR code for Google Authenticator setup.

**Auth required:** Yes

**Request body:** None

**Success response — 200:**

```json
{
    "qr_code": "data:image/png;base64,iVBORw0KGgo...",
    "secret": "JBSWY3DPEHPK3PXP"
}
```

> Frontend renders `qr_code` as an `<img src="{qr_code}" />` tag.
> User scans with Google Authenticator.
> Then call POST `/api/auth/2fa/setup/` with the 6-digit code to confirm.

---

### POST `/api/auth/2fa/setup/`

Confirm 2FA setup using the 6-digit code from Google Authenticator.

**Auth required:** Yes

**Request body:**

```json
{
    "code": "123456"
}
```

**Success response — 200:**

```json
{
    "message": "2FA enabled successfully"
}
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | Invalid code |
| `400` | No pending 2FA setup (call GET first) |

---

### POST `/api/auth/2fa/verify/`

Verify OTP code after password login when 2FA is enabled.

**Auth required:** No

**Request body:**

```json
{
    "user_id": 1,
    "code": "123456"
}
```

**Success response — 200:**

```json
{
    "user": {
        "id": 1,
        "email": "user@example.com",
        "name": "Full Name",
        "is_2fa_enabled": true,
        "created_at": "2026-05-13T10:00:00Z"
    },
    "tokens": {
        "access": "eyJ0eXAiOiJKV1...",
        "refresh": "eyJ0eXAiOiJKV1..."
    }
}
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | Invalid OTP code |
| `400` | user_id or code missing |
| `400` | Invalid user_id |

---

## CV SERVICE

**Base path:** `/api/cv/`

---

### POST `/api/cv/`

Upload a CV PDF. System extracts text and parses it with Claude AI automatically.

**Auth required:** Yes

**Request body:** `multipart/form-data`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `file` | File (PDF) | Yes | Max 5MB, must be .pdf |

**Success response — 201 (first upload):**

```json
{
    "id": 1,
    "file": "/media/cvs/your_cv.pdf",
    "raw_text": "John Doe\nSoftware Engineer\nKarachi, Pakistan...",
    "parsed": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+92 300 1234567",
        "location": "Karachi, Pakistan",
        "summary": "Experienced software engineer with 2 years in Django...",
        "skills": [
            "Python",
            "Django",
            "React",
            "PostgreSQL",
            "REST API"
        ],
        "experience": [
            {
                "company": "Tech Corp",
                "role": "Software Engineer",
                "duration": "2022-2024",
                "description": "Built scalable web applications using Django"
            }
        ],
        "education": [
            {
                "institution": "Bahria University",
                "degree": "BS",
                "field": "Software Engineering",
                "year": "2024"
            }
        ],
        "languages": ["English", "Urdu"],
        "certifications": ["AWS Certified Developer"]
    },
    "uploaded_at": "2026-05-13T10:00:00Z"
}
```

**Success response — 200 (re-upload, replaces existing CV):**

Same structure as 201.

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | File is not a PDF |
| `400` | File exceeds 5MB |
| `400` | No file provided |
| `401` | Not authenticated |

---

### GET `/api/cv/`

Get the currently logged in user's parsed CV.

**Auth required:** Yes

**Request body:** None

**Success response — 200:**

```json
{
    "id": 1,
    "file": "/media/cvs/your_cv.pdf",
    "raw_text": "John Doe\nSoftware Engineer...",
    "parsed": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+92 300 1234567",
        "location": "Karachi, Pakistan",
        "summary": "...",
        "skills": ["Python", "Django", "React"],
        "experience": [ ... ],
        "education": [ ... ],
        "languages": ["English", "Urdu"],
        "certifications": []
    },
    "uploaded_at": "2026-05-13T10:00:00Z"
}
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `404` | User has not uploaded a CV yet |
| `401` | Not authenticated |

---

## JOBS SERVICE

**Base path:** `/api/jobs/`

---

### GET `/api/jobs/`

Get all available job listings. Supports filtering by deadline and skill.

**Auth required:** Yes

**Query parameters:**

| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `deadline` | string | Filter jobs closing within 7 days | `?deadline=soon` |
| `skill` | string | Filter by required skill keyword | `?skill=Python` |

**Example URLs:**

```
GET /api/jobs/
GET /api/jobs/?deadline=soon
GET /api/jobs/?skill=Python
GET /api/jobs/?skill=React
```

**Success response — 200:**

```json
[
    {
        "id": 1,
        "title": "Python Developer",
        "company": "Systems Ltd",
        "location": "Karachi, Pakistan",
        "description": "We are looking for an experienced Python developer...",
        "url": "https://rozee.pk/job/python-developer-123",
        "source": "rozee",
        "required_skills": ["Python", "Django", "PostgreSQL", "REST API"],
        "deadline": "2026-05-20",
        "days_until_deadline": 7,
        "is_deadline_confirmed": true,
        "posted_at": null,
        "scraped_at": "2026-05-13T10:00:00Z"
    },
    {
        "id": 2,
        "title": "React Frontend Developer",
        "company": "Arbisoft",
        "location": "Lahore, Pakistan",
        "description": "Join our frontend team...",
        "url": "https://rozee.pk/job/react-dev-456",
        "source": "rozee",
        "required_skills": ["React", "JavaScript", "Tailwind CSS"],
        "deadline": "2026-05-25",
        "days_until_deadline": 12,
        "is_deadline_confirmed": false,
        "posted_at": null,
        "scraped_at": "2026-05-13T10:00:00Z"
    }
]
```

> Returns maximum 50 jobs per request.
> `days_until_deadline` is `null` if no deadline set.
> `days_until_deadline` is negative if deadline has passed.

---

### POST `/api/jobs/applications/`

Apply to a job. Creates an application record with status `applied`.

**Auth required:** Yes

**Request body:**

```json
{
    "job_id": 1
}
```

**Success response — 201 (new application):**

```json
{
    "id": 1,
    "job": {
        "id": 1,
        "title": "Python Developer",
        "company": "Systems Ltd",
        "location": "Karachi, Pakistan",
        "description": "...",
        "url": "https://rozee.pk/job/123",
        "source": "rozee",
        "required_skills": ["Python", "Django"],
        "deadline": "2026-05-20",
        "days_until_deadline": 7,
        "is_deadline_confirmed": true,
        "posted_at": null,
        "scraped_at": "2026-05-13T10:00:00Z"
    },
    "status": "applied",
    "notes": "",
    "applied_at": "2026-05-13T10:00:00Z",
    "updated_at": "2026-05-13T10:00:00Z"
}
```

**Success response — 200 (already applied, no duplicate created):**

Same structure as 201.

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | job_id missing from request |
| `404` | Job not found |
| `401` | Not authenticated |

---

### GET `/api/jobs/applications/`

Get all job applications for the currently logged in user.

**Auth required:** Yes

**Request body:** None

**Success response — 200:**

```json
[
    {
        "id": 1,
        "job": {
            "id": 1,
            "title": "Python Developer",
            "company": "Systems Ltd",
            ...
        },
        "status": "applied",
        "notes": "",
        "applied_at": "2026-05-13T10:00:00Z",
        "updated_at": "2026-05-13T10:00:00Z"
    },
    {
        "id": 2,
        "job": {
            "id": 3,
            "title": "Backend Engineer",
            "company": "Careem",
            ...
        },
        "status": "interview",
        "notes": "Interview on May 20th at 3pm",
        "applied_at": "2026-05-10T09:00:00Z",
        "updated_at": "2026-05-12T14:00:00Z"
    }
]
```

**Possible status values:**

| Status | Meaning |
|--------|---------|
| `applied` | Application submitted |
| `interview` | Interview scheduled |
| `offer` | Offer received |
| `rejected` | Application rejected |

---

### PATCH `/api/jobs/applications/<id>/`

Update an application's status or notes. Used for ATS (Application Tracking).

**Auth required:** Yes

**URL parameter:** `id` — the application ID from GET /applications/

**Request body (all fields optional):**

```json
{
    "status": "interview",
    "notes": "Interview scheduled for May 20th at 3pm"
}
```

**Success response — 200:**

```json
{
    "id": 1,
    "job": { ... full job object ... },
    "status": "interview",
    "notes": "Interview scheduled for May 20th at 3pm",
    "applied_at": "2026-05-13T10:00:00Z",
    "updated_at": "2026-05-13T10:05:00Z"
}
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `404` | Application not found or belongs to another user |
| `401` | Not authenticated |

---

### POST `/api/jobs/saved/`

Save a job to the user's bookmarks.

**Auth required:** Yes

**Request body:**

```json
{
    "job_id": 1
}
```

**Success response — 201 (newly saved):**

```json
{
    "id": 1,
    "job": {
        "id": 1,
        "title": "Python Developer",
        "company": "Systems Ltd",
        ...
    },
    "saved_at": "2026-05-13T10:00:00Z"
}
```

**Success response — 200 (already saved, no duplicate):**

Same structure as 201.

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | job_id missing |
| `404` | Job not found |
| `401` | Not authenticated |

---

### GET `/api/jobs/saved/`

Get all bookmarked jobs for the current user.

**Auth required:** Yes

**Request body:** None

**Success response — 200:**

```json
[
    {
        "id": 1,
        "job": {
            "id": 1,
            "title": "Python Developer",
            "company": "Systems Ltd",
            "location": "Karachi",
            "required_skills": ["Python", "Django"],
            "deadline": "2026-05-20",
            "days_until_deadline": 7,
            ...
        },
        "saved_at": "2026-05-13T10:00:00Z"
    }
]
```

---

### DELETE `/api/jobs/saved/<id>/`

Remove a job from bookmarks.

**Auth required:** Yes

**URL parameter:** `id` — the saved job ID from GET /saved/

**Request body:** None

**Success response — 204 No Content**

> Response body is empty. This is correct behaviour for DELETE.

**Error responses:**

| Status | Reason |
|--------|--------|
| `404` | Saved job not found or belongs to another user |
| `401` | Not authenticated |

---

## MATCHING SERVICE

**Base path:** `/api/match/`

---

### GET `/api/match/`

Get top 10 jobs semantically matched to the current user's CV using RAG and ChromaDB.

**Auth required:** Yes

**Request body:** None

**Notes:**

- User must have uploaded a CV first
- Jobs are ranked by similarity score — best match comes first
- If CV was just uploaded, wait 10-15 seconds for background embedding to complete
- More jobs in database = better matching results

**Success response — 200:**

```json
[
    {
        "id": 3,
        "title": "Python Developer",
        "company": "Arbisoft",
        "location": "Lahore",
        "description": "Looking for a Python developer with Django experience...",
        "url": "https://rozee.pk/job/789",
        "source": "rozee",
        "required_skills": ["Python", "Django", "REST API", "PostgreSQL"],
        "deadline": "2026-05-25",
        "days_until_deadline": 12,
        "is_deadline_confirmed": true,
        "posted_at": null,
        "scraped_at": "2026-05-13T10:00:00Z"
    },
    {
        "id": 1,
        "title": "Backend Engineer",
        "company": "Careem",
        ...
    }
]
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | No CV uploaded yet |
| `400` | CV parsing failed, re-upload CV |
| `202` | CV not yet indexed, try again in a moment |
| `500` | Matching engine error |
| `401` | Not authenticated |

---

### GET `/api/match/gap/<job_id>/`

Get a detailed skill gap analysis between the user's CV and a specific job.

**Auth required:** Yes

**URL parameter:** `job_id` — the job ID from any jobs endpoint

**Request body:** None

**Success response — 200:**

```json
{
    "match_score": 72,
    "strong_matches": [
        "Python",
        "Django",
        "REST API"
    ],
    "partial_matches": [
        {
            "skill": "Kubernetes",
            "candidate_has": "Docker",
            "gap": "Learn Kubernetes orchestration and pod management"
        },
        {
            "skill": "AWS",
            "candidate_has": "basic cloud knowledge",
            "gap": "Get hands-on with AWS EC2, S3, and RDS"
        }
    ],
    "missing_skills": [
        "Terraform",
        "Jenkins",
        "GraphQL"
    ],
    "recommendations": [
        "Complete the AWS Certified Developer Associate course",
        "Build and deploy a project using Kubernetes",
        "Learn Terraform for infrastructure as code",
        "Build a side project using GraphQL",
        "Set up a CI/CD pipeline using Jenkins or GitHub Actions"
    ],
    "summary": "Strong Python and Django background aligns well with the core backend requirements. Main gaps are in cloud infrastructure and DevOps tooling which can be addressed through targeted learning."
}
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | No CV uploaded yet |
| `404` | Job not found |
| `500` | Skill gap analysis failed |
| `401` | Not authenticated |

---

## Global Error Responses

These apply to every single endpoint.

**401 — Not authenticated:**

```json
{
    "detail": "Authentication credentials were not provided."
}
```

**401 — Token expired or invalid:**

```json
{
    "detail": "Given token not valid for any token type",
    "code": "token_not_valid",
    "messages": [
        {
            "token_class": "AccessToken",
            "token_type": "access",
            "message": "Token is invalid or expired"
        }
    ]
}
```

**403 — Permission denied:**

```json
{
    "detail": "You do not have permission to perform this action."
}
```

**404 — Not found:**

```json
{
    "error": "Resource not found"
}
```

**500 — Server error:**

```json
{
    "error": "Internal server error description"
}
```

---

## Frontend Integration Notes

### Axios base instance

```javascript
// src/api/axios.js
import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8000',
})

// attach JWT token to every request automatically
api.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// auto refresh token when access token expires
api.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401) {
            const refresh = localStorage.getItem('refresh_token')
            if (refresh) {
                try {
                    const res = await axios.post(
                        'http://localhost:8000/api/auth/token/refresh/',
                        { refresh }
                    )
                    localStorage.setItem('access_token', res.data.access)
                    error.config.headers.Authorization = `Bearer ${res.data.access}`
                    return axios(error.config)
                } catch {
                    localStorage.clear()
                    window.location.href = '/login'
                }
            }
        }
        return Promise.reject(error)
    }
)

export default api
```

### Auth API calls

```javascript
// src/api/auth.js
import api from './axios'
import axios from 'axios'

export const register = (data) =>
    axios.post('http://localhost:8000/api/auth/register/', data)

export const login = (data) =>
    axios.post('http://localhost:8000/api/auth/login/', data)

export const refreshToken = (refresh) =>
    axios.post('http://localhost:8000/api/auth/token/refresh/', { refresh })

export const getMe = () =>
    api.get('/api/auth/me/')

export const setup2FA = () =>
    api.get('/api/auth/2fa/setup/')

export const confirm2FA = (code) =>
    api.post('/api/auth/2fa/setup/', { code })

export const verify2FA = (user_id, code) =>
    axios.post('http://localhost:8000/api/auth/2fa/verify/', { user_id, code })
```

### CV API calls

```javascript
// src/api/cv.js
import api from './axios'

export const uploadCV = (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/cv/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

export const getCV = () =>
    api.get('/api/cv/')
```

### Jobs API calls

```javascript
// src/api/jobs.js
import api from './axios'

export const getJobs = (params = {}) =>
    api.get('/api/jobs/', { params })

export const getJobsSoon = () =>
    api.get('/api/jobs/', { params: { deadline: 'soon' } })

export const getJobsBySkill = (skill) =>
    api.get('/api/jobs/', { params: { skill } })

export const applyToJob = (job_id) =>
    api.post('/api/jobs/applications/', { job_id })

export const getApplications = () =>
    api.get('/api/jobs/applications/')

export const updateApplication = (id, data) =>
    api.patch(`/api/jobs/applications/${id}/`, data)

export const saveJob = (job_id) =>
    api.post('/api/jobs/saved/', { job_id })

export const getSavedJobs = () =>
    api.get('/api/jobs/saved/')

export const unsaveJob = (id) =>
    api.delete(`/api/jobs/saved/${id}/`)
```

### Matching API calls

```javascript
// src/api/match.js
import api from './axios'

export const getMatchedJobs = () =>
    api.get('/api/match/')

export const getSkillGap = (job_id) =>
    api.get(`/api/match/gap/${job_id}/`)
```

### Login flow for Keyan

```
Step 1 — call POST /api/auth/login/

Step 2a — if response has tokens:
    localStorage.setItem('access_token', response.tokens.access)
    localStorage.setItem('refresh_token', response.tokens.refresh)
    redirect to /dashboard

Step 2b — if response has requires_2fa: true:
    store user_id temporarily
    show OTP input screen

Step 3 (only if 2FA) — call POST /api/auth/2fa/verify/
    with { user_id, code }
    if success:
        localStorage.setItem('access_token', response.tokens.access)
        localStorage.setItem('refresh_token', response.tokens.refresh)
        redirect to /dashboard
```

### ATS status flow

```
applied → interview → offer
applied → rejected
interview → rejected
```

---

## Quick Reference — All Endpoints

```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/token/refresh/
GET    /api/auth/me/
GET    /api/auth/2fa/setup/
POST   /api/auth/2fa/setup/
POST   /api/auth/2fa/verify/

POST   /api/cv/
GET    /api/cv/

GET    /api/jobs/
GET    /api/jobs/?deadline=soon
GET    /api/jobs/?skill=<keyword>
POST   /api/jobs/applications/
GET    /api/jobs/applications/
PATCH  /api/jobs/applications/<id>/
POST   /api/jobs/saved/
GET    /api/jobs/saved/
DELETE /api/jobs/saved/<id>/

GET    /api/match/
GET    /api/match/gap/<job_id>/
```

---

*Last updated: May 2026 — Job Hunter BSE 6A Spring 2026*
