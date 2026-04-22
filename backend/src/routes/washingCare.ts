import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import ExcelJS from 'exceljs';

const router = Router();
const prisma = new PrismaClient();

// Get all shortform records
router.get('/shortform', async (req, res) => {
  try {
    const shortforms = await prisma.shortForm.findMany({
      orderBy: {
        symbol: 'asc'
      }
    });
    
    res.json({
      success: true,
      data: shortforms,
      count: shortforms.length
    });
  } catch (error) {
    console.error('Error fetching shortform data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shortform data'
    });
  }
});

// Get shortform by ID
router.get('/shortform/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const shortform = await prisma.shortForm.findUnique({
      where: { id }
    });
    
    if (!shortform) {
      return res.status(404).json({
        success: false,
        error: 'Shortform record not found'
      });
    }
    
    res.json({
      success: true,
      data: shortform
    });
  } catch (error) {
    console.error('Error fetching shortform record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shortform record'
    });
  }
});

// Search shortform by symbol or code
router.get('/shortform/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const shortforms = await prisma.shortForm.findMany({
      where: {
        OR: [
          { symbol: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: {
        symbol: 'asc'
      }
    });
    
    res.json({
      success: true,
      data: shortforms,
      count: shortforms.length
    });
  } catch (error) {
    console.error('Error searching shortform data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search shortform data'
    });
  }
});

// Get all composition records
router.get('/composition', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const take = limit ? parseInt(limit as string) : undefined;
    const skip = offset ? parseInt(offset as string) : undefined;
    
    const compositions = await prisma.composition.findMany({
      take,
      skip,
      orderBy: {
        material: 'asc'
      }
    });
    
    const total = await prisma.composition.count();
    
    res.json({
      success: true,
      data: compositions,
      count: compositions.length,
      total,
      pagination: {
        limit: take,
        offset: skip,
        hasMore: skip !== undefined && take !== undefined ? (skip + take) < total : false
      }
    });
  } catch (error) {
    console.error('Error fetching composition data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch composition data'
    });
  }
});

// Get composition by ID
router.get('/composition/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const composition = await prisma.composition.findUnique({
      where: { id }
    });
    
    if (!composition) {
      return res.status(404).json({
        success: false,
        error: 'Composition record not found'
      });
    }
    
    res.json({
      success: true,
      data: composition
    });
  } catch (error) {
    console.error('Error fetching composition record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch composition record'
    });
  }
});

// Search composition by material or other fields
router.get('/composition/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit, offset } = req.query;
    const take = limit ? parseInt(limit as string) : 50; // Default limit for search
    const skip = offset ? parseInt(offset as string) : undefined;
    
    const compositions = await prisma.composition.findMany({
      where: {
        OR: [
          { material: { contains: query, mode: 'insensitive' } },
          { percentage: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { properties: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } }
        ]
      },
      take,
      skip,
      orderBy: {
        material: 'asc'
      }
    });
    
    res.json({
      success: true,
      data: compositions,
      count: compositions.length
    });
  } catch (error) {
    console.error('Error searching composition data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search composition data'
    });
  }
});

// Get unique materials from composition
router.get('/composition/materials/unique', async (req, res) => {
  try {
    const materials = await prisma.composition.findMany({
      select: {
        material: true
      },
      distinct: ['material'],
      orderBy: {
        material: 'asc'
      }
    });
    
    const uniqueMaterials = materials
      .map(item => item.material)
      .filter(material => material && material.trim() !== '');
    
    res.json({
      success: true,
      data: uniqueMaterials,
      count: uniqueMaterials.length
    });
  } catch (error) {
    console.error('Error fetching unique materials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unique materials'
    });
  }
});

// Get database statistics
router.get('/stats', async (req, res) => {
  try {
    const shortformCount = await prisma.shortForm.count();
    const compositionCount = await prisma.composition.count();
    
    res.json({
      success: true,
      data: {
        shortform: {
          total: shortformCount
        },
        composition: {
          total: compositionCount
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Export all tables as SQL file
router.get('/export/sql', async (req, res) => {
  try {
    let sql = '-- Care Label System Database Export\n';
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;

    // Export ShortForm
    const shortforms = await prisma.shortForm.findMany({ orderBy: { symbol: 'asc' } });
    sql += '-- ShortForm Table\n';
    sql += 'DELETE FROM shortform;\n';
    for (const sf of shortforms) {
      const esc = (v: string | null) => v ? v.replace(/'/g, "''") : '';
      sql += `INSERT INTO shortform (id, symbol, code, name, category, description) VALUES ('${sf.id}', '${esc(sf.symbol)}', '${esc(sf.code)}', '${esc(sf.name)}', '${esc(sf.category)}', '${esc(sf.description)}');\n`;
    }

    // Export Composition
    const compositions = await prisma.composition.findMany({ orderBy: { material: 'asc' } });
    sql += '\n-- Composition Table (18 Languages)\n';
    sql += 'DELETE FROM composition;\n';
    const langKeys = ['spanish','french','english','portuguese','dutch','italian','greek','japanese','german','danish','slovenian','chinese','korean','indonesian','arabic','galician','catalan','basque'] as const;
    for (const comp of compositions) {
      const esc = (v: string | null) => v ? v.replace(/'/g, "''") : '';
      const vals = langKeys.map(k => `'${esc((comp as any)[k])}'`).join(', ');
      sql += `INSERT INTO composition (id, material, ${langKeys.join(', ')}) VALUES ('${comp.id}', '${esc(comp.material)}', ${vals});\n`;
    }

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename=i18n_translations.sql');
    res.send(sql);
  } catch (error) {
    console.error('Error exporting SQL:', error);
    res.status(500).json({ success: false, error: 'Failed to export SQL' });
  }
});

// Export all composition translations as Excel
router.get('/composition/export/excel', async (req, res) => {
  try {
    const compositions = await prisma.composition.findMany({
      orderBy: { material: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Care Label System';
    workbook.created = new Date();

    // --- Composition Sheet ---
    const compSheet = workbook.addWorksheet('Composition');

    const languageColumns = [
      { header: 'Material', key: 'material', width: 25 },
      { header: 'Spanish (ES)', key: 'spanish', width: 25 },
      { header: 'French (FR)', key: 'french', width: 25 },
      { header: 'English (EN)', key: 'english', width: 25 },
      { header: 'Portuguese (PT)', key: 'portuguese', width: 25 },
      { header: 'Dutch (DU)', key: 'dutch', width: 25 },
      { header: 'Italian (IT)', key: 'italian', width: 25 },
      { header: 'Greek (GR)', key: 'greek', width: 25 },
      { header: 'Japanese (JA)', key: 'japanese', width: 25 },
      { header: 'German (DE)', key: 'german', width: 25 },
      { header: 'Danish (DA)', key: 'danish', width: 25 },
      { header: 'Slovenian (SL)', key: 'slovenian', width: 25 },
      { header: 'Chinese (CH)', key: 'chinese', width: 25 },
      { header: 'Korean (KO)', key: 'korean', width: 25 },
      { header: 'Indonesian (ID)', key: 'indonesian', width: 25 },
      { header: 'Arabic (AR)', key: 'arabic', width: 25 },
      { header: 'Galician (GA)', key: 'galician', width: 25 },
      { header: 'Catalan (CA)', key: 'catalan', width: 25 },
      { header: 'Basque (BS)', key: 'basque', width: 25 },
    ];

    compSheet.columns = languageColumns;

    // Style header row
    const headerRow = compSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // Add data rows
    for (const comp of compositions) {
      compSheet.addRow({
        material: comp.material || '',
        spanish: comp.spanish || '',
        french: comp.french || '',
        english: comp.english || '',
        portuguese: comp.portuguese || '',
        dutch: comp.dutch || '',
        italian: comp.italian || '',
        greek: comp.greek || '',
        japanese: comp.japanese || '',
        german: comp.german || '',
        danish: comp.danish || '',
        slovenian: comp.slovenian || '',
        chinese: comp.chinese || '',
        korean: comp.korean || '',
        indonesian: comp.indonesian || '',
        arabic: comp.arabic || '',
        galician: comp.galician || '',
        catalan: comp.catalan || '',
        basque: comp.basque || '',
      });
    }

    // Add borders to all cells
    compSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Auto-filter
    compSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: languageColumns.length }
    };

    // --- ShortForm Sheet ---
    const shortforms = await prisma.shortForm.findMany({
      orderBy: { symbol: 'asc' }
    });

    const sfSheet = workbook.addWorksheet('ShortForm');
    sfSheet.columns = [
      { header: 'Symbol', key: 'symbol', width: 15 },
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
    ];

    const sfHeaderRow = sfSheet.getRow(1);
    sfHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sfHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    sfHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sfHeaderRow.height = 30;

    for (const sf of shortforms) {
      sfSheet.addRow({
        symbol: sf.symbol || '',
        code: sf.code || '',
        name: sf.name || '',
        category: sf.category || '',
        description: sf.description || '',
      });
    }

    sfSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Send as Excel file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=i18n_translations.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting translations to Excel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export translations'
    });
  }
});

export default router;
