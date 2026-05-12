import chromadb
from sentence_transformers import SentenceTransformer

# loaded once when the module is first imported
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# persistent local ChromaDB — data survives restarts
client = chromadb.PersistentClient(path='ml/rag/chroma_store')

cv_collection  = client.get_or_create_collection('cvs')
job_collection = client.get_or_create_collection('jobs')


def embed_cv(cv_id: int, cv_text: str, parsed: dict):
    """Convert CV into a vector and store in ChromaDB."""
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
    print(f'CV {cv_id} embedded into ChromaDB')


def embed_job(job_id: int, title: str, description: str, skills: list):
    """Convert job into a vector and store in ChromaDB."""
    skills_text = ' '.join(skills)
    combined    = f"{title}. {description[:2000]} Required skills: {skills_text}"
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
    print(f'Job {job_id} embedded into ChromaDB')


def find_matching_jobs(cv_id: int, top_k: int = 10) -> list:
    """
    Given a CV id, find the most semantically similar jobs.
    Returns list of job IDs ordered by similarity (best first).
    """
    # get CV embedding from ChromaDB
    result = cv_collection.get(
        ids     = [str(cv_id)],
        include = ['embeddings']
    )

    if not result['embeddings']:
        return []

    cv_vector = result['embeddings'][0]

    # search job collection with that vector
    matches = job_collection.query(
        query_embeddings = [cv_vector],
        n_results        = top_k,
        include          = ['metadatas', 'distances']
    )

    if not matches['metadatas'] or not matches['metadatas'][0]:
        return []

    return [int(m['job_id']) for m in matches['metadatas'][0]]