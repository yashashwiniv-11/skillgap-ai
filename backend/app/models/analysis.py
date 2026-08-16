from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String, nullable=False)
    target_role = Column(String, nullable=False)
    match_score = Column(Float, nullable=False)
    skills_count = Column(Integer, default=0)
    skills_json = Column(Text, nullable=True)
    gap_result_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())