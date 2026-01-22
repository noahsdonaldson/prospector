#!/bin/bash

# Cleanup script to remove old reference files
# Run this after verifying the organized structure works

echo "🧹 Cleaning up old reference files..."

# List files to be removed
echo ""
echo "Files that will be removed:"
echo "  - backend_*.py, backend_*.txt"
echo "  - frontend_*.tsx, frontend_*.txt, frontend_*.json"
echo "  - docker_compose.txt"
echo "  - readme_file.md"
echo "  - setup_script.sh"
echo ""

read -p "Do you want to proceed? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Remove backend reference files
    rm -f backend_dockerfile.txt
    rm -f backend_llm_client.py
    rm -f backend_main.py
    rm -f backend_prompts.py
    rm -f backend_requirements.txt
    rm -f backend_research.py
    
    # Remove frontend reference files
    rm -f frontend_component.tsx
    rm -f frontend_dockerfile.txt
    rm -f frontend_packagejson.json
    
    # Remove other reference files
    rm -f docker_compose.txt
    rm -f readme_file.md
    rm -f setup_script.sh
    
    echo "✅ Cleanup complete!"
    echo ""
    echo "Current project structure:"
    find . -type f \( -name "*.py" -o -name "*.js" -o -name "*.json" -o -name "*.yml" -o -name "Dockerfile" -o -name "*.md" \) | grep -v node_modules | sort
else
    echo "❌ Cleanup cancelled."
fi
