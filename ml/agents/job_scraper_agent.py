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
        # Use word boundary matching for better accuracy
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text):
            # Preserve original casing from SKILL_KEYWORDS
            found.append(skill.title())

    return list(dict.fromkeys(found))  # Remove duplicates while preserving order


async def get_job_links(page, query, max_jobs=10):
    """Scrape job listing page with retry logic"""
    url = f"https://www.rozee.pk/job/jsearch/q/{query.replace(' ', '-')}"
    print(f"Visiting: {url}")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Wait for networkidle to ensure JS has loaded
            await page.goto(url, wait_until="networkidle", timeout=60000)
            
            # Wait longer for dynamic content to load
            await page.wait_for_timeout(8000)
            
            # Try to wait for job listings container (with fallback)
            try:
                await page.wait_for_selector('a[href*="/job/"]', timeout=10000)
            except:
                print(f"  Warning: Job listings selector not found, continuing anyway...")
            
            break
        except PlaywrightTimeout:
            if attempt < max_retries - 1:
                print(f"  Timeout on attempt {attempt + 1}, retrying...")
                await asyncio.sleep(3)
            else:
                print(f"  Failed to load page after {max_retries} attempts")
                return []
        except Exception as e:
            print(f"  Error loading page: {e}")
            return []

    try:
        # Get page content to inspect
        content = await page.content()
        
        # Extract all links
        links = await page.eval_on_selector_all(
            "a",
            "els => els.map(e => e.href)"
        )

        # Filter for job links - be more flexible with patterns
        jobs = []
        seen = set()
        
        for link in links:
            if not link:
                continue
                
            # Check various patterns that might be job links
            is_job_link = (
                "rozee.pk/job/" in link and 
                "jsearch" not in link and
                "browse" not in link and
                "company" not in link
            )
            
            if is_job_link and link not in seen:
                jobs.append(link)
                seen.add(link)
        
        print(f"Found {len(jobs)} job links")
        
        # If no jobs found, save page HTML for debugging
        if len(jobs) == 0:
            debug_path = OUTPUT_DIR / "debug_page.html"
            with open(debug_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  No jobs found. Saved page HTML to: {debug_path}")
            print(f"  Please check if Rozee.pk structure has changed.")
            
            # Try alternative: look for any links with job-like patterns
            print(f"  Attempting to find job links with alternative patterns...")
            import re
            job_id_pattern = re.compile(r'rozee\.pk/job/\d+')
            alt_jobs = job_id_pattern.findall(content)
            if alt_jobs:
                jobs = [f"https://www.{match}" for match in set(alt_jobs)]
                print(f"  Found {len(jobs)} jobs using alternative pattern")
        
        return jobs[:max_jobs]
    
    except Exception as e:
        print(f"Error extracting links: {e}")
        import traceback
        traceback.print_exc()
        return []


async def scrape_job_detail(page, url, retry_count=0):
    """Scrape individual job page with enhanced error handling"""
    max_retries = 2
    
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_timeout(3000)

        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")

        # Extract title
        title = await page.title()
        if not title or title == "":
            title = "Unknown Position"
        title = title[:255]

        # Extract body text
        body_text = await page.inner_text("body")

        # Extract skills
        skills = extract_skills_from_text(body_text)

        # Extract company - try multiple selectors
        company = "Unknown"
        for selector in ["h1", "h2", ".company-name", "[class*='company']"]:
            company_el = soup.select_one(selector)
            if company_el:
                company = company_el.get_text(strip=True)[:150]
                if company and company != "Unknown":
                    break

        # Extract location with improved regex
        location = "Pakistan"
        location_match = re.search(
            r"(Karachi|Lahore|Islamabad|Rawalpindi|Peshawar|Quetta|Multan|Faisalabad|Sialkot|Gujranwala|Remote|Hybrid)",
            body_text,
            re.IGNORECASE
        )
        if location_match:
            location = location_match.group(1).title()

        # Extract description - clean and limit
        description = body_text[:5000].strip()

        return {
            "url": url,
            "title": title,
            "company": company,
            "location": location,
            "description": description,
            "required_skills": skills,
            "source": "rozee",
            "scraped_at": datetime.now().isoformat(),
        }

    except PlaywrightTimeout:
        if retry_count < max_retries:
            print(f"  Timeout scraping {url}, retry {retry_count + 1}/{max_retries}")
            await asyncio.sleep(2)
            return await scrape_job_detail(page, url, retry_count + 1)
        else:
            print(f"  Failed to scrape {url} after {max_retries} retries")
            return None
            
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None


async def run_scraping_agent(query="frontend developer", max_jobs=10):
    """Main scraping orchestrator with error handling"""
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True
            )

            page = await browser.new_page()
            
            # Set user agent to avoid blocking
            await page.set_extra_http_headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })

            links = await get_job_links(page, query, max_jobs)

            if not links:
                print("No job links found from Rozee.pk")
                print("Note: Rozee.pk may have changed their HTML structure.")
                print("Consider using alternative job sources or mock data for testing.")
                await browser.close()
                
                # Return mock data for testing if no real jobs found
                print("\n⚠️  Generating mock job data for testing purposes...")
                return generate_mock_jobs(query, max_jobs)

            jobs_data = []

            for i, url in enumerate(links):
                print(f"[{i+1}/{len(links)}] Scraping {url}")

                job = await scrape_job_detail(page, url)

                if job:
                    jobs_data.append(job)
                else:
                    print(f"  Skipped: {url}")

                # Rate limiting
                await asyncio.sleep(2)

            await browser.close()

            save_to_json(jobs_data, query)

            print(f"\n✅ Successfully scraped {len(jobs_data)}/{len(links)} jobs")
            return jobs_data
            
    except Exception as e:
        print(f"Fatal error in scraping agent: {e}")
        import traceback
        traceback.print_exc()
        
        # Return mock data as fallback
        print("\n⚠️  Generating mock job data as fallback...")
        return generate_mock_jobs(query, max_jobs)


def save_to_json(jobs, query):
    """Save scraped jobs to JSON file"""
    if not jobs:
        print("No jobs to save")
        return None

    clean_query = re.sub(r"[^\w\s-]", "", query).replace(" ", "_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    filepath = OUTPUT_DIR / f"jobs_{clean_query}_{timestamp}.json"

    try:
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
    except Exception as e:
        print(f"Error saving JSON: {e}")
        return None


def generate_mock_jobs(query, max_jobs=10):
    """
    Generate mock job data for testing when real scraping fails.
    This ensures the system can be tested without relying on external sites.
    """
    companies = [
        "Systems Limited", "TPS Worldwide", "Arbisoft", "i2c Inc", 
        "Inbox Business Technologies", "Techlogix", "MTBC", "Nisum",
        "Folio3 Software", "Netsol Technologies"
    ]
    
    locations = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Remote", "Hybrid"]
    
    # Generate skills based on query
    base_skills = extract_skills_from_text(query)
    if not base_skills:
        base_skills = ["Python", "Django", "React", "JavaScript", "PostgreSQL"]
    
    additional_skills = ["Git", "Docker", "AWS", "REST API", "Agile", "CI/CD"]
    
    mock_jobs = []
    
    for i in range(min(max_jobs, 10)):
        company = companies[i % len(companies)]
        location = locations[i % len(locations)]
        
        # Vary the skills for each job
        job_skills = base_skills.copy()
        job_skills.extend(additional_skills[:(i % 4) + 2])
        job_skills = list(dict.fromkeys(job_skills))  # Remove duplicates
        
        mock_job = {
            "url": f"https://www.rozee.pk/job/mock-{i+1}-{query.replace(' ', '-')}",
            "title": f"{query.title()} - {'Senior' if i % 3 == 0 else 'Mid-Level' if i % 3 == 1 else 'Junior'}",
            "company": company,
            "location": location,
            "description": f"""
We are looking for an experienced {query} to join our dynamic team.

Responsibilities:
• Design and develop scalable applications
• Collaborate with cross-functional teams
• Write clean, maintainable code
• Participate in code reviews
• Mentor junior developers

Requirements:
• {3 + (i % 3)} years of experience with {', '.join(job_skills[:3])}
• Strong understanding of software development principles
• Excellent problem-solving skills
• Good communication skills
• Bachelor's degree in Computer Science or related field

Benefits:
• Competitive salary
• Health insurance
• Flexible working hours
• Professional development opportunities
• Work from home options
            """.strip(),
            "required_skills": job_skills,
            "source": "mock_data",
            "scraped_at": datetime.now().isoformat(),
        }
        
        mock_jobs.append(mock_job)
    
    print(f"✅ Generated {len(mock_jobs)} mock jobs for testing")
    return mock_jobs

