from typing import List, Dict

JOB_DATABASE = {
    "full stack developer": [
        {
            "title": "Full Stack Developer",
            "company": "TechNova Solutions",
            "location": "Hyderabad / Remote",
            "type": "Full-time",
            "skills": ["React", "Node.js", "SQL", "JavaScript"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=Full%20Stack%20Developer"
        },
        {
            "title": "MERN Stack Developer",
            "company": "CodeCraft Labs",
            "location": "Bangalore",
            "type": "Full-time",
            "skills": ["MongoDB", "Express", "React", "Node.js"],
            "link": "https://www.naukri.com/mern-stack-jobs"
        },
        {
            "title": "Junior Full Stack Engineer",
            "company": "StartupHive",
            "location": "Remote",
            "type": "Internship / Full-time",
            "skills": ["JavaScript", "React", "HTML", "CSS"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=Junior%20Full%20Stack"
        }
    ],
    "frontend developer": [
        {
            "title": "Frontend Developer",
            "company": "PixelPerfect UI",
            "location": "Hyderabad",
            "type": "Full-time",
            "skills": ["React", "TypeScript", "CSS", "HTML"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=Frontend%20Developer"
        },
        {
            "title": "React.js Developer",
            "company": "WebSpark Technologies",
            "location": "Remote",
            "type": "Full-time",
            "skills": ["React", "JavaScript", "Next.js"],
            "link": "https://www.naukri.com/react-js-jobs"
        }
    ],
    "backend developer": [
        {
            "title": "Backend Developer (Python)",
            "company": "DataCore Systems",
            "location": "Bangalore",
            "type": "Full-time",
            "skills": ["Python", "FastAPI", "SQL", "Docker"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=Backend%20Developer%20Python"
        },
        {
            "title": "API Developer",
            "company": "CloudNest",
            "location": "Remote",
            "type": "Full-time",
            "skills": ["Python", "REST API", "PostgreSQL"],
            "link": "https://www.naukri.com/backend-developer-jobs"
        }
    ],
    "data scientist": [
        {
            "title": "Data Scientist",
            "company": "InsightAI Labs",
            "location": "Hyderabad / Remote",
            "type": "Full-time",
            "skills": ["Python", "Machine Learning", "SQL", "Pandas"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=Data%20Scientist"
        },
        {
            "title": "Junior Data Scientist",
            "company": "AnalyticsPro",
            "location": "Bangalore",
            "type": "Full-time",
            "skills": ["Python", "Statistics", "Scikit-learn"],
            "link": "https://www.naukri.com/data-scientist-jobs"
        }
    ],
    "machine learning engineer": [
        {
            "title": "Machine Learning Engineer",
            "company": "DeepLearn Technologies",
            "location": "Bangalore",
            "type": "Full-time",
            "skills": ["Python", "PyTorch", "TensorFlow", "MLOps"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=Machine%20Learning%20Engineer"
        }
    ],
    "data analyst": [
        {
            "title": "Data Analyst",
            "company": "Insight Metrics",
            "location": "Hyderabad",
            "type": "Full-time",
            "skills": ["SQL", "Excel", "Power BI", "Python"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=Data%20Analyst"
        },
        {
            "title": "Business Data Analyst",
            "company": "GrowData Inc",
            "location": "Remote",
            "type": "Full-time",
            "skills": ["SQL", "Tableau", "Excel"],
            "link": "https://www.naukri.com/data-analyst-jobs"
        }
    ],
    "ai engineer": [
        {
            "title": "AI Engineer",
            "company": "NeuralForge",
            "location": "Bangalore / Remote",
            "type": "Full-time",
            "skills": ["Python", "LLMs", "LangChain", "Deep Learning"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=AI%20Engineer"
        }
    ],
    "devops engineer": [
        {
            "title": "DevOps Engineer",
            "company": "CloudOps Hub",
            "location": "Hyderabad",
            "type": "Full-time",
            "skills": ["Docker", "Kubernetes", "AWS", "CI/CD"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=DevOps%20Engineer"
        }
    ],
    "mobile developer": [
        {
            "title": "React Native Developer",
            "company": "AppCraft Studios",
            "location": "Remote",
            "type": "Full-time",
            "skills": ["React Native", "JavaScript", "Firebase"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=React%20Native%20Developer"
        }
    ],
    "cloud engineer": [
        {
            "title": "Cloud Engineer (AWS)",
            "company": "SkyScale Cloud",
            "location": "Bangalore",
            "type": "Full-time",
            "skills": ["AWS", "Docker", "Linux", "Terraform"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=Cloud%20Engineer%20AWS"
        }
    ],
    "cybersecurity analyst": [
        {
            "title": "Cybersecurity Analyst",
            "company": "SecureNet Solutions",
            "location": "Hyderabad",
            "type": "Full-time",
            "skills": ["Networking", "Security", "SIEM", "Linux"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=Cybersecurity%20Analyst"
        }
    ],
    "product manager": [
        {
            "title": "Associate Product Manager",
            "company": "ProductLabs",
            "location": "Bangalore / Remote",
            "type": "Full-time",
            "skills": ["Product Management", "Agile", "Communication"],
            "link": "https://www.linkedin.com/jobs/search/?keywords=Associate%20Product%20Manager"
        }
    ]
}

def get_recommended_jobs(target_role: str) -> List[Dict]:
    role = target_role.lower().strip()
    jobs = JOB_DATABASE.get(role, [])

    # Fallback: search loosely
    if not jobs:
        for key, value in JOB_DATABASE.items():
            if role in key or key in role:
                jobs = value
                break

    return jobs