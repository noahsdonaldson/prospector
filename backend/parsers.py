"""Parsers for extracting structured data from markdown research results"""

import re
from typing import List, Dict, Optional


def parse_persona_table(markdown_text: str) -> List[Dict[str, str]]:
    """
    Extract personas from markdown table with robust parsing.
    
    Returns list of persona dictionaries with standardized keys.
    Returns empty list if no valid table found.
    """
    personas = []
    lines = markdown_text.split('\n')
    
    # Find table start (header row with pipes)
    header_idx = None
    for i, line in enumerate(lines):
        if '|' in line and any(keyword in line.lower() for keyword in ['name', 'title', 'persona']):
            header_idx = i
            break
    
    if header_idx is None:
        return []
    
    # Parse header to find column positions
    header_line = lines[header_idx]
    columns = [col.strip() for col in header_line.split('|')]
    columns = [col for col in columns if col]  # Remove empty strings
    
    # Map column names to standardized keys (case-insensitive)
    column_map = {}
    for idx, col in enumerate(columns):
        col_lower = col.lower()
        if 'name' in col_lower:
            column_map[idx] = 'name'
        elif 'persona' in col_lower and 'title' not in col_lower:
            column_map[idx] = 'persona_title'
        elif 'title' in col_lower or 'role' in col_lower:
            column_map[idx] = 'title'
        elif 'decision' in col_lower:
            column_map[idx] = 'role_in_decision'
        elif 'pain' in col_lower:
            column_map[idx] = 'pain_point'
        elif 'use case' in col_lower or 'ai' in col_lower:
            column_map[idx] = 'ai_use_case'
        elif 'outcome' in col_lower or 'expected' in col_lower:
            column_map[idx] = 'expected_outcome'
        elif 'strategic' in col_lower or 'alignment' in col_lower:
            column_map[idx] = 'strategic_alignment'
        elif 'value' in col_lower or 'hook' in col_lower:
            column_map[idx] = 'value_hook'
    
    # Parse data rows (skip header and separator rows)
    for i in range(header_idx + 1, len(lines)):
        line = lines[i].strip()
        
        # Skip separator rows (---) and empty lines
        if not line or '---' in line or not '|' in line:
            continue
        
        # Parse cells
        cells = [cell.strip() for cell in line.split('|')]
        cells = [cell for cell in cells if cell]  # Remove empty strings
        
        # Skip if cell count doesn't match header
        if len(cells) != len(columns):
            continue
        
        # Extract persona data using column map
        persona = {}
        for idx, cell_content in enumerate(cells):
            if idx in column_map:
                # Strip markdown formatting from cell content
                cleaned_content = strip_markdown(cell_content)
                persona[column_map[idx]] = cleaned_content if cleaned_content else None
        
        # Only add if we have at least a name or title
        if persona.get('name') or persona.get('title'):
            # Skip placeholder values
            name = persona.get('name', '').lower()
            if name and name not in ['tbd', 'to be determined', 'n/a', '-', 'not available', '']:
                personas.append(persona)
    
    return personas


def strip_markdown(text: str) -> str:
    """Remove markdown and HTML formatting from text"""
    if not text:
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]*>', '', text)
    
    # Remove markdown formatting
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # Bold
    text = re.sub(r'\*(.*?)\*', r'\1', text)      # Italic
    text = re.sub(r'__(.*?)__', r'\1', text)      # Bold
    text = re.sub(r'_(.*?)_', r'\1', text)        # Italic
    text = re.sub(r'`(.*?)`', r'\1', text)        # Code
    text = re.sub(r'~~(.*?)~~', r'\1', text)      # Strikethrough
    text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)  # Links
    text = re.sub(r'#{1,6}\s', '', text)          # Headers
    
    # Remove HTML entities
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&quot;', '"')
    
    return text.strip()


def extract_industry_from_text(text: str) -> Optional[str]:
    """
    Extract industry/vertical from text.
    Looks for common industry keywords.
    """
    text_lower = text.lower()
    
    # Industry keywords mapping
    industries = {
        'healthcare': ['healthcare', 'hospital', 'medical', 'pharmaceutical', 'biotech', 'health care'],
        'financial_services': ['financial', 'banking', 'fintech', 'insurance', 'investment'],
        'retail': ['retail', 'e-commerce', 'ecommerce', 'consumer goods'],
        'manufacturing': ['manufacturing', 'industrial', 'production', 'factory'],
        'technology': ['technology', 'software', 'saas', 'tech', 'it services'],
        'energy': ['energy', 'oil', 'gas', 'renewable', 'utilities'],
        'telecommunications': ['telecom', 'telecommunications', 'wireless', 'network'],
        'education': ['education', 'university', 'school', 'learning'],
        'transportation': ['transportation', 'logistics', 'shipping', 'automotive'],
        'real_estate': ['real estate', 'property', 'construction'],
        'professional_services': ['consulting', 'professional services', 'advisory'],
        'media': ['media', 'entertainment', 'publishing', 'broadcasting']
    }
    
    for industry, keywords in industries.items():
        for keyword in keywords:
            if keyword in text_lower:
                # Return human-readable format
                return industry.replace('_', ' ').title()
    
    return None


def parse_business_units(text: str) -> List[str]:
    """Extract business unit names from markdown table"""
    lines = text.split('\n')
    business_units = []
    
    for line in lines:
        if '|' in line and '---' not in line:
            parts = [p.strip() for p in line.split('|')]
            # Skip header and empty cells
            if len(parts) > 1 and parts[1] and parts[1].lower() != 'business unit':
                bu_name = strip_markdown(parts[1])
                if bu_name and bu_name not in business_units:
                    business_units.append(bu_name)
    
    return business_units[:3]  # Max 3 business units
