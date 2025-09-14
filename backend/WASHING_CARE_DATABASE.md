# Washing Care Database Import

This document describes the process of importing Excel data from washing care symbols database into SQL tables.

## Overview

The system imports data from an Excel file (`database.xlsx`) containing two sheets:
- **shortform**: Language codes and short forms
- **composition**: Material composition data in multiple languages

## Database Tables

### ShortForm Table
```sql
CREATE TABLE "shortform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT,           -- Language name (e.g., "ENGLISH", "FRENCH")
    "code" TEXT,             -- Language code (e.g., "EN", "FR")
    "name" TEXT,             -- Additional name field
    "category" TEXT,         -- Category classification
    "description" TEXT,      -- Description field
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Composition Table
```sql
CREATE TABLE "composition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "material" TEXT,         -- Material name (e.g., "COTTON", "POLYESTER")
    "percentage" TEXT,       -- Material in Spanish
    "code" TEXT,             -- Material in French
    "category" TEXT,         -- Material in English
    "properties" TEXT,       -- Material in Portuguese
    "notes" TEXT,            -- Material in Dutch
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Import Process

### Prerequisites
1. Python 3.7+ installed
2. Required Python packages: `pandas`, `openpyxl`
3. Excel file at: `C:\Users\ng\Desktop\washcaresvg\Wash_Care_Symbols_M54\database.xlsx`

### Automated Import
Run the batch script:
```bash
cd backend
import-excel-data.bat
```

### Manual Import Steps

1. **Install Python dependencies:**
   ```bash
   py -m pip install pandas openpyxl
   ```

2. **Create database tables:**
   ```bash
   py create_tables.py
   ```

3. **Import Excel data:**
   ```bash
   py import_excel_data.py
   ```

4. **Verify import:**
   ```bash
   py query_data.py
   ```

## API Endpoints

The system provides REST API endpoints to access the imported data:

### ShortForm Endpoints
- `GET /api/washing-care/shortform` - Get all shortform records
- `GET /api/washing-care/shortform/:id` - Get shortform by ID
- `GET /api/washing-care/shortform/search/:query` - Search shortform records

### Composition Endpoints
- `GET /api/washing-care/composition` - Get all composition records (with pagination)
- `GET /api/washing-care/composition/:id` - Get composition by ID
- `GET /api/washing-care/composition/search/:query` - Search composition records
- `GET /api/washing-care/composition/materials/unique` - Get unique materials list

### Statistics Endpoint
- `GET /api/washing-care/stats` - Get database statistics

### Example API Responses

**ShortForm Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "c1757853146507nczxhv28",
      "symbol": "ENGLISH",
      "code": "EN",
      "name": null,
      "category": null,
      "description": null,
      "createdAt": "2025-09-14T20:32:26.507Z",
      "updatedAt": "2025-09-14T20:32:26.507Z"
    }
  ],
  "count": 18
}
```

**Composition Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "c1757853146529psid1wmp",
      "material": "COTTON",
      "percentage": "algodón",
      "code": "coton",
      "category": "cotton",
      "properties": "algodão",
      "notes": "katoen",
      "createdAt": "2025-09-14T20:32:26.529Z",
      "updatedAt": "2025-09-14T20:32:26.529Z"
    }
  ],
  "count": 221,
  "total": 221
}
```

## Data Structure

### Current Import Results
- **ShortForm**: 18 records (language codes)
- **Composition**: 221 records (material translations)

### Column Mapping

**ShortForm Sheet:**
- Column 1 → `symbol` (Language name)
- Column 2 → `code` (Language code)

**Composition Sheet:**
- Column 1 → `material` (Element/Material name)
- Column 2 → `percentage` (Spanish translation)
- Column 3 → `code` (French translation)
- Column 4 → `category` (English translation)
- Column 5 → `properties` (Portuguese translation)
- Column 6 → `notes` (Dutch translation)
- Additional columns available for Italian, Greek, Japanese, German, Danish, Slovenian, Chinese, Korean, Indonesian, Arabic, Galician, Catalan, and Basque

## Files Created

### Python Scripts
- `import_excel_data.py` - Main import script
- `create_tables.py` - Manual table creation
- `test_tables.py` - Database table verification
- `query_data.py` - Sample data display
- `requirements.txt` - Python dependencies

### Batch Scripts
- `import-excel-data.bat` - Automated import process

### API Files
- `src/routes/washingCare.ts` - REST API endpoints
- Updated `src/index.ts` - Added washing care routes

### Database Files
- `prisma/schema.prisma` - Updated with new tables
- `prisma/migrations/` - Database migration files
- `.env` - Database connection configuration

## Usage Examples

### Frontend Integration
```javascript
// Fetch all language codes
const response = await fetch('/api/washing-care/shortform');
const languages = await response.json();

// Search for materials
const searchResponse = await fetch('/api/washing-care/composition/search/cotton');
const materials = await searchResponse.json();

// Get unique materials
const uniqueResponse = await fetch('/api/washing-care/composition/materials/unique');
const uniqueMaterials = await uniqueResponse.json();
```

### Database Queries
```sql
-- Get all language codes
SELECT symbol, code FROM shortform ORDER BY symbol;

-- Search for cotton-related materials
SELECT material, percentage, code, category 
FROM composition 
WHERE material LIKE '%COTTON%' 
ORDER BY material;

-- Get material count by first letter
SELECT SUBSTR(material, 1, 1) as first_letter, COUNT(*) as count
FROM composition 
WHERE material IS NOT NULL 
GROUP BY SUBSTR(material, 1, 1) 
ORDER BY first_letter;
```

## Troubleshooting

### Common Issues
1. **Excel file not found**: Ensure the file path is correct
2. **Python not found**: Install Python 3.7+ and add to PATH
3. **Permission errors**: Run as administrator if needed
4. **Database locked**: Close any database connections

### Verification Steps
1. Check table creation: `py test_tables.py`
2. Verify data import: `py query_data.py`
3. Test API endpoints: Visit `http://localhost:3001/api/washing-care/stats`

## Future Enhancements

1. **Data Validation**: Add validation for imported data
2. **Incremental Updates**: Support for updating existing records
3. **Export Functionality**: Export data back to Excel
4. **Multi-language Support**: Better handling of language-specific data
5. **Data Relationships**: Link shortform and composition data
