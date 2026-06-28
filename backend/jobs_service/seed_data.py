"""
Mock job data for seeding the database when scraping fails or returns no results.
Provides realistic job listings to ensure the UI never appears empty.
"""

from django.utils import timezone
from datetime import timedelta
import random


MOCK_JOBS = [
    # Python/Django Jobs
    {
        "title": "Senior Python Developer",
        "company": "Systems Limited",
        "location": "Lahore, Pakistan",
        "description": "We are seeking an experienced Python developer to join our team. You will work on building scalable backend systems using Django and FastAPI. Requirements include 5+ years of Python experience, strong knowledge of RESTful APIs, PostgreSQL, and Docker. Experience with cloud platforms (AWS/Azure) is a plus.",
        "url": "https://jobs.systemsltd.com/python-dev-001",
        "source": "mock_data",
        "required_skills": ["Python", "Django", "Fastapi", "Postgresql", "Docker", "Rest Api", "Aws"]
    },
    {
        "title": "Python Backend Engineer",
        "company": "NetSol Technologies",
        "location": "Karachi, Pakistan",
        "description": "Join our team to develop microservices architecture using Python and Django. Work with cutting-edge technologies including Kubernetes, Redis, and RabbitMQ. Must have strong problem-solving skills and experience with agile methodologies.",
        "url": "https://careers.netsoltech.com/backend-python-002",
        "source": "mock_data",
        "required_skills": ["Python", "Django", "Kubernetes", "Redis", "Rabbitmq", "Microservices", "Agile"]
    },
    {
        "title": "Django Developer",
        "company": "Arbisoft",
        "location": "Islamabad, Pakistan",
        "description": "Looking for a Django developer to build and maintain web applications. Experience with Django REST Framework, Celery, and PostgreSQL required. You'll collaborate with frontend teams and contribute to API design.",
        "url": "https://arbisoft.com/careers/django-dev-003",
        "source": "mock_data",
        "required_skills": ["Python", "Django", "Rest Api", "Postgresql", "Celery", "Git"]
    },
    
    # Full Stack Jobs
    {
        "title": "Full Stack Developer (Python + React)",
        "company": "TkXel",
        "location": "Lahore, Pakistan",
        "description": "We need a full stack developer proficient in Python/Django backend and React frontend. Build modern web applications with excellent UX. Must have experience with Redux, TypeScript, and RESTful APIs.",
        "url": "https://tkxel.com/jobs/fullstack-004",
        "source": "mock_data",
        "required_skills": ["Python", "Django", "React", "Typescript", "Redux", "Rest Api", "Git"]
    },
    {
        "title": "Senior Full Stack Engineer",
        "company": "Folio3",
        "location": "Karachi, Pakistan",
        "description": "Join our product team as a senior full stack engineer. Work with Django, React, and AWS to build enterprise solutions. Strong architectural skills and mentoring ability required.",
        "url": "https://folio3.com/careers/fullstack-senior-005",
        "source": "mock_data",
        "required_skills": ["Python", "Django", "React", "Aws", "Docker", "Postgresql", "Leadership"]
    },
    {
        "title": "Full Stack Developer",
        "company": "Afiniti",
        "location": "Remote, Pakistan",
        "description": "Build scalable web applications using modern tech stack. Experience with Python, JavaScript frameworks, and cloud deployment required. Remote-first company with flexible hours.",
        "url": "https://afiniti.com/jobs/fullstack-006",
        "source": "mock_data",
        "required_skills": ["Python", "Javascript", "React", "Node.Js", "Sql", "Docker"]
    },
    
    # Frontend Jobs
    {
        "title": "React Frontend Developer",
        "company": "Teresol",
        "location": "Lahore, Pakistan",
        "description": "Create beautiful, responsive user interfaces using React and TypeScript. Experience with modern CSS frameworks (Tailwind, Material-UI) and state management (Redux, Context API) essential.",
        "url": "https://teresol.com/jobs/react-007",
        "source": "mock_data",
        "required_skills": ["React", "Typescript", "Javascript", "Tailwind", "Redux", "Html", "Css"]
    },
    {
        "title": "Frontend Engineer (Vue.js)",
        "company": "Inbox Business Technologies",
        "location": "Islamabad, Pakistan",
        "description": "Build modern SPAs using Vue.js 3 and Composition API. Work closely with design and backend teams. Strong JavaScript fundamentals and CSS skills required.",
        "url": "https://inboxbiz.com/careers/vue-008",
        "source": "mock_data",
        "required_skills": ["Vue", "Javascript", "Typescript", "Html", "Css", "Webpack"]
    },
    {
        "title": "Senior React Developer",
        "company": "10Pearls",
        "location": "Karachi, Pakistan",
        "description": "Lead frontend development for enterprise clients. Expertise in React, Next.js, and performance optimization required. Mentor junior developers and contribute to technical decisions.",
        "url": "https://10pearls.com/jobs/react-senior-009",
        "source": "mock_data",
        "required_skills": ["React", "Next.Js", "Typescript", "Javascript", "Performance", "Leadership"]
    },
    {
        "title": "Frontend Developer (Angular)",
        "company": "VentureDive",
        "location": "Lahore, Pakistan",
        "description": "Develop enterprise applications using Angular 15+. Strong TypeScript skills and experience with RxJS required. Work on challenging projects for international clients.",
        "url": "https://venturedive.com/careers/angular-010",
        "source": "mock_data",
        "required_skills": ["Angular", "Typescript", "Javascript", "Rxjs", "Html", "Css", "Sass"]
    },
    
    # Backend/Node.js Jobs
    {
        "title": "Node.js Backend Developer",
        "company": "Programmers Force",
        "location": "Islamabad, Pakistan",
        "description": "Build RESTful APIs and microservices using Node.js and Express. Experience with MongoDB, Redis, and message queues required. Strong async programming skills essential.",
        "url": "https://programmersforce.com/jobs/nodejs-011",
        "source": "mock_data",
        "required_skills": ["Node.Js", "Express", "Javascript", "Mongodb", "Redis", "Rest Api"]
    },
    {
        "title": "Backend Engineer (Node.js)",
        "company": "Cubix",
        "location": "Karachi, Pakistan",
        "description": "Design and implement scalable backend services. Work with GraphQL, PostgreSQL, and Docker. Collaborate with mobile and web teams on API design.",
        "url": "https://cubix.co/careers/backend-012",
        "source": "mock_data",
        "required_skills": ["Node.Js", "Graphql", "Postgresql", "Docker", "Rest Api", "Aws"]
    },
    
    # DevOps Jobs
    {
        "title": "DevOps Engineer",
        "company": "Systems Limited",
        "location": "Lahore, Pakistan",
        "description": "Manage CI/CD pipelines and cloud infrastructure. Experience with Kubernetes, Docker, Jenkins, and AWS required. Automate deployment processes and ensure system reliability.",
        "url": "https://jobs.systemsltd.com/devops-013",
        "source": "mock_data",
        "required_skills": ["Docker", "Kubernetes", "Aws", "Jenkins", "Ci/Cd", "Linux", "Python"]
    },
    {
        "title": "Senior DevOps Engineer",
        "company": "Nisum",
        "location": "Remote, Pakistan",
        "description": "Lead DevOps initiatives for Fortune 500 clients. Expertise in Terraform, Kubernetes, and cloud platforms essential. Build robust monitoring and alerting systems.",
        "url": "https://nisum.com/jobs/devops-senior-014",
        "source": "mock_data",
        "required_skills": ["Kubernetes", "Docker", "Aws", "Terraform", "Jenkins", "Monitoring", "Linux"]
    },
    {
        "title": "Cloud DevOps Specialist",
        "company": "CloudFlex",
        "location": "Islamabad, Pakistan",
        "description": "Architect and maintain cloud infrastructure on AWS/Azure. Implement infrastructure as code using Terraform. Strong scripting skills in Python/Bash required.",
        "url": "https://cloudflex.com/careers/devops-015",
        "source": "mock_data",
        "required_skills": ["Aws", "Docker", "Kubernetes", "Terraform", "Python", "Bash", "Ci/Cd"]
    },
    
    # Data Science/ML Jobs
    {
        "title": "Machine Learning Engineer",
        "company": "Afiniti",
        "location": "Karachi, Pakistan",
        "description": "Develop and deploy ML models for production systems. Experience with TensorFlow, PyTorch, and scikit-learn required. Work on cutting-edge AI applications.",
        "url": "https://afiniti.com/jobs/ml-016",
        "source": "mock_data",
        "required_skills": ["Python", "Machine Learning", "Tensorflow", "Pytorch", "Scikit-Learn", "Sql"]
    },
    {
        "title": "Data Scientist",
        "company": "Teradata Pakistan",
        "location": "Lahore, Pakistan",
        "description": "Analyze large datasets and build predictive models. Strong Python skills and experience with pandas, NumPy, and visualization tools required. SQL expertise essential.",
        "url": "https://teradata.com/pk/jobs/data-scientist-017",
        "source": "mock_data",
        "required_skills": ["Python", "Machine Learning", "Sql", "Pandas", "Data Analysis", "Statistics"]
    },
    {
        "title": "Senior ML Engineer",
        "company": "Careem (Uber)",
        "location": "Karachi, Pakistan",
        "description": "Build ML systems at scale for millions of users. Experience with deep learning, NLP, and production ML pipelines required. Competitive compensation and benefits.",
        "url": "https://careers.careem.com/ml-senior-018",
        "source": "mock_data",
        "required_skills": ["Python", "Machine Learning", "Deep Learning", "Nlp", "Tensorflow", "Aws"]
    },
    {
        "title": "AI/ML Developer",
        "company": "Xavor Corporation",
        "location": "Islamabad, Pakistan",
        "description": "Develop AI-powered solutions using modern ML frameworks. Experience with computer vision or NLP preferred. Work on innovative projects for US clients.",
        "url": "https://xavor.com/careers/ai-ml-019",
        "source": "mock_data",
        "required_skills": ["Python", "Machine Learning", "Tensorflow", "Pytorch", "Deep Learning", "Nlp"]
    },
    
    # Mobile Development Jobs
    {
        "title": "React Native Developer",
        "company": "Creative Chaos",
        "location": "Karachi, Pakistan",
        "description": "Build cross-platform mobile applications using React Native. Strong JavaScript/TypeScript skills required. Experience with native modules and performance optimization a plus.",
        "url": "https://creativechaos.com/jobs/react-native-020",
        "source": "mock_data",
        "required_skills": ["React", "React Native", "Javascript", "Typescript", "Mobile Development"]
    },
    {
        "title": "Flutter Developer",
        "company": "TechAbout",
        "location": "Lahore, Pakistan",
        "description": "Create beautiful mobile apps using Flutter and Dart. Experience with state management (Provider, Bloc) and Firebase integration required.",
        "url": "https://techabout.com/careers/flutter-021",
        "source": "mock_data",
        "required_skills": ["Flutter", "Dart", "Mobile Development", "Firebase", "Rest Api"]
    },
    
    # Software Engineering (General)
    {
        "title": "Software Engineer",
        "company": "Google (via contractor)",
        "location": "Remote, Pakistan",
        "description": "Work on large-scale distributed systems. Strong CS fundamentals and coding skills in Python/Java/C++ required. Competitive compensation with global team collaboration.",
        "url": "https://careers.google.com/pakistan/swe-022",
        "source": "mock_data",
        "required_skills": ["Python", "Java", "C++", "Algorithms", "System Design", "Git"]
    },
    {
        "title": "Software Development Engineer",
        "company": "Amazon Pakistan",
        "location": "Karachi, Pakistan",
        "description": "Join Amazon's engineering team in Pakistan. Build scalable services for millions of customers. Strong problem-solving skills and experience with AWS required.",
        "url": "https://amazon.jobs/pakistan/sde-023",
        "source": "mock_data",
        "required_skills": ["Java", "Python", "Aws", "System Design", "Sql", "Distributed Systems"]
    },
    {
        "title": "Backend Software Engineer",
        "company": "Shopify Pakistan",
        "location": "Remote, Pakistan",
        "description": "Build e-commerce infrastructure at scale. Experience with Ruby on Rails or similar frameworks. Strong database and API design skills required.",
        "url": "https://shopify.com/careers/pakistan/backend-024",
        "source": "mock_data",
        "required_skills": ["Ruby", "Rails", "Sql", "Rest Api", "Redis", "Docker"]
    },
    {
        "title": "Software Engineer II",
        "company": "Microsoft Pakistan",
        "location": "Islamabad, Pakistan",
        "description": "Work on Microsoft cloud services. Strong C#/.NET experience required. Contribute to products used by millions worldwide.",
        "url": "https://careers.microsoft.com/pakistan/swe2-025",
        "source": "mock_data",
        "required_skills": ["C#", ".Net", "Azure", "Sql", "Rest Api", "Git"]
    },
    
    # QA/Testing Jobs
    {
        "title": "QA Automation Engineer",
        "company": "Mentor Graphics",
        "location": "Lahore, Pakistan",
        "description": "Build automated testing frameworks using Selenium and Python. Experience with CI/CD integration and test reporting required. Strong scripting skills essential.",
        "url": "https://mentorgraphics.com/pk/jobs/qa-026",
        "source": "mock_data",
        "required_skills": ["Python", "Selenium", "Testing", "Automation", "Ci/Cd", "Jenkins"]
    },
    {
        "title": "Software Test Engineer",
        "company": "Emumba",
        "location": "Islamabad, Pakistan",
        "description": "Ensure software quality through manual and automated testing. Design test cases and identify defects. ISTQB certification preferred.",
        "url": "https://emumba.com/careers/qa-027",
        "source": "mock_data",
        "required_skills": ["Testing", "Automation", "Selenium", "Jira", "Agile", "Python"]
    },
    
    # Security Jobs
    {
        "title": "Security Engineer",
        "company": "NETSOL Technologies",
        "location": "Lahore, Pakistan",
        "description": "Implement security best practices and conduct vulnerability assessments. Experience with penetration testing and security tools required.",
        "url": "https://netsoltech.com/careers/security-028",
        "source": "mock_data",
        "required_skills": ["Security", "Python", "Linux", "Networking", "Penetration Testing"]
    },
    
    # Database Jobs
    {
        "title": "Database Administrator",
        "company": "MCB Bank",
        "location": "Karachi, Pakistan",
        "description": "Manage and optimize PostgreSQL/Oracle databases. Experience with replication, backup strategies, and performance tuning required. Financial sector experience a plus.",
        "url": "https://mcb.com.pk/careers/dba-029",
        "source": "mock_data",
        "required_skills": ["Postgresql", "Oracle", "Sql", "Database", "Performance", "Linux"]
    },
    
    # More Python Jobs
    {
        "title": "Python Developer (Flask)",
        "company": "Daraz (Alibaba)",
        "location": "Karachi, Pakistan",
        "description": "Build microservices using Flask and Python. Work on e-commerce platform serving millions of users. Strong API design skills required.",
        "url": "https://careers.daraz.pk/python-flask-030",
        "source": "mock_data",
        "required_skills": ["Python", "Flask", "Rest Api", "Mongodb", "Docker", "Redis"]
    },
    {
        "title": "Python Automation Engineer",
        "company": "Siemens Pakistan",
        "location": "Lahore, Pakistan",
        "description": "Develop automation scripts and tools using Python. Work on industrial IoT systems. Strong problem-solving and scripting skills required.",
        "url": "https://siemens.com.pk/careers/python-automation-031",
        "source": "mock_data",
        "required_skills": ["Python", "Automation", "Linux", "Scripting", "Iot", "Git"]
    },
    {
        "title": "Django REST Framework Developer",
        "company": "Zameen.com",
        "location": "Lahore, Pakistan",
        "description": "Build RESTful APIs for Pakistan's largest real estate platform. Experience with DRF, PostgreSQL, and caching strategies required.",
        "url": "https://careers.zameen.com/drf-dev-032",
        "source": "mock_data",
        "required_skills": ["Python", "Django", "Rest Api", "Postgresql", "Redis", "Elasticsearch"]
    },
    
    # More Full Stack
    {
        "title": "MERN Stack Developer",
        "company": "TPS Worldwide",
        "location": "Karachi, Pakistan",
        "description": "Full stack development using MongoDB, Express, React, and Node.js. Build modern web applications from scratch. Fresh graduates welcome to apply.",
        "url": "https://tps.com.pk/jobs/mern-033",
        "source": "mock_data",
        "required_skills": ["Node.Js", "React", "Express", "Mongodb", "Javascript", "Rest Api"]
    },
    {
        "title": "Full Stack Engineer (Django + Vue)",
        "company": "LMKR",
        "location": "Islamabad, Pakistan",
        "description": "Develop geospatial applications using Django backend and Vue.js frontend. Work on innovative mapping and data visualization projects.",
        "url": "https://lmkr.com/careers/fullstack-034",
        "source": "mock_data",
        "required_skills": ["Python", "Django", "Vue", "Javascript", "Postgresql", "Rest Api"]
    },
    
    # More Frontend
    {
        "title": "UI/UX Frontend Developer",
        "company": "Mindstorm Studios",
        "location": "Lahore, Pakistan",
        "description": "Create pixel-perfect interfaces using React and modern CSS. Strong design sense and attention to detail required. Work with international gaming clients.",
        "url": "https://mindstormstudios.com/jobs/ui-frontend-035",
        "source": "mock_data",
        "required_skills": ["React", "Javascript", "Html", "Css", "Sass", "Ui/Ux Design"]
    },
    {
        "title": "JavaScript Developer",
        "company": "Ovex Technologies",
        "location": "Islamabad, Pakistan",
        "description": "Build dynamic web applications using vanilla JavaScript and modern frameworks. Strong ES6+ knowledge and DOM manipulation skills required.",
        "url": "https://ovex.com/careers/js-dev-036",
        "source": "mock_data",
        "required_skills": ["Javascript", "Html", "Css", "React", "Webpack", "Git"]
    },
    
    # More Backend
    {
        "title": "Backend Developer (Java Spring Boot)",
        "company": "Contour Software",
        "location": "Karachi, Pakistan",
        "description": "Develop enterprise applications using Java and Spring Boot. Strong OOP principles and microservices architecture experience required.",
        "url": "https://contoursoftware.com/jobs/java-037",
        "source": "mock_data",
        "required_skills": ["Java", "Spring Boot", "Sql", "Rest Api", "Microservices", "Docker"]
    },
    {
        "title": "Go Backend Developer",
        "company": "i2c Inc.",
        "location": "Lahore, Pakistan",
        "description": "Build high-performance backend services using Golang. Experience with concurrency, gRPC, and cloud deployment required.",
        "url": "https://i2cinc.com/careers/golang-038",
        "source": "mock_data",
        "required_skills": ["Golang", "Microservices", "Docker", "Kubernetes", "Grpc", "Postgresql"]
    },
    
    # More Data Science
    {
        "title": "Data Engineer",
        "company": "Jazz (Pakistan Mobile)",
        "location": "Islamabad, Pakistan",
        "description": "Build data pipelines and ETL processes. Experience with Apache Spark, Airflow, and big data technologies required. Work with telecom data at scale.",
        "url": "https://careers.jazz.com.pk/data-engineer-039",
        "source": "mock_data",
        "required_skills": ["Python", "Sql", "Spark", "Data Engineering", "Etl", "Aws"]
    },
    {
        "title": "Business Intelligence Developer",
        "company": "Telenor Pakistan",
        "location": "Islamabad, Pakistan",
        "description": "Create dashboards and reports using Tableau/Power BI. Strong SQL and data visualization skills required. Telecom domain knowledge a plus.",
        "url": "https://telenor.com.pk/careers/bi-040",
        "source": "mock_data",
        "required_skills": ["Sql", "Tableau", "Power Bi", "Python", "Data Analysis", "Etl"]
    },
    
    # More DevOps
    {
        "title": "Site Reliability Engineer",
        "company": "Careem",
        "location": "Karachi, Pakistan",
        "description": "Ensure reliability and performance of production systems. Experience with monitoring tools, incident management, and automation required.",
        "url": "https://careers.careem.com/sre-041",
        "source": "mock_data",
        "required_skills": ["Linux", "Docker", "Kubernetes", "Python", "Monitoring", "Aws"]
    },
    {
        "title": "Cloud Engineer",
        "company": "Systems Limited",
        "location": "Lahore, Pakistan",
        "description": "Design and implement cloud solutions on AWS/Azure. Experience with serverless architectures and cost optimization required.",
        "url": "https://systemsltd.com/jobs/cloud-042",
        "source": "mock_data",
        "required_skills": ["Aws", "Azure", "Docker", "Terraform", "Lambda", "Python"]
    },
    
    # Specialized Roles
    {
        "title": "Blockchain Developer",
        "company": "Blockchain Labs Pakistan",
        "location": "Remote, Pakistan",
        "description": "Develop smart contracts and DApps using Solidity and Web3.js. Experience with Ethereum, DeFi protocols, and cryptography required.",
        "url": "https://blockchainlabs.pk/jobs/blockchain-043",
        "source": "mock_data",
        "required_skills": ["Solidity", "Blockchain", "Web3", "Javascript", "Smart Contracts"]
    },
    {
        "title": "WordPress Developer",
        "company": "Digital Marketing Agency",
        "location": "Lahore, Pakistan",
        "description": "Customize WordPress themes and develop plugins. Strong PHP and JavaScript skills required. Experience with WooCommerce a plus.",
        "url": "https://digitalagency.pk/jobs/wordpress-044",
        "source": "mock_data",
        "required_skills": ["Php", "Wordpress", "Javascript", "Mysql", "Html", "Css"]
    },
    {
        "title": "Shopify Developer",
        "company": "E-commerce Solutions PK",
        "location": "Karachi, Pakistan",
        "description": "Build and customize Shopify stores. Experience with Liquid templating, Shopify APIs, and app development required.",
        "url": "https://ecommsolutions.pk/jobs/shopify-045",
        "source": "mock_data",
        "required_skills": ["Shopify", "Javascript", "Html", "Css", "Liquid", "Rest Api"]
    },
    {
        "title": "Game Developer (Unity)",
        "company": "Caramel Tech Studios",
        "location": "Lahore, Pakistan",
        "description": "Create mobile games using Unity3D and C#. Experience with game physics, animations, and monetization strategies required.",
        "url": "https://carameltech.com/jobs/unity-046",
        "source": "mock_data",
        "required_skills": ["Unity", "C#", "Game Development", "Mobile", "3D Graphics"]
    },
    {
        "title": "IoT Developer",
        "company": "Neem IoT Solutions",
        "location": "Islamabad, Pakistan",
        "description": "Develop IoT solutions using Raspberry Pi, Arduino, and MQTT. Experience with embedded systems and Python required.",
        "url": "https://neemiot.com/careers/iot-047",
        "source": "mock_data",
        "required_skills": ["Python", "Iot", "Raspberry Pi", "Mqtt", "Embedded Systems"]
    },
    {
        "title": "Computer Vision Engineer",
        "company": "AI Robotics Pakistan",
        "location": "Lahore, Pakistan",
        "description": "Develop computer vision applications using OpenCV and deep learning. Experience with object detection and image processing required.",
        "url": "https://airobotics.pk/jobs/cv-048",
        "source": "mock_data",
        "required_skills": ["Python", "Opencv", "Deep Learning", "Tensorflow", "Computer Vision"]
    },
    {
        "title": "NLP Engineer",
        "company": "KeepTruckin Pakistan",
        "location": "Islamabad, Pakistan",
        "description": "Build NLP models for text analysis and chatbots. Experience with spaCy, NLTK, and transformer models required.",
        "url": "https://keeptruckin.com/pk/jobs/nlp-049",
        "source": "mock_data",
        "required_skills": ["Python", "Nlp", "Machine Learning", "Tensorflow", "Spacy", "Transformers"]
    },
    {
        "title": "Rust Developer",
        "company": "Systems Performance Labs",
        "location": "Remote, Pakistan",
        "description": "Build high-performance systems using Rust. Work on blockchain and distributed systems projects. Strong systems programming background required.",
        "url": "https://sysperflabs.com/jobs/rust-050",
        "source": "mock_data",
        "required_skills": ["Rust", "Systems Programming", "Blockchain", "Performance", "Concurrency"]
    }
]


def load_mock_jobs():
    """
    Load mock job data into the database.
    Returns the number of jobs created.
    """
    from .models import Job
    from matching_service.tasks import embed_job
    
    created_count = 0
    embedded_count = 0
    
    print("Loading mock job data...")
    
    for job_data in MOCK_JOBS:
        try:
            # Add random deadline between 7-30 days from now
            days_until_deadline = random.randint(7, 30)
            deadline = (timezone.now() + timedelta(days=days_until_deadline)).date()
            
            obj, created = Job.objects.get_or_create(
                url=job_data['url'],
                defaults={
                    'title': job_data['title'],
                    'company': job_data['company'],
                    'location': job_data['location'],
                    'description': job_data['description'],
                    'required_skills': job_data['required_skills'],
                    'source': job_data['source'],
                    'deadline': deadline,
                    'is_deadline_confirmed': False,
                }
            )
            
            if created:
                created_count += 1
                # Try to embed the job
                try:
                    embed_job(obj.id)
                    embedded_count += 1
                except Exception as e:
                    print(f"Warning: Could not embed job {obj.id}: {e}")
                    # Continue even if embedding fails
                    pass
                    
        except Exception as e:
            print(f"Error creating mock job: {e}")
            continue
    
    print(f"✅ Mock data loaded: {created_count} jobs created, {embedded_count} embedded")
    return created_count
