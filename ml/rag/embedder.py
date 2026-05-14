import chromadb
from pathlib import Path
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer('all-MiniLM-L6-v2')

# absolute path — works from anywhere
CHROMA_PATH = Path(__file__).resolve().parent / 'chroma_store'
client = chromadb.PersistentClient(path=str(CHROMA_PATH))

cv_collection  = client.get_or_create_collection('cvs')
job_collection = client.get_or_create_collection('jobs')


def embed_cv(cv_id: int, cv_text: str, parsed: dict):
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
    print(f'CV {cv_id} embedded into ChromaDB at {CHROMA_PATH}')


def embed_job(job_id: int, title: str, description: str, skills: list):
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
    print(f'Job {job_id} embedded into ChromaDB at {CHROMA_PATH}')


def find_matching_jobs(cv_id: int, top_k: int = 10) -> list:
    result = cv_collection.get(
        ids     = [str(cv_id)],
        include = ['embeddings']
    )
    if not result['embeddings']:
        print(f'CV {cv_id} not found in ChromaDB at {CHROMA_PATH}')
        return []

    cv_vector = result['embeddings'][0]
    matches   = job_collection.query(
        query_embeddings = [cv_vector],
        n_results        = min(top_k, job_collection.count()),
        include          = ['metadatas', 'distances']
    )
    if not matches['metadatas'] or not matches['metadatas'][0]:
        return []
    return [int(m['job_id']) for m in matches['metadatas'][0]]