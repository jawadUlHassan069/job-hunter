import json
import os
from google import genai
from django.conf import settings


def get_gemini_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def analyze_skill_gap(cv_parsed: dict, job: dict) -> dict:
    """
    Compare a candidate's CV against a job's requirements using Gemini.
    Returns structured gap report.
    """
    client = get_gemini_client()

    cv_skills  = cv_parsed.get('skills',     [])
    cv_exp     = cv_parsed.get('experience', [])
    job_skills = job.get('required_skills',  [])
    job_title  = job.get('title',            '')
    job_desc   = job.get('description',      '')

    prompt = f"""
You are a career advisor analyzing a candidate's fit for a job.
Return ONLY a valid JSON object. No explanation. No markdown.

Job Title: {job_title}
Required Skills: {', '.join(job_skills)}
Job Description: {job_desc[:500]}

Candidate Skills: {', '.join(cv_skills)}
Candidate Experience: {json.dumps(cv_exp[:3])}

Return exactly this JSON:
{{
  "match_score": <integer 0-100>,
  "strong_matches": ["skills candidate clearly has"],
  "partial_matches": [
    {{
      "skill": "required skill",
      "candidate_has": "related skill they have",
      "gap": "what they need to improve"
    }}
  ],
  "missing_skills": ["skills completely missing from candidate"],
  "recommendations": ["3 to 5 specific things to learn or improve"],
  "summary": "2 sentence summary of overall fit"
}}
"""

    response = client.models.generate_content(
            model = 'models/gemini-flash-lite-latest',
        contents = prompt,
    )

    text = response.text.strip()

    if text.startswith('```'):
        lines = text.split('\n')
        text  = '\n'.join(lines[1:-1])

    return json.loads(text)