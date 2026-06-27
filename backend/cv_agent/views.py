import requests
import json
import re
import os
import logging

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .prompts import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# Read from env — never hardcode API keys in source
def _get_groq_key():
    key = getattr(settings, 'GROQ_API_KEY', None) or os.getenv('GROQ_API_KEY', '')
    if not key:
        raise ValueError('GROQ_API_KEY is not set in environment')
    return key


def _call_groq_api(messages, temperature=0.7, max_tokens=2500):
    """Wrapper for Groq API calls with error handling"""
    try:
        GROQ_API_KEY = _get_groq_key()
        
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=60
        )
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.Timeout:
        logger.error("Groq API timeout")
        raise Exception("API request timed out. Please try again.")
    except requests.exceptions.RequestException as e:
        logger.error(f"Groq API request failed: {e}")
        raise Exception(f"API request failed: {str(e)}")


def _extract_json_from_text(text):
    """Extract JSON from text that may contain markdown or other content"""
    # Remove markdown code blocks
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    
    # Try to find JSON object boundaries
    json_start = text.find('{')
    json_end = text.rfind('}')
    
    if json_start != -1 and json_end != -1:
        text = text[json_start:json_end+1]
    
    return text


def _validate_and_fix_resume_json(resume_data):
    """Validate and auto-fix resume JSON structure"""
    if not isinstance(resume_data, dict):
        raise ValueError("Resume data must be a dictionary")
    
    # Ensure all required top-level fields exist
    resume_data.setdefault("name", "")
    resume_data.setdefault("email", "")
    resume_data.setdefault("phone", "")
    resume_data.setdefault("location", "")
    resume_data.setdefault("linkedin", "")
    resume_data.setdefault("github", "")
    resume_data.setdefault("summary", "")
    
    # Ensure skills structure
    if "skills" not in resume_data or not isinstance(resume_data["skills"], dict):
        resume_data["skills"] = {"technical": [], "soft": []}
    else:
        resume_data["skills"].setdefault("technical", [])
        resume_data["skills"].setdefault("soft", [])
    
    # Ensure array fields
    resume_data.setdefault("projects", [])
    resume_data.setdefault("experience", [])
    resume_data.setdefault("education", [])
    resume_data.setdefault("certifications", [])
    
    # Validate array types
    for field in ["projects", "experience", "education", "certifications"]:
        if not isinstance(resume_data[field], list):
            resume_data[field] = []
    
    # Validate skills arrays
    if not isinstance(resume_data["skills"]["technical"], list):
        resume_data["skills"]["technical"] = []
    if not isinstance(resume_data["skills"]["soft"], list):
        resume_data["skills"]["soft"] = []
    
    return resume_data


def _check_completion_signal(reply_text):
    """Check multiple completion signals"""
    completion_markers = [
        "<CV_COMPLETE>",
        "cv_complete",
        "COMPLETE",
        "[COMPLETE]",
        "<!-- COMPLETE -->",
        "resume is complete",
        "cv is complete"
    ]
    
    reply_lower = reply_text.lower()
    for marker in completion_markers:
        if marker.lower() in reply_lower:
            return True
    
    # Also check if the response looks like a complete CV (has multiple sections)
    section_count = 0
    sections = ["name:", "email:", "skills:", "experience:", "education:", "projects:", "summary:"]
    for section in sections:
        if section in reply_lower:
            section_count += 1
    
    # If we have at least 4 sections, consider it complete
    return section_count >= 4


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat(request):
    """CV Builder chat endpoint with enhanced error handling"""
    
    messages = request.data.get("messages", [])
    
    if not messages:
        return Response({
            "error": "No messages provided"
        }, status=400)

    try:
        # =========================
        # CALL LLM FOR CONVERSATION
        # =========================
        
        data = _call_groq_api([
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            *messages
        ])

        if "choices" not in data or not data["choices"]:
            logger.error(f"Invalid API response: {data}")
            return Response({
                "error": "Invalid response from AI service"
            }, status=500)

        reply = data["choices"][0]["message"]["content"]

        # =========================
        # COMPLETION CHECK
        # =========================

        completed = _check_completion_signal(reply)

        # Remove completion markers from visible text
        clean_reply = re.sub(r'<CV_COMPLETE>|<!-- COMPLETE -->|\[COMPLETE\]', '', reply, flags=re.IGNORECASE).strip()

        # =========================
        # IF NOT COMPLETE
        # =========================

        if not completed:
            return Response({
                "reply": clean_reply,
                "status": "chat"
            })

        # =========================
        # STRUCTURED JSON GENERATION
        # =========================

        logger.info("CV marked as complete, generating JSON structure...")

        structure_prompt = f"""
You are a resume JSON generator. Convert the following CV conversation into STRICT VALID JSON.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no explanation, no comments
2. Use proper JSON escaping for quotes and special characters
3. Arrays must be proper JSON arrays with square brackets []
4. All string values must be in double quotes
5. No trailing commas

JSON STRUCTURE (copy this exactly):

{{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "github": "",
  "summary": "",
  "skills": {{
    "technical": [],
    "soft": []
  }},
  "projects": [
    {{
      "name": "",
      "description": ""
    }}
  ],
  "experience": [
    {{
      "title": "",
      "company": "",
      "period": "",
      "achievements": []
    }}
  ],
  "education": [
    {{
      "degree": "",
      "institution": "",
      "year": ""
    }}
  ],
  "certifications": []
}}

EXTRACTION INSTRUCTIONS:
- Extract ALL contact information mentioned
- Infer technical skills from projects and experience
- Infer soft skills from achievements and descriptions
- Generate professional project descriptions
- Create achievement bullet points for experience
- Fill ALL fields that have data available
- Use empty strings "" for missing text fields
- Use empty arrays [] for missing list fields

CONVERSATION:
{json.dumps(messages, ensure_ascii=False)}

FINAL CV TEXT:
{clean_reply}

Return the JSON now:
"""

        structure_data = _call_groq_api([
            {
                "role": "user",
                "content": structure_prompt
            }
        ], temperature=0.2, max_tokens=3000)

        if "choices" not in structure_data or not structure_data["choices"]:
            logger.error("Failed to get structured JSON response")
            return Response({
                "error": "Failed to structure CV data",
                "reply": clean_reply,
                "status": "error"
            }, status=500)

        raw_json = structure_data["choices"][0]["message"]["content"]

        # =========================
        # PARSE AND VALIDATE JSON
        # =========================

        try:
            # Clean the JSON text
            cleaned_json = _extract_json_from_text(raw_json)
            
            # Parse JSON
            resume_json = json.loads(cleaned_json)
            
            # Validate and fix structure
            resume_json = _validate_and_fix_resume_json(resume_json)
            
            logger.info("Successfully generated structured CV JSON")

        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}\nRaw JSON: {raw_json}")
            
            # Return a basic structure as fallback
            resume_json = {
                "name": "",
                "email": "",
                "phone": "",
                "location": "",
                "linkedin": "",
                "github": "",
                "summary": "",
                "skills": {"technical": [], "soft": []},
                "projects": [],
                "experience": [],
                "education": [],
                "certifications": []
            }
            
            return Response({
                "reply": clean_reply,
                "status": "complete",
                "data": resume_json,
                "warning": "Could not parse structured data. Please review the CV text."
            })
        
        except Exception as e:
            logger.error(f"JSON validation error: {e}")
            return Response({
                "error": f"Failed to validate CV structure: {str(e)}",
                "reply": clean_reply,
                "status": "error"
            }, status=500)

        # =========================
        # SUCCESS RESPONSE
        # =========================

        return Response({
            "reply": clean_reply,
            "status": "complete",
            "data": resume_json
        })

    except Exception as e:
        logger.error(f"CV Builder error: {e}", exc_info=True)
        return Response({
            "error": str(e),
            "status": "error"
        }, status=500)
