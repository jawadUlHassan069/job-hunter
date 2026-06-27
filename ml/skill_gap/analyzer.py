import json
from utils.llm_client import call_llm_json


def analyze_skill_gap(cv_parsed: dict, job: dict) -> dict:
    """
    Analyze skill gap between CV and job using multi-model LLM client.
    Tries Groq → OpenRouter → Gemini until one succeeds.
    """
    
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
    
    try:
        return call_llm_json(prompt, temperature=0.3, max_tokens=2000)
    except Exception as e:
        print(f'Skill gap analysis failed with all providers: {e}')
        raise