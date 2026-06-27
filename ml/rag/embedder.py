import os
os.environ['ANONYMIZED_TELEMETRY'] = 'False'

import chromadb
from pathlib import Path
from sentence_transformers import SentenceTransformer

# runs on your CPU — no API needed
embedder    = SentenceTransformer('all-MiniLM-L6-v2')

# absolute path — works from anywhere
CHROMA_PATH = Path(__file__).resolve().parent / 'chroma_store'
client      = chromadb.PersistentClient(path=str(CHROMA_PATH))

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
    vector   = embedder.encode(combined).tolist()

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
    print(f'CV {cv_id} embedded')


def embed_job(job_id: int, title: str, description: str, skills: list):
    """
    Convert job into a vector and store in ChromaDB.
    Called after every job is scraped or added.
    """
    skills_text = ' '.join(skills)
    combined    = f"{title}. {description[:2000]} Required: {skills_text}"
    vector      = embedder.encode(combined).tolist()

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
    print(f'Job {job_id} embedded')


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
        return []

    cv_vector = result['embeddings'][0]

    matches = job_collection.query(
        query_embeddings = [cv_vector],
        n_results        = min(top_k, job_collection.count()),
        include          = ['metadatas', 'distances']
    )

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

    return scores