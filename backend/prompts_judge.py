"""
Prompts for Judge LLM validation system
"""

def validation_prompt_step(step_name: str, original_prompt: str, output_data: str, citations: list, step_context: str = "") -> str:
    """
    Generate validation prompt for a specific research step
    
    Args:
        step_name: Name of the step (e.g., "Step 1: Company Overview")
        original_prompt: The original prompt used to generate this step
        output_data: The actual output produced
        citations: List of citation objects with title, url, relevance_score
        step_context: Additional context from other steps if needed
    """
    
    citations_text = "\n".join([
        f"- [{i+1}] {c.get('title', 'No title')} ({c.get('url', 'No URL')}) - Relevance: {c.get('relevance_score', 0):.0%}"
        for i, c in enumerate(citations)
    ]) if citations else "No citations provided"
    
    return f"""You are validating the quality of AI-generated research. Analyze this research step and provide a quality score.

**STEP BEING VALIDATED:** {step_name}

**ORIGINAL PROMPT/INSTRUCTIONS:**
{original_prompt}

**OUTPUT PRODUCED:**
{output_data}

**SOURCE CITATIONS USED:**
{citations_text}

{step_context}

**YOUR VALIDATION TASK:**

1. **Citation Quality (0-30 points)**
   - Are key claims supported by citations?
   - Are citations relevant and authoritative?
   - Any unsupported statements or potential hallucinations?

2. **Prompt Adherence (0-30 points)**
   - Does output follow the original prompt instructions?
   - Are all required elements present?
   - Is the format/structure correct?

3. **Accuracy & Consistency (0-30 points)**
   - Are facts accurate based on citations?
   - Internal consistency within this step?
   - Any contradictions or unclear statements?

4. **Completeness & Depth (0-10 points)**
   - Sufficient detail and depth?
   - Actionable and useful information?

**REQUIRED OUTPUT FORMAT:**

Score: [0-100]
Status: [RED/YELLOW/GREEN]

Issues:
- [List specific issues found, or "None" if none]

Strengths:
- [List 2-3 strengths]

Recommendations:
- [Specific improvements needed, or "None" if score is GREEN]

**SCORING GUIDELINES:**
- GREEN (85-100): High quality, well-cited, accurate, complete
- YELLOW (70-84): Good but has minor gaps, weak citations, or unclear areas
- RED (<70): Significant issues - missing citations, inaccuracies, incomplete, or poor adherence

Provide your validation now:"""


def overall_validation_prompt(step_scores: dict, full_research: dict) -> str:
    """
    Generate prompt for overall research validation across all steps
    
    Args:
        step_scores: Dictionary of individual step scores and findings
        full_research: Complete research data structure
    """
    
    step_summary = "\n".join([
        f"- {step}: Score {data['score']}/100 ({data['status']})"
        for step, data in step_scores.items()
    ])
    
    return f"""You are performing a final holistic validation of a complete research report.

**INDIVIDUAL STEP SCORES:**
{step_summary}

**YOUR TASK:**
Review the consistency and quality across ALL steps of the research.

1. **Cross-Step Consistency (0-40 points)**
   - Do personas in Step 5 align with use cases in Step 4?
   - Does business case in Step 6 reference earlier findings?
   - Is company info from Step 1 consistent throughout?
   - Any contradictions between steps?

2. **Overall Coherence (0-30 points)**
   - Does research tell a coherent story?
   - Logical flow from overview to business case?
   - Professional quality throughout?

3. **Actionability (0-30 points)**
   - Can this research drive real business actions?
   - Specific enough for sales/outreach?
   - Clear value propositions?

**REQUIRED OUTPUT FORMAT:**

Overall Score: [0-100]
Overall Status: [RED/YELLOW/GREEN]

Critical Issues:
- [Cross-step issues or systemic problems, or "None"]

Warnings:
- [Minor concerns across multiple steps, or "None"]

Overall Assessment:
[2-3 sentences on overall quality]

Recommendations:
- [Top 3 recommendations for improvement, or "Research meets quality standards" if GREEN]

Provide your overall validation now:"""
