# Gunicorn configuration for Render free tier (512MB RAM)
# Optimized to prevent OOM (Out of Memory) errors

import multiprocessing
import os

# Bind to the port Render provides (default 10000)
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"

# ── Worker Configuration ──────────────────────────────────────
# Use only 1 worker on free tier to minimize memory usage
# Default formula would be (2 * CPU cores) + 1, but that's too much for 512MB
workers = 1

# Worker class - sync is most memory efficient
worker_class = 'sync'

# Threads per worker - allows some concurrency without multiple processes
# Each thread uses ~10-20MB vs ~50MB per worker
threads = 2

# ── Timeout Configuration ─────────────────────────────────────
# Increased timeout for CV processing (PDF parsing + LLM calls can take time)
timeout = 120  # 2 minutes (default is 30s)
graceful_timeout = 30
keepalive = 5

# ── Memory Management ─────────────────────────────────────────
# Restart workers after processing N requests to prevent memory leaks
max_requests = 100
max_requests_jitter = 20  # Add randomness to avoid all workers restarting at once

# ── Logging ───────────────────────────────────────────────────
loglevel = 'info'
accesslog = '-'  # Log to stdout
errorlog = '-'   # Log to stderr
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# ── Performance ───────────────────────────────────────────────
# Preload app to save memory (shared code between workers)
# NOTE: Only useful if workers > 1, but we keep it for future scaling
preload_app = True

# Disable request/response buffering for large file uploads
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190
