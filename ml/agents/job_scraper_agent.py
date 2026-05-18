import asyncio
import json
import re
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

OUTPUT_DIR = Path(__file__).resolve().parents[2] / "backend" / "scraped_jobs"
OUTPUT_DIR.mkdir(exist_ok=True)

SKILL_KEYWORDS = [
    "python", "django", "react", "javascript",
    "typescript", "aws", "docker", "sql"
]


def extract_skills_from_text(text: str):
    text = text.lower()
    found = []

    for skill in SKILL_KEYWORDS:
        if skill in text:
            found.append(skill.title())

    return list(dict.fromkeys(found))


async def get_job_links(page, query, max_jobs=10):
    url = f"https://www.rozee.pk/job/jsearch/q/{query.replace(' ', '-')}"
    print(f"Visiting: {url}")

    await page.goto(url, wait_until="domcontentloaded", timeout=60000)
    await page.wait_for_timeout(5000)

    links = await page.eval_on_selector_all(
        "a",
        "els => els.map(e => e.href)"
    )

    jobs = list(set([
        link for link in links
        if link and "rozee.pk/job" in link and "jsearch" not in link
    ]))

    print(f"Found {len(jobs)} job links")
    return jobs[:max_jobs]


async def scrape_job_detail(page, url):
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_timeout(3000)

        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")

        title = await page.title()
        body_text = await page.inner_text("body")

        skills = extract_skills_from_text(body_text)

        company = "Unknown"
        company_el = soup.find("h1") or soup.find("h2")
        if company_el:
            company = company_el.get_text(strip=True)[:150]

        location = "Pakistan"
        match = re.search(
            r"(Karachi|Lahore|Islamabad|Rawalpindi|Remote)",
            body_text,
            re.I
        )
        if match:
            location = match.group(1)

        return {
            "url": url,
            "title": title[:255],
            "company": company,
            "location": location,
            "description": body_text[:5000],
            "required_skills": skills,
            "source": "rozee",
            "scraped_at": datetime.now().isoformat(),
        }

    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None


async def run_scraping_agent(query="frontend developer", max_jobs=10):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True   # set True later for production
        )

        page = await browser.new_page()

        links = await get_job_links(page, query, max_jobs)

        jobs_data = []

        for i, url in enumerate(links):
            print(f"[{i+1}/{len(links)}] Scraping {url}")

            job = await scrape_job_detail(page, url)

            if job:
                jobs_data.append(job)

            await asyncio.sleep(2)

        await browser.close()

        save_to_json(jobs_data, query)

        print(f"Saved {len(jobs_data)} jobs")
        return jobs_data


def save_to_json(jobs, query):
    if not jobs:
        return

    clean_query = re.sub(r"[^\w\s-]", "", query).replace(" ", "_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    filepath = OUTPUT_DIR / f"jobs_{clean_query}_{timestamp}.json"

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(
            {
                "query": query,
                "count": len(jobs),
                "scraped_at": datetime.now().isoformat(),
                "jobs": jobs
            },
            f,
            indent=4,
            ensure_ascii=False
        )

    print(f"JSON saved at: {filepath}")
    return filepath