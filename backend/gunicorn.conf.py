# Gunicorn configuration for Render free tier (512MB RAM)
# Optimized to prevent OOM (Out of Memory) errors and request timeouts

import multiprocessing
import os

# Bind to the port Render provides (default 10000)
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"

# ── Worker Configuration ──────────────────────────────────────
# REDUCED TO 1 WORKER due to memory constraints on Render free tier
# With ML model (~400MB) + Playwright (~200MB), 2 workers exceeds 512MB limit
# Consider: Run locally for development OR upgrade Render plan for 2+ workers
workers = 1

# Worker class - sync is most memory efficient
worker_class = 'sync'

# NO THREADS - Even threads cause memory issues on 512MB tier
# threads = 2  # Disabled to reduce memory usage

# ── Timeout Configuration ─────────────────────────────────────
# Increased timeout for CV processing, LLM calls, AND web scraping
# Scraping with Playwright can take 60-120 seconds
timeout = 180  # 3 minutes - allows time for scraping operations
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
# preload_app disabled to allow Gunicorn to bind port before loading Django
# This fixes "Port scan timeout" on Render by ensuring health check passes
preload_app = False
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190
