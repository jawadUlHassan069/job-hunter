# ChromaDB Explained - Where & What It Is

## 📍 Physical Location on Your Computer

```
C:\Users\ANONYMOUUSS\Desktop\job-hunter (backup)\job-hunter\
└── ml/
    └── rag/
        ├── embedder.py  ← Code that uses ChromaDB
        └── chroma_store/  ← DATABASE FOLDER (your embeddings are here!)
            ├── chroma.sqlite3  ← Metadata (collection names, IDs, etc.)
            ├── 16979929-0b3d-4fa1-8867-d65f9b63b076/  ← Collection 1 (cvs)
            │   ├── data_level0.bin  ← CV embedding vectors
            │   ├── header.bin
            │   ├── length.bin
            │   └── link_lists.bin  ← HNSW index for fast search
            └── c282448a-05f8-4a45-bda8-4e9abb997a2a/  ← Collection 2 (jobs)
                ├── data_level0.bin  ← Job embedding vectors
                ├── header.bin
                ├── length.bin
                └── link_lists.bin
```

## 🗄️ What is ChromaDB?

**ChromaDB = Vector Database** (specialized database for AI embeddings)

Think of it like this:

| Regular Database (PostgreSQL) | Vector Database (ChromaDB) |
|-------------------------------|----------------------------|
| Stores: text, numbers, dates  | Stores: 384-dimensional vectors |
| Search: exact match (WHERE name='John') | Search: similarity (find similar vectors) |
| Fast at: filtering, sorting | Fast at: "find items like this" |
| Example: `SELECT * FROM jobs WHERE location='Karachi'` | Example: "Find jobs similar to this CV" |

## 📦 What Are Collections?

**Collections = Tables in regular databases**

In your system, you have **2 collections**:

### 1. `cv_collection` (name: "cvs")
**Stores**: CV embeddings

**Each entry contains:**
```python
{
  'id': '1',  # CV ID from PostgreSQL
  'embedding': [0.023, -0.145, 0.891, ..., 0.034],  # 384 numbers
  'document': 'John Doe. Software engineer with 5 years... Skills: Python Django React',
  'metadata': {
    'cv_id': 1,
    'skills': 'Python Django React',
    'name': 'John Doe'
  }
}
```

### 2. `job_collection` (name: "jobs")
**Stores**: Job embeddings

**Each entry contains:**
```python
{
  'id': '42',  # Job ID from PostgreSQL
  'embedding': [0.045, -0.132, 0.765, ..., 0.089],  # 384 numbers
  'document': 'Senior Python Developer. We are looking for... Required: Python Django PostgreSQL',
  'metadata': {
    'job_id': 42,
    'title': 'Senior Python Developer',
    'skills': 'Python Django PostgreSQL'
  }
}
```

## 🔍 How Collections Are Created

**In `ml/rag/embedder.py`:**

```python
import chromadb
from pathlib import Path

# 1. Point to storage folder
CHROMA_PATH = Path(__file__).resolve().parent / 'chroma_store'

# 2. Create client (connects to folder)
client = chromadb.PersistentClient(path=str(CHROMA_PATH))

# 3. Create/Get collections
cv_collection = client.get_or_create_collection(
    'cvs',  # Collection name
    metadata={'hnsw:space': 'cosine'}  # Use cosine similarity
)

job_collection = client.get_or_create_collection(
    'jobs',  # Collection name
    metadata={'hnsw:space': 'cosine'}
)
```

**What happens:**
- First time: Creates new collection, stores UUIDs in `chroma.sqlite3`
- Next time: Loads existing collection from disk
- Collections persist between server restarts!

## 💾 What's Inside Each File?

### `chroma.sqlite3`
- SQLite database
- Stores metadata: collection names, UUIDs, document IDs
- You can open it with: `sqlite3 chroma.sqlite3`

### UUID Folders (e.g., `16979929-0b3d-4fa1-8867-d65f9b63b076/`)
Each folder = 1 collection

**Inside each folder:**
- `data_level0.bin` - **The actual embedding vectors** (384 floats per job/CV)
- `header.bin` - Binary header information
- `length.bin` - Length metadata
- `link_lists.bin` - **HNSW index** (enables fast similarity search)

## 🔬 How to Inspect ChromaDB

### Option 1: Python Shell
```bash
cd backend
python manage.py shell
```

```python
>>> from ml.rag.embedder import cv_collection, job_collection

# Check counts
>>> print(f"CVs: {cv_collection.count()}")
>>> print(f"Jobs: {job_collection.count()}")

# Peek at first entry
>>> cv_collection.peek(limit=1)
{
  'ids': ['1'],
  'embeddings': [[0.023, -0.145, ..., 0.034]],  # 384 numbers
  'documents': ['John Doe. Software engineer...'],
  'metadatas': [{'cv_id': 1, 'name': 'John Doe', ...}]
}

# Get specific CV
>>> cv_collection.get(ids=['1'])

# List all IDs
>>> cv_collection.get()['ids']
['1', '2', '3']

# Check embedding size
>>> len(cv_collection.peek(limit=1)['embeddings'][0])
384  # ✓ Correct!
```

### Option 2: Check Folder Size
```bash
# Windows PowerShell
cd "C:\Users\ANONYMOUUSS\Desktop\job-hunter (backup)\job-hunter\ml\rag\chroma_store"
Get-ChildItem -Recurse | Measure-Object -Property Length -Sum
```

**Size guide:**
- Empty: ~100 KB
- 10 jobs: ~500 KB
- 100 jobs: ~3 MB
- 1000 jobs: ~30 MB

## 🎯 How Matching Works

### Step-by-Step:

**1. User uploads CV**
```python
# Backend receives PDF
cv_text = extract_text_from_pdf(file)

# Create embedding (384 numbers)
vector = embedder.encode(cv_text).tolist()

# Store in cv_collection
cv_collection.upsert(
    ids=['1'],
    embeddings=[vector],
    documents=[cv_text],
    metadatas=[{'cv_id': 1, 'name': 'John'}]
)
```

**2. User requests matches**
```python
# Get CV embedding
cv_vector = cv_collection.get(ids=['1'])['embeddings'][0]

# Search for similar job vectors
matches = job_collection.query(
    query_embeddings=[cv_vector],
    n_results=10
)
```

**3. ChromaDB magic**
- Uses HNSW algorithm (Hierarchical Navigable Small World)
- Compares cv_vector with all job vectors
- Finds 10 closest matches (cosine similarity)
- Returns in milliseconds (even with millions of jobs!)

**4. Calculate scores**
```python
for distance in matches['distances'][0]:
    similarity = (1 - distance / 2) * 100
    # distance 0 = 100% match
    # distance 2 = 0% match
```

## 📊 Collection Structure Analogy

Think of collections like Excel sheets:

### cv_collection (CVs sheet)
| ID | Embedding (384 cols) | Document | Name | Skills |
|----|---------------------|----------|------|--------|
| 1  | [0.02, -0.14, ...]  | "John Doe. Software..." | John Doe | Python, React |
| 2  | [0.05, 0.23, ...]   | "Jane Smith. Data..." | Jane Smith | Python, SQL |

### job_collection (Jobs sheet)
| ID | Embedding (384 cols) | Title | Company | Skills |
|----|---------------------|-------|---------|--------|
| 1  | [0.04, -0.13, ...]  | Python Dev | ABC Corp | Python, Django |
| 2  | [0.01, 0.18, ...]   | Data Analyst | XYZ Inc | SQL, Python |

**But**: Embeddings are stored as binary (not text) for speed!

## ⚙️ Configuration

**In `embedder.py`:**

```python
# Use cosine similarity (best for text)
metadata = {'hnsw:space': 'cosine'}

# Other options:
# - 'l2': Euclidean distance
# - 'ip': Inner product
```

**HNSW Parameters** (automatically set by Chroma):
- `M`: 16 (connections per layer)
- `efConstruction`: 200 (build quality)
- `efSearch`: 10 (search quality)

## 🔄 Data Persistence

**ChromaDB is persistent:**
✅ Data saved to disk automatically
✅ Survives server restart
✅ No need to re-embed after shutdown
✅ Can backup by copying `chroma_store/` folder

**To backup:**
```bash
# Backup
cp -r ml/rag/chroma_store ml/rag/chroma_store_backup

# Restore
rm -rf ml/rag/chroma_store
mv ml/rag/chroma_store_backup ml/rag/chroma_store
```

## 🗑️ How to Clear Collections

```bash
python manage.py shell
```

```python
>>> from ml.rag.embedder import cv_collection, job_collection

# Delete all CVs
>>> cv_collection.delete(ids=cv_collection.get()['ids'])

# Delete all jobs
>>> job_collection.delete(ids=job_collection.get()['ids'])

# Or delete everything and start fresh:
>>> import shutil
>>> shutil.rmtree('ml/rag/chroma_store')
# Collections will be recreated on next embed
```

## 📈 Performance

**Speed:**
- Insert: ~10ms per embedding
- Search (10K jobs): ~20ms
- Search (1M jobs): ~50ms

**Memory:**
- Loads index into RAM on first query
- 10K jobs: ~50 MB RAM
- 100K jobs: ~500 MB RAM

**Disk:**
- Each embedding: ~1.5 KB
- 1000 jobs: ~1.5 MB
- 10,000 jobs: ~15 MB

## 🎓 Summary

**What is ChromaDB?**
- Vector database for storing embeddings
- Located: `ml/rag/chroma_store/`
- Persistent (data saved to disk)
- Free and open source

**What are collections?**
- `cv_collection`: Stores CV embeddings
- `job_collection`: Stores job embeddings
- Like tables in regular databases

**Why use it?**
- Fast similarity search (finds "similar" items)
- Semantic understanding (meaning, not just keywords)
- Scales to millions of items
- No API costs (runs locally)

**How to check it?**
```python
from ml.rag.embedder import cv_collection, job_collection
print(cv_collection.count(), job_collection.count())
```

---

**Your embeddings are real files on your disk!** 🎯
Location: `C:\Users\ANONYMOUUSS\Desktop\job-hunter (backup)\job-hunter\ml\rag\chroma_store\`
