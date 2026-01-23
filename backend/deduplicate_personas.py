#!/usr/bin/env python3
"""
One-time script to deduplicate existing personas in the database.
Keeps the most recent persona for each (company_id, name) pair.
"""

from database import SessionLocal, Persona
from sqlalchemy import func
from datetime import datetime

def deduplicate_personas():
    db = SessionLocal()
    
    try:
        # Find all duplicate persona groups (same company + same name)
        duplicates = db.query(
            Persona.company_id,
            Persona.name,
            func.count(Persona.id).label('count')
        ).group_by(
            Persona.company_id,
            Persona.name
        ).having(
            func.count(Persona.id) > 1
        ).all()
        
        total_deleted = 0
        
        for company_id, name, count in duplicates:
            print(f"\nFound {count} duplicates for '{name}' at company_id={company_id}")
            
            # Get all personas with this company_id and name
            personas = db.query(Persona).filter(
                Persona.company_id == company_id,
                Persona.name == name
            ).order_by(
                Persona.last_researched_at.desc().nullslast(),
                Persona.updated_at.desc().nullslast(),
                Persona.created_at.desc()
            ).all()
            
            # Keep the first one (most recent), delete the rest
            keep = personas[0]
            to_delete = personas[1:]
            
            print(f"  Keeping persona ID {keep.id} (last_researched: {keep.last_researched_at})")
            
            for persona in to_delete:
                print(f"  Deleting persona ID {persona.id} (last_researched: {persona.last_researched_at})")
                db.delete(persona)
                total_deleted += 1
        
        db.commit()
        
        print(f"\n✅ Deduplication complete!")
        print(f"   Total duplicates removed: {total_deleted}")
        
        # Show final persona count
        total_personas = db.query(Persona).count()
        print(f"   Total personas remaining: {total_personas}")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during deduplication: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting persona deduplication...")
    deduplicate_personas()
