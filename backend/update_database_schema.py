#!/usr/bin/env python3
"""
Manually update the database schema to add all language columns
"""

import sqlite3
import os

def update_database_schema():
    """Add all language columns to the composition table"""
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List of language columns to add
        language_columns = [
            'spanish', 'french', 'english', 'portuguese', 'dutch', 'italian',
            'greek', 'japanese', 'german', 'danish', 'slovenian', 'chinese',
            'korean', 'indonesian', 'arabic', 'galician', 'catalan', 'basque'
        ]
        
        print("🔧 Adding language columns to composition table...")
        
        # Add each language column
        for column in language_columns:
            try:
                cursor.execute(f"ALTER TABLE composition ADD COLUMN {column} TEXT")
                print(f"✅ Added column: {column}")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e):
                    print(f"⚠️ Column {column} already exists")
                else:
                    print(f"❌ Error adding column {column}: {e}")
        
        # Remove old columns that are no longer needed
        print("\n🗑️ Note: Old columns (percentage, code, category, properties, notes) will be kept for compatibility")
        
        conn.commit()
        
        # Verify the new structure
        cursor.execute("PRAGMA table_info(composition)")
        columns = cursor.fetchall()
        
        print(f"\n📋 Updated table structure ({len(columns)} columns):")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        conn.close()
        print("\n✅ Database schema updated successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error updating database schema: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Updating database schema...")
    print("=" * 60)
    update_database_schema()
