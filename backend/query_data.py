#!/usr/bin/env python3
"""
Query and display sample data from the imported tables
"""

import sqlite3
import os

def query_sample_data():
    """Query and display sample data from both tables"""
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 SHORTFORM TABLE SAMPLE DATA")
        print("=" * 60)
        cursor.execute("SELECT * FROM shortform LIMIT 10")
        shortform_data = cursor.fetchall()
        
        # Get column names
        cursor.execute("PRAGMA table_info(shortform)")
        shortform_columns = [col[1] for col in cursor.fetchall()]
        
        print(f"📋 Columns: {', '.join(shortform_columns)}")
        print()
        
        for i, row in enumerate(shortform_data, 1):
            print(f"Record {i}:")
            for j, col_name in enumerate(shortform_columns):
                if j < len(row):
                    value = row[j] if row[j] else "(empty)"
                    print(f"  {col_name}: {value}")
            print()
        
        print("\n🔍 COMPOSITION TABLE SAMPLE DATA")
        print("=" * 60)
        cursor.execute("SELECT * FROM composition LIMIT 5")
        composition_data = cursor.fetchall()
        
        # Get column names
        cursor.execute("PRAGMA table_info(composition)")
        composition_columns = [col[1] for col in cursor.fetchall()]
        
        print(f"📋 Columns: {', '.join(composition_columns)}")
        print()
        
        for i, row in enumerate(composition_data, 1):
            print(f"Record {i}:")
            for j, col_name in enumerate(composition_columns):
                if j < len(row):
                    value = row[j] if row[j] else "(empty)"
                    # Truncate long values for display
                    if isinstance(value, str) and len(value) > 50:
                        value = value[:47] + "..."
                    print(f"  {col_name}: {value}")
            print()
        
        # Show record counts
        cursor.execute("SELECT COUNT(*) FROM shortform")
        shortform_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM composition")
        composition_count = cursor.fetchone()[0]
        
        print(f"\n📊 SUMMARY")
        print("=" * 30)
        print(f"ShortForm records: {shortform_count}")
        print(f"Composition records: {composition_count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error querying data: {e}")
        return False

if __name__ == "__main__":
    print("📊 Querying imported data...")
    print("=" * 60)
    query_sample_data()
