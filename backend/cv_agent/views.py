import requests
import json
import re

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .prompts import SYSTEM_PROMPT

GROQ_API_KEY = "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"


@api_view(["POST"])
def chat(request):

    messages = request.data.get("messages", [])

    try:

        # =========================
        # MAIN AI CHAT
        # =========================

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT
                    },
                    *messages
                ],
                "temperature": 0.7,
                "max_tokens": 2500,
            },
            timeout=60
        )

        data = response.json()

        if "choices" not in data:
            return Response({
                "error": data
            }, status=500)

        reply = data["choices"][0]["message"]["content"]

        # =========================
        # COMPLETION CHECK
        # =========================

        completed = "<CV_COMPLETE>" in reply

        # remove token from visible text
        clean_reply = reply.replace("<CV_COMPLETE>", "").strip()

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

        structure_prompt = f"""
You are a resume JSON generator.

Convert the following conversation and final CV into STRICT VALID JSON.

RULES:
- Return ONLY JSON
- No markdown
- No explanation
- No comments

JSON FORMAT:

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

IMPORTANT:
- NEVER leave important fields empty if information exists
- Infer skills intelligently
- Generate project descriptions professionally
- Generate strong summary
- Extract all contact information

Conversation:
{messages}

Final CV:
{clean_reply}
"""

        structure_res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "user",
                        "content": structure_prompt
                    }
                ],
                "temperature": 0.2,
                "max_tokens": 2000,
            },
            timeout=60
        )

        structure_data = structure_res.json()

        raw_json = structure_data["choices"][0]["message"]["content"]

        # =========================
        # CLEAN JSON
        # =========================

        raw_json = raw_json.strip()

        raw_json = re.sub(r"```json", "", raw_json)
        raw_json = re.sub(r"```", "", raw_json)

        try:
            resume_json = json.loads(raw_json)

        except Exception as e:
            return Response({
                "error": "JSON Parse Error",
                "raw": raw_json,
                "details": str(e)
            }, status=500)

        # =========================
        # AUTO FIX MISSING FIELDS
        # =========================

        resume_json.setdefault("name", "")
        resume_json.setdefault("email", "")
        resume_json.setdefault("phone", "")
        resume_json.setdefault("location", "")
        resume_json.setdefault("linkedin", "")
        resume_json.setdefault("github", "")
        resume_json.setdefault("summary", "")

        if "skills" not in resume_json:
            resume_json["skills"] = {
                "technical": [],
                "soft": []
            }

        resume_json["skills"].setdefault("technical", [])
        resume_json["skills"].setdefault("soft", [])

        resume_json.setdefault("projects", [])
        resume_json.setdefault("experience", [])
        resume_json.setdefault("education", [])
        resume_json.setdefault("certifications", [])

        # =========================
        # FINAL RESPONSE
        # =========================

        return Response({
            "reply": clean_reply,
            "status": "complete",
            "data": resume_json
        })

    except Exception as e:
        return Response({
            "error": str(e)
        }, status=500)