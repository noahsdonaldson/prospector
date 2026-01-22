import asyncio
from typing import AsyncGenerator, Dict
from llm_client import LLMClient
from prompts import PromptTemplates

class ResearchOrchestrator:
    def __init__(self):
        self.prompts = PromptTemplates()
    
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
            
            step1_result = await llm.call_llm(
                self.prompts.step1_master_research(company_name)
            )
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
            
            step2_result = await llm.call_llm(
                self.prompts.step2_bu_alignment(company_name, step1_result)
            )
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
                
                bu_result = await llm.call_llm(
                    self.prompts.step3_bu_deepdive(company_name, bu, step1_result)
                )
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
            
            step4_result = await llm.call_llm(
                self.prompts.step4_ai_alignment(company_name, step1_result, step3_results)
            )
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
            
            step5_result = await llm.call_llm(
                self.prompts.step5_persona_mapping(
                    company_name, step1_result, step3_results, step4_result
                )
            )
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
