# -*- coding: utf-8 -*-
import asyncio
import json
import uuid
from datetime import datetime
from typing import AsyncGenerator, Dict, Optional
from llm_client import LLMClient
from prompts import PromptTemplates
from search_client import TavilySearchClient
from parsers import extract_industry_from_text

class ResearchOrchestrator:
    def __init__(self, tavily_api_key: Optional[str] = None):
        self.prompts = PromptTemplates()
        self.search_client = TavilySearchClient(tavily_api_key) if tavily_api_key else None
        
        # Metadata tracking
        self.metadata = {
            "research_id": str(uuid.uuid4()),
            "start_time": None,
            "end_time": None,
            "total_tokens": 0,
            "tavily_searches": 0,
            "llm_calls": 0,
            "retries": 0
        }
    
    def _parse_json_response(self, response: str) -> dict:
        """Parse LLM JSON response with fallback handling"""
        try:
            # Try to parse as pure JSON first
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            import re
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', response, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    pass
            
            # Try to find JSON object in the response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except json.JSONDecodeError:
                    pass
            
            # Fallback: return raw text wrapped in error structure
            return {
                "error": "Failed to parse JSON",
                "raw_response": response,
                "fallback": True
            }
    
    async def run_full_research(
        self, 
        company_name: str,
        llm_provider: str,
        api_key: str
    ) -> AsyncGenerator[Dict, None]:
        """
        Execute all 7 steps sequentially, yielding progress updates.
        
        Yields updates in format:
        {
            "type": "progress" | "step_complete" | "complete" | "error",
            "step": 1-7,
            "step_name": str,
            "data": str (result of step),
            "progress_percent": 0-100,
            "metadata": {...}
        }
        """
        self.metadata["start_time"] = datetime.now().isoformat()
        llm = LLMClient(provider=llm_provider, api_key=api_key)
        
        results = {
            "research_id": self.metadata["research_id"],
            "company_name": company_name,
            "industry": None,
            "llm_provider": llm_provider,
            "status": "in_progress",
            "steps": {},
            "failed_steps": [],
            "errors": []
        }
        
        try:
            # Step 1: Master Research
            yield {
                "type": "progress",
                "step": 1,
                "step_name": "Strategic Objectives",
                "message": f"Researching {company_name}'s strategic objectives...",
                "progress_percent": 0
            }
            
            # Get recent web data if search is available
            web_context = ""
            step1_citations = []
            if self.search_client:
                web_context, step1_citations = self.search_client.search_for_step(
                    company_name, "strategic objectives plans initiatives 2024 2025"
                )
                self.metadata["tavily_searches"] += 1
            
            step1_prompt = self.prompts.step1_master_research(company_name)
            if web_context:
                step1_prompt = web_context + "\n\n" + step1_prompt
            
            step1_raw = await llm.call_llm(step1_prompt)
            self.metadata["llm_calls"] += 1
            
            # Parse JSON response
            step1_result = self._parse_json_response(step1_raw)
            
            results["steps"]["step1_strategic_objectives"] = {
                "status": "complete",
                "data": step1_result,
                "raw": step1_raw,
                "citations": step1_citations
            }
            
            # Try to extract industry from Step 1 JSON
            if isinstance(step1_result, dict) and "industry" in step1_result:
                results["industry"] = step1_result["industry"]
            else:
                # Fallback to text extraction if JSON parsing failed
                industry = extract_industry_from_text(step1_raw)
                if industry:
                    results["industry"] = industry
            
            yield {
                "type": "step_complete",
                "step": 1,
                "step_name": "Strategic Objectives",
                "data": step1_result,
                "progress_percent": 14
            }
            
            # Step 2: Business Unit Alignment
            yield {
                "type": "progress",
                "step": 2,
                "step_name": "Business Unit Alignment",
                "message": "Mapping business units to strategy...",
                "progress_percent": 14
            }
            
            # Get recent web data if search is available
            web_context = ""
            step2_citations = []
            if self.search_client:
                web_context, step2_citations = self.search_client.search_for_step(
                    company_name, "business units divisions segments structure 2024 2025"
                )
                self.metadata["tavily_searches"] += 1
            
            # Pass raw string for context (not parsed JSON)
            step1_context = step1_raw if isinstance(step1_result, dict) else str(step1_result)
            step2_prompt = self.prompts.step2_bu_alignment(company_name, step1_context)
            if web_context:
                step2_prompt = web_context + "\n\n" + step2_prompt
            
            step2_raw = await llm.call_llm(step2_prompt)
            self.metadata["llm_calls"] += 1
            
            # Parse JSON response
            step2_result = self._parse_json_response(step2_raw)
            
            results["steps"]["step2_bu_alignment"] = {
                "status": "complete",
                "data": step2_result,
                "raw": step2_raw,
                "citations": step2_citations
            }
            
            yield {
                "type": "step_complete",
                "step": 2,
                "step_name": "Business Unit Alignment",
                "data": step2_result,
                "progress_percent": 28
            }
            
            # Step 3: Business Unit Deep-Dive
            yield {
                "type": "progress",
                "step": 3,
                "step_name": "Business Unit Deep-Dive",
                "message": "Analyzing business unit operations...",
                "progress_percent": 28
            }
            
            business_units = self._extract_business_units(step2_result)
            step3_results = {}
            step3_citations = []
            
            for idx, bu in enumerate(business_units[:3]):  # Limit to 3 BUs
                yield {
                    "type": "progress",
                    "step": 3,
                    "step_name": "Business Unit Deep-Dive",
                    "message": f"Deep-dive on {bu}...",
                    "progress_percent": 28 + (idx * 5)
                }
                
                # Get recent web data if search is available
                web_context = ""
                bu_citations = []
                if self.search_client:
                    web_context, bu_citations = self.search_client.search_for_step(
                        company_name, f"{bu} business unit operations initiatives 2024 2025"
                    )
                    self.metadata["tavily_searches"] += 1
                    step3_citations.extend(bu_citations)
                
                step3_prompt = self.prompts.step3_bu_deepdive(company_name, bu, step1_context)
                if web_context:
                    step3_prompt = web_context + "\n\n" + step3_prompt
                
                bu_raw = await llm.call_llm(step3_prompt)
                self.metadata["llm_calls"] += 1
                
                # Parse JSON response
                bu_parsed = self._parse_json_response(bu_raw)
                step3_results[bu] = {
                    "data": bu_parsed,
                    "raw": bu_raw
                }
            
            results["steps"]["step3_bu_deepdive"] = {
                "status": "complete",
                "data": step3_results,
                "citations": step3_citations
            }
            
            yield {
                "type": "step_complete",
                "step": 3,
                "step_name": "Business Unit Deep-Dive",
                "data": step3_results,
                "progress_percent": 43
            }
            
            # Step 4: AI Alignment
            yield {
                "type": "progress",
                "step": 4,
                "step_name": "AI Alignment",
                "message": "Mapping AI use cases to objectives...",
                "progress_percent": 43
            }
            
            # Get recent web data if search is available
            web_context = ""
            step4_citations = []
            if self.search_client:
                web_context, step4_citations = self.search_client.search_for_step(
                    company_name, "AI artificial intelligence machine learning initiatives 2024 2025"
                )
                self.metadata["tavily_searches"] += 1
            
            # Prepare context strings for step4
            step3_raw_contexts = {bu: data["raw"] for bu, data in step3_results.items()}
            
            step4_prompt = self.prompts.step4_ai_alignment(company_name, step1_context, step3_raw_contexts)
            if web_context:
                step4_prompt = web_context + "\n\n" + step4_prompt
            
            step4_raw = await llm.call_llm(step4_prompt)
            self.metadata["llm_calls"] += 1
            
            # Parse JSON response
            step4_result = self._parse_json_response(step4_raw)
            
            results["steps"]["step4_ai_alignment"] = {
                "status": "complete",
                "data": step4_result,
                "raw": step4_raw,
                "citations": step4_citations
            }
            
            yield {
                "type": "step_complete",
                "step": 4,
                "step_name": "AI Alignment",
                "data": step4_result,
                "progress_percent": 57
            }
            
            # Step 5: Persona Mapping
            yield {
                "type": "progress",
                "step": 5,
                "step_name": "Persona Mapping",
                "message": "Identifying key decision makers...",
                "progress_percent": 57
            }
            
            # Get recent web data for executive names if search is available
            # Use multiple targeted searches for better executive name discovery
            web_context = ""
            step5_citations = []
            if self.search_client:
                web_context, step5_citations = self.search_client.search_executives_multi(company_name)
                self.metadata["tavily_searches"] += 10  # 10 targeted searches (6 C-suite + 4 BU-level)
            
            step5_prompt = self.prompts.step5_persona_mapping(
                company_name, step1_context, step3_raw_contexts, step4_raw
            )
            if web_context:
                step5_prompt = web_context + "\n\n" + step5_prompt
            
            # First attempt
            step5_raw = await llm.call_llm(step5_prompt)
            self.metadata["llm_calls"] += 1
            
            # Parse and validate
            step5_result = self._parse_json_response(step5_raw)
            
            # Validate: Check if result contains TBD or lacks real names
            if self._needs_persona_retry(step5_raw):
                yield {
                    "type": "progress",
                    "step": 5,
                    "step_name": "Persona Mapping",
                    "message": "Refining executive search...",
                    "progress_percent": 62
                }
                
                # Retry with stronger prompt
                retry_prompt = f"""CRITICAL RETRY: The previous attempt failed to find actual executive names.

{web_context}

{step5_prompt}

⚠️ MANDATORY REQUIREMENTS:
- You MUST find actual executive names from the search results above
- "TBD" is NOT acceptable - use the web search results provided
- If a name is in the search results, you MUST use it
- Review the search results carefully - names are present in the content
- Do not proceed without finding at least 3 actual executive names"""
                
                step5_raw = await llm.call_llm(retry_prompt)
                self.metadata["llm_calls"] += 1
                self.metadata["retries"] += 1
                step5_result = self._parse_json_response(step5_raw)
            
            results["steps"]["step5_persona_mapping"] = {
                "status": "complete",
                "data": step5_result,
                "raw": step5_raw,
                "citations": step5_citations
            }
            
            yield {
                "type": "step_complete",
                "step": 5,
                "step_name": "Persona Mapping",
                "data": step5_result,
                "progress_percent": 71
            }
            
            # Step 6: Value Realization
            yield {
                "type": "progress",
                "step": 6,
                "step_name": "Value Realization",
                "message": "Building value realization table...",
                "progress_percent": 71
            }
            
            step6_raw = await llm.call_llm(
                self.prompts.step6_value_realization(
                    company_name, step1_context, step3_raw_contexts, step4_raw, step5_raw
                )
            )
            self.metadata["llm_calls"] += 1
            
            # Parse JSON response
            step6_result = self._parse_json_response(step6_raw)
            
            results["steps"]["step6_value_realization"] = {
                "status": "complete",
                "data": step6_result,
                "raw": step6_raw,
                "citations": []  # No web search for step 6
            }
            
            yield {
                "type": "step_complete",
                "step": 6,
                "step_name": "Value Realization",
                "data": step6_result,
                "progress_percent": 85
            }
            
            # Step 7: Outreach Email
            yield {
                "type": "progress",
                "step": 7,
                "step_name": "Outreach Email",
                "message": "Generating personalized outreach...",
                "progress_percent": 85
            }
            
            step7_raw = await llm.call_llm(
                self.prompts.step7_outreach_email(
                    company_name, step1_context, step4_raw, step5_raw, step6_raw
                )
            )
            self.metadata["llm_calls"] += 1
            
            # Parse JSON response
            step7_result = self._parse_json_response(step7_raw)
            
            results["steps"]["step7_outreach_email"] = {
                "status": "complete",
                "data": step7_result,
                "raw": step7_raw,
                "citations": []  # No web search for step 7
            }
            
            yield {
                "type": "step_complete",
                "step": 7,
                "step_name": "Outreach Email",
                "data": step7_result,
                "progress_percent": 100
            }
            
            # Mark as complete and finalize metadata
            results["status"] = "complete"
            self.metadata["end_time"] = datetime.now().isoformat()
            
            # Calculate duration
            if self.metadata["start_time"] and self.metadata["end_time"]:
                start = datetime.fromisoformat(self.metadata["start_time"])
                end = datetime.fromisoformat(self.metadata["end_time"])
                duration = (end - start).total_seconds()
                self.metadata["research_duration_seconds"] = int(duration)
            
            # Final completion
            yield {
                "type": "complete",
                "message": f"Research complete for {company_name}",
                "results": results,
                "metadata": self.metadata,
                "progress_percent": 100
            }
            
        except Exception as e:
            results["status"] = "failed"
            self.metadata["end_time"] = datetime.now().isoformat()
            
            yield {
                "type": "error",
                "message": str(e),
                "results": results,
                "metadata": self.metadata,
                "progress_percent": 0
            }
    
    def _needs_persona_retry(self, result: str) -> bool:
        """Check if persona mapping result needs retry due to missing names"""
        # Handle JSON responses
        try:
            data = json.loads(result) if isinstance(result, str) else result
            if isinstance(data, dict) and "personas" in data:
                for persona in data["personas"]:
                    name = persona.get("name", "").lower()
                    if not name or "tbd" in name or name in ["", "-", "n/a", "not available", "to be determined"]:
                        return True
                return False
        except:
            pass
        
        # Fallback for non-JSON responses
        result_lower = result.lower()
        
        # Check for TBD or placeholder values
        if "tbd" in result_lower or "to be determined" in result_lower:
            return True
        
        # Check if table has empty name cells or generic placeholders
        lines = result.split('\n')
        for line in lines:
            if '|' in line and not line.strip().startswith('#'):
                cells = [c.strip() for c in line.split('|')]
                if len(cells) > 1:
                    # First cell should be name
                    name_cell = cells[1] if len(cells) > 1 else ""
                    if not name_cell or name_cell in ["", "-", "N/A", "Not Available"]:
                        return True
        
        return False
    
    def _extract_business_units(self, step2_result: dict) -> list:
        """Extract business unit names from JSON response"""
        if isinstance(step2_result, dict) and "business_units" in step2_result:
            return [bu.get("name", "") for bu in step2_result["business_units"] if bu.get("name")]
        
        # Fallback for non-JSON response
        if isinstance(step2_result, str):
            lines = step2_result.split('\n')
            bus = []
            for line in lines:
                if line.strip().startswith('|') and '---' not in line:
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) > 1 and parts[1] and parts[1] != 'Business Unit':
                        bus.append(parts[1])
            return bus[:3]
        
        return []
