# -*- coding: utf-8 -*-
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
import asyncio
import json
import uuid
from typing import AsyncGenerator, Optional, List
from research import ResearchOrchestrator
from database import get_db, init_db, Company, Report, Persona, ResearchQueue
from parsers import parse_persona_table

app = FastAPI(title="Account Research API")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

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

class SaveResearchRequest(BaseModel):
    research_id: str
    company_name: str
    industry: Optional[str]
    llm_provider: str
    results: dict
    metadata: dict
    user_email: Optional[str] = None

class PersonaRequest(BaseModel):
    company_id: int
    name: str
    title: str
    added_by: Optional[str] = None

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
                yield f"data: {json.dumps(update, ensure_ascii=False)}\n\n"
                
        except Exception as e:
            error_update = {
                "type": "error",
                "message": str(e)
            }
            yield f"data: {json.dumps(error_update, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        generate_updates(),
        media_type="text/event-stream"
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/research/save")
async def save_research(request: SaveResearchRequest, db: Session = Depends(get_db)):
    """Save completed research to database"""
    try:
        # Check if company exists or create it
        company = db.query(Company).filter(Company.name == request.company_name).first()
        if not company:
            company = Company(
                name=request.company_name,
                industry=request.industry
            )
            db.add(company)
            db.flush()
        elif request.industry and not company.industry:
            company.industry = request.industry
        
        # Create report
        report = Report(
            company_id=company.id,
            research_id=uuid.UUID(request.research_id),
            user_email=request.user_email,
            llm_provider=request.llm_provider,
            llm_model=request.metadata.get("model"),
            total_tokens=request.metadata.get("total_tokens"),
            tavily_searches=request.metadata.get("tavily_searches"),
            research_duration_seconds=request.metadata.get("research_duration_seconds"),
            status="complete" if request.results.get("status") == "complete" else "failed"
        )
        
        # Save each step as JSONB
        steps = request.results.get("steps", {})
        report.step1_strategic_objectives = steps.get("step1_strategic_objectives")
        report.step2_bu_alignment = steps.get("step2_bu_alignment")
        report.step3_bu_deepdive = steps.get("step3_bu_deepdive")
        report.step4_ai_alignment = steps.get("step4_ai_alignment")
        report.step5_persona_mapping = steps.get("step5_persona_mapping")
        report.step6_value_realization = steps.get("step6_value_realization")
        report.step7_outreach_email = steps.get("step7_outreach_email")
        
        if request.results.get("status") == "complete":
            report.completed_at = datetime.now()
        
        db.add(report)
        db.flush()
        
        # Parse and save personas from Step 5
        if steps.get("step5_persona_mapping"):
            step5_data = steps["step5_persona_mapping"]
            persona_markdown = step5_data.get("markdown") or step5_data.get("data", "")
            personas = parse_persona_table(persona_markdown)
            
            for persona_data in personas:
                persona = Persona(
                    company_id=company.id,
                    report_id=report.id,
                    name=persona_data.get("name"),
                    title=persona_data.get("title") or persona_data.get("persona_title"),
                    role_in_decision=persona_data.get("role_in_decision"),
                    pain_point=persona_data.get("pain_point"),
                    ai_use_case=persona_data.get("ai_use_case"),
                    expected_outcome=persona_data.get("expected_outcome"),
                    strategic_alignment=persona_data.get("strategic_alignment"),
                    value_hook=persona_data.get("value_hook"),
                    source="auto",
                    last_researched_at=datetime.now()
                )
                db.add(persona)
        
        db.commit()
        
        return {
            "success": True,
            "company_id": company.id,
            "report_id": report.id,
            "research_id": str(report.research_id)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/companies")
async def get_companies(db: Session = Depends(get_db)):
    """Get all companies with their latest research date and persona count"""
    companies = db.query(Company).all()
    result = []
    
    for company in companies:
        latest_report = db.query(Report).filter(
            Report.company_id == company.id,
            Report.status == "complete"
        ).order_by(Report.created_at.desc()).first()
        
        persona_count = db.query(Persona).filter(Persona.company_id == company.id).count()
        
        result.append({
            "id": company.id,
            "name": company.name,
            "domain": company.domain,
            "industry": company.industry,
            "last_researched": latest_report.created_at.isoformat() if latest_report else None,
            "persona_count": persona_count,
            "created_at": company.created_at.isoformat(),
            "updated_at": company.updated_at.isoformat()
        })
    
    return result

@app.get("/api/companies/{company_id}/reports")
async def get_company_reports(company_id: int, db: Session = Depends(get_db)):
    """Get all reports for a specific company"""
    reports = db.query(Report).filter(Report.company_id == company_id).order_by(Report.created_at.desc()).all()
    
    return [{
        "id": report.id,
        "research_id": str(report.research_id),
        "status": report.status,
        "llm_provider": report.llm_provider,
        "llm_model": report.llm_model,
        "created_at": report.created_at.isoformat(),
        "completed_at": report.completed_at.isoformat() if report.completed_at else None,
        "research_duration_seconds": report.research_duration_seconds,
        "tavily_searches": report.tavily_searches,
        "total_tokens": report.total_tokens
    } for report in reports]

@app.get("/api/reports/{report_id}")
async def get_report(report_id: int, db: Session = Depends(get_db)):
    """Get full report details including all steps and personas"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    personas = db.query(Persona).filter(Persona.report_id == report_id).all()
    
    return {
        "id": report.id,
        "research_id": str(report.research_id),
        "company": {
            "id": report.company.id,
            "name": report.company.name,
            "industry": report.company.industry
        },
        "status": report.status,
        "steps": {
            "step1_strategic_objectives": report.step1_strategic_objectives,
            "step2_bu_alignment": report.step2_bu_alignment,
            "step3_bu_deepdive": report.step3_bu_deepdive,
            "step4_ai_alignment": report.step4_ai_alignment,
            "step5_persona_mapping": report.step5_persona_mapping,
            "step6_value_realization": report.step6_value_realization,
            "step7_outreach_email": report.step7_outreach_email
        },
        "personas": [{
            "id": p.id,
            "name": p.name,
            "title": p.title,
            "role_in_decision": p.role_in_decision,
            "pain_point": p.pain_point,
            "ai_use_case": p.ai_use_case,
            "expected_outcome": p.expected_outcome,
            "strategic_alignment": p.strategic_alignment,
            "value_hook": p.value_hook,
            "source": p.source,
            "added_by": p.added_by,
            "last_researched_at": p.last_researched_at.isoformat() if p.last_researched_at else None
        } for p in personas],
        "metadata": {
            "llm_provider": report.llm_provider,
            "llm_model": report.llm_model,
            "total_tokens": report.total_tokens,
            "tavily_searches": report.tavily_searches,
            "research_duration_seconds": report.research_duration_seconds,
            "created_at": report.created_at.isoformat(),
            "completed_at": report.completed_at.isoformat() if report.completed_at else None
        }
    }

@app.post("/api/personas")
async def add_manual_persona(request: PersonaRequest, db: Session = Depends(get_db)):
    """Manually add a persona to a company for research"""
    persona = Persona(
        company_id=request.company_id,
        name=request.name,
        title=request.title,
        source="manual",
        added_by=request.added_by
    )
    db.add(persona)
    db.commit()
    db.refresh(persona)
    
    return {
        "id": persona.id,
        "name": persona.name,
        "title": persona.title
    }

@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: int, db: Session = Depends(get_db)):
    """Delete a report and its associated personas"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db.delete(report)
    db.commit()
    
    return {"message": "Report deleted successfully"}
    
    # Add to research queue
    queue_item = ResearchQueue(
        company_id=request.company_id,
        persona_id=None,  # Will be set after commit
        requested_by=request.added_by
    )
    
    db.commit()
    db.refresh(persona)
    
    queue_item.persona_id = persona.id
    db.add(queue_item)
    db.commit()
    
    return {
        "success": True,
        "persona_id": persona.id,
        "queue_id": queue_item.id
    }

@app.get("/api/companies/{company_id}/personas")
async def get_company_personas(company_id: int, db: Session = Depends(get_db)):
    """Get all personas for a company"""
    personas = db.query(Persona).filter(Persona.company_id == company_id).all()
    
    return [{
        "id": p.id,
        "name": p.name,
        "title": p.title,
        "source": p.source,
        "added_by": p.added_by,
        "last_researched_at": p.last_researched_at.isoformat() if p.last_researched_at else None,
        "created_at": p.created_at.isoformat()
    } for p in personas]
