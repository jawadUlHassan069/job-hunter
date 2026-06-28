"""
Multi-source job scraper supporting multiple job boards.
Falls back to alternative sources if one fails.
"""

import asyncio
import json
import re
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup

OUTPUT_DIR = Path(__file__).resolve().parents[2] / "backend" / "scraped_jobs"
OUTPUT_DIR.mkdir(exist_ok=True)

SKILL_KEYWORDS = [
    "python", "django", "react", "javascript",
    "typescript", "aws", "docker", "sql",
    "node.js", "express", "mongodb", "postgresql",
    "flask", "fastapi", "vue", "angular",
    "git", "linux", "kubernetes", "jenkins",
    "ci/cd", "rest api", "graphql", "redis",
    "elasticsearch", "kafka", "rabbitmq",
    "machine learning", "deep learning", "nlp",
    "tensorflow", "pytorch", "scikit-learn",
    "html", "css", "sass", "tailwind",
    "bootstrap", "webpack", "vite", "next.js",
    "java", "spring boot", "c++", "golang",
    "rust", "php", "laravel", "wordpress",
    "mysql", "oracle", "nosql", "firebase",
    "agile", "scrum", "jira", "testing"
]


def extract_skills_from_text(text: str):
    """Extract skills from text using case-insensitive matching"""
    text = text.lower()
    found = []

    for skill in SKILL_KEYWORDS:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text):
            found.append(skill.title())

    return list(dict.fromkeys(found))


# ============================================================================
# INDEED SCRAPER (Works well, no login required)
# ============================================================================

async def scrape_indeed(page, query, location="Pakistan", max_jobs=10):
    """Scrape jobs from Indeed.com"""
    print(f"\n=== Scraping Indeed for '{query}' ===")
    
    # Build Indeed URL
    query_encoded = query.replace(' ', '+')
    location_encoded = location.replace(' ', '+')
    url = f"https://pk.indeed.com/jobs?q={query_encoded}&l={location_encoded}"
    
    print(f"Visiting: {url}")
    
    try:
        await page.goto(url, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(3000)
        
        # Indeed uses specific selectors for job cards
        job_cards = await page.query_selector_all('.job_seen_beacon')
        
        print(f"Found {len(job_cards)} job cards on Indeed")
        
        jobs_data = []
        
        for i, card in enumerate(job_cards[:max_jobs]):
            try:
                # Extract job data from card
                title_elem = await card.query_selector('h2.jobTitle a')
                company_elem = await card.query_selector('[data-testid="company-name"]')
                location_elem = await card.query_selector('[data-testid="text-location"]')
                snippet_elem = await card.query_selector('.job-snippet')
                
                if not title_elem:
                    continue
                
                title = await title_elem.inner_text()
                title = title.strip()[:255]
                
                company = "Unknown"
                if company_elem:
                    company = await company_elem.inner_text()
                    company = company.strip()[:200]
                
                job_location = location
                if location_elem:
                    job_location = await location_elem.inner_text()
                    job_location = job_location.strip()[:200]
                
                snippet = ""
                if snippet_elem:
                    snippet = await snippet_elem.inner_text()
                
                # Get job URL
                job_url = await title_elem.get_attribute('href')
                if job_url and not job_url.startswith('http'):
                    job_url = f"https://pk.indeed.com{job_url}"
                
                # Extract skills from snippet
                skills = extract_skills_from_text(f"{title} {snippet}")
                
                job_data = {
                    "url": job_url or f"https://pk.indeed.com/viewjob?jk=indeed_{i}",
                    "title": title,
                    "company": company,
                    "location": job_location,
                    "description": snippet[:5000],
                    "required_skills": skills,
                    "source": "indeed",
                    "scraped_at": datetime.now().isoformat(),
                }
                
                jobs_data.append(job_data)
                print(f"  [{i+1}] {title} at {company}")
                
            except Exception as e:
                print(f"  Error scraping Indeed job card {i+1}: {e}")
                continue
        
        print(f"✅ Indeed: Scraped {len(jobs_data)} jobs")
        return jobs_data
        
    except Exception as e:
        print(f"❌ Indeed scraping failed: {e}")
        return []


# ============================================================================
# LINKEDIN SCRAPER (Uses public job search - no login)
# ============================================================================

async def scrape_linkedin(page, query, location="Pakistan", max_jobs=10):
    """Scrape jobs from LinkedIn (public job search)"""
    print(f"\n=== Scraping LinkedIn for '{query}' ===")
    
    query_encoded = query.replace(' ', '%20')
    location_encoded = location.replace(' ', '%20')
    url = f"https://www.linkedin.com/jobs/search?keywords={query_encoded}&location={location_encoded}"
    
    print(f"Visiting: {url}")
    
    try:
        await page.goto(url, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(5000)
        
        # LinkedIn job cards
        job_cards = await page.query_selector_all('li.job-search-card')
        
        if not job_cards:
            # Try alternative selector
            job_cards = await page.query_selector_all('.jobs-search__results-list li')
        
        print(f"Found {len(job_cards)} job cards on LinkedIn")
        
        jobs_data = []
        
        for i, card in enumerate(job_cards[:max_jobs]):
            try:
                title_elem = await card.query_selector('.base-search-card__title')
                company_elem = await card.query_selector('.base-search-card__subtitle')
                location_elem = await card.query_selector('.job-search-card__location')
                link_elem = await card.query_selector('a.base-card__full-link')
                
                if not title_elem or not link_elem:
                    continue
                
                title = await title_elem.inner_text()
                title = title.strip()[:255]
                
                company = "Unknown"
                if company_elem:
                    company = await company_elem.inner_text()
                    company = company.strip()[:200]
                
                job_location = location
                if location_elem:
                    job_location = await location_elem.inner_text()
                    job_location = job_location.strip()[:200]
                
                job_url = await link_elem.get_attribute('href')
                
                # LinkedIn jobs usually have description in separate page
                # For now, use title and company to extract skills
                skills = extract_skills_from_text(f"{title} {company}")
                
                job_data = {
                    "url": job_url or f"https://www.linkedin.com/jobs/view/linkedin_{i}",
                    "title": title,
                    "company": company,
                    "location": job_location,
                    "description": f"Position: {title} at {company}. Location: {job_location}. Visit LinkedIn for full details.",
                    "required_skills": skills,
                    "source": "linkedin",
                    "scraped_at": datetime.now().isoformat(),
                }
                
                jobs_data.append(job_data)
                print(f"  [{i+1}] {title} at {company}")
                
            except Exception as e:
                print(f"  Error scraping LinkedIn job card {i+1}: {e}")
                continue
        
        print(f"✅ LinkedIn: Scraped {len(jobs_data)} jobs")
        return jobs_data
        
    except Exception as e:
        print(f"❌ LinkedIn scraping failed: {e}")
        return []


# ============================================================================
# GLASSDOOR SCRAPER
# ============================================================================

async def scrape_glassdoor(page, query, location="Pakistan", max_jobs=10):
    """Scrape jobs from Glassdoor"""
    print(f"\n=== Scraping Glassdoor for '{query}' ===")
    
    query_encoded = query.replace(' ', '-')
    location_encoded = location.replace(' ', '-')
    url = f"https://www.glassdoor.com/Job/{location_encoded}-{query_encoded}-jobs-SRCH_IL.0,8_IC{location_encoded}_KO9,{len(query_encoded)+9}.htm"
    
    # Simpler URL
    url = f"https://www.glassdoor.com/Job/jobs.htm?sc.keyword={query.replace(' ', '+')}"
    
    print(f"Visiting: {url}")
    
    try:
        await page.goto(url, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(5000)
        
        # Glassdoor job cards
        job_cards = await page.query_selector_all('[data-test="jobListing"]')
        
        if not job_cards:
            job_cards = await page.query_selector_all('li.react-job-listing')
        
        print(f"Found {len(job_cards)} job cards on Glassdoor")
        
        jobs_data = []
        
        for i, card in enumerate(job_cards[:max_jobs]):
            try:
                title_elem = await card.query_selector('[data-test="job-title"]')
                company_elem = await card.query_selector('[data-test="employer-name"]')
                location_elem = await card.query_selector('[data-test="location"]')
                
                if not title_elem:
                    continue
                
                title = await title_elem.inner_text()
                title = title.strip()[:255]
                
                company = "Unknown"
                if company_elem:
                    company = await company_elem.inner_text()
                    company = company.strip()[:200]
                
                job_location = location
                if location_elem:
                    job_location = await location_elem.inner_text()
                    job_location = job_location.strip()[:200]
                
                # Extract skills
                skills = extract_skills_from_text(f"{title} {company}")
                
                job_data = {
                    "url": f"https://www.glassdoor.com/job-listing/{i}",
                    "title": title,
                    "company": company,
                    "location": job_location,
                    "description": f"Position: {title} at {company}. Visit Glassdoor for full details.",
                    "required_skills": skills,
                    "source": "glassdoor",
                    "scraped_at": datetime.now().isoformat(),
                }
                
                jobs_data.append(job_data)
                print(f"  [{i+1}] {title} at {company}")
                
            except Exception as e:
                print(f"  Error scraping Glassdoor job card {i+1}: {e}")
                continue
        
        print(f"✅ Glassdoor: Scraped {len(jobs_data)} jobs")
        return jobs_data
        
    except Exception as e:
        print(f"❌ Glassdoor scraping failed: {e}")
        return []


# ============================================================================
# MAIN ORCHESTRATOR
# ============================================================================

async def run_multi_source_scraping(query="python developer", location="Pakistan", max_jobs=10):
    """
    Scrape from multiple sources and combine results.
    Falls back to next source if one fails.
    """
    print(f"\n{'='*60}")
    print(f"MULTI-SOURCE JOB SCRAPER")
    print(f"Query: {query}")
    print(f"Location: {location}")
    print(f"Max jobs per source: {max_jobs}")
    print(f"{'='*60}\n")
    
    all_jobs = []
    
    try:
        async with async_playwright() as p:
            # Launch browser with memory optimization flags
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--disable-dev-shm-usage',  # Overcome limited resource problems
                    '--no-sandbox',              # Required for Docker/Render
                    '--disable-setuid-sandbox',
                    '--disable-gpu',             # Disable GPU hardware acceleration
                    '--disable-software-rasterizer',
                    '--disable-extensions',      # Disable extensions
                    '--disable-background-networking',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-breakpad',
                    '--disable-component-extensions-with-background-pages',
                    '--disable-features=TranslateUI',
                    '--disable-ipc-flooding-protection',
                    '--disable-renderer-backgrounding',
                    '--enable-features=NetworkService,NetworkServiceInProcess',
                    '--force-color-profile=srgb',
                    '--hide-scrollbars',
                    '--metrics-recording-only',
                    '--mute-audio',
                    '--no-first-run',
                ]
            )
            
            # Create page with reduced viewport to save memory
            page = await browser.new_page(viewport={'width': 1280, 'height': 720})
            
            # Set realistic user agent
            await page.set_extra_http_headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })
            
            # Try Indeed first (most reliable)
            try:
                indeed_jobs = await scrape_indeed(page, query, location, max_jobs)
                all_jobs.extend(indeed_jobs)
            except Exception as e:
                print(f"Indeed failed: {e}")
            
            # Try LinkedIn
            try:
                linkedin_jobs = await scrape_linkedin(page, query, location, max_jobs)
                all_jobs.extend(linkedin_jobs)
            except Exception as e:
                print(f"LinkedIn failed: {e}")
            
            # Try Glassdoor
            try:
                glassdoor_jobs = await scrape_glassdoor(page, query, location, max_jobs)
                all_jobs.extend(glassdoor_jobs)
            except Exception as e:
                print(f"Glassdoor failed: {e}")
            
            await browser.close()
            
    except Exception as e:
        print(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
    
    # Remove duplicates based on URL
    seen_urls = set()
    unique_jobs = []
    for job in all_jobs:
        if job['url'] not in seen_urls:
            seen_urls.add(job['url'])
            unique_jobs.append(job)
    
    print(f"\n{'='*60}")
    print(f"SCRAPING COMPLETE")
    print(f"Total jobs scraped: {len(unique_jobs)}")
    print(f"Sources: Indeed ({len([j for j in unique_jobs if j['source']=='indeed'])}), "
          f"LinkedIn ({len([j for j in unique_jobs if j['source']=='linkedin'])}), "
          f"Glassdoor ({len([j for j in unique_jobs if j['source']=='glassdoor'])})")
    print(f"{'='*60}\n")
    
    # Save to JSON
    if unique_jobs:
        save_to_json(unique_jobs, query)
    
    return unique_jobs


def save_to_json(jobs, query):
    """Save scraped jobs to JSON file"""
    clean_query = re.sub(r"[^\w\s-]", "", query).replace(" ", "_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = OUTPUT_DIR / f"jobs_{clean_query}_{timestamp}.json"
    
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump({
                "query": query,
                "count": len(jobs),
                "scraped_at": datetime.now().isoformat(),
                "jobs": jobs
            }, f, indent=4, ensure_ascii=False)
        
        print(f"✅ Saved to: {filepath}")
        return filepath
    except Exception as e:
        print(f"Error saving JSON: {e}")
        return None
