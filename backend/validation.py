"""
Research validation orchestration using Judge LLM
"""
import json
import re
from datetime import datetime
from typing import Dict, Any, List
from judge_client import JudgeLLMClient
from prompts_judge import validation_prompt_step, overall_validation_prompt

class ResearchValidator:
    """Orchestrates validation of research using judge LLM"""
    
    def __init__(self, judge_api_key: str):
        self.judge = JudgeLLMClient(api_key=judge_api_key)
        
        # Map step keys to their names (we'll skip actual prompt retrieval for simplicity)
        self.step_config = {
            "step1_overview": {
                "name": "Step 1: Company Overview"
            },
            "step2_business_priorities": {
                "name": "Step 2: Business Priorities"
            },
            "step3_tech_stack": {
                "name": "Step 3: Technology Stack"
            },
            "step4_ai_alignment": {
                "name": "Step 4: AI/Agentic AI Alignment"
            },
            "step5_persona_mapping": {
                "name": "Step 5: Persona Mapping"
            },
            "step6_value_realization": {
                "name": "Step 6: Business Case & ROI"
            },
            "step7_outreach": {
                "name": "Step 7: Outreach Strategy"
            }
        }
    
    def validate_research(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate entire research report
        
        Args:
            report_data: Full research report with steps and metadata
            
        Returns:
            Validation report with scores and findings
        """
        results = report_data.get("results", {})
        steps = results.get("steps", {})
        
        validation_report = {
            "validation_timestamp": datetime.now().isoformat(),
            "judge_model": "gpt-4o",
            "company_name": results.get("company_name", "Unknown"),
            "report_id": report_data.get("id"),
            "step_validations": {},
            "overall_score": 0,
            "overall_status": "YELLOW",
            "critical_issues": [],
            "warnings": [],
            "recommendations": []
        }
        
        # Validate each step
        step_scores = {}
        for step_key, step_data in steps.items():
            if step_key not in self.step_config:
                continue
            
            validation = self._validate_step(
                step_key=step_key,
                step_data=step_data,
                company_name=results.get("company_name")
            )
            
            validation_report["step_validations"][step_key] = validation
            step_scores[self.step_config[step_key]["name"]] = {
                "score": validation["score"],
                "status": validation["status"]
            }
        
        # Overall validation
        overall = self._validate_overall(step_scores, results)
        validation_report.update({
            "overall_score": overall["score"],
            "overall_status": overall["status"],
            "critical_issues": overall.get("critical_issues", []),
            "warnings": overall.get("warnings", []),
            "overall_assessment": overall.get("assessment", ""),
            "recommendations": overall.get("recommendations", [])
        })
        
        return validation_report
    
    def _validate_step(self, step_key: str, step_data: Dict, company_name: str) -> Dict[str, Any]:
        """Validate a single research step"""
        
        config = self.step_config[step_key]
        
        # Extract step content and citations
        if isinstance(step_data, dict):
            content = step_data.get("data", step_data)
            citations = step_data.get("citations", [])
        else:
            content = step_data
            citations = []
        
        # Get original prompt description (simplified)
        original_prompt = f"Generate {config['name']} for {company_name} including all required elements and structure."
        
        # Convert content to string for validation
        if isinstance(content, dict):
            output_str = json.dumps(content, indent=2)
        else:
            output_str = str(content)
        
        # Create validation prompt
        validation_prompt = validation_prompt_step(
            step_name=config["name"],
            original_prompt=original_prompt,
            output_data=output_str,
            citations=citations
        )
        
        # Get judge response
        try:
            judge_response = self.judge.validate(validation_prompt)
            parsed = self._parse_step_validation(judge_response)
            return parsed
        except Exception as e:
            return {
                "score": 50,
                "status": "YELLOW",
                "issues": [f"Validation error: {str(e)}"],
                "strengths": [],
                "recommendations": ["Unable to complete validation"]
            }
    
    def _validate_overall(self, step_scores: Dict, full_research: Dict) -> Dict[str, Any]:
        """Validate overall research quality across all steps"""
        
        overall_prompt = overall_validation_prompt(step_scores, full_research)
        
        try:
            judge_response = self.judge.validate(overall_prompt)
            parsed = self._parse_overall_validation(judge_response)
            return parsed
        except Exception as e:
            # Fallback: average of step scores
            avg_score = sum(s["score"] for s in step_scores.values()) / len(step_scores) if step_scores else 50
            return {
                "score": int(avg_score),
                "status": self._score_to_status(avg_score),
                "critical_issues": [f"Overall validation error: {str(e)}"],
                "warnings": [],
                "assessment": "Unable to complete overall validation",
                "recommendations": ["Review individual step scores"]
            }
    
    def _parse_step_validation(self, response: str) -> Dict[str, Any]:
        """Parse judge response for step validation"""
        
        # Extract score
        score_match = re.search(r'Score:\s*(\d+)', response, re.IGNORECASE)
        score = int(score_match.group(1)) if score_match else 75
        
        # Extract status
        status_match = re.search(r'Status:\s*(RED|YELLOW|GREEN)', response, re.IGNORECASE)
        status = status_match.group(1).upper() if status_match else self._score_to_status(score)
        
        # Extract issues
        issues_match = re.search(r'Issues:(.*?)(?:Strengths:|$)', response, re.DOTALL | re.IGNORECASE)
        issues = self._parse_list_items(issues_match.group(1)) if issues_match else []
        
        # Extract strengths
        strengths_match = re.search(r'Strengths:(.*?)(?:Recommendations:|$)', response, re.DOTALL | re.IGNORECASE)
        strengths = self._parse_list_items(strengths_match.group(1)) if strengths_match else []
        
        # Extract recommendations
        recs_match = re.search(r'Recommendations:(.*?)$', response, re.DOTALL | re.IGNORECASE)
        recommendations = self._parse_list_items(recs_match.group(1)) if recs_match else []
        
        return {
            "score": score,
            "status": status,
            "issues": issues,
            "strengths": strengths,
            "recommendations": recommendations
        }
    
    def _parse_overall_validation(self, response: str) -> Dict[str, Any]:
        """Parse judge response for overall validation"""
        
        # Extract overall score
        score_match = re.search(r'Overall Score:\s*(\d+)', response, re.IGNORECASE)
        score = int(score_match.group(1)) if score_match else 75
        
        # Extract status
        status_match = re.search(r'Overall Status:\s*(RED|YELLOW|GREEN)', response, re.IGNORECASE)
        status = status_match.group(1).upper() if status_match else self._score_to_status(score)
        
        # Extract critical issues
        critical_match = re.search(r'Critical Issues:(.*?)(?:Warnings:|$)', response, re.DOTALL | re.IGNORECASE)
        critical_issues = self._parse_list_items(critical_match.group(1)) if critical_match else []
        
        # Extract warnings
        warnings_match = re.search(r'Warnings:(.*?)(?:Overall Assessment:|$)', response, re.DOTALL | re.IGNORECASE)
        warnings = self._parse_list_items(warnings_match.group(1)) if warnings_match else []
        
        # Extract assessment
        assessment_match = re.search(r'Overall Assessment:(.*?)(?:Recommendations:|$)', response, re.DOTALL | re.IGNORECASE)
        assessment = assessment_match.group(1).strip() if assessment_match else ""
        
        # Extract recommendations
        recs_match = re.search(r'Recommendations:(.*?)$', response, re.DOTALL | re.IGNORECASE)
        recommendations = self._parse_list_items(recs_match.group(1)) if recs_match else []
        
        return {
            "score": score,
            "status": status,
            "critical_issues": critical_issues,
            "warnings": warnings,
            "assessment": assessment,
            "recommendations": recommendations
        }
    
    def _parse_list_items(self, text: str) -> List[str]:
        """Parse bulleted/numbered list items from text"""
        if not text:
            return []
        
        # Split by lines and find list items
        lines = text.strip().split('\n')
        items = []
        for line in lines:
            line = line.strip()
            # Match bullets, numbers, or dashes
            if re.match(r'^[-*•]\s+', line) or re.match(r'^\d+\.\s+', line):
                item = re.sub(r'^[-*•\d.]\s+', '', line).strip()
                if item and item.lower() != 'none':
                    items.append(item)
        
        # If no items found but text exists, return as single item
        if not items and text.strip().lower() != 'none':
            items = [text.strip()]
        
        return items
    
    def _score_to_status(self, score: int) -> str:
        """Convert numeric score to color status"""
        if score >= 85:
            return "GREEN"
        elif score >= 70:
            return "YELLOW"
        else:
            return "RED"
