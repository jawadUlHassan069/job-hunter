# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Playwright and PyMuPDF
# Note: Playwright requires many system libraries
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies FIRST (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install ONLY Chromium browser for Playwright
# This step is large (~200MB) but necessary for web scraping
# It will be skipped if Playwright fails, and mock data will be used instead
RUN playwright install chromium --with-deps || echo "Playwright installation failed, will use mock data fallback"

# Copy project files
COPY . .

EXPOSE 8000