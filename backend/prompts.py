class PromptTemplates:
    """All 7 step prompts from your document"""
    
    def step1_master_research(self, company_name: str) -> str:
        return f"""**Master Research Prompt: Strategic Objectives & Initiatives (Customer-Level)**

**Role**
You are a **strategic research analyst** tasked with compiling a fact-based view of {company_name}'s **current strategic objectives, initiatives, and success metrics**.

You must rely only on **credible, verifiable sources** and clearly cite where each insight comes from.

**Objective**
Research and synthesize the company's **strategic priorities for the current and next 2--3 years**, focusing on:
- Strategic objectives
- Key initiatives
- Measurable success metrics (financial, operational, customer, or workforce)

The output should resemble an **executive strategy summary**, grounded in public disclosures.

**Approved Source Hierarchy (Use in This Order)**
1. **Primary Sources (Highest Priority)**
   - Company website (strategy, products, investor relations)
   - Annual Report / Form 10‑K / 20‑F
   - Investor Day materials
   - Earnings call transcripts (last 4--6 quarters)

2. **Secondary Authoritative Sources**
   - Shareholder letters
   - ESG / Sustainability reports
   - Regulatory filings
   - Official press releases

3. **Tertiary Sources (Validation Only)**
   - Reputable business media (e.g., WSJ, FT, Bloomberg, Reuters)
   - Industry analyst reports (clearly labeled as analyst interpretation)

⚠️ Do **not** rely on blogs, marketing summaries, or AI‑generated secondary content without verification.

**Research Instructions**
1. **Identify Strategic Themes**
   - Extract recurring priorities (e.g., growth, efficiency, innovation, capital return, culture).
   - Look for repeated language across filings and leadership commentary.

2. **Map Initiatives to Objectives**
   - Tie each initiative directly to stated company goals.
   - Avoid speculation---use the company's own language wherever possible.

3. **Extract Quantifiable Targets**
   - Financial targets (revenue growth, margins, ROE, capital return)
   - Operational targets (efficiency, automation, productivity)
   - Customer or workforce metrics (retention, engagement, penetration)

4. **Validate Consistency**
   - Cross-check objectives across at least **two independent primary sources**.
   - Flag any changes or evolution in strategy year-over-year.

5. **Cite Sources**
   - For each objective or metric, include source references (document name + year).

**Required Output Format**

**Company: {company_name}**
**Strategy Horizon: [e.g., FY2025--FY2027]**

| Strategic Objective | Description & Key Initiatives | Key Target Metrics | Primary Sources |
|---------------------|-------------------------------|-------------------|-----------------|

**Evidence Standards**
- Use **direct quotes or paraphrased language** consistent with source wording
- Avoid inferred intent unless explicitly stated by leadership
- Clearly label:
  - **Fact** (directly stated by company)
  - **Interpretation** (supported but not explicitly stated)

**Final Quality Check**
Before finalizing:
- Every objective has at least one primary source
- Every metric is measurable and time-bound (or explicitly noted if not)
- No unsupported assumptions"""

    def step2_bu_alignment(self, company_name: str, step1_context: str) -> str:
        # Truncate context to avoid token limits
        context_snippet = step1_context[:2000] if len(step1_context) > 2000 else step1_context
        
        return f"""**Prompt: Business-Unit Strategic Alignment & Metrics**

**Role**: You are a strategic research analyst specializing in corporate financial disclosures. Your task is to map the specific business segments of {company_name} to their overarching strategic objectives and measurable KPIs.

**Context from Step 1 (Strategic Objectives):**
{context_snippet}

**Objective**: Synthesize data from the company's most recent 10-K, Investor Day presentations, and Annual Reports to populate a "Business-Unit Alignment Table." The output must be factual and grounded in public disclosures; do not infer or "hallucinate" objectives that are not explicitly stated by the company.

**Research Instructions:**
1. Identify Business Units: Use the reportable segments defined in the most recent 10-K or Investor Relations website.
2. Define Primary Focus: Summarize the core products, services, and target customers for each unit.
3. Map to Strategic Pillars: Identify which of the company's enterprise-wide strategic objectives each unit is tasked with driving. Use the company's specific terminology/quotes.
4. Extract Core Metrics: List the specific financial and operational KPIs the company uses to measure that unit's success.

**Output Format**: Provide the data in a markdown table with the following four columns:

| Business Unit | Primary Focus | How It Supports Strategic Objectives | Core Metrics & Levers |
|---------------|---------------|-------------------------------------|----------------------|

**Approved Source Hierarchy (Strict Adherence Required):**
1. Primary: 10-K/20-F Filings, Investor Day Transcripts/Decks, Earnings Call Transcripts (Last 4 quarters).
2. Secondary: Shareholder Letters, Official Press Releases.

Note: If a specific metric or objective is not found in these sources, mark it as "Not Publicly Disclosed" rather than inferring."""

    def step3_bu_deepdive(self, company_name: str, business_unit: str, step1_context: str) -> str:
        context_snippet = step1_context[:1500] if len(step1_context) > 1500 else step1_context
        
        return f"""**Step 3 Prompt: Business Unit Deep-Dive (Operational Level)**

**Role:** You are a strategic research analyst specializing in divisional operations. Your task is to provide a granular, deep-dive profile of: **{business_unit}** within {company_name}.

**Context from Step 1 (Strategic Objectives):**
{context_snippet}

**Objective:** Research and synthesize the specific operational roadmap and performance indicators for this business unit for the next 24 months. Your output must be formatted to highlight execution goals, financial markers, and operational hurdles.

**Output Requirements:** Please provide the analysis using the following three sections:

1. **Main Objectives (2025-2026):**
   - Identify 3--4 core strategic pillars for this specific unit (e.g., platform migrations, market share growth in specific sub-segments, or margin expansion initiatives).
   - Focus on "how" the unit is evolving its operating model (e.g., automation, standardization).

2. **Markers / Metrics to Watch:**
   - List the specific KPIs used to track this unit's health.
   - Include, where available: Asset levels (AUC/A, AUM), specific margin targets (Pre-tax, Operating), and efficiency ratios (ROTCE, ROE).
   - Cite the most recent data points from the latest fiscal quarter or Investor Day.

3. **Key Challenges:**
   - Identify the "friction points" specific to this unit.
   - Focus on three areas: Technical/Structural (e.g., legacy systems), Market/Economic (e.g., fee sensitivity, volume volatility), and Regulatory (e.g., compliance, operational resilience).

**Approved Source Hierarchy**
1. Primary Sources: Segment-level reporting in 10-K/10-Q, Investor Day "Deep Dive" presentations, and specific mentions of the BU head in earnings call transcripts.
2. Secondary Sources: Industry analyst reports and regulatory filings specific to the unit's jurisdiction."""

    def step4_ai_alignment(self, company_name: str, step1_context: str, step3_contexts: dict) -> str:
        # Combine BU contexts
        bu_summary = "\n\n".join([
            f"**{bu}:**\n{context[:800]}" 
            for bu, context in list(step3_contexts.items())[:3]
        ])
        
        context_snippet = step1_context[:1500] if len(step1_context) > 1500 else step1_context
        
        return f"""**Step 4: AI Alignment & Agentic Use Case Mapping Prompt**

**Role**: You are an AI Strategy & Solutions Architect specializing in digital transformation. Your task is to take the business unit objectives of {company_name} and map them to specific, high-impact Agentic AI use cases that drive measurable operational lift.

**Context from Step 1 (Strategic Pillars):**
{context_snippet}

**Context from Step 3 (Business Unit Objectives):**
{bu_summary}

**Objective:** Synthesize a technical "AI Alignment" table that demonstrates how {company_name} can leverage Agentic AI (autonomous agents, predictive modeling, and automated orchestration) to achieve their 2025--2026 strategic goals.

**Instructions & Output Format:** Create a table with the following four columns, ensuring the content is grounded in industry-specific pain points and current AI capabilities:

| Objective (2025--2026) | AI / Agentic AI Use Case | Expected Outcome / KPI Lift | Strategic Pillar Alignment |
|------------------------|--------------------------|----------------------------|---------------------------|

**Tone and Quality Standards**
- **Specificity**: Avoid generic terms like "improve efficiency." Use specific terms like "Post-Trade Ops & Exception Management" or "Predictive Settlement-Risk Agents."
- **Audit-Ready**: Ensure the use cases mention "data lineage," "explainability," or "compliance-ready" features where applicable.
- **Forward-Looking**: Focus on the 2025--2026 timeframe, assuming a shift from generative AI to agentic, autonomous workflows."""

    def step5_persona_mapping(self, company_name: str, step1_context: str, step3_contexts: dict, step4_context: str) -> str:
        bu_summary = "\n\n".join([
            f"**{bu}:**\n{context[:500]}" 
            for bu, context in list(step3_contexts.items())[:2]
        ])
        
        context1 = step1_context[:1000] if len(step1_context) > 1000 else step1_context
        context4 = step4_context[:1500] if len(step4_context) > 1500 else step4_context
        
        return f"""**Step 5: Persona Mapping & Personalized Outreach Prompt**

**Role:** You are an Executive Outreach Strategist. Your task is to take the strategic objectives, business unit details, and AI use cases to identify the exact personas to target and draft a high-impact outreach strategy.

**Context from Step 1 (Strategic Objectives):**
{context1}

**Context from Step 3 (Business Unit Details):**
{bu_summary}

**Context from Step 4 (AI Use Cases):**
{context4}

**Objective**: Identify the "Decision Makers" and "Targetable Lieutenants" within the specific Business Units and map our AI value proposition to their specific daily pressures and KPIs.

**Task Requirements**
1. **Identify Target Personas**: Based on the BU structure, list 3--5 specific job titles (Lieutenants) who would be the "Economic Buyer," the "Champion," and the "Technical Gatekeeper."

2. **The "Why Now" (Pain Points)**: For each persona, identify the specific "on-the-ground" pain points they face that the AI use cases solve.

3. **Value Proposition Mapping**: Create a concise "Value Hook" for each persona that connects the AI KPI lift to the Enterprise Strategy.

4. **Draft Outreach "Hooks"**: Write a 2-sentence "Executive Hook" for a LinkedIn message or email for the primary lead and the most relevant Lieutenant.

**Output Format:** Provide the results in a Persona Outreach Matrix (Table) with the following columns:

| Persona Title | Role in Decision (Buyer/Champion/User) | Specific Pain Point | Tailored Value Hook |
|---------------|---------------------------------------|-------------------|-------------------|"""

    def step6_value_realization(self, company_name: str, step1_context: str, step3_contexts: dict, step4_context: str, step5_context: str) -> str:
        context1 = step1_context[:1000] if len(step1_context) > 1000 else step1_context
        context4 = step4_context[:1500] if len(step4_context) > 1500 else step4_context
        context5 = step5_context[:1500] if len(step5_context) > 1500 else step5_context
        
        return f"""**Step 6: Value Realization & Strategic Alignment Mapping**

**Role:** You are a Strategic Solutions Architect specializing in AI transformation. Your task is to synthesize the research from the previous steps into a final Value Realization Table for {company_name}.

**Context from Step 1 (Strategic Objectives):**
{context1}

**Context from Step 4 (AI Use Cases):**
{context4}

**Context from Step 5 (Persona Mapping):**
{context5}

**Objective:** Create a structured table that maps specific decision-makers (Personas) to their operational friction points, proposes specific Agentic AI solutions, defines quantifiable success metrics, and demonstrates direct alignment with the enterprise's overarching strategic pillars.

**Instructions:** Using the data gathered in the previous steps, please generate a table with the following five columns:

| Lieutenant Persona | Biggest Pain Point | AI / Agentic AI Use Case | Expected Outcome | Strategic Objective Alignment |
|-------------------|-------------------|--------------------------|------------------|------------------------------|

**Output Requirements:**
- Present the information in a clean, professional table.
- Use symbols (↑/↓) for the Expected Outcome column to denote performance lifts or cost reductions.
- Ensure the "Strategic Objective Alignment" column uses the exact terminology found in the Enterprise Strategy (Step 1).
- Provide 2--3 quantifiable KPI improvements (e.g., ↑ STP %, ↓ OPEX %, ↓ Case Prep Time) based on industry benchmarks."""

    def step7_outreach_email(self, company_name: str, step1_context: str, step4_context: str, step5_context: str, step6_context: str) -> str:
        context1 = step1_context[:800] if len(step1_context) > 800 else step1_context
        context4 = step4_context[:1000] if len(step4_context) > 1000 else step4_context
        context5 = step5_context[:1000] if len(step5_context) > 1000 else step5_context
        context6 = step6_context[:1000] if len(step6_context) > 1000 else step6_context
        
        return f"""**Step 7: Personalized Outreach Generation Prompt**

**Role:** You are a Strategic Sales Specialist. Your task is to draft a highly personalized outreach email to a decision-maker within {company_name}, leveraging the research gathered in the previous six steps.

**Context from Step 1 (Strategic Objectives):**
{context1}

**Context from Step 4 (AI Use Cases):**
{context4}

**Context from Step 5 (Persona Mapping):**
{context5}

**Context from Step 6 (Value Realization):**
{context6}

**Objective:** Write a professional email that connects AI infrastructure capabilities directly to {company_name}'s stated business goals.

**Guidelines:**
1. **The Hook**: Start by referencing a high-level enterprise goal identified in Step 1.
2. **The Challenge**: Acknowledge the specific constraints the Business Unit is likely facing (the "Pain Point"). Use industry benchmarks if available.
3. **The Pivot**: Introduce how AI solutions have empowered similar firms or units to overcome these specific hurdles.
4. **The Proof**: Mention the "Projected Impact" or "KPI Lift" identified in Step 4/6.
5. **The Tone**: Be insightful and collaborative, not presumptive. Use phrases like "We understand one of your key objectives is..." and "I don't know if you're facing the same constraints, but..."
6. **Call to Action**: End with a low-friction request for a brief conversation to "strengthen our hypothesis."

**Output Format:**
- Subject Line: (Professional and value-oriented)
- Email Body: (Structured with clear paragraphs, 3-5 paragraphs total)"""
