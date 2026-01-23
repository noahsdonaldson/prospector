-- Prospector Database Schema
-- Creates tables for storing account research data

-- Companies table with industry categorization
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    domain VARCHAR(255),
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_name ON companies(name);

-- Research reports (one per research run)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    research_id UUID UNIQUE NOT NULL,
    user_email VARCHAR(255),
    
    -- Store each step as JSONB for flexibility
    step1_strategic_objectives JSONB,
    step2_bu_alignment JSONB,
    step3_bu_deepdive JSONB,
    step4_transformation_roadmap JSONB,
    step5_persona_mapping JSONB,
    step6_value_realization JSONB,
    step7_outreach_email JSONB,
    
    -- Metadata
    status VARCHAR(50) DEFAULT 'in_progress',  -- 'in_progress', 'complete', 'failed'
    llm_provider VARCHAR(50),
    llm_model VARCHAR(100),
    total_tokens INTEGER,
    tavily_searches INTEGER,
    research_duration_seconds INTEGER,
    cost_estimate_usd DECIMAL(10, 4),
    
    -- Error tracking
    failed_steps INTEGER[],
    errors JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_reports_company_id ON reports(company_id);
CREATE INDEX idx_reports_research_id ON reports(research_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_status ON reports(status);

-- Personas (both auto-discovered and manually added)
CREATE TABLE IF NOT EXISTS personas (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    
    -- Persona details
    name VARCHAR(255),
    title VARCHAR(255),
    role_in_decision TEXT,
    pain_point TEXT,
    ai_use_case TEXT,
    expected_outcome TEXT,
    strategic_alignment TEXT,
    value_hook TEXT,
    
    -- Source tracking
    source VARCHAR(50) DEFAULT 'auto',  -- 'auto' or 'manual'
    added_by VARCHAR(255),  -- user email who added manually
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_researched_at TIMESTAMP
);

CREATE INDEX idx_personas_company_id ON personas(company_id);
CREATE INDEX idx_personas_report_id ON personas(report_id);
CREATE INDEX idx_personas_title ON personas(title);
CREATE INDEX idx_personas_source ON personas(source);
CREATE INDEX idx_personas_name ON personas(name);

-- Research queue for manual persona research requests
CREATE TABLE IF NOT EXISTS research_queue (
    id SERIAL PRIMARY KEY,
    persona_id INTEGER REFERENCES personas(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'failed'
    requested_by VARCHAR(255),
    requested_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

CREATE INDEX idx_research_queue_status ON research_queue(status);
CREATE INDEX idx_research_queue_persona_id ON research_queue(persona_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personas_updated_at
    BEFORE UPDATE ON personas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
