/**
 * Export i18n translations to SQL and Excel files.
 * Data source: materialTranslations from NewCompTransDialog.tsx
 * Usage: npx ts-node export-translations.ts
 */
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

const LANG_KEYS = [
  'spanish','french','english','portuguese','dutch','italian',
  'greek','japanese','german','danish','slovenian','chinese',
  'korean','indonesian','arabic','galician','catalan','basque'
] as const;

const LANG_HEADERS: Record<string, string> = {
  spanish: 'Spanish (ES)', french: 'French (FR)', english: 'English (EN)',
  portuguese: 'Portuguese (PT)', dutch: 'Dutch (DU)', italian: 'Italian (IT)',
  greek: 'Greek (GR)', japanese: 'Japanese (JA)', german: 'German (DE)',
  danish: 'Danish (DA)', slovenian: 'Slovenian (SL)', chinese: 'Chinese (CH)',
  korean: 'Korean (KO)', indonesian: 'Indonesian (ID)', arabic: 'Arabic (AR)',
  galician: 'Galician (GA)', catalan: 'Catalan (CA)', basque: 'Basque (BS)',
};

// Source data from NewCompTransDialog.tsx materialTranslations
// Order: ES, FR, EN, PT, DU, IT, GR, JA, DE, DA, SL, CH, KO, ID, AR, GA, CA, BS
const materialTranslations: { [key: string]: string[] } = {
  'COTTON': ['algodón', 'coton', 'cotton', 'algodão', 'katoen', 'cotone', 'ΒΑΜΒΑΚΙ', 'コットン', 'baumwolle', 'bomuld', 'bombaž', '棉', '면', 'katun', 'قطن', 'algodón', 'cotó', 'kotoia'],
  'POLYESTER': ['poliéster', 'polyester', 'polyester', 'poliéster', 'polyester', 'poliestere', 'ΠΟΛΥΕΣΤΕΡΑΣ', 'ポリエステル', 'polyester', 'polyester', 'poliester', '聚酯纤维', '폴리에스터', 'poliester', 'بوليستير', 'poliéster', 'polièster', 'poliesterra'],
  'ELASTANE': ['elastano', 'élasthanne', 'elastane', 'elastano', 'elastaan', 'elastan', 'ΕΛΑΣΤΑΝΗ', 'エラスタン', 'elastan', 'elastan', 'elastan', '氨纶', '엘라스탄', 'elastan', 'إيلاستان', 'elastano', 'elastà', 'elastanoa'],
  'VISCOSE': ['viscosa', 'viscose', 'viscose', 'viscose', 'viscose', 'viscosa', 'ΒΙΣΚΟΖΗ', 'ビスコース', 'viskose', 'viskose', 'viskoza', '粘胶纤维', '비스코스', 'viskosa', 'فيسكوز', 'viscosa', 'viscosa', 'biskosea'],
  'NYLON': ['nailon', 'nylon', 'nylon', 'nylon (so p/o Brasil poliamida)', 'nylon', 'nailon', 'ΝΑΪΛΟΝ', 'ナイロン', 'nylon', 'nylon', 'najlon', '锦纶', '나일론', 'nilon', 'نايلون', 'nailon', 'niló', 'nylona'],
  'WOOL': ['lana', 'laine', 'wool', 'lã', 'wol', 'lana', 'ΜΑΛΛΙ', 'ウール', 'wolle', 'uld', 'volna', '羊毛', '울', 'wol', 'صوف', 'la', 'llana', 'artilea'],
  'SILK': ['seda', 'soie', 'silk', 'seda', 'zijde', 'seta', 'ΜΕΤΑΞΙ', 'シルク', 'seide', 'silke', 'svila', '丝绸', '실크', 'sutra', 'حرير', 'seda', 'seda', 'zetaa'],
  'LINEN': ['lino', 'lin', 'linen', 'linho', 'linnen', 'lino', 'ΛΙΝΑΡΙ', 'リネン', 'leinen', 'hør', 'lan', '亚麻', '린넨', 'linen', 'كتان', 'liño', 'lli', 'lihoaren'],
  'ACRYLIC': ['acrílico', 'acrylique', 'acrylic', 'acrílico', 'acryl', 'acrilico', 'ΑΚΡΥΛΙΚΟ', 'アクリル', 'acryl', 'akryl', 'akril', '腈纶', '아크릴', 'akrilik', 'أكريليك', 'acrílico', 'acrílic', 'akrilikoa'],
  'POLYAMIDE': ['poliamida', 'polyamide', 'polyamide', 'poliamida', 'polyamide', 'poliammide', 'ΠΟΛΥΑΜΙΔΙΟ', 'ナイロン', 'polyamid', 'polyamid', 'poliamid', '锦纶', '폴리아미드', 'poliamida', 'بولياميد', 'poliamida', 'poliamida', 'poliamida'],
  'MODAL': ['modal', 'modal', 'modal', 'modal', 'modal', 'modale', 'ΙΝΑ ΜΟΝΤΑΛ', 'モダル', 'modal', 'modal', 'modal', '莫代尔纤维', '모달', 'modal', 'شكلي', 'modal', 'modal', 'modala'],
  'BAMBOO': ['bambú', 'bambou', 'bamboo', 'bambu', 'bamboe', 'bambù', 'ΜΠΑΜΠΟΥ', '竹材', 'bambus', 'bambus', 'bambus', '竹', '대나무', 'bambu', 'الخيزران', 'bambú', 'bambú', 'banbu'],
  'CASHMERE': ['cachemira', 'cachemire', 'cashmere', 'caxemira', 'kasjmier', 'cashmere', 'ΚΑΣΜΙΡΙ', 'カシミア', 'kaschmir', 'kashmir', 'kašmir', '山羊绒', '캐시미어', 'kasmir', 'كشمير', 'caxemira', 'caixmir', 'kaxmirra'],
  'ALPACA': ['alpaca', 'alpaga', 'alpaca', 'alpaca', 'alpaca', 'alpaca', 'ΑΛΠΑΚΑΣ', 'アルパカ', 'alpaka', 'alpaka', 'alpaka', '羊驼毛', '알파카', 'domba', 'الألبكة', 'alpaca', 'alpaca', 'alpaka'],
};

function exportSQL(outputPath: string) {
  const esc = (v: string) => v.replace(/'/g, "''");
  let sql = `-- Care Label System i18n Translations Export\n-- Generated: ${new Date().toISOString()}\n-- 14 materials x 18 languages\n\n`;

  sql += 'DELETE FROM composition;\n';
  let id = 1;
  for (const [material, translations] of Object.entries(materialTranslations)) {
    const vals = LANG_KEYS.map((_, i) => `'${esc(translations[i] || '')}'`).join(', ');
    sql += `INSERT INTO composition (id, material, ${LANG_KEYS.join(', ')}) VALUES ('${id++}', '${esc(material)}', ${vals});\n`;
  }

  fs.writeFileSync(outputPath, sql, 'utf-8');
  console.log(`SQL exported: ${outputPath} (${Object.keys(materialTranslations).length} materials)`);
}

function exportExcel(outputPath: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Care Label System';

  const sheet = workbook.addWorksheet('Composition');
  const langCols = [
    { header: 'Material', key: 'material', width: 25 },
    ...LANG_KEYS.map(k => ({ header: LANG_HEADERS[k], key: k, width: 25 }))
  ];
  sheet.columns = langCols;

  const hdr = sheet.getRow(1);
  hdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  hdr.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF4472C4' } };
  hdr.alignment = { vertical: 'middle', horizontal: 'center' };
  hdr.height = 30;

  for (const [material, translations] of Object.entries(materialTranslations)) {
    const row: any = { material };
    LANG_KEYS.forEach((k, i) => row[k] = translations[i] || '');
    sheet.addRow(row);
  }

  sheet.eachRow(row => {
    row.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: langCols.length } };

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  return workbook.xlsx.writeFile(outputPath).then(() => {
    console.log(`Excel exported: ${outputPath} (${Object.keys(materialTranslations).length} materials)`);
  });
}

async function main() {
  const outDir = path.join(__dirname, 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  exportSQL(path.join(outDir, 'i18n_translations.sql'));
  await exportExcel(path.join(outDir, 'i18n_translations.xlsx'));

  console.log(`\nAll exports saved to: ${outDir}`);
}

main().catch(e => { console.error('Export failed:', e); process.exit(1); });
