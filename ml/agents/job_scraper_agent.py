import asyncio
import json
import os
from datetime import date
from pathlib import Path

from playwright.async_api import async_playwright
from google import genai


# -----------------------------
# JOB SOURCES
# -----------------------------

JOB_SOURCES = [
    {
        "name": "rozee",
        "base_url": "https://www.rozee.pk/job/jsearch/q/",
    },
]


# -----------------------------
# GEMINI CLIENT
# -----------------------------

def get_gemini_client():
    return genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))


# -----------------------------
# SCRAPE SINGLE JOB PAGE
# -----------------------------

async def scrape_job_page(page, url: str) -> str:
    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
    await page.wait_for_timeout(2000)
    return await page.inner_text("body")


# -----------------------------
# LLM EXTRACTION (FIXED + SAFE)
# -----------------------------

def extract_job_details_with_llm(page_text: str, url: str) -> dict | None:
    client = get_gemini_client()

    prompt = f"""
You are a strict JSON extractor.

RULES:
- Output ONLY valid JSON
- If missing, use null
- No markdown, no explanation

Schema:
{{
  "title": string or null,
  "company": string or null,
  "location": string or null,
  "description": string or null,
  "required_skills": [],
  "deadline": null,
  "is_deadline_confirmed": false
}}

TEXT:
{page_text[:3000]}

URL: {url}
"""

    response = client.models.generate_content(
        model="models/gemini-flash-lite-latest",
        contents=prompt,
    )

    text = response.text.strip()

    # remove markdown fences
    if text.startswith("```"):
        text = "\n".join(text.split("\n")[1:-1])

    try:
        data = json.loads(text)
    except Exception:
        print("⚠️ Invalid LLM JSON → skipping job")
        return None

    if not isinstance(data, dict):
        return None

    # SAFETY FIX (prevent DB crash)
    data["title"] = data.get("title") or "Unknown Title"
    data["company"] = data.get("company") or "Unknown Company"
    data["location"] = data.get("location") or ""
    data["description"] = data.get("description") or ""

    return data


# -----------------------------
# MAIN SCRAPER
# -----------------------------

async def run_scraping_agent(query: str = "python developer", max_jobs: int = 20):
    results = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.set_extra_http_headers({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        })

        for source in JOB_SOURCES:
            try:
                print(f"Scraping {source['name']}...")

                search_url = source["base_url"] + query.strip().replace(" ", "-")
                print("URL:", search_url)

                await page.goto(search_url, wait_until="domcontentloaded")
                await page.wait_for_timeout(3000)

                # FIXED LINK EXTRACTION
                links = await page.eval_on_selector_all(
                    "a",
                    """
                    els => els
                        .map(e => e.href)
                        .filter(h => h && h.includes('/job/'))
                    """
                )

                links = list(dict.fromkeys(links))

                print(f"Found {len(links)} links")

                if not links:
                    print("⚠️ No job links found")
                    continue

                for url in links[:max_jobs]:
                    try:
                        page_text = await scrape_job_page(page, url)
                        job_data = extract_job_details_with_llm(page_text, url)

                        if not job_data:
                            continue

                        job_data["url"] = url
                        job_data["source"] = source["name"]

                        results.append(job_data)

                        print(f"Extracted: {job_data['title']} at {job_data['company']}")

                        await asyncio.sleep(2)

                    except Exception as e:
                        print(f"Failed job {url}: {e}")

            except Exception as e:
                print(f"Source failed {source['name']}: {e}")

        await browser.close()

    return results


# -----------------------------
# SAVE TO DJANGO (FIXED SAFE VERSION)
# -----------------------------

def save_scraped_jobs(jobs: list) -> int:
    import django
    import sys

    backend_path = Path(__file__).resolve().parent.parent.parent / "backend"
    sys.path.insert(0, str(backend_path))

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    try:
        django.setup()
    except RuntimeError:
        pass

    from jobs_service.models import Job
    from matching_service.tasks import embed_job_task

    saved_count = 0

    for job_data in jobs:
        if not job_data:
            continue

        title = job_data.get("title") or "Unknown Title"

        deadline = None
        if job_data.get("deadline"):
            try:
                deadline = date.fromisoformat(job_data["deadline"])
            except Exception:
                pass

        try:
            job, created = Job.objects.get_or_create(
                url=job_data.get("url", ""),
                defaults={
                    "title": title,
                    "company": job_data.get("company") or "Unknown Company",
                    "location": job_data.get("location") or "",
                    "description": job_data.get("description") or "",
                    "source": job_data.get("source") or "",
                    "required_skills": job_data.get("required_skills") or [],
                    "deadline": deadline,
                    "is_deadline_confirmed": job_data.get(
                        "is_deadline_confirmed", False
                    ),
                },
            )

            if created:
                try:
                    embed_job_task.delay(job.id)
                except Exception as e:
                    print("Embedding task failed:", e)

                saved_count += 1

        except Exception as e:
            print(f"DB save failed: {e}")

    return saved_count