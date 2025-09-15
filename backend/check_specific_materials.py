#!/usr/bin/env python3
"""
Check specific materials in both Excel and database
"""

import sqlite3
import pandas as pd
import os

def check_materials_in_database(materials):
    """Check specific materials in the database"""
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 CHECKING DATABASE:")
        print("=" * 50)
        
        for material in materials:
            print(f"\n🔍 SEARCHING FOR: {material}")
            cursor.execute("SELECT material, spanish, french, english, portuguese, dutch FROM composition WHERE material = ?", (material,))
            rows = cursor.fetchall()
            
            if rows:
                for row in rows:
                    print(f"✅ Found: {row[0]}")
                    print(f"   Spanish: {row[1]}")
                    print(f"   French: {row[2]}")
                    print(f"   English: {row[3]}")
                    print(f"   Portuguese: {row[4]}")
                    print(f"   Dutch: {row[5]}")
            else:
                print(f"❌ NOT FOUND in database: {material}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error querying database: {e}")
        return False

def check_materials_in_excel(materials):
    """Check specific materials in the Excel file"""
    file_path = r"C:\Users\ng\Desktop\washcaresvg\Wash_Care_Symbols_M54\database.xlsx"
    
    if not os.path.exists(file_path):
        print(f"❌ Excel file not found: {file_path}")
        return False
    
    try:
        print("\n🔍 CHECKING EXCEL FILE:")
        print("=" * 50)
        
        df = pd.read_excel(file_path, sheet_name='composition')
        print(f"📊 Excel has {len(df)} rows, {len(df.columns)} columns")
        print(f"📋 Columns: {list(df.columns)}")
        
        for material in materials:
            print(f"\n🔍 SEARCHING FOR: {material}")
            matches = df[df['ELEMENT'].str.upper() == material.upper()]
            
            if len(matches) > 0:
                for index, row in matches.iterrows():
                    print(f"✅ Found: {row['ELEMENT']}")
                    print(f"   Spanish: {row.get('SPANISH          ', 'N/A')}")
                    print(f"   French: {row.get('FRENCH          ', 'N/A')}")
                    print(f"   English: {row.get('ENGLISH          ', 'N/A')}")
                    print(f"   Portuguese: {row.get('PORTUGUESE          ', 'N/A')}")
                    print(f"   Dutch: {row.get('DUTCH          ', 'N/A')}")
            else:
                print(f"❌ NOT FOUND in Excel: {material}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error reading Excel file: {e}")
        return False

if __name__ == "__main__":
    materials_to_check = ['BAMBOO', 'SPANDEX', 'CASHMERE', 'ALPACA']
    
    print("🔍 Checking specific materials in Excel and Database...")
    print("=" * 60)
    
    check_materials_in_excel(materials_to_check)
    check_materials_in_database(materials_to_check)
