class PromptTemplates:
    """All 7 step prompts with JSON output format"""
    
    def step1_master_research(self, company_name: str) -> str:
        return f"""**Master Research: Strategic Objectives & Initiatives (Customer-Level)**

**Role**: You are a strategic research analyst tasked with compiling a fact-based view of {company_name}'s current strategic objectives, initiatives, and success metrics.

⚠️ **CRITICAL: USE ONLY RECENT DATA (2024-2026)**
- All data MUST be from 2024, 2025, or 2026 only
- Explicitly state "As of 2024" or "In 2025" when citing information
- If you cannot find recent data, explicitly state "Recent data not available"
- DO NOT use data from 2023 or earlier unless explicitly noting it as historical context

**INDUSTRY CLASSIFICATION REQUIRED**
Identify the company's primary industry vertical using one of these categories:
Healthcare, Financial Services, Retail, Manufacturing, Technology, Energy, Telecommunications, 
Education, Transportation, Real Estate, Professional Services, Media & Entertainment, or Other

**Objective**: Research and synthesize the company's strategic priorities for 2024-2026, focusing on:
- Strategic objectives with measurable targets
- Key initiatives and programs
- Success metrics (financial, operational, customer, workforce)

**Approved Source Hierarchy (Use in This Order)**
1. Primary Sources (Highest Priority) - MUST BE FROM 2024-2026:
   - Annual Report / Form 10‑K / 20‑F (FY2024, FY2025, or FY2026 only)
   - Investor Day materials (2024-2026 only)
   - Earnings call transcripts (2024-2026 quarters only)
   - Company website (strategy, products, investor relations)

2. Secondary Authoritative Sources - DATED 2024-2026:
   - Shareholder letters, ESG reports, Regulatory filings, Press releases

3. Tertiary Sources (Validation Only) - PUBLISHED 2024-2026:
   - Reputable business media (WSJ, FT, Bloomberg, Reuters)
   - Industry analyst reports (clearly labeled with date)

**Research Instructions**
1. Identify Strategic Themes: Extract recurring priorities
2. Map Initiatives to Objectives: Tie each initiative to stated company goals
3. Extract Quantifiable Targets: Financial, operational, customer metrics
4. Validate Consistency: Cross-check across at least two primary sources
5. Cite Sources: Include document name + year for each objective

**OUTPUT FORMAT - RETURN VALID JSON ONLY**

Return your response as a valid JSON object with this exact structure:

{{
  "company": "{company_name}",
  "industry": "Financial Services",
  "strategy_horizon": "FY2025-FY2027",
  "objectives": [
    {{
      "objective": "Strategic Objective Name",
      "description": "Detailed description of the objective and key initiatives",
      "target_metrics": [
        "Revenue growth of 8-10% annually",
        "Operating margin expansion to 35%"
      ],
      "primary_sources": [
        "FY2024 10-K",
        "Q3 2024 Earnings Call"
      ],
      "evidence_type": "fact"
    }}
  ],
  "data_quality_note": "All data from 2024-2026 sources"
}}

CRITICAL: Your entire response must be valid JSON. Do not include any markdown, explanatory text, or formatting outside the JSON object."""

    def step2_bu_alignment(self, company_name: str, step1_context: str) -> str:
        context_snippet = step1_context[:2000] if len(step1_context) > 2000 else step1_context
        
        return f"""**Business-Unit Strategic Alignment & Metrics**

**Role**: Strategic research analyst specializing in corporate financial disclosures. Map the specific business segments of {company_name} to their overarching strategic objectives and measurable KPIs.

⚠️ **DATA RECENCY REQUIREMENT**: Use only 2024-2026 data. Cite the year explicitly.

**Context from Step 1 (Strategic Objectives):**
{context_snippet}

**Objective**: Synthesize data from the company's most recent 10-K, Investor Day presentations, and Annual Reports to create a Business-Unit Alignment structure. Be factual and grounded in public disclosures.

**Research Instructions:**
1. Identify Business Units: Use reportable segments from most recent 10-K
2. Define Primary Focus: Core products, services, target customers
3. Map to Strategic Pillars: Link to enterprise-wide strategic objectives
4. Extract Core Metrics: Financial and operational KPIs

**Approved Source Hierarchy:**
1. Primary: 10-K/20-F Filings, Investor Day Transcripts, Earnings Calls (Last 4 quarters)
2. Secondary: Shareholder Letters, Official Press Releases

**OUTPUT FORMAT - RETURN VALID JSON ONLY**

Return your response as a valid JSON object:

{{
  "company": "{company_name}",
  "business_units": [
    {{
      "name": "Business Unit Name",
      "primary_focus": "Core products, services, and target customers",
      "strategic_alignment": "How this BU supports enterprise strategic objectives",
      "core_metrics": [
        "Revenue: $X.XB (up Y% YoY)",
        "Operating margin: Z%",
        "Key operational metric"
      ],
      "sources": ["FY2024 10-K Segment Reporting", "Q2 2024 Investor Day"]
    }}
  ],
  "data_timestamp": "2024-2026"
}}

CRITICAL: Return only valid JSON. No markdown, no additional text."""

    def step3_bu_deepdive(self, company_name: str, business_unit: str, step1_context: str) -> str:
        context_snippet = step1_context[:1500] if len(step1_context) > 1500 else step1_context
        
        return f"""**Business Unit Deep-Dive (Operational Level)**

**Role**: Strategic research analyst specializing in divisional operations. Provide a granular profile of: **{business_unit}** within {company_name}.

⚠️ **DATA RECENCY**: Focus on 2024-2026 operational data and near-term roadmap.

**Context from Step 1:**
{context_snippet}

**Objective**: Research and synthesize the specific operational roadmap and performance indicators for this business unit for the next 24 months.

**Approved Source Hierarchy**
1. Primary: Segment-level reporting in 10-K/10-Q, Investor Day presentations, earnings calls
2. Secondary: Industry analyst reports, regulatory filings

**OUTPUT FORMAT - RETURN VALID JSON ONLY**

{{
  "business_unit": "{business_unit}",
  "company": "{company_name}",
  "main_objectives": [
    {{
      "objective": "Objective name",
      "description": "Details on execution strategy",
      "timeline": "2025-2026"
    }}
  ],
  "key_metrics": [
    {{
      "metric": "Metric name",
      "current_value": "Current performance",
      "target": "Target value",
      "source": "Source document"
    }}
  ],
  "challenges": [
    {{
      "category": "Technical/Market/Regulatory",
      "challenge": "Description of friction point",
      "impact": "How this affects operations"
    }}
  ],
  "data_timestamp": "2024-2026"
}}

CRITICAL: Return only valid JSON. No markdown."""

    def step4_ai_alignment(self, company_name: str, step1_context: str, step3_contexts: dict) -> str:
        bu_summary = "\n\n".join([
            f"**{bu}:**\n{context[:800]}" 
            for bu, context in list(step3_contexts.items())[:3]
        ])
        
        context_snippet = step1_context[:1500] if len(step1_context) > 1500 else step1_context
        
        return f"""**AI Alignment & Agentic Use Case Mapping**

**Role**: AI Strategy & Solutions Architect specializing in digital transformation. Map {company_name}'s business unit objectives to specific, high-impact Agentic AI use cases.

**Context from Step 1 (Strategic Pillars):**
{context_snippet}

**Context from Step 3 (Business Unit Objectives):**
{bu_summary}

**Objective**: Create an AI Alignment structure showing how {company_name} can leverage Agentic AI to achieve 2024-2026 strategic goals.

⚠️ **USE CURRENT DATA**: Base on 2024-2026 strategic priorities and operational challenges.

**Quality Standards**
- Specificity: Use specific terms, not generic phrases
- Audit-Ready: Mention data lineage, explainability, compliance features
- Forward-Looking: Focus on 2025-2026 timeframe

**OUTPUT FORMAT - RETURN VALID JSON ONLY**

{{
  "company": "{company_name}",
  "ai_use_cases": [
    {{
      "objective": "Business objective for 2025-2026",
      "ai_use_case": "Specific AI/Agentic AI solution",
      "expected_outcome": "Quantifiable KPI improvement",
      "strategic_alignment": "Maps to which strategic pillar from Step 1",
      "business_unit": "Applicable BU"
    }}
  ],
  "focus_period": "2025-2026"
}}

CRITICAL: Return only valid JSON. No markdown."""

    def step5_persona_mapping(self, company_name: str, step1_context: str, step3_contexts: dict, step4_context: str) -> str:
        bu_summary = "\n\n".join([
            f"**{bu}:**\n{context[:500]}" 
            for bu, context in list(step3_contexts.items())[:2]
        ])
        
        context1 = step1_context[:1000] if len(step1_context) > 1000 else step1_context
        context4 = step4_context[:1500] if len(step4_context) > 1500 else step4_context
        
        return f"""**Persona Mapping: Buying Committee & Stakeholder Intelligence**

**Role**: Strategic Account Intelligence Analyst. Build comprehensive stakeholder map identifying decision-makers, influencers, and engagement strategy.

**Context from Step 1:**
{context1}

**Context from Step 3:**
{bu_summary}

**Context from Step 4:**
{context4}

**CRITICAL**: You MUST research and find actual executive names. Check:
- Company website leadership/management pages
- LinkedIn executive profiles  
- Press releases and news articles
- Annual reports and SEC filings
- Recent earnings call transcripts

Do NOT use "TBD" unless you have exhausted all public sources.

**Task Requirements**
1. Identify 3-5 specific executives WITH ACTUAL NAMES and exact titles
2. Map their buying committee roles (Economic Buyer, Champion, Technical Evaluator, etc.)
3. Assess decision authority (Budget owner, Influencer, Approver, End user)
4. Define "Why Now" pain points for each persona
5. Map AI solutions to their specific challenges
6. Identify engagement barriers and enablers
7. Assign outreach priority (1-5, where 1 is highest)

**OUTPUT FORMAT - RETURN VALID JSON ONLY**

{{
  "company": "{company_name}",
  "personas": [
    {{
      "name": "Actual Executive Name",
      "title": "Exact job title",
      "business_unit": "BU they oversee",
      "buying_role": "Economic Buyer/Champion/Technical Evaluator/Influencer/Blocker",
      "decision_authority": "Budget Owner/Final Approver/Recommender/End User",
      "reports_to": "Name of their manager if known",
      "pain_point": "Specific operational challenge they face",
      "ai_use_case": "AI solution that addresses their pain point",
      "expected_outcome": "↑ STP 15%, ↓ OPEX 20%",
      "strategic_alignment": "Maps to which enterprise objective",
      "engagement_approach": "How to approach this person (peer intro, direct, partner, event)",
      "potential_barriers": "What might block engagement (risk averse, vendor locked, etc.)",
      "outreach_priority": 1-5,
      "value_hook": "Concise value proposition statement",
      "data_source": "Where you found this person's name/role"
    }}
  ],
  "buying_committee_summary": "Overview of decision-making structure and power dynamics",
  "research_note": "Explain research methodology if names were difficult to find"
}}

CRITICAL: Name field MUST contain actual executive names from public sources. Return only valid JSON."""

    def step6_value_realization(self, company_name: str, step1_context: str, step3_contexts: dict, step4_context: str, step5_context: str) -> str:
        context1 = step1_context[:1000] if len(step1_context) > 1000 else step1_context
        context4 = step4_context[:1500] if len(step4_context) > 1500 else step4_context
        context5 = step5_context[:1500] if len(step5_context) > 1500 else step5_context
        
        return f"""**Value Realization: Business Case & ROI Analysis**

**Role**: Strategic Business Value Consultant. Build quantified business case showing financial impact, implementation roadmap, and success metrics.

**Context from Step 1:**
{context1}

**Context from Step 4:**
{context4}

**Context from Step 5:**
{context5}

**Objective**: Transform AI use cases into quantified business value with financial modeling, implementation timeline, resource requirements, and risk mitigation.

**Task Requirements**
1. Select the TOP 2-3 highest-impact AI use cases from Step 4
2. Build detailed financial model (cost savings, revenue increase, efficiency gains)
3. Define implementation roadmap with phases and timeline
4. Identify resource requirements (budget, headcount, technology)
5. Map risks and mitigation strategies
6. Define measurable success criteria and KPIs
7. Highlight competitive advantage and strategic differentiation

**OUTPUT FORMAT - RETURN VALID JSON ONLY**

{{
  "company": "{company_name}",
  "value_realizations": [
    {{
      "use_case_name": "Name of AI use case",
      "business_unit": "Primary BU benefiting",
      "executive_sponsor": "Name from Step 5 who would champion this",
      "problem_statement": "Clear problem being solved",
      "solution_overview": "High-level solution approach",
      "financial_impact": {{
        "annual_cost_savings": "$X.XM explanation",
        "revenue_opportunity": "$X.XM explanation",
        "efficiency_gains": "X% improvement in metric",
        "payback_period": "X months",
        "3_year_roi": "XXX%"
      }},
      "implementation": {{
        "timeline": "X months (Phase 1: X weeks, Phase 2: X weeks, Phase 3: X weeks)",
        "budget_required": "$XXXk - $X.XM",
        "headcount_required": "X FTEs (roles)",
        "technology_stack": ["AI platform", "Integration tools", "Infrastructure"]
      }},
      "success_metrics": [
        {{
          "metric": "KPI name",
          "baseline": "Current state",
          "target": "Future state",
          "timeline": "When to achieve"
        }}
      ],
      "risks_and_mitigation": [
        {{
          "risk": "Potential obstacle",
          "likelihood": "High/Medium/Low",
          "impact": "High/Medium/Low",
          "mitigation": "How to address"
        }}
      ],
      "strategic_differentiation": "How this creates competitive advantage",
      "quick_wins": "Early value that can be demonstrated in 30-60 days"
    }}
  ],
  "executive_summary": "2-3 sentence overview of total value opportunity"
}}

CRITICAL: Focus on QUANTIFIED business value with specific dollar amounts and percentages. Return only valid JSON."""

    def step7_outreach_email(self, company_name: str, step1_context: str, step4_context: str, step5_context: str, step6_context: str) -> str:
        context1 = step1_context[:800] if len(step1_context) > 800 else step1_context
        context4 = step4_context[:1000] if len(step4_context) > 1000 else step4_context
        context5 = step5_context[:1000] if len(step5_context) > 1000 else step5_context
        context6 = step6_context[:1000] if len(step6_context) > 1000 else step6_context
        
        return f"""**Personalized Outreach Generation**

**Role**: Strategic Sales Specialist. Draft highly personalized outreach email to decision-maker within {company_name}.

**Context from Step 1:**
{context1}

**Context from Step 4:**
{context4}

**Context from Step 5:**
{context5}

**Context from Step 6:**
{context6}

**Objective**: Write professional email connecting AI infrastructure capabilities to {company_name}'s stated business goals.

**Guidelines:**
1. The Hook: Reference high-level enterprise goal from Step 1
2. The Challenge: Acknowledge specific BU constraints (pain point)
3. The Pivot: How AI solutions have helped similar firms
4. The Proof: Mention projected KPI lift from Step 4/6
5. The Tone: Insightful and collaborative, not presumptive
6. Call to Action: Low-friction request for brief conversation

**OUTPUT FORMAT - RETURN VALID JSON ONLY**

{{
  "company": "{company_name}",
  "primary_persona": "Name and title of email recipient",
  "subject_line": "Professional, value-oriented subject",
  "email_body": "Complete email text with paragraphs separated by \\n\\n",
  "email_structure": {{
    "hook": "Opening paragraph text",
    "challenge": "Challenge paragraph text",
    "pivot": "Solution paragraph text",
    "proof": "Value proof paragraph text",
    "cta": "Call to action paragraph text"
  }},
  "tone": "Insightful and collaborative",
  "key_talking_points": ["Point 1", "Point 2", "Point 3"]
}}

CRITICAL: Return only valid JSON. No markdown."""
