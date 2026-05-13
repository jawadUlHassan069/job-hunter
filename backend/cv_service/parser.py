import json
from google import genai
from google.genai import types
from django.conf import settings


def get_gemini_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw text from a PDF using PyMuPDF."""
    import fitz
    doc  = fitz.open(file_path)
    text = ''
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


def parse_cv_with_llm(raw_text: str) -> dict:
    """
    Send raw CV text to Gemini.
    Returns structured JSON.
    """
    client = get_gemini_client()

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

    response = client.models.generate_content(
            model = 'models/gemini-flash-lite-latest',
        contents = prompt,
    )

    response_text = response.text.strip()

    # strip markdown fences if present
    if response_text.startswith('```'):
        lines         = response_text.split('\n')
        response_text = '\n'.join(lines[1:-1])

    return json.loads(response_text)