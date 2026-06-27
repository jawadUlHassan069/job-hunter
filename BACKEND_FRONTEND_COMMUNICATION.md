# Backend ↔ Frontend Communication Explained

## 🎯 What Are Serializers?

**Serializers = Translators between Python and JSON**

Think of serializers as **two-way converters**:

```
Python Object (Database)  ←→  Serializer  ←→  JSON (API Response)
```

### Example:

**In Database (PostgreSQL):**
```python
Job(
    id=1,
    title="Python Developer",
    company="Systems Limited",
    location="Karachi",
    required_skills=["Python", "Django"],
    scraped_at=datetime(2024, 1, 15, 10, 30)
)
```

**Serializer converts to:**
```json
{
  "id": 1,
  "title": "Python Developer",
  "company": "Systems Limited",
  "location": "Karachi",
  "required_skills": ["Python", "Django"],
  "scraped_at": "2024-01-15T10:30:00Z"
}
```

**Frontend receives JSON** and can display it!

---

## 📡 Complete Communication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                                 │
└─────────────────────────────────────────────────────────────────┘
User clicks "Upload CV" button
    ↓
    JavaScript fetch() call
    ↓
POST http://localhost:8000/api/cv/
Headers: {
  "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGc...",
  "Content-Type": "multipart/form-data"
}
Body: {
  file: <PDF binary data>
}

┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (Django)                                                 │
└─────────────────────────────────────────────────────────────────┘
    ↓
1. Django receives HTTP request
    ↓
2. URL Router (urls.py) matches /api/cv/
    ↓
3. Calls CVUploadView.post()
    ↓
4. CVUploadSerializer validates file
    ├─ Check: Is it a PDF?
    ├─ Check: Is size < 5MB?
    └─ ✓ Valid!
    ↓
5. Extract text from PDF (PyMuPDF)
    ↓
6. Parse with Gemini LLM → structured JSON
    ↓
7. Save to PostgreSQL (CV model)
    ↓
8. Trigger Celery task → embed CV
    ↓
9. CVSerializer converts Python object to JSON
    ↓
10. Django sends HTTP response

Response:
Status: 201 Created
Body: {
  "id": 1,
  "file": "/media/cvs/resume.pdf",
  "parsed": {
    "name": "John Doe",
    "email": "john@example.com",
    "skills": ["Python", "Django", "React"]
  },
  "ats_score": 85,
  "uploaded_at": "2024-01-15T10:30:00Z"
}

┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                                 │
└─────────────────────────────────────────────────────────────────┘
    ↓
JavaScript receives JSON response
    ↓
Updates React state
    ↓
UI renders:
  - "CV uploaded successfully!"
  - "ATS Score: 85%"
  - Skills chips: [Python] [Django] [React]
```

---

## 🔍 Detailed Serializer Examples

### 1. JobSerializer

**Purpose:** Convert Job database object → JSON for frontend

```python
# backend/jobs_service/serializers.py

class JobSerializer(serializers.ModelSerializer):
    # Computed field (not in database)
    days_until_deadline = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = ['id', 'title', 'company', 'location', ...]
    
    def get_days_until_deadline(self, obj):
        """Calculate days until deadline (dynamic)"""
        if not obj.deadline:
            return None
        delta = obj.deadline - timezone.now().date()
        return delta.days
```

**What it does:**
```python
# In Django view:
job = Job.objects.get(id=1)
serializer = JobSerializer(job)
return Response(serializer.data)

# Output (JSON sent to frontend):
{
  "id": 1,
  "title": "Python Developer",
  "company": "Systems Limited",
  "days_until_deadline": 14,  ← Calculated by serializer!
  ...
}
```

---

### 2. CVUploadSerializer

**Purpose:** Validate uploaded files before processing

```python
# backend/cv_service/serializers.py

class CVUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    
    def validate_file(self, value):
        # Check file size
        if value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError('File too large')
        
        # Check file type
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError('Only PDF accepted')
        
        return value
```

**What it does:**
- Checks if uploaded file is valid
- Returns error to frontend if not
- Prevents bad data from entering system

---

### 3. ApplicationSerializer (Nested)

**Purpose:** Include related job data in application response

```python
class ApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)  # Nested serializer!
    
    class Meta:
        model = Application
        fields = ['id', 'job', 'status', 'applied_at']
```

**Output (JSON):**
```json
{
  "id": 1,
  "status": "applied",
  "applied_at": "2024-01-15T10:30:00Z",
  "job": {                          ← Full job object nested!
    "id": 42,
    "title": "Python Developer",
    "company": "Systems Limited",
    "location": "Karachi"
  }
}
```

**Why nested?**
- Frontend gets all data in one request
- No need for additional API calls
- Efficient and clean

---

## 🌐 API Endpoints & Communication

### Example 1: Get All Jobs

**Frontend (React):**
```javascript
// frontend/src/api/jobs.js
import axios from './axios';

export const getJobs = async () => {
  const response = await axios.get('/api/jobs/');
  return response.data;
};

// Usage in component:
const jobs = await getJobs();
// jobs = [{id: 1, title: "..."}, {id: 2, ...}]
```

**Backend (Django):**
```python
# backend/jobs_service/views.py

class JobListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        jobs = Job.objects.all()[:50]
        
        # Serialize (Python → JSON)
        serializer = JobSerializer(jobs, many=True)
        
        return Response(serializer.data)
        # Returns: [{id:1, title:"..."}, {id:2, ...}]
```

**Flow:**
```
Frontend → GET /api/jobs/ → JobListView.get()
         → Job.objects.all()
         → JobSerializer(jobs, many=True)
         → Response(JSON) → Frontend
```

---

### Example 2: Upload CV

**Frontend (React):**
```javascript
// frontend/src/api/cv.js

export const uploadCV = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post('/api/cv/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

// Usage:
const result = await uploadCV(pdfFile);
console.log(result.ats_score);  // 85
```

**Backend (Django):**
```python
# backend/cv_service/views.py

class CVUploadView(APIView):
    def post(self, request):
        # 1. Validate file
        serializer = CVUploadSerializer(data=request.FILES)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        # 2. Process CV
        file = serializer.validated_data['file']
        cv = CV.objects.create(user=request.user, file=file)
        
        # ... extract text, parse, embed ...
        
        # 3. Serialize response
        response_data = CVSerializer(cv).data
        response_data['ats_score'] = calculate_score(cv.parsed)
        
        return Response(response_data, status=201)
```

---

### Example 3: Get Job Matches

**Frontend (React):**
```javascript
// frontend/src/api/match.js

export const getMatches = async () => {
  const response = await axios.get('/api/match/');
  return response.data;
};

// Usage:
const matches = await getMatches();
// matches = [
//   {title: "Python Dev", match_score: 94},
//   {title: "Backend Eng", match_score: 87}
// ]
```

**Backend (Django):**
```python
# backend/matching_service/views.py

class MatchJobsView(APIView):
    def get(self, request):
        cv = request.user.cv
        
        # 1. Get similarity scores from ChromaDB
        scores = get_similarity_scores(cv.id, top_k=10)
        # scores = [{job_id: 1, similarity: 94}, ...]
        
        # 2. Fetch jobs from PostgreSQL
        jobs = Job.objects.filter(id__in=job_ids)
        
        # 3. Serialize + add match scores
        results = []
        for score in scores:
            job = jobs_map.get(score['job_id'])
            job_data = JobSerializer(job).data
            job_data['match_score'] = score['similarity']
            results.append(job_data)
        
        return Response(results)
```

---

## 🔐 Authentication Flow

### How JWT Works:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER LOGS IN                                                  │
└─────────────────────────────────────────────────────────────────┘
Frontend sends:
POST /api/auth/login/
Body: {
  "email": "user@example.com",
  "password": "secretpass"
}

Backend responds:
{
  "user": {"id": 1, "email": "user@example.com", "name": "John"},
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",  ← JWT token
    "refresh": "eyJ0eXAiOiJKV1QiLCJh..."
  }
}

Frontend stores token:
localStorage.setItem('access_token', token.access)

┌─────────────────────────────────────────────────────────────────┐
│ 2. USER REQUESTS PROTECTED DATA                                 │
└─────────────────────────────────────────────────────────────────┘
Frontend sends token with every request:
GET /api/jobs/
Headers: {
  "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Backend verifies token:
- Decodes JWT
- Checks signature
- Checks expiration
- Identifies user
- ✓ Allows request

If token is invalid/expired:
- Returns 401 Unauthorized
- Frontend redirects to login
```

---

## 📂 File Structure

### Backend API Structure:
```
backend/
├── config/
│   └── urls.py  ← Main router
├── auth_service/
│   ├── models.py        ← User model
│   ├── serializers.py   ← User, Register serializers
│   ├── views.py         ← Login, Register views
│   └── urls.py          ← /api/auth/*
├── jobs_service/
│   ├── models.py        ← Job, Application models
│   ├── serializers.py   ← Job, Application serializers
│   ├── views.py         ← Job CRUD views
│   └── urls.py          ← /api/jobs/*
└── cv_service/
    ├── models.py        ← CV model
    ├── serializers.py   ← CV serializers
    ├── views.py         ← CV upload/get views
    └── urls.py          ← /api/cv/
```

### Frontend API Structure:
```
frontend/src/
├── api/
│   ├── axios.js     ← Base axios config (sets auth header)
│   ├── auth.js      ← login(), register()
│   ├── jobs.js      ← getJobs(), applyToJob()
│   ├── cv.js        ← uploadCV(), getCV()
│   └── match.js     ← getMatches()
└── pages/
    ├── Dashboard.jsx  ← Calls getJobs(), getApplications()
    ├── Auth.jsx       ← Calls login(), register()
    └── CVAnalysis.jsx ← Calls uploadCV(), getMatches()
```

---

## 🔄 Request/Response Cycle

### Complete Example: Job Matching

```
USER ACTION: Click "Find Matches" button

┌──────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                              │
└──────────────────────────────────────────────────────────────┘
1. Button click → handleFindMatches()
2. Call API: await getMatches()
3. Frontend sends:
   GET http://localhost:8000/api/match/
   Headers: {
     Authorization: "Bearer eyJ0eXAi..."
   }

┌──────────────────────────────────────────────────────────────┐
│ NETWORK (HTTP)                                                │
└──────────────────────────────────────────────────────────────┘
HTTP Request over localhost

┌──────────────────────────────────────────────────────────────┐
│ BACKEND (Django)                                              │
└──────────────────────────────────────────────────────────────┘
4. Django receives request at port 8000
5. URL router: /api/match/ → MatchJobsView.get()
6. JWT Middleware: Verify token → Get user
7. MatchJobsView.get(request):
   a. Fetch user's CV from PostgreSQL
   b. Get CV embedding from ChromaDB
   c. Search job_collection for similar jobs
   d. Calculate match scores (cosine similarity)
   e. Fetch full job details from PostgreSQL
   f. Serialize jobs with JobSerializer
   g. Add match_score to each job
   h. Return Response(serializer.data)

8. Django sends JSON response:
   Status: 200 OK
   Body: [
     {
       "id": 1,
       "title": "Python Developer",
       "company": "Systems Limited",
       "location": "Karachi",
       "required_skills": ["Python", "Django"],
       "match_score": 94
     },
     ...
   ]

┌──────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                              │
└──────────────────────────────────────────────────────────────┘
9. Receives JSON response
10. Updates state: setMatches(response.data)
11. React re-renders:
    - Shows list of matched jobs
    - Displays match scores with colored badges
    - Enables "Apply" buttons
```

---

## 🎯 Why Serializers Are Important

### Without Serializers (Manual):
```python
# ❌ BAD: Manual JSON conversion
def get_job(request, job_id):
    job = Job.objects.get(id=job_id)
    
    # Manual conversion (error-prone!)
    data = {
        'id': job.id,
        'title': job.title,
        'company': job.company,
        'scraped_at': job.scraped_at.isoformat(),  # Need to convert!
        # ... repeat for every field
    }
    
    return JsonResponse(data)
```

### With Serializers (Clean):
```python
# ✅ GOOD: Automatic conversion
def get_job(request, job_id):
    job = Job.objects.get(id=job_id)
    serializer = JobSerializer(job)
    return Response(serializer.data)  # Done!
```

### Benefits:
✅ **Automatic type conversion** (datetime → ISO string)  
✅ **Validation** (check data before saving)  
✅ **Consistent format** (all responses look the same)  
✅ **Less code** (no manual dict building)  
✅ **Nested data** (include related objects easily)  

---

## 📊 Summary

**Serializers =** Translators between Python objects and JSON

**Communication Flow:**
1. Frontend sends HTTP request (JSON)
2. Django receives → URL router → View
3. Serializer validates/deserializes input
4. Business logic (database queries, embeddings, etc.)
5. Serializer serializes output → JSON
6. Django sends HTTP response
7. Frontend receives JSON → Updates UI

**Why This Architecture?**
- **Separation of concerns**: Frontend (UI) ↔ Backend (Logic)
- **Platform independent**: Any client can use API (React, Mobile, etc.)
- **Scalable**: Can add more frontends without changing backend
- **Testable**: Can test API endpoints independently

---

**Your system is a REST API!** 🎯
- Backend exposes JSON endpoints
- Frontend consumes them via HTTP
- Serializers handle the translation
