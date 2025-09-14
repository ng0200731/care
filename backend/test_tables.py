#!/usr/bin/env python3
"""
Test script to verify the database tables exist
"""

import sqlite3
import os

def test_database_tables():
    """Test if the new tables exist in the database"""
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        
        print("📋 Existing tables in database:")
        for table in sorted(tables):
            print(f"   • {table}")
        
        # Check specifically for our new tables
        required_tables = ['shortform', 'composition']
        missing_tables = []
        
        for table in required_tables:
            if table not in tables:
                missing_tables.append(table)
        
        if missing_tables:
            print(f"❌ Missing tables: {missing_tables}")
            return False
        else:
            print("✅ All required tables exist!")
            
            # Show table structure
            for table in required_tables:
                cursor.execute(f"PRAGMA table_info({table});")
                columns = cursor.fetchall()
                print(f"\n📊 Table '{table}' structure:")
                for col in columns:
                    print(f"   • {col[1]} ({col[2]})")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error testing database: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing database tables...")
    print("=" * 40)
    test_database_tables()
