#!/usr/bin/env python3
"""
Manually create the shortform and composition tables
"""

import sqlite3
import os

def create_tables():
    """Create the shortform and composition tables manually"""
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create shortform table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS "shortform" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "symbol" TEXT,
                "code" TEXT,
                "name" TEXT,
                "category" TEXT,
                "description" TEXT,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create composition table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS "composition" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "material" TEXT,
                "percentage" TEXT,
                "code" TEXT,
                "category" TEXT,
                "properties" TEXT,
                "notes" TEXT,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        
        # Verify tables were created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        
        print("📋 Tables in database after creation:")
        for table in sorted(tables):
            print(f"   • {table}")
        
        if 'shortform' in tables and 'composition' in tables:
            print("✅ Both tables created successfully!")
            
            # Show table structures
            for table_name in ['shortform', 'composition']:
                cursor.execute(f"PRAGMA table_info({table_name});")
                columns = cursor.fetchall()
                print(f"\n📊 Table '{table_name}' structure:")
                for col in columns:
                    print(f"   • {col[1]} ({col[2]})")
        else:
            print("❌ Failed to create tables")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Creating database tables manually...")
    print("=" * 50)
    create_tables()
