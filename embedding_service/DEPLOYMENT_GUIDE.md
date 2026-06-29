# HuggingFace Spaces Deployment Guide

## Step-by-Step Instructions to Deploy Embedding Service

### Prerequisites
- HuggingFace account (free) - Sign up at https://huggingface.co/join

---

## Step 1: Create HuggingFace Space

1. **Go to HuggingFace Spaces:**
   - Visit: https://huggingface.co/spaces
   - Click "Create new Space"

2. **Configure Space:**
   - **Space name**: `embedding-service` (or any name you prefer)
   - **License**: `mit` (recommended)
   - **Space SDK**: Select **"Docker"** (IMPORTANT!)
   - **Space hardware**: `CPU basic` (free tier is sufficient)
   - **Visibility**: Public or Private (your choice)
   - Click **"Create Space"**

---

## Step 2: Upload Files to Space

You have two options:

### Option A: Upload via Web Interface (Easier)

1. Click on **"Files"** tab in your Space
2. Click **"Add file"** → **"Upload files"**
3. Upload these 4 files from `embedding_service/` folder:
   - `app.py`
   - `requirements.txt`
   - `Dockerfile`
   - `README.md`
4. Click **"Commit new files to main"**

### Option B: Push via Git (Advanced)

```bash
# Clone your Space repository
git clone https://huggingface.co/spaces/YOUR-USERNAME/embedding-service
cd embedding-service

# Copy files
cp ../embedding_service/* .

# Commit and push
git add .
git commit -m "Initial deployment of embedding service"
git push
```

---

## Step 3: Wait for Build (5-10 minutes)

1. HuggingFace will automatically build your Docker container
2. Watch the build logs in the **"Logs"** tab
3. You'll see:
   ```
   Installing dependencies...
   Loading SentenceTransformer model...
   Model loaded successfully!
   Application startup complete.
   ```
4. When ready, you'll see: **"Running"** status with a green dot

---

## Step 4: Get Your Space URL

Your embedding service will be available at:
```
https://YOUR-USERNAME-embedding-service.hf.space
```

Example: `https://jawad17-embedding-service.hf.space`

---

## Step 5: Test the Service

### Test in Browser
Visit your Space URL - you should see:
```json
{
  "service": "Job Hunter Embedding Service",
  "model": "all-MiniLM-L6-v2",
  "dimension": 384,
  "status": "running"
}
```

### Test with cURL
```bash
curl -X POST "https://YOUR-USERNAME-embedding-service.hf.space/embed" \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Python developer with 5 years experience"]}'
```

You should get a response with embeddings:
```json
{
  "embeddings": [[0.123, -0.456, ...]],
  "model": "all-MiniLM-L6-v2",
  "dimension": 384
}
```

---

## Step 6: Connect to Your Render Backend

1. **Copy your Space URL** (e.g., `https://jawad17-embedding-service.hf.space`)

2. **Update Render Environment Variables:**
   - Go to Render Dashboard → Your service
   - Go to **"Environment"** tab
   - Add/Update these variables:
     ```
     ENABLE_ML_MATCHING=true
     USE_REMOTE_EMBEDDER=true
     EMBEDDING_SERVICE_URL=https://YOUR-USERNAME-embedding-service.hf.space
     ```
   - Click **"Save Changes"**

3. **Render will auto-redeploy** with the new configuration

---

## Step 7: Update CORS in Embedding Service

After you have your Render URL, update CORS in `app.py`:

1. Go to your Space on HuggingFace
2. Edit `app.py`
3. Update the `allow_origins` list:
   ```python
   allow_origins=[
       "https://job-hunter-du0n.onrender.com",  # Your actual Render URL
       "http://localhost:8000",
       "http://127.0.0.1:8000",
   ]
   ```
4. Commit changes → Space will rebuild automatically

---

## Step 8: Verify Everything Works

1. **Upload a CV** on your frontend
2. **Check Render logs** - you should see:
   ```
   Generated 1 embeddings via remote service
   CV 123 embedded successfully
   ```
3. **View matched jobs** - should work without memory errors!

---

## Troubleshooting

### Space shows "Building" forever
- Check build logs for errors
- Most common: Missing dependencies in `requirements.txt`
- Solution: Make sure all files are uploaded correctly

### "Connection refused" errors
- Space might be sleeping (free tier sleeps after 48h of inactivity)
- Solution: Visit the Space URL to wake it up (takes 15-30 seconds)

### CORS errors in browser
- Check that Render URL is in the `allow_origins` list in `app.py`
- Update and recommit to Space

### High latency (>2 seconds)
- Space is sleeping - first request wakes it up
- Subsequent requests will be fast (~200-500ms)
- Consider upgrading to "always on" Space ($0.60/month)

---

## Cost Breakdown

| Service | Free Tier | Paid Option |
|---------|-----------|-------------|
| HuggingFace Spaces | ✅ Free (with sleep) | $0.60/mo (always on) |
| Render Backend | ✅ 512MB RAM | $7/mo (2GB RAM) |
| Vercel Frontend | ✅ Free | N/A |
| Neon PostgreSQL | ✅ 0.5GB storage | $19/mo (more storage) |

**Total Cost: $0/month** (with free tiers) or **$7.60/month** (always-on, no sleep)

---

## Architecture Diagram

```
┌──────────────┐
│   Frontend   │  (Vercel - Free)
│  React App   │
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────────────┐
│  Backend API         │  (Render - 512MB, now works!)
│  Django + Gunicorn   │  • User auth
│  ~200MB RAM          │  • CV parsing
└──────┬──────┬────────┘  • Job management
       │      │
       │      │ HTTPS API call
       │      ▼
       │  ┌─────────────────────┐
       │  │  Embedding Service  │  (HuggingFace Spaces - Free)
       │  │  SentenceTransformer│  • Generate embeddings
       │  │  ~400MB RAM         │  • No DB, stateless
       │  └─────────────────────┘
       │
       ▼
┌──────────────────┐
│   PostgreSQL     │  (Neon - Free)
│   Database       │
└──────────────────┘
```

---

## Benefits of This Architecture

✅ **Render stays under 512MB** - No more OOM crashes
✅ **Free tier works** - All features enabled
✅ **Scalable** - Can upgrade individual services independently
✅ **Fast** - Embeddings cached in ChromaDB, only generated once
✅ **Reliable** - Fallback to local model if remote service fails

---

## Next Steps

After deployment:
1. Test CV upload with job matching
2. Monitor Render memory usage (should stay ~200-300MB)
3. Consider upgrading HuggingFace Space to "always on" if you want zero cold starts
4. Add monitoring/alerts for the embedding service

**Your Job Hunter app will now have full ML-powered job matching on Render's free tier!** 🎉
