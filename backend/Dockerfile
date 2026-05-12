# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# install system dependencies for PyMuPDF and Playwright
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy project
COPY . .

EXPOSE 8000