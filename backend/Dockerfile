# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PyMuPDF and Playwright
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install ONLY Chromium browser for Playwright (saves ~400MB vs all 3 browsers)
# This allows web scraping while keeping memory footprint minimal
RUN playwright install chromium --with-deps

# Copy project
COPY . .

EXPOSE 8000