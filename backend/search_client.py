"""
Tavily Search Client for real-time web research
"""
from tavily import TavilyClient as TavilyAPI
from typing import List, Dict, Optional, Tuple


class TavilySearchClient:
    """Client for performing web searches using Tavily API"""
    
    def __init__(self, api_key: str):
        """Initialize Tavily client with API key"""
        self.client = TavilyAPI(api_key=api_key)
    
    def search(self, query: str, max_results: int = 5) -> Tuple[str, List[Dict]]:
        """
        Perform a web search and return formatted results plus structured citations
        
        Args:
            query: Search query string
            max_results: Maximum number of results to return
            
        Returns:
            Tuple of (formatted string with search results, list of citation dicts)
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
                return "No search results found.", []
            
            results = response['results']
            if not results:
                return "No search results found.", []
            
            # Build formatted output and structured citations
            formatted_results = ["=== RECENT WEB SEARCH RESULTS ===\n"]
            citations = []
            
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
                
                # Store structured citation
                citations.append({
                    "title": title,
                    "url": url,
                    "relevance_score": score
                })
            
            formatted_results.append("=== END OF WEB SEARCH RESULTS ===\n")
            
            return "\n".join(formatted_results), citations
            
        except Exception as e:
            return f"Search error: {str(e)}", []
    
    def search_for_step(self, company_name: str, step_focus: str) -> Tuple[str, List[Dict]]:
        """
        Perform a targeted search for a specific research step
        
        Args:
            company_name: Name of the company being researched
            step_focus: The focus area for this step (e.g., "strategic objectives", "key initiatives")
            
        Returns:
            Tuple of (formatted search results, list of citations)
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
    
    def search_executives_multi(self, company_name: str, roles: list = None) -> Tuple[str, List[Dict]]:
        """
        Perform multiple targeted searches for specific executive roles
        
        Args:
            company_name: Name of the company being researched
            roles: List of specific roles to search for (e.g., ["CFO", "CTO", "CRO"])
            
        Returns:
            Tuple of (combined formatted search results, list of citations)
        """
        if not roles:
            roles = [
                # C-Suite executives
                "CFO Chief Financial Officer", "CTO Chief Technology Officer", 
                "COO Chief Operating Officer", "CRO Chief Risk Officer",
                "CDO Chief Data Officer", "CISO Chief Information Security Officer",
                # BU-level leaders
                "Division President", "Business Unit Head EVP SVP",
                "VP Vice President Operations", "VP Technology Innovation"
            ]
        
        all_results = ["=== EXECUTIVE SEARCH RESULTS (MULTIPLE TARGETED QUERIES) ===\n"]
        citations = []
        
        for role in roles:
            query = f"{company_name} {role} name current 2024 2025"
            try:
                response = self.client.search(
                    query=query,
                    search_depth="advanced",
                    max_results=3,
                    include_domains=[],
                    exclude_domains=[]
                )
                
                if response and 'results' in response and response['results']:
                    all_results.append(f"\n--- Search for {role} ---")
                    for idx, result in enumerate(response['results'][:2], 1):  # Top 2 per role
                        title = result.get('title', 'No title')
                        url = result.get('url', 'No URL')
                        content = result.get('content', 'No content available')
                        score = result.get('score', 0)
                        
                        all_results.append(f"{idx}. {title}")
                        all_results.append(f"   URL: {url}")
                        all_results.append(f"   Content: {content}")
                        all_results.append("")
                        
                        # Store citation
                        citations.append({
                            "title": title,
                            "url": url,
                            "relevance_score": score
                        })
            except Exception as e:
                all_results.append(f"\n--- Search for {role} failed: {str(e)} ---\n")
        
        all_results.append("\n=== END OF EXECUTIVE SEARCH RESULTS ===\n")
        return "\n".join(all_results), citations
