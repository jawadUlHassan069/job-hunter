# Gunicorn configuration for Render free tier (512MB RAM)
# Optimized to prevent OOM (Out of Memory) errors and request timeouts

import multiprocessing
import os

# Bind to the port Render provides (default 10000)
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"

# ── Worker Configuration ──────────────────────────────────────
# Use 2 workers to prevent request blocking (free tier can handle this)
workers = 2

# Worker class - sync is most memory efficient
worker_class = 'sync'

# Threads per worker - allows some concurrency without multiple processes
threads = 2

# ── Timeout Configuration ─────────────────────────────────────
# Increased timeout for CV processing and LLM calls
# CRITICAL: Must be higher than Render's proxy timeout (30s) to see actual errors
timeout = 60  # 1 minute (was 120, reducing to match Render's expectations)
graceful_timeout = 30
keepalive = 5

# ── Memory Management ─────────────────────────────────────────
# Restart workers after processing N requests to prevent memory leaks
max_requests = 100
max_requests_jitter = 20

# ── Logging ───────────────────────────────────────────────────
loglevel = 'info'
accesslog = '-'
errorlog = '-'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# ── Performance ───────────────────────────────────────────────
preload_app = True
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190
