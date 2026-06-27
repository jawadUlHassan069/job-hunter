"""
Multi-Model LLM Client with Automatic Fallback
===============================================
Tries models in order until one succeeds:
1. Groq (Llama 3.3 70B) - Primary, fast and high quality
2. OpenRouter (Multiple free models) - Fallback when Groq quota exhausted
3. Gemini (Flash Lite) - Last resort

Usage:
    from utils.llm_client import call_llm
    
    response = call_llm(
        prompt="Analyze this CV...",
        temperature=0.7,
        max_tokens=2000
    )
"""

import json
import time
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


# OpenRouter free models to try in order
OPENROUTER_MODELS = [
    "meta-llama/llama-3.1-70b-instruct:free",      # Best free model
    "google/gemini-2.0-flash-exp:free",            # Fast and good
    "mistralai/mistral-7b-instruct:free",          # Backup
]


def _call_groq(prompt: str, temperature: float = 0.7, max_tokens: int = 2000) -> str:
    """Call Groq API (Llama 3.3 70B)"""
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")
    
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        },
        timeout=60
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]


def _call_openrouter(prompt: str, temperature: float = 0.7, max_tokens: int = 2000, model: str = None) -> str:
    """Call OpenRouter API (tries multiple free models)"""
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY not set")
    
    models_to_try = [model] if model else OPENROUTER_MODELS
    
    for model_name in models_to_try:
        try:
            logger.info(f"Trying OpenRouter model: {model_name}")
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:8000",  # Required by OpenRouter
                    "X-Title": "JobHunter CV System",
                },
                json={
                    "model": model_name,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=90
            )
            response.raise_for_status()
            data = response.json()
            result = data["choices"][0]["message"]["content"]
            logger.info(f"✓ OpenRouter success with {model_name}")
            return result
        except Exception as e:
            logger.warning(f"OpenRouter {model_name} failed: {e}")
            if model_name == models_to_try[-1]:
                raise
            continue
    
    raise Exception("All OpenRouter models failed")


def _call_gemini(prompt: str, temperature: float = 0.7, max_tokens: int = 2000) -> str:
    """Call Gemini API (Flash Lite) - Last resort"""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")
    
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        response = client.models.generate_content(
            model='models/gemini-2.0-flash-lite',
            contents=prompt,
        )
        return response.text.strip()
    except ImportError:
        # If google-genai not installed, use REST API
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tokens,
                }
            },
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


def call_llm(
    prompt: str,
    temperature: float = 0.7,
    max_tokens: int = 2000,
    retries: int = 2
) -> str:
    """
    Call LLM with automatic fallback between providers.
    
    Tries in order:
    1. Groq (Llama 3.3 70B)
    2. OpenRouter (multiple free models)
    3. Gemini (Flash Lite)
    
    Args:
        prompt: The prompt to send to the LLM
        temperature: Sampling temperature (0.0-1.0)
        max_tokens: Maximum tokens to generate
        retries: Number of retries per provider on transient errors
    
    Returns:
        LLM response text
    
    Raises:
        Exception: If all providers fail
    """
    
    # Track which providers we tried
    attempts = []
    
    # Try Groq first (fastest and best quality)
    if settings.GROQ_API_KEY:
        for attempt in range(retries):
            try:
                logger.info(f"Trying Groq (attempt {attempt + 1}/{retries})")
                result = _call_groq(prompt, temperature, max_tokens)
                logger.info("✓ Groq success")
                return result
            except Exception as e:
                error_str = str(e)
                attempts.append(f"Groq: {error_str}")
                
                # Check if it's a quota/rate limit error
                if '429' in error_str or 'rate_limit' in error_str.lower() or 'quota' in error_str.lower():
                    logger.warning(f"Groq quota/rate limit hit: {e}")
                    break  # Don't retry on quota errors, move to next provider
                
                # Retry on transient errors (503, timeout)
                if '503' in error_str or 'timeout' in error_str.lower():
                    if attempt < retries - 1:
                        wait = (attempt + 1) * 3
                        logger.warning(f"Groq transient error, retrying in {wait}s: {e}")
                        time.sleep(wait)
                        continue
                
                # Other errors - try next provider
                logger.warning(f"Groq failed: {e}")
                break
    
    # Try OpenRouter (multiple free models)
    if settings.OPENROUTER_API_KEY:
        for attempt in range(retries):
            try:
                logger.info(f"Trying OpenRouter (attempt {attempt + 1}/{retries})")
                result = _call_openrouter(prompt, temperature, max_tokens)
                logger.info("✓ OpenRouter success")
                return result
            except Exception as e:
                error_str = str(e)
                attempts.append(f"OpenRouter: {error_str}")
                
                # Retry on transient errors
                if '503' in error_str or 'timeout' in error_str.lower():
                    if attempt < retries - 1:
                        wait = (attempt + 1) * 5
                        logger.warning(f"OpenRouter transient error, retrying in {wait}s: {e}")
                        time.sleep(wait)
                        continue
                
                logger.warning(f"OpenRouter failed: {e}")
                break
    
    # Try Gemini as last resort
    if settings.GEMINI_API_KEY:
        for attempt in range(retries):
            try:
                logger.info(f"Trying Gemini (attempt {attempt + 1}/{retries})")
                result = _call_gemini(prompt, temperature, max_tokens)
                logger.info("✓ Gemini success")
                return result
            except Exception as e:
                error_str = str(e)
                attempts.append(f"Gemini: {error_str}")
                
                # Retry on transient errors
                if '503' in error_str or 'timeout' in error_str.lower():
                    if attempt < retries - 1:
                        wait = (attempt + 1) * 5
                        logger.warning(f"Gemini transient error, retrying in {wait}s: {e}")
                        time.sleep(wait)
                        continue
                
                logger.warning(f"Gemini failed: {e}")
                break
    
    # All providers failed
    error_msg = "All LLM providers failed. Attempts:\n" + "\n".join(attempts)
    logger.error(error_msg)
    raise Exception(error_msg)


def call_llm_json(
    prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 2000,
    retries: int = 2
) -> dict:
    """
    Call LLM and parse response as JSON.
    Automatically handles markdown code blocks and cleaning.
    
    Args:
        prompt: The prompt (should ask for JSON output)
        temperature: Sampling temperature (lower for structured output)
        max_tokens: Maximum tokens to generate
        retries: Number of retries per provider
    
    Returns:
        Parsed JSON dict
    
    Raises:
        Exception: If LLM call fails or JSON parsing fails
    """
    response_text = call_llm(prompt, temperature, max_tokens, retries)
    
    # Clean markdown code blocks
    cleaned = response_text.strip()
    if cleaned.startswith('```'):
        # Remove opening ```json or ```
        lines = cleaned.split('\n')
        cleaned = '\n'.join(lines[1:-1])
    
    # Remove any remaining backticks
    cleaned = cleaned.replace('```', '').strip()
    
    # Parse JSON
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}\nResponse: {cleaned[:500]}")
        raise Exception(f"Failed to parse JSON from LLM response: {e}")
