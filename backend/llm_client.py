# -*- coding: utf-8 -*-
import os
import httpx
from typing import Optional

class LLMClient:
    """Simple LLM client supporting Anthropic Claude and OpenAI"""
    
    def __init__(self, provider: str = "anthropic", api_key: Optional[str] = None):
        self.provider = provider.lower()
        self.api_key = api_key or os.getenv(f"{provider.upper()}_API_KEY")
        
        if not self.api_key:
            raise ValueError(f"API key required for {provider}")
        
        if self.provider == "anthropic":
            self.api_url = "https://api.anthropic.com/v1/messages"
            self.model = "claude-sonnet-4-20250514"
        elif self.provider == "openai":
            self.api_url = "https://api.openai.com/v1/chat/completions"
            self.model = "gpt-4o-2024-11-20"
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    async def call_llm(self, prompt: str, max_tokens: int = 4000, json_schema: dict = None) -> str:
        """Call LLM API and return response text
        
        Args:
            prompt: The prompt text
            max_tokens: Maximum tokens in response
            json_schema: Optional JSON schema for structured output
        """
        
        if self.provider == "anthropic":
            return await self._call_anthropic(prompt, max_tokens, json_schema)
        elif self.provider == "openai":
            return await self._call_openai(prompt, max_tokens, json_schema)
    
    async def _call_anthropic(self, prompt: str, max_tokens: int, json_schema: dict = None) -> str:
        """Call Anthropic Claude API"""
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        # Add structured output if schema provided (Claude doesn't natively support, but we can add to prompt)
        if json_schema:
            payload["messages"][0]["content"] += f"\n\nIMPORTANT: Return ONLY valid JSON matching this exact schema:\n{json_schema}"
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                self.api_url,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract text from Claude response
            return data["content"][0]["text"]
    
    async def _call_openai(self, prompt: str, max_tokens: int, json_schema: dict = None) -> str:
        """Call OpenAI GPT API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens
        }
        
        # Add structured output if schema provided (OpenAI supports response_format)
        if json_schema:
            payload["response_format"] = {
                "type": "json_schema",
                "json_schema": json_schema
            }
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                self.api_url,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract text from OpenAI response
            return data["choices"][0]["message"]["content"]
