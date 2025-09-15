#!/usr/bin/env python3
"""
Query full column structure and specific materials with all columns
"""

import sqlite3
import os

def query_full_structure():
    """Query the full column structure and specific materials"""
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get ALL column information
        cursor.execute("PRAGMA table_info(composition)")
        column_info = cursor.fetchall()
        
        print("📋 FULL COLUMN STRUCTURE:")
        print("=" * 60)
        for col in column_info:
            print(f"  {col[1]} ({col[2]})")
        print()
        
        # Query ACRYLIC with all columns
        print("🔍 ACRYLIC - ALL COLUMNS:")
        print("=" * 50)
        cursor.execute("SELECT * FROM composition WHERE material = 'ACRYLIC'")
        acrylic_row = cursor.fetchone()
        
        if acrylic_row:
            for i, col_info in enumerate(column_info):
                col_name = col_info[1]
                value = acrylic_row[i] if i < len(acrylic_row) and acrylic_row[i] else "(empty)"
                print(f"  {col_name}: {value}")
        
        print("\n🔍 POLYAMIDE - ALL COLUMNS:")
        print("=" * 50)
        cursor.execute("SELECT * FROM composition WHERE material = 'POLYAMIDE'")
        polyamide_row = cursor.fetchone()
        
        if polyamide_row:
            for i, col_info in enumerate(column_info):
                col_name = col_info[1]
                value = polyamide_row[i] if i < len(polyamide_row) and polyamide_row[i] else "(empty)"
                print(f"  {col_name}: {value}")
        
        print("\n🔍 MODAL - ALL COLUMNS:")
        print("=" * 50)
        cursor.execute("SELECT * FROM composition WHERE material = 'MODAL'")
        modal_row = cursor.fetchone()
        
        if modal_row:
            for i, col_info in enumerate(column_info):
                col_name = col_info[1]
                value = modal_row[i] if i < len(modal_row) and modal_row[i] else "(empty)"
                print(f"  {col_name}: {value}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error querying data: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Querying full database structure...")
    print("=" * 60)
    query_full_structure()
