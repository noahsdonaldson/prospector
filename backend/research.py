import asyncio
from typing import AsyncGenerator, Dict, Optional
from llm_client import LLMClient
from prompts import PromptTemplates
from search_client import TavilySearchClient

class ResearchOrchestrator:
    def __init__(self, tavily_api_key: Optional[str] = None):
        self.prompts = PromptTemplates()
        self.search_client = TavilySearchClient(tavily_api_key) if tavily_api_key else None
    
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
            "progress_percent": 0-100
        }
        """
        llm = LLMClient(provider=llm_provider, api_key=api_key)
        
        results = {
            "company_name": company_name,
            "steps": {}
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
            if self.search_client:
                web_context = self.search_client.search_for_step(
                    company_name, "strategic objectives plans initiatives 2024 2025"
                )
            
            step1_prompt = self.prompts.step1_master_research(company_name)
            if web_context:
                step1_prompt = web_context + "\n\n" + step1_prompt
            
            step1_result = await llm.call_llm(step1_prompt)
            results["steps"]["step1_strategic_objectives"] = step1_result
            
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
            if self.search_client:
                web_context = self.search_client.search_for_step(
                    company_name, "business units divisions segments structure 2024 2025"
                )
            
            step2_prompt = self.prompts.step2_bu_alignment(company_name, step1_result)
            if web_context:
                step2_prompt = web_context + "\n\n" + step2_prompt
            
            step2_result = await llm.call_llm(step2_prompt)
            results["steps"]["step2_bu_alignment"] = step2_result
            
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
                if self.search_client:
                    web_context = self.search_client.search_for_step(
                        company_name, f"{bu} business unit operations initiatives 2024 2025"
                    )
                
                step3_prompt = self.prompts.step3_bu_deepdive(company_name, bu, step1_result)
                if web_context:
                    step3_prompt = web_context + "\n\n" + step3_prompt
                
                bu_result = await llm.call_llm(step3_prompt)
                step3_results[bu] = bu_result
            
            results["steps"]["step3_bu_deepdive"] = step3_results
            
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
            if self.search_client:
                web_context = self.search_client.search_for_step(
                    company_name, "AI artificial intelligence machine learning initiatives 2024 2025"
                )
            
            step4_prompt = self.prompts.step4_ai_alignment(company_name, step1_result, step3_results)
            if web_context:
                step4_prompt = web_context + "\n\n" + step4_prompt
            
            step4_result = await llm.call_llm(step4_prompt)
            results["steps"]["step4_ai_alignment"] = step4_result
            
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
            web_context = ""
            if self.search_client:
                web_context = self.search_client.search_for_step(
                    company_name, "executives leadership management team names titles 2024 2025"
                )
            
            step5_prompt = self.prompts.step5_persona_mapping(
                company_name, step1_result, step3_results, step4_result
            )
            if web_context:
                step5_prompt = web_context + "\n\n" + step5_prompt
            
            step5_result = await llm.call_llm(step5_prompt)
            results["steps"]["step5_persona_mapping"] = step5_result
            
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
            
            step6_result = await llm.call_llm(
                self.prompts.step6_value_realization(
                    company_name, step1_result, step3_results, step4_result, step5_result
                )
            )
            results["steps"]["step6_value_realization"] = step6_result
            
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
            
            step7_result = await llm.call_llm(
                self.prompts.step7_outreach_email(
                    company_name, step1_result, step4_result, step5_result, step6_result
                )
            )
            results["steps"]["step7_outreach_email"] = step7_result
            
            yield {
                "type": "step_complete",
                "step": 7,
                "step_name": "Outreach Email",
                "data": step7_result,
                "progress_percent": 100
            }
            
            # Final completion
            yield {
                "type": "complete",
                "message": f"Research complete for {company_name}",
                "results": results,
                "progress_percent": 100
            }
            
        except Exception as e:
            yield {
                "type": "error",
                "message": str(e),
                "progress_percent": 0
            }
    
    def _extract_business_units(self, step2_result: str) -> list:
        """Extract business unit names from markdown table"""
        lines = step2_result.split('\n')
        bus = []
        
        for line in lines:
            if line.strip().startswith('|') and '---' not in line:
                parts = [p.strip() for p in line.split('|')]
                # Skip header and empty cells
                if len(parts) > 1 and parts[1] and parts[1] != 'Business Unit':
                    bus.append(parts[1])
        
        return bus[:3]  # Max 3 business units
