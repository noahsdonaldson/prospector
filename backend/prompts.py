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
        
        return f"""**Persona Mapping & Personalized Outreach Strategy**

**Role**: Executive Outreach Strategist. Identify exact personas to target and draft high-impact outreach strategy.

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
2. Define "Why Now" pain points for each persona
3. Map AI solutions to their specific challenges
4. Define quantifiable success metrics (use ↑/↓ symbols)
5. Align to enterprise strategic pillars
6. Create tailored value proposition

**OUTPUT FORMAT - RETURN VALID JSON ONLY**

{{
  "company": "{company_name}",
  "personas": [
    {{
      "name": "Actual Executive Name",
      "title": "Exact job title",
      "role_in_decision": "Economic Buyer/Champion/Technical Gatekeeper",
      "business_unit": "BU they oversee",
      "pain_point": "Specific operational challenge they face",
      "ai_use_case": "AI solution that addresses their pain point",
      "expected_outcome": "↑ STP 15%, ↓ OPEX 20%",
      "strategic_alignment": "Maps to which enterprise objective",
      "value_hook": "Concise value proposition statement",
      "data_source": "Where you found this person's name/role"
    }}
  ],
  "research_note": "Explain research methodology if names were difficult to find"
}}

CRITICAL: Name field MUST contain actual executive names from public sources. Return only valid JSON."""

    def step6_value_realization(self, company_name: str, step1_context: str, step3_contexts: dict, step4_context: str, step5_context: str) -> str:
        context1 = step1_context[:1000] if len(step1_context) > 1000 else step1_context
        context4 = step4_context[:1500] if len(step4_context) > 1500 else step4_context
        context5 = step5_context[:1500] if len(step5_context) > 1500 else step5_context
        
        return f"""**Value Realization & Strategic Alignment Mapping**

**Role**: Strategic Solutions Architect specializing in AI transformation. Synthesize research into final Value Realization structure for {company_name}.

**Context from Step 1:**
{context1}

**Context from Step 4:**
{context4}

**Context from Step 5:**
{context5}

**IMPORTANT**: Use the EXACT personas (names and titles) identified in Step 5. Do not create new personas.

**Objective**: Map specific decision-makers to operational friction points, propose AI solutions, define success metrics, and demonstrate strategic alignment.

**OUTPUT FORMAT - RETURN VALID JSON ONLY**

{{
  "company": "{company_name}",
  "value_realizations": [
    {{
      "name": "Executive name from Step 5",
      "title": "Title from Step 5",
      "pain_point": "Biggest operational challenge",
      "ai_use_case": "Specific AI/Agentic AI solution",
      "expected_outcome": "↑ Metric 15%, ↓ Cost 20%",
      "strategic_alignment": "Enterprise strategic objective (exact terminology from Step 1)"
    }}
  ]
}}

CRITICAL: Use exact names/titles from Step 5. Return only valid JSON."""

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
