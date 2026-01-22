from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json
from typing import AsyncGenerator, Optional
from research import ResearchOrchestrator

app = FastAPI(title="Account Research API")

# Allow frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    company_name: str
    llm_provider: str = "anthropic"  # or "openai"
    api_key: str  # User provides their own API key
    tavily_api_key: Optional[str] = None  # Optional Tavily API key for web search

@app.get("/")
async def root():
    return {"status": "Account Research API is running"}

@app.post("/api/research")
async def start_research(request: ResearchRequest):
    """
    Run full 7-step research workflow.
    Returns streaming response with progress updates.
    """
    # Create orchestrator with optional Tavily API key
    orchestrator = ResearchOrchestrator(tavily_api_key=request.tavily_api_key)
    
    async def generate_updates() -> AsyncGenerator[str, None]:
        try:
            async for update in orchestrator.run_full_research(
                company_name=request.company_name,
                llm_provider=request.llm_provider,
                api_key=request.api_key
            ):
                # Send server-sent event format
                yield f"data: {json.dumps(update)}\n\n"
                
        except Exception as e:
            error_update = {
                "type": "error",
                "message": str(e)
            }
            yield f"data: {json.dumps(error_update)}\n\n"
    
    return StreamingResponse(
        generate_updates(),
        media_type="text/event-stream"
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
