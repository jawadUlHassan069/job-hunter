#!/bin/bash
# Render build script

echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "Installing Playwright Chromium browser..."
playwright install chromium --with-deps || echo "⚠ Playwright installation failed - will use mock data fallback"

echo "Build complete!"
