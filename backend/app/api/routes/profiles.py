from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import json

from app.services.resume_parser import extract_text_from_pdf
from app.services.skill_extractor import extract_skills
from app.services.skill_gap import calculate_skill_gap
from app.services.job_matcher import get_recommended_jobs
from app.core.database import get_db
from app.models.analysis import Analysis

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


@router.post("/save-analysis")
async def save_analysis(payload: dict, db: Session = Depends(get_db)):
    filename = payload.get("filename", "resume")
    target_role = payload.get("target_role", "")
    match_score = payload.get("match_score", 0)
    skills = payload.get("skills", [])
    gap_result = payload.get("gap_result", {})
    user_id = payload.get("user_id", None)

    if not target_role:
        raise HTTPException(status_code=400, detail="target_role is required")

    analysis = Analysis(
        user_id=user_id,
        filename=filename,
        target_role=target_role,
        match_score=match_score,
        skills_count=len(skills),
        skills_json=json.dumps(skills),
        gap_result_json=json.dumps(gap_result),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "id": analysis.id,
        "message": "Analysis saved successfully",
        "created_at": str(analysis.created_at)
    }


@router.get("/history")
async def get_history(user_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Analysis)
    if user_id:
        query = query.filter(Analysis.user_id == user_id)

    analyses = query.order_by(Analysis.created_at.desc()).limit(20).all()

    result = []
    for a in analyses:
        result.append({
            "id": a.id,
            "filename": a.filename,
            "target_role": a.target_role,
            "match_score": a.match_score,
            "skills_count": a.skills_count,
            "skills": json.loads(a.skills_json) if a.skills_json else [],
            "gap_result": json.loads(a.gap_result_json) if a.gap_result_json else {},
            "date": str(a.created_at)
        })

    return {"history": result, "count": len(result)}