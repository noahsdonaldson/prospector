"""
Judge LLM Client - Uses OpenAI GPT-4o for independent validation
"""
import os
from openai import OpenAI
from typing import Dict, Any

class JudgeLLMClient:
    """Separate LLM client for validating research quality"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key required for judge LLM")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4o"
    
    def validate(self, prompt: str, temperature: float = 0.1) -> str:
        """
        Call judge LLM with low temperature for consistent validation
        
        Args:
            prompt: Validation prompt with context and instructions
            temperature: Low temperature for deterministic results
            
        Returns:
            Validation response as string
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a research quality validator. Analyze research outputs for accuracy, citation quality, consistency, and adherence to specifications. Provide objective, detailed assessments."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=temperature,
                max_tokens=2000
            )
            
            return response.choices[0].message.content.strip()
        
        except Exception as e:
            print(f"Judge LLM error: {e}")
            raise
