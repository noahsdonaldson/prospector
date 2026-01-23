"""Database models and connection for Prospector"""

import os
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, TIMESTAMP,
    ForeignKey, DECIMAL, ARRAY, Boolean, text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import uuid

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://prospector:prospector_dev_password@localhost:5432/prospector")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    domain = Column(String(255))
    industry = Column(String(100), index=True)
    created_at = Column(TIMESTAMP, server_default=text('NOW()'))
    updated_at = Column(TIMESTAMP, server_default=text('NOW()'))
    
    # Relationships
    reports = relationship("Report", back_populates="company", cascade="all, delete-orphan")
    personas = relationship("Persona", back_populates="company", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    research_id = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4, index=True)
    user_email = Column(String(255))
    
    # Research steps stored as JSONB
    step1_strategic_objectives = Column(JSONB)
    step2_bu_alignment = Column(JSONB)
    step3_bu_deepdive = Column(JSONB)
    step4_transformation_roadmap = Column(JSONB)
    step5_persona_mapping = Column(JSONB)
    step6_value_realization = Column(JSONB)
    step7_outreach_email = Column(JSONB)
    
    # Metadata
    status = Column(String(50), server_default='in_progress', index=True)
    llm_provider = Column(String(50))
    llm_model = Column(String(100))
    total_tokens = Column(Integer)
    tavily_searches = Column(Integer)
    research_duration_seconds = Column(Integer)
    cost_estimate_usd = Column(DECIMAL(10, 4))
    
    # Error tracking
    failed_steps = Column(ARRAY(Integer))
    errors = Column(JSONB)
    
    created_at = Column(TIMESTAMP, server_default=text('NOW()'), index=True)
    completed_at = Column(TIMESTAMP)
    
    # Relationships
    company = relationship("Company", back_populates="reports")
    personas = relationship("Persona", back_populates="report", cascade="all, delete-orphan")


class Persona(Base):
    __tablename__ = "personas"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), index=True)
    
    # Persona details
    name = Column(String(255), index=True)
    title = Column(String(255), index=True)
    role_in_decision = Column(Text)
    pain_point = Column(Text)
    ai_use_case = Column(Text)
    expected_outcome = Column(Text)
    strategic_alignment = Column(Text)
    value_hook = Column(Text)
    
    # Source tracking
    source = Column(String(50), server_default='auto', index=True)  # 'auto' or 'manual'
    added_by = Column(String(255))
    
    # Timestamps
    created_at = Column(TIMESTAMP, server_default=text('NOW()'))
    updated_at = Column(TIMESTAMP, server_default=text('NOW()'))
    last_researched_at = Column(TIMESTAMP)
    
    # Relationships
    company = relationship("Company", back_populates="personas")
    report = relationship("Report", back_populates="personas")
    research_queue_items = relationship("ResearchQueue", back_populates="persona", cascade="all, delete-orphan")


class ResearchQueue(Base):
    __tablename__ = "research_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    persona_id = Column(Integer, ForeignKey("personas.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(String(50), server_default='pending', index=True)  # pending, in_progress, completed, failed
    requested_by = Column(String(255))
    requested_at = Column(TIMESTAMP, server_default=text('NOW()'))
    started_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)
    error_message = Column(Text)
    
    # Relationships
    persona = relationship("Persona", back_populates="research_queue_items")


def get_db():
    """Dependency for FastAPI endpoints"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
