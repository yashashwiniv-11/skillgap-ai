# SkillGap AI

AI-powered skill gap analyzer that helps students and job seekers understand the gap between their current skills and target job roles.

## Features

- **Resume Upload** – Supports PDF and TXT files
- **AI Skill Extraction** – Uses Groq (Llama 3.3) to extract skills with categories and confidence scores
- **Skill Gap Analysis** – Compare your skills against target roles
- **Match Score** – Get a percentage match for your chosen role
- **Learning Path** – Personalized resource recommendations for missing skills
- **Download Report** – Export full analysis as a text report
- **History** – Save and revisit previous analyses (localStorage)

## Supported Roles

- Data Scientist
- Full Stack Developer
- Machine Learning Engineer
- Frontend Developer
- Backend Developer
- Data Analyst
- DevOps Engineer
- AI Engineer

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend   | FastAPI, Python                     |
| AI        | Groq API (Llama 3.3 70B)            |
| PDF Parse | pdfplumber                          |

## Project Structure
skillgap-ai/
├── frontend/                  # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx           # Main application page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/ui/         # shadcn components
│   └── package.json
│
├── backend/                   # FastAPI Backend
│   ├── app/
│   │   ├── api/routes/
│   │   │   └── profiles.py    # Upload + Skill Gap endpoints
│   │   ├── core/
│   │   │   └── config.py      # Settings & env
│   │   ├── services/
│   │   │   ├── skill_extractor.py
│   │   │   ├── skill_gap.py
│   │   │   └── resume_parser.py
│   │   └── main.py
│   ├── .env
│   └── requirements.txt
│
└── README.md

---

## How to Run Locally

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn python-multipart pydantic-settings python-dotenv pdfplumber groq

# Start the server
python -m uvicorn app.main:app --reload --port 8000