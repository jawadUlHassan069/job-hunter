import json
import anthropic
from django.conf import settings


def analyze_skill_gap(cv_parsed: dict, job: dict) -> dict:
    """
    Compare a candidate's CV against a job's requirements.

    cv_parsed : structured dict from CV parsing
    job       : dict with title, description, required_skills

    Returns structured gap report.
    """
    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)

    cv_skills    = cv_parsed.get('skills',     [])
    cv_exp       = cv_parsed.get('experience', [])
    job_skills   = job.get('required_skills',  [])
    job_title    = job.get('title',            '')
    job_desc     = job.get('description',      '')

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

    message = client.messages.create(
        model      = 'claude-sonnet-4-20250514',
        max_tokens = 1000,
        messages   = [{'role': 'user', 'content': prompt}]
    )

    text = message.content[0].text.strip()

    if text.startswith('```'):
        lines = text.split('\n')
        text  = '\n'.join(lines[1:-1])

    return json.loads(text)