/**
 * ArtworkRenderer Service
 *
 * Renders artwork from data model. NO DOM dependency.
 * Uses mm coordinates directly — never getBoundingClientRect().
 *
 * CRITICAL: Content is NOT in region.contents[] (that doesn't exist).
 * Content lives in a separate regionContents map: { regionId: ContentObject[] }
 * This map is saved alongside canvasData in localStorage layouts.
 */

import jsPDF from 'jspdf';

export interface LayoutData {
  objects: any[];
  width?: number;
  height?: number;
}

export type RegionContentsMap = Record<string, any[]>;

export interface RenderOptions {
  onlyPreview?: boolean;
  showDimensions?: boolean;
  showRegionBorders?: boolean;
  margin?: number;
  headerText?: string;
}

const DEFAULT_OPTS: RenderOptions = {
  onlyPreview: true,
  showDimensions: false,
  showRegionBorders: false,
  margin: 5,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
           : { r: 0, g: 0, b: 0 };
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function sortMothers(objects: any[]): any[] {
  const mothers = objects.filter(o => o.type?.includes('mother'));
  const parents = mothers.filter((m: any) => !m.isOverflowChild);
  const children = mothers.filter((m: any) => m.isOverflowChild);
  parents.sort((a: any, b: any) => a.x - b.x);

  const result: any[] = [];
  const added = new Set<string>();

  parents.forEach((p: any) => {
    result.push(p);
    (p.childMotherIds || []).forEach((cid: string) => {
      if (!added.has(cid)) {
        const ch = children.find((c: any) => c.name === cid);
        if (ch) { result.push(ch); added.add(cid); }
      }
    });
  });
  children.forEach((ch: any) => { if (!added.has(ch.name)) result.push(ch); });
  return result;
}

function findPaperSize(w: number, h: number) {
  const papers = [
    { format: 'a4', width: 210, height: 297 },
    { format: 'a3', width: 297, height: 420 },
    { format: 'a2', width: 420, height: 594 },
    { format: 'a1', width: 594, height: 841 },
  ];
  for (const p of papers) {
    if (w <= p.width && h <= p.height)
      return { format: p.format as string, width: p.width, height: p.height, orientation: 'portrait' as const };
    if (w <= p.height && h <= p.width)
      return { format: p.format as string, width: p.height, height: p.width, orientation: 'landscape' as const };
  }
  return { format: 'a1', width: 841, height: 594, orientation: 'landscape' as const };
}

interface ContentStyle {
  fontSize: number;
  fontSizeUnit: string;
  fontFamily: string;
  fontColor: string;
  textAlign: string;
  verticalAlign: string;
  padding: { top: number; right: number; bottom: number; left: number };
}

function extractStyle(content: any): ContentStyle {
  const d: ContentStyle = {
    fontSize: 12, fontSizeUnit: 'px', fontFamily: 'helvetica',
    fontColor: '#000000', textAlign: 'left', verticalAlign: 'top',
    padding: { top: 2, right: 2, bottom: 2, left: 2 },
  };

  if (content.type === 'new-comp-trans' && content.newCompTransConfig) {
    const c = content.newCompTransConfig;
    d.fontSize = c.typography?.fontSize || 12;
    d.fontSizeUnit = c.typography?.fontSizeUnit || 'px';
    d.fontFamily = c.typography?.fontFamily || 'helvetica';
    d.fontColor = c.typography?.fontColor || '#000000';
    d.textAlign = c.alignment?.horizontal || 'left';
    d.verticalAlign = c.alignment?.vertical || 'top';
    d.padding = c.padding || d.padding;
  } else if (content.type === 'new-multi-line' && content.newMultiLineConfig) {
    const c = content.newMultiLineConfig;
    d.fontSize = c.typography?.fontSize || 12;
    d.fontSizeUnit = c.typography?.fontSizeUnit || 'px';
    d.fontFamily = c.typography?.fontFamily || 'helvetica';
    d.fontColor = c.typography?.fontColor || '#000000';
    d.textAlign = c.alignment?.horizontal || 'left';
    d.verticalAlign = c.alignment?.vertical || 'top';
    d.padding = c.padding || d.padding;
  } else if (content.type === 'new-line-text' && content.newLineTextConfig) {
    const c = content.newLineTextConfig;
    d.fontSize = c.typography?.fontSize || 12;
    d.fontSizeUnit = c.typography?.fontSizeUnit || 'px';
    d.fontFamily = c.typography?.fontFamily || 'helvetica';
    d.fontColor = c.typography?.fontColor || '#000000';
    d.textAlign = c.alignment?.horizontal || 'left';
    d.verticalAlign = c.alignment?.vertical || 'top';
    d.padding = c.padding || d.padding;
  } else if (content.type === 'new-washing-care-symbol' && content.newWashingCareSymbolConfig) {
    const c = content.newWashingCareSymbolConfig;
    d.fontSize = c.typography?.fontSize || 12;
    d.fontSizeUnit = c.typography?.fontSizeUnit || 'px';
    d.fontFamily = c.typography?.fontFamily || 'helvetica';
    d.fontColor = c.typography?.fontColor || '#000000';
    d.textAlign = c.alignment?.horizontal || 'left';
    d.verticalAlign = c.alignment?.vertical || 'top';
    d.padding = c.padding || d.padding;
  } else {
    const t = content.typography || {};
    const l = content.layout || {};
    d.fontSize = t.fontSize || 12;
    d.fontFamily = t.fontFamily || 'helvetica';
    d.fontColor = t.fontColor || '#000000';
    d.textAlign = l.horizontalAlign || 'left';
    d.verticalAlign = l.verticalAlign || 'top';
    d.padding = l.padding || d.padding;
  }
  return d;
}

function getContentText(content: any): string {
  if (content.type === 'new-comp-trans') {
    return content.newCompTransConfig?.textContent?.generatedText
        || content.content?.text || '';
  }
  if (content.type === 'new-multi-line') {
    return content.newMultiLineConfig?.textContent
        || content.content?.text || '';
  }
  if (content.type === 'new-line-text') {
    return content.newLineTextConfig?.textContent?.text
        || content.content?.text || '';
  }
  return content.content?.text || content.content?.primaryContent || '';
}

export function renderToPDF(
  layoutData: LayoutData,
  regionContents: RegionContentsMap,
  options: RenderOptions = {}
): jsPDF {
  const opts = { ...DEFAULT_OPTS, ...options };
  const rawMothers = layoutData.objects.filter((o: any) => o.type?.includes('mother'));

  // Expand mothers: detect overflow in comp-trans content and create child mothers
  const expandedMothers = expandMothersForOverflow(rawMothers, regionContents);
  const mothers = sortMothers(expandedMothers);

  if (mothers.length === 0) throw new Error('No mothers found');

  // Calculate total dimensions including dynamically created children
  let maxX = 0, maxY = 0;
  mothers.forEach((m: any) => {
    maxX = Math.max(maxX, m.x + m.width);
    maxY = Math.max(maxY, m.y + m.height);
  });

  const margin = opts.margin || 5;
  const totalW = maxX + margin * 2;
  const totalH = maxY + margin * 2;
  const paper = findPaperSize(totalW, totalH);

  const pdf = new jsPDF({ orientation: paper.orientation, unit: 'mm', format: paper.format, compress: false });

  // Center mothers horizontally on page
  const spacing = 5;
  let seqW = 0;
  mothers.forEach((m: any, i: number) => {
    seqW += m.width;
    if (i < mothers.length - 1) seqW += spacing;
  });

  let seqX = (paper.width - seqW) / 2;
  const baseY = Math.max(margin, (paper.height - maxY) / 2);

  mothers.forEach((mother: any) => {
    const mx = seqX;
    const my = baseY + mother.y;

    // Mother outline
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.setLineDashPattern([], 0);
    pdf.rect(mx, my, mother.width, mother.height);

    if (!opts.onlyPreview) {
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${mother.name}`, mx, my - 2);
    }

    const regions = mother.regions || [];
    regions.forEach((region: any) => {
      const renderRegions: { id: string; x: number; y: number; width: number; height: number; contents: any[] }[] = [];

      if (region.children && region.children.length > 0) {
        region.children.forEach((child: any) => {
          renderRegions.push({
            id: child.id,
            x: region.x + (child.x - region.x),
            y: region.y + (child.y - region.y),
            width: child.width,
            height: child.height,
            contents: child.contents || []
          });
        });
      } else {
        // Get content from regionContents map OR embedded region.contents[]
        const mapContents = regionContents[region.id] || [];
        const embeddedContents = region.contents || [];
        const contents = mapContents.length > 0 ? mapContents : embeddedContents;
        console.log(`📊 Render region ${region.id} (mother: ${mother.name}): map=${mapContents.length}, embedded=${embeddedContents.length}, using=${contents.length > 0 ? 'mapContents' : 'embeddedContents'}`);

        renderRegions.push({
          id: region.id,
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          contents
        });
      }

      renderRegions.forEach(rr => {
        const rx = mx + rr.x;
        const ry = my + rr.y;

        rr.contents.forEach((content: any) => {
          drawContentInPDF(pdf, content, rx, ry, rr.width, rr.height);
        });
      });
    });

    seqX += mother.width + spacing;
  });

  return pdf;
}

/**
 * Detect overflow in comp-trans content and create child mothers dynamically.
 * Mirrors the canvas behavior from App.tsx lines 8934-9180.
 */
function expandMothersForOverflow(mothers: any[], regionContents: RegionContentsMap): any[] {
  const result = [...mothers];

  mothers.forEach((mother: any) => {
    if (mother.isOverflowChild) return; // Skip existing child mothers

    // If this mother already has child mothers in the saved layout, skip overflow detection.
    // The saved child mothers already have the correct split text in their region.contents[].
    const existingChildren = result.filter((m: any) =>
      m.isOverflowChild && m.parentMotherId === mother.name
    );
    if (existingChildren.length > 0) {
      console.log(`📊 Mother ${mother.name} has ${existingChildren.length} existing child mothers: ${existingChildren.map((c: any) => c.name).join(', ')} — using saved layout`);
      return;
    }

    const regions = mother.regions || [];
    regions.forEach((region: any) => {
      // Get content for this region
      const mapContents = regionContents[region.id] || [];
      const embeddedContents = region.contents || [];
      const contents = mapContents.length > 0 ? mapContents : embeddedContents;

      contents.forEach((content: any) => {
        if (content.type !== 'new-comp-trans') return;

        const text = content.newCompTransConfig?.textContent?.generatedText
                  || content.content?.text || '';
        if (!text) return;

        // Calculate max lines that fit in this region (same math as App.tsx:8964-8990)
        const config = content.newCompTransConfig || {};
        const padding = config.padding || { top: 2, right: 2, bottom: 2, left: 2 };

        let fontSizePx = config.typography?.fontSize || 12;
        if (config.typography?.fontSizeUnit === 'mm') fontSizePx *= 3.779527559;
        else if (config.typography?.fontSizeUnit === 'pt') fontSizePx *= 4 / 3;

        const scaledFontSize = Math.max(6, fontSizePx);
        const scaledFontSizeMM = scaledFontSize / 3.779527559;
        const lineSpacing = config.lineBreakSettings?.lineSpacing || 1.2;
        const lineHeightMM = scaledFontSizeMM * lineSpacing;

        const textAreaH = region.height - padding.top - padding.bottom;
        const baselineOffsetMM = scaledFontSizeMM * 0.8;
        const safeH = Math.max(0, textAreaH - baselineOffsetMM);
        const maxLinesPerMother = Math.max(1, Math.floor(safeH / lineHeightMM));

        if (maxLinesPerMother <= 0) return;

        // Count actual lines
        const allLines = text.split('\n').filter((l: string) => l.trim());

        if (allLines.length <= maxLinesPerMother) return; // No overflow

        // Need child mothers
        const totalMothersNeeded = Math.ceil(allLines.length / maxLinesPerMother);
        console.log(`📊 Overflow: ${allLines.length} lines, max ${maxLinesPerMother}/mother, creating ${totalMothersNeeded - 1} child mothers`);

        // Split text across mothers
        const textSplits: string[] = [];
        let lineIdx = 0;
        for (let mi = 0; mi < totalMothersNeeded; mi++) {
          const isLast = mi === totalMothersNeeded - 1;
          const remaining = allLines.length - lineIdx;
          const take = isLast ? remaining : Math.min(maxLinesPerMother, remaining);
          textSplits.push(allLines.slice(lineIdx, lineIdx + take).join('\n'));
          lineIdx += take;
        }

        // Update parent content to only show first split
        if (content.newCompTransConfig?.textContent) {
          content.newCompTransConfig.textContent.generatedText = textSplits[0];
          content.newCompTransConfig.textContent.originalText = textSplits[0];
        }
        if (content.content) {
          content.content.text = textSplits[0];
        }

        // Create child mothers for remaining splits
        const spacing = 5;
        mother.childMotherIds = [];
        for (let ci = 1; ci < textSplits.length; ci++) {
          const childLetter = String.fromCharCode('A'.charCodeAt(0) + ci - 1);
          const childName = `${mother.name}${childLetter}`;

          let maxRightX = 0;
          result.forEach((m: any) => {
            maxRightX = Math.max(maxRightX, m.x + m.width);
          });

          const childRegions = JSON.parse(JSON.stringify(regions));
          childRegions.forEach((r: any) => {
            r.id = `${r.id}_copy_${childName}`;
            r.contents = [{
              ...JSON.parse(JSON.stringify(content)),
              id: `child_${Date.now()}_${ci}`,
              regionId: r.id,
              content: { ...content.content, text: textSplits[ci] },
              newCompTransConfig: {
                ...JSON.parse(JSON.stringify(config)),
                textContent: {
                  ...config.textContent,
                  generatedText: textSplits[ci],
                  originalText: textSplits[ci]
                }
              }
            }];
          });

          const childMother = {
            ...JSON.parse(JSON.stringify(mother)),
            name: childName,
            x: maxRightX + spacing,
            y: mother.y,
            regions: childRegions,
            parentMotherId: mother.name,
            isOverflowChild: true,
          };
          delete childMother.childMotherIds;

          result.push(childMother);
          mother.childMotherIds.push(childName);
          console.log(`📊 Created child mother: ${childName} with ${textSplits[ci].split('\n').length} lines`);
        }
      });
    });
  });

  return result;
}

function drawContentInPDF(
  pdf: jsPDF,
  content: any,
  rx: number,
  ry: number,
  regionW: number,
  regionH: number
): void {
  const text = getContentText(content);
  if (!text) return;

  const style = extractStyle(content);

  let fontSizePx = style.fontSize;
  if (style.fontSizeUnit === 'pt') fontSizePx = style.fontSize * 4 / 3;
  else if (style.fontSizeUnit === 'mm') fontSizePx = style.fontSize * 3.779527559;

  const scaledFontSize = Math.max(6, fontSizePx);
  const pdfFontSize = scaledFontSize * 0.75;
  const lineHeightMM = scaledFontSize * 1.2 * 0.264583;

  pdf.setFontSize(pdfFontSize);
  pdf.setFont(style.fontFamily === 'Arial' ? 'helvetica' : (style.fontFamily || 'helvetica'), 'normal');

  const color = hexToRgb(style.fontColor);
  pdf.setTextColor(color.r, color.g, color.b);

  const p = style.padding;
  const textAreaW = Math.max(0, regionW - p.left - p.right);
  const textAreaH = Math.max(0, regionH - p.top - p.bottom);

  const wrappedLines = text.split('\n');

  const fontSizeMM = pdfFontSize * 0.352778;
  const baselineOffsetMM = fontSizeMM * 0.8;
  const safeH = Math.max(0, textAreaH - baselineOffsetMM);
  const maxLines = Math.max(0, Math.floor(safeH / lineHeightMM));

  if (maxLines <= 0) return;

  const displayLines = wrappedLines.length > maxLines
    ? wrappedLines.slice(0, maxLines)
    : wrappedLines;

  let textX = rx + p.left;
  let align: 'left' | 'center' | 'right' = 'left';
  if (style.textAlign === 'center') { textX = rx + regionW / 2; align = 'center'; }
  else if (style.textAlign === 'right') { textX = rx + regionW - p.right; align = 'right'; }

  let startY = ry + p.top + fontSizeMM;
  if (style.verticalAlign === 'center') {
    const totalTextH = displayLines.length * lineHeightMM;
    startY = ry + p.top + (textAreaH - totalTextH) / 2 + fontSizeMM;
  } else if (style.verticalAlign === 'bottom') {
    const totalTextH = displayLines.length * lineHeightMM;
    startY = ry + regionH - p.bottom - totalTextH + fontSizeMM;
  }

  displayLines.forEach((line, i) => {
    if (!line.trim()) return;
    const splitLines = pdf.splitTextToSize(line, textAreaW);
    splitLines.forEach((sl: string, si: number) => {
      const ly = startY + i * lineHeightMM + si * lineHeightMM;
      if (ly < ry + regionH) {
        pdf.text(sl, textX, ly, { align });
      }
    });
  });
}

export function renderToSVG(
  layoutData: LayoutData,
  regionContents: RegionContentsMap,
  options: RenderOptions = {}
): string {
  const opts = { ...DEFAULT_OPTS, ...options };
  const rawMothers = layoutData.objects.filter((o: any) => o.type?.includes('mother'));

  // Expand mothers: detect overflow in comp-trans content and create child mothers
  const expandedMothers = expandMothersForOverflow(rawMothers, regionContents);
  const mothers = sortMothers(expandedMothers);

  if (mothers.length === 0) return '<svg xmlns="http://www.w3.org/2000/svg"><text x="50" y="50">No content</text></svg>';

  let maxX = 0, maxY = 0;
  mothers.forEach((m: any) => {
    maxX = Math.max(maxX, m.x + m.width);
    maxY = Math.max(maxY, m.y + m.height);
  });

  const margin = opts.margin || 5;
  const totalW = maxX + margin * 2;
  const totalH = maxY + margin * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}mm" height="${totalH}mm">`;

  mothers.forEach((mother: any) => {
    const mx = margin + mother.x;
    const my = margin + mother.y;

    svg += `<rect x="${mx}" y="${my}" width="${mother.width}" height="${mother.height}" fill="none" stroke="black" stroke-width="0.3"/>`;

    const regions = mother.regions || [];
    regions.forEach((region: any) => {
      const renderRegions: { id: string; x: number; y: number; width: number; height: number }[] = [];

      if (region.children && region.children.length > 0) {
        region.children.forEach((child: any) => {
          renderRegions.push({ id: child.id, x: region.x + (child.x - region.x), y: region.y + (child.y - region.y), width: child.width, height: child.height });
        });
      } else {
        renderRegions.push({ id: region.id, x: region.x, y: region.y, width: region.width, height: region.height });
      }

      renderRegions.forEach(rr => {
        const rx = mx + rr.x;
        const ry = my + rr.y;

        // Check both regionContents map and embedded region.contents[]
        const mapContents = regionContents[rr.id] || [];
        let embeddedContents: any[] = [];
        if (region.children) {
          const child = region.children.find((c: any) => c.id === rr.id);
          if (child?.contents) embeddedContents = child.contents;
        } else if (region.id === rr.id && region.contents) {
          embeddedContents = region.contents;
        }
        const contents = mapContents.length > 0 ? mapContents : embeddedContents;

        contents.forEach((content: any) => {
          const text = getContentText(content);
          if (!text) return;

          const style = extractStyle(content);
          const fontSizeMM = (style.fontSizeUnit === 'pt') ? style.fontSize * 0.352778
                           : (style.fontSizeUnit === 'mm') ? style.fontSize
                           : style.fontSize * 0.264583;
          const clampedSize = Math.max(1.5, fontSizeMM);

          const lines = text.split('\n');
          const pad = style.padding;
          const lineH = clampedSize * 1.2;
          let ly = ry + pad.top + clampedSize;
          const maxLy = ry + rr.height - pad.bottom;

          lines.forEach(line => {
            if (!line.trim() || ly > maxLy) return;
            const anchor = style.textAlign === 'center' ? 'middle'
                         : style.textAlign === 'right' ? 'end' : 'start';
            const lx = style.textAlign === 'center' ? rx + rr.width / 2
                     : style.textAlign === 'right' ? rx + rr.width - pad.right
                     : rx + pad.left;

            svg += `<text x="${lx}" y="${ly}" style="font-size:${clampedSize}mm;font-family:${style.fontFamily};fill:${style.fontColor};text-anchor:${anchor}">${escapeXml(line)}</text>`;
            ly += lineH;
          });
        });
      });
    });
  });

  svg += '</svg>';
  return svg;
}

export async function renderToImage(
  layoutData: LayoutData,
  regionContents: RegionContentsMap,
  options: RenderOptions = {}
): Promise<string> {
  const svgString = renderToSVG(layoutData, regionContents, { ...options, onlyPreview: true });

  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const scale = 3;
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context failed')); return; }
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load failed')); };
    img.src = url;
  });
}

export const artworkRenderer = { renderToSVG, renderToPDF, renderToImage };
export default artworkRenderer;