#!/usr/bin/env python3
"""
Query specific materials from the composition table
"""

import sqlite3
import os

def query_materials(materials):
    """Query specific materials from the composition table"""
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get column names first
        cursor.execute("PRAGMA table_info(composition)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"📋 Columns: {', '.join(columns)}")
        print()
        
        for material in materials:
            print(f"🔍 SEARCHING FOR: {material}")
            print("=" * 50)
            
            # Query for the specific material
            cursor.execute("SELECT * FROM composition WHERE material = ?", (material,))
            rows = cursor.fetchall()
            
            if rows:
                for i, row in enumerate(rows, 1):
                    print(f"Record {i}:")
                    for j, col_name in enumerate(columns):
                        if j < len(row):
                            value = row[j] if row[j] else "(empty)"
                            print(f"  {col_name}: {value}")
                    print()
            else:
                print(f"❌ No records found for {material}")
                print()
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error querying data: {e}")
        return False

if __name__ == "__main__":
    materials_to_query = ['ACRYLIC', 'POLYAMIDE', 'SPANDEX', 'MODAL']
    
    print("🔍 Querying specific materials...")
    print("=" * 60)
    query_materials(materials_to_query)
