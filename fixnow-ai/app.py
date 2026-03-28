import os
import uvicorn
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import classify_service

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI instance
app = FastAPI(
    title="FixNow AI Service Detector API",
    description="A hybrid AI service to detect service from text (Hindi, Hinglish, English)",
    version="1.0.0"
)

# CORS configuration for React / React Native apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class DetectionRequest(BaseModel):
    text: str

# Response Models
class ServiceResult(BaseModel):
    service: str
    confidence: int
    price: int

# -------------------------
# Health Check Endpoint
# -------------------------
@app.get("/health", tags=["General"])
async def health_check():
    return {"status": "healthy", "service": "fixnow-ai-detector", "ai_model": "Hybrid MNLI + Keyword Engine"}

# -------------------------
# Detection Endpoint
# -------------------------
@app.post("/detect-service", response_model=list[ServiceResult], tags=["AI"])
async def detect_service(payload: DetectionRequest):
    if not payload.text or len(payload.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Input text is required")
    
    try:
        logger.info(f"Processing detection for: {payload.text}")
        results = classify_service(payload.text)
        
        # Check if first result is an error message
        if results and "error" in results[0]:
             # Return as 200 but maybe empty list or handle as 500 if critical? 
             # Let's keep it robust and return empty for better UX in frontend
             logger.error(f"Detection error: {results[0].get('error')}")
             return []
        
        return results

    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# Fallback basic middleware for JSON only
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # Ensure header context or other things can be added here
    response = await call_next(request)
    return response

# Main entry point for local execution
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)


@app.get("/")
def root():
    return {"status": "FixNow AI running"}