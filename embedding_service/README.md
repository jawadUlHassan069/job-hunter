---
title: Job Hunter Embedding Service
emoji: 🔮
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Job Hunter - Embedding Microservice

This is a standalone embedding service that generates text embeddings using SentenceTransformer. It's deployed on Hugging Face Spaces to offload the heavy ML model (~400MB) from the main Render deployment.

## Why Separate Service?

- **Memory**: SentenceTransformer model requires ~400MB RAM
- **Render Free Tier**: Only has 512MB total RAM
- **Solution**: Deploy embedding service on HuggingFace Spaces (free, with GPU support)

## API Endpoints

### POST /embed
Generate embeddings for text.

**Request:**
```json
{
  "texts": [
    "Python developer with 5 years experience",
    "Senior React developer"
  ]
}
```

**Response:**
```json
{
  "embeddings": [
    [0.123, -0.456, ...],
    [0.789, 0.012, ...]
  ],
  "model": "all-MiniLM-L6-v2",
  "dimension": 384
}
```

### GET /health
Health check endpoint.

## Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python app.py
```

Service will be available at `http://localhost:7860`

## Deploy to Hugging Face Spaces

1. Create account at https://huggingface.co
2. Create new Space
3. Select "Docker" SDK
4. Push these files to the Space repo
5. Get your Space URL: `https://YOUR-USERNAME-embedding-service.hf.space`

## Environment Variables

None required - this is a stateless service.

## Security

- CORS configured to only allow requests from your Render backend
- No authentication required (embeddings are not sensitive)
- Rate limiting handled by HuggingFace Spaces
