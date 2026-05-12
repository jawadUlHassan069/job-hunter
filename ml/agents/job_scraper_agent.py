import asyncio
import json
import os
import anthropic
from datetime import date
from playwright.async_api import async_playwright

# add job sources here — one entry per site
JOB_SOURCES = [
    {
        'name':          'rozee',
        'url':           'https://www.rozee.pk/job/jsearch/q/python-developer',
        'link_selector': 'a.job-title-clamp',
    },
]


async def scrape_job_page(page, url: str) -> str:
    """Visit a job page and return all visible text."""
    await page.goto(url, wait_until='domcontentloaded', timeout=30000)
    await page.wait_for_timeout(2000)
    return await page.inner_text('body')


def extract_job_details_with_llm(page_text: str, url: str) -> dict:
    """Use Claude to extract structured job data from raw page text."""
    client = anthropic.Anthropic(
        api_key=os.environ.get('CLAUDE_API_KEY', '')
    )

    prompt = f"""
Extract job details from this job posting.
Return ONLY a valid JSON object. No explanation. No markdown.

Return exactly this structure:
{{
  "title": "job title",
  "company": "company name",
  "location": "city or remote",
  "description": "job description max 800 chars",
  "required_skills": ["skill1", "skill2"],
  "deadline": "YYYY-MM-DD or null if not found",
  "is_deadline_confirmed": true or false
}}

Job posting text:
{page_text[:3500]}

URL: {url}
"""

    message = client.messages.create(
        model      = 'claude-sonnet-4-20250514',
        max_tokens = 800,
        messages   = [{'role': 'user', 'content': prompt}]
    )

    text = message.content[0].text.strip()

    # strip markdown fences if present
    if text.startswith('```'):
        lines = text.split('\n')
        text  = '\n'.join(lines[1:-1])

    return json.loads(text)


async def run_scraping_agent(query: str = 'python developer', max_jobs: int = 20) -> list:
    """
    Main scraping function.
    Visits job sites, extracts job details using LLM.
    Returns list of job dicts.
    """
    results = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page    = await browser.new_page()

        await page.set_extra_http_headers({
            'User-Agent': (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/120.0.0.0 Safari/537.36'
            )
        })

        for source in JOB_SOURCES:
            try:
                print(f"Scraping {source['name']}...")
                await page.goto(source['url'], wait_until='domcontentloaded')
                await page.wait_for_timeout(3000)

                links = await page.eval_on_selector_all(
                    source['link_selector'],
                    "els => els.map(e => e.href).filter(Boolean)"
                )

                print(f"Found {len(links)} links on {source['name']}")

                for url in links[:max_jobs]:
                    try:
                        page_text = await scrape_job_page(page, url)
                        job_data  = extract_job_details_with_llm(page_text, url)
                        job_data['url']    = url
                        job_data['source'] = source['name']
                        results.append(job_data)
                        print(f"Extracted: {job_data.get('title')} at {job_data.get('company')}")
                        await asyncio.sleep(2)   # polite delay
                    except Exception as e:
                        print(f"Failed on {url}: {e}")
                        continue

            except Exception as e:
                print(f"Failed source {source['name']}: {e}")
                continue

        await browser.close()

    return results


def save_scraped_jobs(jobs: list) -> int:
    """
    Save scraped job dicts to PostgreSQL.
    Triggers ChromaDB embedding for each new job.
    Returns count of newly saved jobs.
    """
    import django
    import sys
    from pathlib import Path

    # setup Django so we can use ORM outside of request cycle
    backend_path = Path(__file__).resolve().parent.parent.parent / 'backend'
    sys.path.insert(0, str(backend_path))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

    try:
        django.setup()
    except RuntimeError:
        pass  # already setup

    from jobs_service.models import Job
    from matching_service.tasks import embed_job_task

    saved_count = 0

    for job_data in jobs:
        # parse deadline string
        deadline     = None
        deadline_str = job_data.get('deadline')
        if deadline_str:
            try:
                deadline = date.fromisoformat(deadline_str)
            except (ValueError, TypeError):
                pass

        job, created = Job.objects.get_or_create(
            url      = job_data.get('url', ''),
            defaults = {
                'title':                 job_data.get('title',           'Unknown'),
                'company':               job_data.get('company',         'Unknown'),
                'location':              job_data.get('location',        ''),
                'description':           job_data.get('description',     ''),
                'source':                job_data.get('source',          ''),
                'required_skills':       job_data.get('required_skills', []),
                'deadline':              deadline,
                'is_deadline_confirmed': job_data.get('is_deadline_confirmed', False),
            }
        )

        if created:
            # embed new job in background
            try:
                embed_job_task.delay(job.id)
            except Exception as e:
                print(f'Could not queue embed task: {e}')
            saved_count += 1

    return saved_count