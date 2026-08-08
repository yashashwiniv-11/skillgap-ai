from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.resume_parser import extract_text_from_pdf
from app.services.skill_extractor import extract_skills
from app.services.skill_gap import calculate_skill_gap

router = APIRouter()

class Skill(BaseModel):
    name: str
    category: str
    confidence: float

class GapRequest(BaseModel):
    skills: List[Skill]
    target_role: str

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if file.content_type not in ["application/pdf", "text/plain"]:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are allowed")

    content = await file.read()

    if file.content_type == "application/pdf":
        try:
            text = extract_text_from_pdf(content)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        text = content.decode("utf-8")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted")

    skills = extract_skills(text)

    return {
        "filename": file.filename,
        "extracted_text": text,
        "char_count": len(text),
        "skills": skills
    }

@router.post("/skill-gap")
async def get_skill_gap(request: GapRequest):
    result = calculate_skill_gap(
        user_skills=[skill.dict() for skill in request.skills],
        target_role=request.target_role
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result