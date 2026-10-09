from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.router import api_v1_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Python FastAPI backend for Hybrid RAG, Vector Search & LangGraph Multi-Agent Orchestration.",
    version=settings.VERSION
)

app.include_router(
    api_v1_router,
    prefix=settings.API_V1_STR
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "dan-ai-engine",
        "version": settings.VERSION
    }
