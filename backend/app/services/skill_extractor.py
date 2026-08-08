from groq import Groq
from app.core.config import settings
import json

client = Groq(api_key=settings.GROQ_API_KEY)

def extract_skills(resume_text: str) -> list:
    prompt = f"""
You are an expert career analyst. Extract technical and soft skills from the following resume text.
Return ONLY valid JSON in this exact format:
{{
  "skills": [
    {{"name": "skill name", "category": "Programming|Framework|Tool|Soft Skill|Domain", "confidence": 0.9}}
  ]
}}
Be precise. Do not invent skills that are not clearly present.

Resume:
{resume_text}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get("skills", [])
    except Exception as e:
        print(f"Skill extraction error: {e}")
        return []