#!/usr/bin/env python3
"""
Excel to SQLite Database Import Script
Imports data from Excel sheets 'shortform' and 'composition' into SQLite database tables.
"""

import pandas as pd
import sqlite3
import os
import sys
from datetime import datetime

def connect_to_database():
    """Connect to the SQLite database"""
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        print("Please run 'npx prisma migrate dev' first to create the database.")
        return None
    
    try:
        conn = sqlite3.connect(db_path)
        print(f"✅ Connected to database: {db_path}")
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return None

def read_excel_file(file_path):
    """Read Excel file and return both sheets as DataFrames"""
    if not os.path.exists(file_path):
        print(f"❌ Excel file not found: {file_path}")
        return None, None
    
    try:
        # Read both sheets
        shortform_df = pd.read_excel(file_path, sheet_name='shortform')
        composition_df = pd.read_excel(file_path, sheet_name='composition')
        
        print(f"✅ Successfully read Excel file: {file_path}")
        print(f"📊 ShortForm sheet: {len(shortform_df)} rows, {len(shortform_df.columns)} columns")
        print(f"📊 Composition sheet: {len(composition_df)} rows, {len(composition_df.columns)} columns")
        
        return shortform_df, composition_df
    except Exception as e:
        print(f"❌ Failed to read Excel file: {e}")
        return None, None

def create_tables_if_not_exist(conn):
    """Create tables if they don't exist (backup in case migration hasn't run)"""
    cursor = conn.cursor()
    
    # Create shortform table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shortform (
            id TEXT PRIMARY KEY,
            symbol TEXT,
            code TEXT,
            name TEXT,
            category TEXT,
            description TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create composition table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS composition (
            id TEXT PRIMARY KEY,
            material TEXT,
            percentage TEXT,
            code TEXT,
            category TEXT,
            properties TEXT,
            notes TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    print("✅ Tables created/verified")

def generate_cuid():
    """Generate a simple CUID-like ID"""
    import random
    import string
    timestamp = str(int(datetime.now().timestamp() * 1000))
    random_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"c{timestamp}{random_part}"

def import_shortform_data(conn, df):
    """Import shortform data into the database"""
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM shortform")
    
    # Get column names from DataFrame
    columns = df.columns.tolist()
    print(f"📋 ShortForm columns: {columns}")
    
    # Map DataFrame columns to database columns
    # Adjust these mappings based on your actual Excel column names
    column_mapping = {
        'symbol': 'symbol',
        'code': 'code', 
        'name': 'name',
        'category': 'category',
        'description': 'description'
    }
    
    imported_count = 0
    current_time = datetime.now().isoformat()
    
    for index, row in df.iterrows():
        try:
            # Generate unique ID
            record_id = generate_cuid()
            
            # Extract data based on available columns
            symbol = str(row.get(columns[0], '')) if len(columns) > 0 else ''
            code = str(row.get(columns[1], '')) if len(columns) > 1 else ''
            name = str(row.get(columns[2], '')) if len(columns) > 2 else ''
            category = str(row.get(columns[3], '')) if len(columns) > 3 else ''
            description = str(row.get(columns[4], '')) if len(columns) > 4 else ''
            
            # Clean up NaN values
            symbol = symbol if symbol != 'nan' else ''
            code = code if code != 'nan' else ''
            name = name if name != 'nan' else ''
            category = category if category != 'nan' else ''
            description = description if description != 'nan' else ''
            
            cursor.execute('''
                INSERT INTO shortform (id, symbol, code, name, category, description, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (record_id, symbol, code, name, category, description, current_time, current_time))
            
            imported_count += 1
            
        except Exception as e:
            print(f"⚠️ Error importing shortform row {index}: {e}")
            continue
    
    conn.commit()
    print(f"✅ Imported {imported_count} records into shortform table")

def import_composition_data(conn, df):
    """Import composition data into the database"""
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM composition")
    
    # Get column names from DataFrame
    columns = df.columns.tolist()
    print(f"📋 Composition columns: {columns}")
    
    imported_count = 0
    current_time = datetime.now().isoformat()
    
    for index, row in df.iterrows():
        try:
            # Generate unique ID
            record_id = generate_cuid()
            
            # Extract data based on available columns
            material = str(row.get(columns[0], '')) if len(columns) > 0 else ''
            percentage = str(row.get(columns[1], '')) if len(columns) > 1 else ''
            code = str(row.get(columns[2], '')) if len(columns) > 2 else ''
            category = str(row.get(columns[3], '')) if len(columns) > 3 else ''
            properties = str(row.get(columns[4], '')) if len(columns) > 4 else ''
            notes = str(row.get(columns[5], '')) if len(columns) > 5 else ''
            
            # Clean up NaN values
            material = material if material != 'nan' else ''
            percentage = percentage if percentage != 'nan' else ''
            code = code if code != 'nan' else ''
            category = category if category != 'nan' else ''
            properties = properties if properties != 'nan' else ''
            notes = notes if notes != 'nan' else ''
            
            cursor.execute('''
                INSERT INTO composition (id, material, percentage, code, category, properties, notes, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (record_id, material, percentage, code, category, properties, notes, current_time, current_time))
            
            imported_count += 1
            
        except Exception as e:
            print(f"⚠️ Error importing composition row {index}: {e}")
            continue
    
    conn.commit()
    print(f"✅ Imported {imported_count} records into composition table")

def main():
    """Main function to orchestrate the import process"""
    print("🚀 Starting Excel to Database Import Process")
    print("=" * 50)
    
    # Default file path - can be overridden via command line argument
    default_file_path = r"C:\Users\ng\Desktop\washcaresvg\Wash_Care_Symbols_M54\database.xlsx"
    
    # Check if file path provided as argument
    if len(sys.argv) > 1:
        excel_file_path = sys.argv[1]
    else:
        excel_file_path = default_file_path
    
    print(f"📁 Excel file path: {excel_file_path}")
    
    # Step 1: Read Excel file
    shortform_df, composition_df = read_excel_file(excel_file_path)
    if shortform_df is None or composition_df is None:
        print("❌ Failed to read Excel file. Exiting.")
        return
    
    # Step 2: Connect to database
    conn = connect_to_database()
    if conn is None:
        print("❌ Failed to connect to database. Exiting.")
        return
    
    try:
        # Step 3: Create tables if needed
        create_tables_if_not_exist(conn)
        
        # Step 4: Import data
        print("\n📥 Importing ShortForm data...")
        import_shortform_data(conn, shortform_df)
        
        print("\n📥 Importing Composition data...")
        import_composition_data(conn, composition_df)
        
        print("\n🎉 Import process completed successfully!")
        print("=" * 50)
        
        # Display summary
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM shortform")
        shortform_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM composition")
        composition_count = cursor.fetchone()[0]
        
        print(f"📊 Final Summary:")
        print(f"   • ShortForm table: {shortform_count} records")
        print(f"   • Composition table: {composition_count} records")
        
    except Exception as e:
        print(f"❌ Import process failed: {e}")
    finally:
        conn.close()
        print("🔒 Database connection closed")

if __name__ == "__main__":
    main()
