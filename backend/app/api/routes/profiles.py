from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.resume_parser import extract_text_from_pdf
from app.services.skill_extractor import extract_skills
from app.services.skill_gap import calculate_skill_gap
from app.services.job_matcher import get_recommended_jobs

router = APIRouter()

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

    # Extract skills using Groq
    skills = extract_skills(text)

    return {
        "filename": file.filename,
        "extracted_text": text,
        "char_count": len(text),
        "skills": skills
    }


@router.post("/skill-gap")
async def skill_gap_analysis(payload: dict):
    skills = payload.get("skills", [])
    target_role = payload.get("target_role", "")

    if not skills:
        raise HTTPException(status_code=400, detail="Skills are required")
    if not target_role:
        raise HTTPException(status_code=400, detail="Target role is required")

    result = calculate_skill_gap(skills, target_role)
    return result


@router.post("/jobs")
async def get_jobs(payload: dict):
    target_role = payload.get("target_role", "")

    if not target_role:
        raise HTTPException(status_code=400, detail="target_role is required")

    jobs = get_recommended_jobs(target_role)

    return {
        "target_role": target_role,
        "jobs": jobs,
        "count": len(jobs)
    }