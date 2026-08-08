from typing import List, Dict

ROLE_REQUIREMENTS = {
    "data scientist": {
        "critical": ["Python", "Machine Learning", "SQL", "Statistics", "Pandas"],
        "important": ["TensorFlow", "PyTorch", "Data Visualization", "Scikit-learn", "NumPy"],
        "nice_to_have": ["Deep Learning", "NLP", "Spark", "AWS", "Docker"]
    },
    "full stack developer": {
        "critical": ["JavaScript", "React", "Node.js", "HTML", "CSS", "SQL"],
        "important": ["TypeScript", "Next.js", "MongoDB", "Express", "Git"],
        "nice_to_have": ["Docker", "AWS", "GraphQL", "Redis", "Tailwind CSS"]
    },
    "machine learning engineer": {
        "critical": ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch"],
        "important": ["SQL", "Docker", "AWS", "MLOps", "Scikit-learn"],
        "nice_to_have": ["Kubernetes", "Spark", "FastAPI", "CI/CD", "Linux"]
    },
    "frontend developer": {
        "critical": ["JavaScript", "React", "HTML", "CSS", "TypeScript"],
        "important": ["Next.js", "Tailwind CSS", "Git", "Redux", "Responsive Design"],
        "nice_to_have": ["GraphQL", "Jest", "Webpack", "Figma", "Vue.js"]
    },
    "backend developer": {
        "critical": ["Python", "SQL", "API", "Git", "Database"],
        "important": ["FastAPI", "Django", "PostgreSQL", "Docker", "Linux"],
        "nice_to_have": ["Redis", "AWS", "Kubernetes", "GraphQL", "MongoDB"]
    },
    "data analyst": {
        "critical": ["SQL", "Excel", "Python", "Data Visualization", "Statistics"],
        "important": ["Pandas", "Power BI", "Tableau", "NumPy", "Data Cleaning"],
        "nice_to_have": ["Machine Learning", "R", "Google Analytics", "Looker", "ETL"]
    },
    "devops engineer": {
        "critical": ["Linux", "Docker", "Git", "CI/CD", "Cloud"],
        "important": ["Kubernetes", "AWS", "Terraform", "Jenkins", "Python"],
        "nice_to_have": ["Ansible", "Prometheus", "Grafana", "Bash", "Networking"]
    },
    "ai engineer": {
        "critical": ["Python", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow"],
        "important": ["NLP", "Computer Vision", "MLOps", "FastAPI", "Docker"],
        "nice_to_have": ["LangChain", "Hugging Face", "AWS", "Vector Databases", "LLMs"]
    }
}

LEARNING_RESOURCES = {
    "Python": "Learn Python on freeCodeCamp or Coursera (Python for Everybody)",
    "JavaScript": "JavaScript full course on freeCodeCamp or JavaScript.info",
    "React": "React Official Docs + freeCodeCamp React course",
    "Node.js": "Node.js and Express course on freeCodeCamp",
    "HTML": "HTML & CSS full course on freeCodeCamp",
    "CSS": "CSS full course + Tailwind CSS documentation",
    "SQL": "SQL for Data Analysis on Mode Analytics or freeCodeCamp",
    "Machine Learning": "Andrew Ng Machine Learning course (Coursera)",
    "Deep Learning": "Deep Learning Specialization by Andrew Ng",
    "TensorFlow": "TensorFlow Developer Certificate course",
    "PyTorch": "PyTorch Official Tutorials + freeCodeCamp",
    "Docker": "Docker Official Getting Started + freeCodeCamp Docker course",
    "AWS": "AWS Cloud Practitioner free course on AWS Skill Builder",
    "TypeScript": "TypeScript Official Handbook + freeCodeCamp",
    "Next.js": "Next.js Official Learn course",
    "MongoDB": "MongoDB University free courses",
    "Git": "Git & GitHub crash course on freeCodeCamp",
    "Pandas": "Pandas documentation + Kaggle Pandas course",
    "Statistics": "Statistics with Python on Coursera",
    "FastAPI": "FastAPI Official Tutorial",
    "Linux": "Linux Journey or freeCodeCamp Linux course",
    "Kubernetes": "Kubernetes Official Basics + free courses on YouTube",
    "Power BI": "Microsoft Power BI free learning path",
    "Tableau": "Tableau free training videos",
    "Express": "Express.js documentation + freeCodeCamp",
    "Scikit-learn": "Scikit-learn official tutorials",
    "OpenCV": "OpenCV Python tutorials"
}

# Mapping for better matching (aliases)
SKILL_ALIASES = {
    "react.js": "react",
    "reactjs": "react",
    "node.js": "node.js",
    "nodejs": "node.js",
    "html5": "html",
    "css3": "css",
    "js": "javascript",
    "ts": "typescript",
    "nextjs": "next.js",
    "express.js": "express",
    "expressjs": "express",
    "mongo": "mongodb",
    "postgres": "postgresql",
    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "tf": "tensorflow",
    "torch": "pytorch",
    "ml": "machine learning",
    "dl": "deep learning",
    "cv": "computer vision",
    "nlp": "nlp",
}

def normalize_skill(skill: str) -> str:
    s = skill.lower().strip()
    # Remove common suffixes
    s = s.replace(".js", "").replace(".ts", "")
    return SKILL_ALIASES.get(s, s)

def calculate_skill_gap(user_skills: List[Dict], target_role: str) -> Dict:
    role = target_role.lower().strip()
    
    if role not in ROLE_REQUIREMENTS:
        return {
            "error": f"Role '{target_role}' not found. Available roles: {list(ROLE_REQUIREMENTS.keys())}"
        }

    requirements = ROLE_REQUIREMENTS[role]
    
    # Normalize user skills
    user_skill_names = {normalize_skill(skill["name"]) for skill in user_skills}

    def check_skills(skill_list):
        has = []
        missing = []
        for skill in skill_list:
            normalized = normalize_skill(skill)
            if normalized in user_skill_names or skill.lower() in user_skill_names:
                has.append(skill)
            else:
                missing.append(skill)
        return has, missing

    critical_has, critical_missing = check_skills(requirements["critical"])
    important_has, important_missing = check_skills(requirements["important"])
    nice_has, nice_missing = check_skills(requirements["nice_to_have"])

    # Calculate match score
    total_critical = len(requirements["critical"])
    total_important = len(requirements["important"])
    
    score = 0
    if total_critical > 0:
        score += (len(critical_has) / total_critical) * 60
    if total_important > 0:
        score += (len(important_has) / total_important) * 30
    if len(requirements["nice_to_have"]) > 0:
        score += (len(nice_has) / len(requirements["nice_to_have"])) * 10

    # Learning path
    missing_skills = critical_missing + important_missing
    learning_path = []
    for skill in missing_skills:
        resource = LEARNING_RESOURCES.get(skill, f"Search for '{skill}' courses on Coursera or freeCodeCamp")
        learning_path.append({
            "skill": skill,
            "resource": resource
        })

    return {
        "target_role": target_role,
        "match_score": round(score, 1),
        "critical": {
            "has": critical_has,
            "missing": critical_missing
        },
        "important": {
            "has": important_has,
            "missing": important_missing
        },
        "nice_to_have": {
            "has": nice_has,
            "missing": nice_missing
        },
        "learning_path": learning_path
    }