#!/usr/bin/env python3
"""
Get complete 18-language translations for specific materials
"""

import sqlite3
import os

def get_full_translations(materials):
    """Get complete translations for specific materials"""
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Language order for frontend array
        language_columns = [
            'spanish', 'french', 'english', 'portuguese', 'dutch', 'italian',
            'greek', 'japanese', 'german', 'danish', 'slovenian', 'chinese',
            'korean', 'indonesian', 'arabic', 'galician', 'catalan', 'basque'
        ]
        
        print("🌍 COMPLETE 18-LANGUAGE TRANSLATIONS:")
        print("=" * 60)
        
        for material in materials:
            print(f"\n🔍 {material}:")
            
            # Build query for all language columns
            columns_str = ', '.join(language_columns)
            cursor.execute(f"SELECT {columns_str} FROM composition WHERE material = ?", (material,))
            row = cursor.fetchone()
            
            if row:
                # Create the array format for frontend
                translations = [str(val) if val else material.lower() for val in row]
                print(f"  '{material}': {translations},")
                
                # Also show readable format
                print("  Readable format:")
                for i, lang in enumerate(language_columns):
                    print(f"    {lang}: {translations[i]}")
            else:
                print(f"❌ NOT FOUND: {material}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error querying database: {e}")
        return False

if __name__ == "__main__":
    materials_to_get = ['BAMBOO', 'CASHMERE', 'ALPACA']
    
    print("🔍 Getting complete translations for materials...")
    print("=" * 60)
    
    get_full_translations(materials_to_get)
