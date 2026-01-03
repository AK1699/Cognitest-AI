"""
Performance Testing Microservice
Main application entry point
"""
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.v1.endpoints import performance

app = FastAPI(
    title="Cognitest Performance Testing Service",
    description="Microservice for Lighthouse audits, Load testing, and AI-powered performance analysis",
    version="0.1.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router
api_router = APIRouter()
api_router.include_router(performance.router, prefix="/performance", tags=["performance"])

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "performance-testing"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
