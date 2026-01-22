"""
Tavily Search Client for real-time web research
"""
from tavily import TavilyClient as TavilyAPI
from typing import List, Dict, Optional


class TavilySearchClient:
    """Client for performing web searches using Tavily API"""
    
    def __init__(self, api_key: str):
        """Initialize Tavily client with API key"""
        self.client = TavilyAPI(api_key=api_key)
    
    def search(self, query: str, max_results: int = 5) -> str:
        """
        Perform a web search and return formatted results
        
        Args:
            query: Search query string
            max_results: Maximum number of results to return
            
        Returns:
            Formatted string with search results including titles, URLs, and content
        """
        try:
            # Perform search with Tavily
            response = self.client.search(
                query=query,
                search_depth="advanced",  # Use advanced search for better quality
                max_results=max_results,
                include_domains=[],
                exclude_domains=[]
            )
            
            # Format results for LLM context
            if not response or 'results' not in response:
                return "No search results found."
            
            results = response['results']
            if not results:
                return "No search results found."
            
            # Build formatted output
            formatted_results = ["=== RECENT WEB SEARCH RESULTS ===\n"]
            
            for idx, result in enumerate(results, 1):
                title = result.get('title', 'No title')
                url = result.get('url', 'No URL')
                content = result.get('content', 'No content available')
                score = result.get('score', 0)
                
                formatted_results.append(f"{idx}. {title}")
                formatted_results.append(f"   URL: {url}")
                formatted_results.append(f"   Relevance: {score:.2f}")
                formatted_results.append(f"   Content: {content}")
                formatted_results.append("")  # Blank line between results
            
            formatted_results.append("=== END OF WEB SEARCH RESULTS ===\n")
            
            return "\n".join(formatted_results)
            
        except Exception as e:
            return f"Search error: {str(e)}"
    
    def search_for_step(self, company_name: str, step_focus: str) -> str:
        """
        Perform a targeted search for a specific research step
        
        Args:
            company_name: Name of the company being researched
            step_focus: The focus area for this step (e.g., "strategic objectives", "key initiatives")
            
        Returns:
            Formatted search results
        """
        # Build query that prioritizes recent information
        query = f"{company_name} {step_focus} 2024 2025 2026"
        return self.search(query, max_results=5)
