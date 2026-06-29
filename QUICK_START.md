# Quick Start Guide - Deploy Your Embedding Service

## TL;DR - 3 Simple Steps

1. **Deploy embedding service to HuggingFace Spaces** (10 minutes)
2. **Update Render environment variable** with your Space URL (2 minutes)
3. **Test CV upload & matching** (1 minute)

That's it! Your app will have full ML-powered matching on free tiers.

---

## Step 1: Deploy to HuggingFace Spaces (10 min)

### A. Create Account
- Go to https://huggingface.co/join
- Sign up (free, no credit card needed)

### B. Create Space
1. Visit: https://huggingface.co/new-space
2. Fill in:
   - **Space name**: `embedding-service`
   - **SDK**: Select **"Docker"**
   - **Hardware**: `CPU basic` (free)
3. Click **"Create Space"**

### C. Upload Files
1. Click **"Files"** tab → **"Add file"** → **"Upload files"**
2. Upload these 4 files from `embedding_service/` folder:
   - `app.py`
   - `requirements.txt`
   - `Dockerfile`
   - `README.md`
3. Click **"Commit"**

### D. Wait for Build
- Watch the **"Logs"** tab
- Build takes ~5-10 minutes
- When done, you'll see "Running" status

### E. Get Your URL
Your service URL will be:
```
https://YOUR-USERNAME-embedding-service.hf.space
```

Example: `https://jawad17-embedding-service.hf.space`

---

## Step 2: Update Render Config (2 min)

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your backend service
3. Go to **"Environment"** tab
4. Add/Update these variables:
   ```
   ENABLE_ML_MATCHING=true
   USE_REMOTE_EMBEDDER=true
   EMBEDDING_SERVICE_URL=https://YOUR-USERNAME-embedding-service.hf.space
   ```
   (Replace `YOUR-USERNAME` with your actual HuggingFace username)
5. Click **"Save Changes"**
6. Render will automatically redeploy (~2 minutes)

---

## Step 3: Test It (1 min)

1. Open your frontend: `https://job-hunter-tau-eight.vercel.app`
2. Upload a CV
3. Check Render logs - you should see:
   ```
   Generated 1 embeddings via remote service
   CV 123 embedded successfully
   ```
4. View Dashboard → See matched jobs! 🎉

---

## Troubleshooting

### "Connection refused" error
**Cause:** HF Space is sleeping (happens after 48h inactivity on free tier)  
**Fix:** Visit your Space URL to wake it up (takes 15-30 seconds)

### CORS error in browser console
**Cause:** Render URL not in CORS whitelist  
**Fix:** 
1. Go to your HF Space
2. Edit `app.py`
3. Add your Render URL to `allow_origins` list:
   ```python
   allow_origins=[
       "https://job-hunter-du0n.onrender.com",
       ...
   ]
   ```
4. Commit → Space rebuilds automatically

### Still getting memory errors on Render
**Cause:** Environment variables not set correctly  
**Fix:** 
1. Verify `USE_REMOTE_EMBEDDER=true` on Render
2. Check `EMBEDDING_SERVICE_URL` is correct
3. Redeploy Render service

---

## What Happens Now?

### With Remote Embedder Enabled:
✅ CV upload creates embeddings via HF Spaces API  
✅ Job scraping works without memory issues  
✅ Job matching uses semantic similarity  
✅ Render stays under 512MB RAM  
✅ All features work on free tiers!

### Memory Usage:
- **Before:** ~700MB (crashes on Render free tier)
- **After:** ~250MB (works perfectly!)

---

## Optional: Upgrade for Better Performance

### HuggingFace Space: $0.60/month
- Benefit: Always on (no cold starts)
- No 15-30s wake-up time
- Worth it if you have daily users

### Render: $7/month
- Benefit: 2GB RAM instead of 512MB
- Faster, can handle more traffic
- Can run local model if HF Space is down

### Both Upgrades: $7.60/month
- Production-ready setup
- Fast and reliable
- Professional deployment

---

## Next Steps

1. **Monitor performance** - Check Render logs for embedding service calls
2. **Test thoroughly** - Upload different CVs, check matching quality
3. **Consider upgrades** - If you launch to users, consider always-on Space
4. **Add monitoring** - Set up Sentry or similar for error tracking

---

## Architecture Diagram

```
Frontend (Vercel)
    ↓
Main Backend (Render - 250MB RAM) ──API call──→ Embedding Service (HF Spaces - 400MB RAM)
    ↓
Database (Neon PostgreSQL)
```

---

## Resources

- Full deployment guide: `embedding_service/DEPLOYMENT_GUIDE.md`
- Architecture details: `MICROSERVICES_ARCHITECTURE.md`
- HuggingFace Spaces docs: https://huggingface.co/docs/hub/spaces
- Render docs: https://render.com/docs

---

## Support

If you encounter issues:
1. Check the logs (Render + HF Spaces)
2. Review `DEPLOYMENT_GUIDE.md`
3. Test the embedding service directly: `python embedding_service/test_service.py`

**You're all set! Your Job Hunter app now has full ML features on free hosting! 🚀**
