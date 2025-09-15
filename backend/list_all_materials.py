#!/usr/bin/env python3
"""
List all materials available in the database
"""

import sqlite3
import os

def list_all_materials():
    """List all materials in the database"""
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT material FROM composition ORDER BY material")
        materials = cursor.fetchall()
        
        print(f"📋 ALL MATERIALS IN DATABASE ({len(materials)} total):")
        print("=" * 60)
        
        # Materials currently in frontend
        frontend_materials = [
            'COTTON', 'POLYESTER', 'ELASTANE', 'VISCOSE', 'NYLON', 'WOOL', 
            'SILK', 'LINEN', 'ACRYLIC', 'POLYAMIDE', 'MODAL', 'BAMBOO', 
            'CASHMERE', 'ALPACA'
        ]
        
        print("✅ MATERIALS WITH TRANSLATIONS IN FRONTEND:")
        for material in frontend_materials:
            print(f"  {material}")
        
        print(f"\n❌ MATERIALS MISSING FROM FRONTEND ({len(materials) - len(frontend_materials)} materials):")
        missing_count = 0
        for row in materials:
            material = row[0]
            if material not in frontend_materials:
                print(f"  {material}")
                missing_count += 1
        
        print(f"\n📊 SUMMARY:")
        print(f"  Total materials in database: {len(materials)}")
        print(f"  Materials with frontend translations: {len(frontend_materials)}")
        print(f"  Materials missing from frontend: {missing_count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error querying database: {e}")
        return False

if __name__ == "__main__":
    print("📋 Listing all materials in database...")
    print("=" * 60)
    
    list_all_materials()
