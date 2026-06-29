import os
os.environ['ANONYMIZED_TELEMETRY'] = 'False'

import chromadb
from pathlib import Path
import requests
from typing import List
from decouple import config

# Configuration
USE_REMOTE_EMBEDDER = config('USE_REMOTE_EMBEDDER', default=False, cast=bool)
EMBEDDING_SERVICE_URL = config('EMBEDDING_SERVICE_URL', default='')

# Lazy loading for local model - only used if remote service is disabled
_local_embedder = None

def get_local_embedder():
    """Lazy load the local SentenceTransformer model."""
    global _local_embedder
    if _local_embedder is None:
        print("Loading local SentenceTransformer model...")
        from sentence_transformers import SentenceTransformer
        _local_embedder = SentenceTransformer('all-MiniLM-L6-v2')
        print("Local model loaded successfully")
    return _local_embedder


def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for texts using either remote service or local model.
    
    Args:
        texts: List of strings to embed
        
    Returns:
        List of embedding vectors (each vector is a list of floats)
    """
    if USE_REMOTE_EMBEDDER and EMBEDDING_SERVICE_URL:
        # Use remote HuggingFace Spaces service
        try:
            response = requests.post(
                f"{EMBEDDING_SERVICE_URL}/embed",
                json={"texts": texts},
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            print(f"Generated {len(data['embeddings'])} embeddings via remote service")
            return data['embeddings']
        except Exception as e:
            print(f"Remote embedding service failed: {e}")
            print("Falling back to local model...")
            # Fall back to local model
            embedder = get_local_embedder()
            embeddings = embedder.encode(texts)
            return [emb.tolist() for emb in embeddings]
    else:
        # Use local model
        embedder = get_local_embedder()
        embeddings = embedder.encode(texts)
        return [emb.tolist() for emb in embeddings]

# ChromaDB storage path
# Use /tmp on cloud platforms (ephemeral but writable)
# Use local path for development
import os
if os.environ.get('RENDER'):
    # On Render, use /tmp which is writable but ephemeral
    CHROMA_PATH = Path('/tmp/chroma_store')
    print(f"🔧 Running on Render - using ephemeral storage: {CHROMA_PATH}")
else:
    # Local development - use persistent local storage
    CHROMA_PATH = Path(__file__).resolve().parent / 'chroma_store'
    print(f"🔧 Running locally - using persistent storage: {CHROMA_PATH}")

# Ensure directory exists and is writable
try:
    CHROMA_PATH.mkdir(parents=True, exist_ok=True)
    # Test write permissions
    test_file = CHROMA_PATH / '.write_test'
    test_file.touch()
    test_file.unlink()
    print(f"✅ ChromaDB path is writable: {CHROMA_PATH}")
except Exception as e:
    print(f"❌ ChromaDB path NOT writable: {CHROMA_PATH}")
    print(f"   Error: {e}")

client = chromadb.PersistentClient(path=str(CHROMA_PATH))

# cosine similarity — scores always positive 0 to 100%
cv_collection  = client.get_or_create_collection(
    'cvs',
    metadata = {'hnsw:space': 'cosine'}
)
job_collection = client.get_or_create_collection(
    'jobs',
    metadata = {'hnsw:space': 'cosine'}
)


def embed_cv(cv_id: int, cv_text: str, parsed: dict):
    """
    Convert CV text into a vector and store in ChromaDB.
    Called after every CV upload.
    """
    skills   = ' '.join(parsed.get('skills', []))
    combined = f"{cv_text[:2000]} Skills: {skills}"
    
    # Get embedding (remote or local)
    embeddings = get_embeddings([combined])
    vector = embeddings[0]

    cv_collection.upsert(
        ids        = [str(cv_id)],
        embeddings = [vector],
        documents  = [combined],
        metadatas  = [{
            'cv_id':  cv_id,
            'skills': skills,
            'name':   parsed.get('name', ''),
        }]
    )
    print(f'✅ CV {cv_id} embedded successfully (ChromaDB count: {cv_collection.count()})')


def embed_job(job_id: int, title: str, description: str, skills: list):
    """
    Convert job into a vector and store in ChromaDB.
    Called after every job is scraped or added.
    """
    skills_text = ' '.join(skills)
    combined    = f"{title}. {description[:2000]} Required: {skills_text}"
    
    # Get embedding (remote or local)
    embeddings = get_embeddings([combined])
    vector = embeddings[0]

    job_collection.upsert(
        ids        = [str(job_id)],
        embeddings = [vector],
        documents  = [combined],
        metadatas  = [{
            'job_id': job_id,
            'title':  title,
            'skills': skills_text,
        }]
    )
    print(f'✅ Job {job_id} embedded successfully (ChromaDB count: {job_collection.count()})')


def find_matching_jobs(cv_id: int, top_k: int = 10) -> list:
    """
    Given a CV id, find the most similar jobs.
    Returns list of job IDs ordered by similarity (best first).
    """
    result = cv_collection.get(
        ids     = [str(cv_id)],
        include = ['embeddings']
    )

    if not result['embeddings']:
        print(f'CV {cv_id} not found in ChromaDB')
        return []

    cv_vector = result['embeddings'][0]

    matches = job_collection.query(
        query_embeddings = [cv_vector],
        n_results        = min(top_k, job_collection.count()),
        include          = ['metadatas', 'distances']
    )

    if not matches['metadatas'] or not matches['metadatas'][0]:
        return []

    return [int(m['job_id']) for m in matches['metadatas'][0]]


def get_similarity_scores(cv_id: int, top_k: int = 5) -> list:
    """
    Same as find_matching_jobs but also returns similarity percentages.
    Used for testing and debugging.
    """
    result = cv_collection.get(
        ids     = [str(cv_id)],
        include = ['embeddings']
    )

    if not result['embeddings']:
        print(f"❌ CV {cv_id} not found in ChromaDB")
        return []

    cv_vector = result['embeddings'][0]
    
    # Check if there are any jobs in ChromaDB
    job_count = job_collection.count()
    print(f"📊 ChromaDB stats: {job_count} jobs indexed")
    
    if job_count == 0:
        print("⚠️  No jobs in ChromaDB - cannot perform matching")
        return []

    matches = job_collection.query(
        query_embeddings = [cv_vector],
        n_results        = min(top_k, job_count),
        include          = ['metadatas', 'distances']
    )

    # Safety check: ensure we got results
    if not matches['metadatas'] or not matches['metadatas'][0]:
        print("⚠️  ChromaDB query returned no matches")
        return []

    scores = []
    for meta, dist in zip(
        matches['metadatas'][0],
        matches['distances'][0]
    ):
        # cosine distance: 0 = identical, 2 = opposite
        # convert to percentage: 100% = perfect match
        similarity = round((1 - dist / 2) * 100, 1)
        scores.append({
            'job_id':     int(meta['job_id']),
            'title':      meta['title'],
            'similarity': similarity,
        })
    
    print(f"✅ Found {len(scores)} matching jobs for CV {cv_id}")
    return scores