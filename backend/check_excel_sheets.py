#!/usr/bin/env python3
"""
Check what sheets are available in the Excel file
"""

import pandas as pd
import os

def check_excel_sheets():
    """Check available sheets in the Excel file"""
    file_path = r"C:\Users\ng\Desktop\washcaresvg\Wash_Care_Symbols_M54\database.xlsx"
    
    if not os.path.exists(file_path):
        print(f"❌ Excel file not found: {file_path}")
        return False
    
    try:
        # Get all sheet names
        excel_file = pd.ExcelFile(file_path)
        sheet_names = excel_file.sheet_names
        
        print(f"📊 Excel file: {file_path}")
        print(f"📋 Available sheets ({len(sheet_names)}):")
        for i, sheet_name in enumerate(sheet_names, 1):
            print(f"  {i}. {sheet_name}")
        
        # Try to read the first few rows of each sheet to understand structure
        for sheet_name in sheet_names:
            print(f"\n🔍 Sheet: {sheet_name}")
            print("=" * 40)
            try:
                df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=3)
                print(f"📏 Dimensions: {df.shape[0]} rows, {df.shape[1]} columns")
                print(f"📋 Columns: {list(df.columns)}")
                if len(df) > 0:
                    print("📝 First row data:")
                    for col in df.columns[:5]:  # Show first 5 columns
                        print(f"   {col}: {df.iloc[0][col]}")
            except Exception as e:
                print(f"❌ Error reading sheet {sheet_name}: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error reading Excel file: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Checking Excel file structure...")
    print("=" * 60)
    check_excel_sheets()
