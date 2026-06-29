"""
Quick test script for the embedding service
Run this to verify the service works before deploying
"""

import requests
import json

# Change this to your deployed URL or use localhost for local testing
SERVICE_URL = "http://localhost:7860"  # Local testing
# SERVICE_URL = "https://YOUR-USERNAME-embedding-service.hf.space"  # Production

def test_root():
    """Test root endpoint"""
    print("Testing root endpoint...")
    response = requests.get(f"{SERVICE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_health():
    """Test health check"""
    print("Testing health endpoint...")
    response = requests.get(f"{SERVICE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_embedding():
    """Test embedding generation"""
    print("Testing embedding generation...")
    
    texts = [
        "Python developer with 5 years of experience in Django and FastAPI",
        "Senior React developer specializing in frontend architecture"
    ]
    
    response = requests.post(
        f"{SERVICE_URL}/embed",
        json={"texts": texts},
        timeout=30
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Model: {data['model']}")
        print(f"Dimension: {data['dimension']}")
        print(f"Number of embeddings: {len(data['embeddings'])}")
        print(f"First embedding (first 10 values): {data['embeddings'][0][:10]}")
        print("✅ Embedding generation successful!")
    else:
        print(f"❌ Error: {response.text}")
    print()

if __name__ == "__main__":
    print("=" * 60)
    print("Embedding Service Test Script")
    print("=" * 60)
    print()
    
    try:
        test_root()
        test_health()
        test_embedding()
        print("=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Is the service running?")
        print(f"   Make sure the service is started at: {SERVICE_URL}")
        print("   Run: python app.py")
    except Exception as e:
        print(f"❌ Test failed: {e}")
