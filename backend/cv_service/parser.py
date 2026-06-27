import json
from pathlib import Path
import fitz  # PyMuPDF
from utils.llm_client import call_llm_json


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using PyMuPDF"""
    doc  = fitz.open(file_path)
    text = ''
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


def parse_cv_with_llm(raw_text: str) -> dict:
    """
    Parse CV using multi-model LLM client with automatic fallback.
    Tries Groq → OpenRouter → Gemini until one succeeds.
    """
    
    prompt = f"""
You are a CV parser. Extract structured information from the CV text below.
Return ONLY a valid JSON object. No explanation. No markdown. No code blocks.

Extract these exact fields:
{{
  "name": "full name as string",
  "email": "email address as string",
  "phone": "phone number as string",
  "location": "city and country as string",
  "summary": "professional summary as string or empty string",
  "skills": ["list", "of", "skills"],
  "experience": [
    {{
      "company": "company name",
      "role": "job title",
      "duration": "e.g. 2021-2023",
      "description": "brief description"
    }}
  ],
  "education": [
    {{
      "institution": "university name",
      "degree": "degree type",
      "field": "field of study",
      "year": "graduation year"
    }}
  ],
  "languages": ["list of languages"],
  "certifications": ["list of certifications"]
}}

CV Text:
{raw_text[:4000]}
"""
    
    try:
        return call_llm_json(prompt, temperature=0.3, max_tokens=2500)
    except Exception as e:
        print(f'CV parsing failed with all providers: {e}')
        raise