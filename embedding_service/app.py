"""
Embedding Microservice for Job Hunter
Deployed on Hugging Face Spaces

This service provides embedding generation using SentenceTransformer
to offload the ~400MB model from the main Render deployment.

API Endpoints:
- POST /embed - Generate embeddings for text
- GET /health - Health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn
from typing import List

# Initialize FastAPI app
app = FastAPI(
    title="Job Hunter Embedding Service",
    description="Microservice for generating text embeddings using SentenceTransformer",
    version="1.0.0"
)

# CORS - Allow requests from your Render backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://job-hunter-du0n.onrender.com",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once at startup (this takes ~5-10 seconds)
print("Loading SentenceTransformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully!")


# Request/Response models
class EmbedRequest(BaseModel):
    texts: List[str]  # Can embed multiple texts in one call
    
class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    model: str = "all-MiniLM-L6-v2"
    dimension: int = 384


@app.get("/")
def root():
    """Root endpoint with service info"""
    return {
        "service": "Job Hunter Embedding Service",
        "model": "all-MiniLM-L6-v2",
        "dimension": 384,
        "status": "running",
        "endpoints": {
            "embed": "POST /embed",
            "health": "GET /health"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }


@app.post("/embed", response_model=EmbedResponse)
def generate_embeddings(request: EmbedRequest):
    """
    Generate embeddings for one or more texts.
    
    Example request:
    {
        "texts": [
            "Python developer with 5 years experience",
            "Senior frontend engineer specializing in React"
        ]
    }
    
    Returns:
    {
        "embeddings": [[0.123, -0.456, ...], [0.789, 0.012, ...]],
        "model": "all-MiniLM-L6-v2",
        "dimension": 384
    }
    """
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="No texts provided")
        
        # Generate embeddings
        embeddings = model.encode(request.texts)
        
        # Convert numpy arrays to lists for JSON serialization
        embeddings_list = [emb.tolist() for emb in embeddings]
        
        return EmbedResponse(
            embeddings=embeddings_list,
            dimension=len(embeddings_list[0]) if embeddings_list else 384
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")


if __name__ == "__main__":
    # For local testing
    uvicorn.run(app, host="0.0.0.0", port=7860)
