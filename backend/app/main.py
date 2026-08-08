from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import profiles

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(profiles.router, prefix="/api/v1/profiles", tags=["Profiles"])

@app.get("/")
def root():
    return {"message": "SkillGap AI Backend is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}