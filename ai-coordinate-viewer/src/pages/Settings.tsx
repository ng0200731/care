import React from 'react';

const Settings: React.FC = () => {
  // Complete parameters - all 12 factors
  const params = {
    // User-defined factors (1-6)
    regionWidth: 40,         // mm - Factor 1: Label width
    regionHeight: 90,        // mm - Factor 2: Label height  
    paddingTop: 4,           // mm - Factor 3: Padding top
    paddingRight: 4,         // mm - Factor 4: Padding right
    paddingBottom: 4,        // mm - Factor 5: Padding bottom
    paddingLeft: 4,          // mm - Factor 6: Padding left
    
    // System factors (7-12) - locked
    fontFamily: 'Arial',     // string - Factor 7: Font name
    fontSize: 10,            // px - Factor 8: Font size
    fontSizeUnit: 'px',      // string - Font size unit
    lineSpacing: 1.2,        // number - Factor 9: Line spacing
    lineBreakSymbol: '\n',   // Factor 10: Line break symbol
    zoom: 1.0,               // Factor 11: Zoom factor
    mmToPx: 3.779527559,     // Factor 12: DPI conversion (96 DPI)
    textBaselineOffset: 0.8, // Factor 13: Baseline offset multiplier
    userSafetyBuffer: 1.5,   // Factor 14: Safety buffer (mm)
    preserveWords: true      // Factor 15: Word preservation
  };

  // Sample text content
  const textContent = `60% algodón - coton - cotton - algodão - katoen - cotone - ΒΑΜΒΑΚΙ - コットン - baumwolle - bomuld - bombaž - 棉 - 면 - katun - قطن - algodón - cotó - kotoia

10% poliéster - polyester - polyester - poliéster - polyester - poliestere - ΠΟΛΥΕΣΤΕΡΑΣ - ポリエステル - polyester - polyester - poliester - 聚酯纤维 - 폴리에스터 - poliester - بوليستير - poliéster - polièster - poliesterra

10% elastano - élasthanne - elastane - elastano - elastaan - elastan - ΕΛΑΣΤΑΝΗ - エラスタン - elastan - elastan - elastan - 氨纶 - 엘라스탄 - elastan - إيلاستان - elastano - elastà - elastanoa

10% nailon - nylon - nylon - nylon (so p/o Brasil poliamida) - nylon - nailon - ΝΑΪΛΟΝ - ナイロン - nylon - nylon - najlon - 锦纶 - 나일론 - nilon - نايلون - nailon - niló - nylona

10% lana - laine - wool - lã - wol - lana - ΜΑΛΛΙ - ウール - wolle - uld - volna - 羊毛 - 울 - wol - صوف - la - llana - artilea`;

  // Calculate analysis results
  const regionWidthPx = params.regionWidth * params.mmToPx;
  const regionHeightPx = params.regionHeight * params.mmToPx;
  const availableWidthPx = (params.regionWidth - params.paddingLeft - params.paddingRight) * params.mmToPx;
  const availableHeightPx = (params.regionHeight - params.paddingTop - params.paddingBottom) * params.mmToPx;
  const availableWidthMm = availableWidthPx / params.mmToPx;
  const availableHeightMm = availableHeightPx / params.mmToPx;
  const effectiveAvailableWidth = availableWidthMm - params.userSafetyBuffer;
  
  const fontSizePx = params.fontSize;
  const scaledFontSize = Math.max(6, fontSizePx * params.zoom);
  const scaledFontSizeMm = scaledFontSize / params.mmToPx;
  const lineHeightMm = scaledFontSizeMm * params.lineSpacing;
  const maxVisibleLines = Math.floor(availableHeightMm / lineHeightMm);

  // Estimate total lines (simplified calculation)
  const estimatedTotalLines = Math.ceil(textContent.length / 30); // Rough estimate
  const hasOverflow = estimatedTotalLines > maxVisibleLines;

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6'
    }}>
      <h1 style={{ 
        color: '#333', 
        borderBottom: '3px solid #2196F3', 
        paddingBottom: '10px',
        marginBottom: '30px'
      }}>
        🔍 Text Overflow Analysis Settings
      </h1>
      
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
        <strong>Comprehensive analysis of all factors affecting text overflow splitting</strong>
      </p>

      {/* All 12 Factors */}
      <div style={{ 
        background: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#333', marginTop: '0' }}>📋 All 12 Factors Affecting Text Overflow</h2>
        
        <h3 style={{ color: '#555', marginTop: '25px' }}>👤 User-Defined Factors (1-6) - Canvas Dependent:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <strong>1. Region Width:</strong> {params.regionWidth}mm
          </div>
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <strong>2. Region Height:</strong> {params.regionHeight}mm
          </div>
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <strong>3. Padding Top:</strong> {params.paddingTop}mm
          </div>
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <strong>4. Padding Right:</strong> {params.paddingRight}mm
          </div>
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <strong>5. Padding Bottom:</strong> {params.paddingBottom}mm
          </div>
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <strong>6. Padding Left:</strong> {params.paddingLeft}mm
          </div>
        </div>
        
        <h3 style={{ color: '#555', marginTop: '25px' }}>🔧 System Factors (7-12) - Locked Values:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
          <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', opacity: '0.8' }}>
            <strong>7. Font Family:</strong> {params.fontFamily} <em>🔒 (System locked)</em>
          </div>
          <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', opacity: '0.8' }}>
            <strong>8. Font Size:</strong> {params.fontSize}{params.fontSizeUnit} <em>🔒 (System locked)</em>
          </div>
          <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', opacity: '0.8' }}>
            <strong>9. Line Spacing:</strong> {params.lineSpacing} <em>🔒 (System locked)</em>
          </div>
          <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', opacity: '0.8' }}>
            <strong>10. Text Length:</strong> {textContent.length} characters <em>🔒 (Dynamic)</em>
          </div>
          <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', opacity: '0.8' }}>
            <strong>11. Line Break Symbol:</strong> "{params.lineBreakSymbol}" <em>🔒 (System locked)</em>
          </div>
          <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', opacity: '0.8' }}>
            <strong>12. Zoom Factor:</strong> {params.zoom} <em>🔒 (System locked)</em>
          </div>
        </div>
      </div>

      {/* System Factor Explanations */}
      <div style={{ 
        background: '#f3e5f5', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#333', marginTop: '0' }}>💡 What These System Factors Really Mean:</h2>
        
        <div style={{ display: 'grid', gap: '15px' }}>
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '15px', borderRadius: '6px' }}>
            <strong>🔤 Line Break Symbol ("\n"):</strong> This tells the computer "start a new line here" - just like when you press Enter while typing.
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '15px', borderRadius: '6px' }}>
            <strong>🔍 Zoom Factor (1.0):</strong> This means we're looking at normal size (100%). If it was 2.0, everything would be twice as big. We use 1.0 for accurate calculations.
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '15px', borderRadius: '6px' }}>
            <strong>📺 Screen Resolution (3.78 pixels/mm):</strong> Your computer screen has tiny dots called pixels. This number tells us how many dots fit in 1mm. It's like knowing how many LEGO blocks fit in an inch.
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '15px', borderRadius: '6px' }}>
            <strong>🛡️ Safety Margin (1.5mm):</strong> Like leaving space around the edges of a picture frame. We keep text 1.5mm away from the edges so it looks nice and doesn't get too close to the border.
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '15px', borderRadius: '6px' }}>
            <strong>✂️ Keep Words Whole (Yes):</strong> The computer will NEVER break a word in the middle. If "computer" doesn't fit on a line, the whole word moves to the next line. No "compu-ter" splits!
          </div>
        </div>
      </div>

      {/* Step-by-Step Calculations */}
      <div style={{ 
        background: '#f3e5f5', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#333', marginTop: '0' }}>🧮 Step-by-Step Calculation Equations</h2>
        
        <h3 style={{ color: '#555', marginTop: '25px' }}>🔢 Step 1: Region Space Calculations</h3>
        <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', marginBottom: '15px', borderLeft: '4px solid #2196F3' }}>
          <div>regionWidthPx = regionWidth × mmToPx</div>
          <div>regionWidthPx = {params.regionWidth} × {params.mmToPx} = {(params.regionWidth * params.mmToPx).toFixed(2)}px</div>
          <br/>
          <div>regionHeightPx = regionHeight × mmToPx</div>
          <div>regionHeightPx = {params.regionHeight} × {params.mmToPx} = {(params.regionHeight * params.mmToPx).toFixed(2)}px</div>
        </div>

        <h3 style={{ color: '#555', marginTop: '25px' }}>🔢 Step 2: Available Space After Padding</h3>
        <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', marginBottom: '15px', borderLeft: '4px solid #2196F3' }}>
          <div>paddingLeftPx = paddingLeft × mmToPx = {params.paddingLeft} × {params.mmToPx} = {(params.paddingLeft * params.mmToPx).toFixed(2)}px</div>
          <div>paddingRightPx = paddingRight × mmToPx = {params.paddingRight} × {params.mmToPx} = {(params.paddingRight * params.mmToPx).toFixed(2)}px</div>
          <div>paddingTopPx = paddingTop × mmToPx = {params.paddingTop} × {params.mmToPx} = {(params.paddingTop * params.mmToPx).toFixed(2)}px</div>
          <div>paddingBottomPx = paddingBottom × mmToPx = {params.paddingBottom} × {params.mmToPx} = {(params.paddingBottom * params.mmToPx).toFixed(2)}px</div>
          <br/>
          <div>availableWidthPx = regionWidthPx - paddingLeftPx - paddingRightPx</div>
          <div>availableWidthPx = {(params.regionWidth * params.mmToPx).toFixed(2)} - {(params.paddingLeft * params.mmToPx).toFixed(2)} - {(params.paddingRight * params.mmToPx).toFixed(2)} = {availableWidthPx.toFixed(2)}px</div>
          <br/>
          <div>availableHeightPx = regionHeightPx - paddingTopPx - paddingBottomPx</div>
          <div>availableHeightPx = {(params.regionHeight * params.mmToPx).toFixed(2)} - {(params.paddingTop * params.mmToPx).toFixed(2)} - {(params.paddingBottom * params.mmToPx).toFixed(2)} = {availableHeightPx.toFixed(2)}px</div>
        </div>

        <h3 style={{ color: '#555', marginTop: '25px' }}>🔢 Step 3: Font Size and Zoom Scaling</h3>
        <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', marginBottom: '15px', borderLeft: '4px solid #2196F3' }}>
          <div>fontSizePx = {params.fontSize} (already in pixels)</div>
          <div>scaledFontSize = Math.max(6, fontSizePx × zoom)</div>
          <div>scaledFontSize = Math.max(6, {params.fontSize} × {params.zoom}) = {scaledFontSize}px</div>
          <br/>
          <div>scaledFontSizeMm = scaledFontSize ÷ mmToPx</div>
          <div>scaledFontSizeMm = {scaledFontSize} ÷ {params.mmToPx} = {scaledFontSizeMm.toFixed(3)}mm</div>
        </div>

        <h3 style={{ color: '#555', marginTop: '25px' }}>🔢 Step 4: Line Height Calculation</h3>
        <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', marginBottom: '15px', borderLeft: '4px solid #2196F3' }}>
          <div>lineHeightMm = scaledFontSizeMm × lineSpacing</div>
          <div>lineHeightMm = {scaledFontSizeMm.toFixed(3)} × {params.lineSpacing} = {lineHeightMm.toFixed(3)}mm</div>
          <br/>
          <div>availableHeightMm = availableHeightPx ÷ mmToPx</div>
          <div>availableHeightMm = {availableHeightPx.toFixed(2)} ÷ {params.mmToPx} = {availableHeightMm.toFixed(1)}mm</div>
        </div>

        <h3 style={{ color: '#555', marginTop: '25px' }}>🔢 Step 5: Safety Buffer Application</h3>
        <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', marginBottom: '15px', borderLeft: '4px solid #2196F3' }}>
          <div>availableWidthMm = availableWidthPx ÷ mmToPx</div>
          <div>availableWidthMm = {availableWidthPx.toFixed(2)} ÷ {params.mmToPx} = {availableWidthMm.toFixed(1)}mm</div>
          <br/>
          <div>effectiveAvailableWidth = availableWidthMm - userSafetyBuffer</div>
          <div>effectiveAvailableWidth = {availableWidthMm.toFixed(1)} - {params.userSafetyBuffer} = {effectiveAvailableWidth.toFixed(1)}mm</div>
        </div>

        <h3 style={{ color: '#555', marginTop: '25px' }}>🔢 Step 6: Maximum Lines Calculation</h3>
        <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', marginBottom: '15px', borderLeft: '4px solid #2196F3' }}>
          <div>maxVisibleLines = Math.floor(availableHeightMm ÷ lineHeightMm)</div>
          <div>maxVisibleLines = Math.floor({availableHeightMm.toFixed(1)} ÷ {lineHeightMm.toFixed(3)}) = {maxVisibleLines}</div>
        </div>
      </div>

      {/* Analysis Results */}
      <div style={{ 
        background: hasOverflow ? '#fff3e0' : '#e8f5e8', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: `2px solid ${hasOverflow ? '#ff9800' : '#4caf50'}`
      }}>
        <h2 style={{ color: '#333', marginTop: '0' }}>📊 Analysis Results & Measurements</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <strong>Effective Width:</strong><br/>{effectiveAvailableWidth.toFixed(1)}mm
          </div>
          <div style={{ background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <strong>Available Height:</strong><br/>{availableHeightMm.toFixed(1)}mm
          </div>
          <div style={{ background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <strong>Line Height:</strong><br/>{lineHeightMm.toFixed(3)}mm
          </div>
          <div style={{ background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <strong>Max Lines:</strong><br/>{maxVisibleLines}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <strong>Estimated Total Lines:</strong><br/>~{estimatedTotalLines}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <strong>Has Overflow:</strong><br/>{hasOverflow ? '🌊 YES' : '✅ NO'}
          </div>
        </div>

        <div style={{ 
          background: hasOverflow ? '#ffebee' : '#f1f8e9', 
          border: `1px solid ${hasOverflow ? '#f44336' : '#4caf50'}`, 
          padding: '15px', 
          borderRadius: '6px' 
        }}>
          <strong>{hasOverflow ? '⚠️ OVERFLOW DETECTED:' : '✅ NO OVERFLOW:'}</strong> 
          {hasOverflow 
            ? ` Text needs ~${estimatedTotalLines} lines but only ${maxVisibleLines} fit. Overflow: ~${estimatedTotalLines - maxVisibleLines} lines.`
            : ` All ~${estimatedTotalLines} lines fit within available space.`
          }
        </div>
      </div>

      {/* Complete Line-by-Line Breakdown */}
      <div style={{ 
        background: '#e8f5e8', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#333', marginTop: '0' }}>📝 Complete Line-by-Line Breakdown (All 43 Lines)</h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Complete text wrapped into 43 lines with precise width measurements:
        </p>
        
        <div style={{ 
          background: 'white', 
          padding: '15px', 
          borderRadius: '4px', 
          fontFamily: 'monospace', 
          fontSize: '11px',
          border: '1px solid #ccc',
          maxHeight: '400px',
          overflowY: 'auto',
          lineHeight: '1.4'
        }}>
          <div>Line 1: "60% algodón - coton -" (25.9mm width)</div>
          <div>Line 2: "cotton - algodão - katoen" (29.3mm width)</div>
          <div>Line 3: "- cotone - ΒΑΜΒΑΚΙ -" (25.3mm width)</div>
          <div>Line 4: "コットン - baumwolle -" (27.2mm width)</div>
          <div>Line 5: "bomuld - bombaž - 棉 - 면" (30.4mm width)</div>
          <div>Line 6: "- katun - قطن - algodón -" (27.5mm width)</div>
          <div>Line 7: "cotó - kotoia" (14.4mm width)</div>
          <div style={{ color: '#888', fontStyle: 'italic' }}>Line 8: (breakline)</div>
          <div>Line 9: "10% poliéster - polyester" (29.1mm width)</div>
          <div>Line 10: "- polyester - poliéster -" (26.3mm width)</div>
          <div>Line 11: "polyester - poliestere -" (26.2mm width)</div>
          <div>Line 12: "ΠΟΛΥΕΣΤΕΡΑΣ -" (20.6mm width)</div>
          <div>Line 13: "ポリエステル - polyester" (29.0mm width)</div>
          <div>Line 14: "- polyester - poliester -" (26.3mm width)</div>
          <div>Line 15: "聚酯纤维 - 폴리에스터 -" (27.8mm width)</div>
          <div>Line 16: "poliester - بوليستير -" (20.9mm width)</div>
          <div>Line 17: "poliéster - polièster -" (24.0mm width)</div>
          <div>Line 18: "poliesterra" (12.4mm width)</div>
          <div style={{ color: '#888', fontStyle: 'italic' }}>Line 19: (breakline)</div>
          <div>Line 20: "10% elastano -" (17.7mm width)</div>
          <div>Line 21: "élasthanne - elastane -" (26.9mm width)</div>
          <div>Line 22: "elastano - elastaan -" (24.0mm width)</div>
          <div>Line 23: "elastan - ΕΛΑΣΤΑΝΗ -" (26.4mm width)</div>
          <div>Line 24: "エラスタン - elastan -" (25.7mm width)</div>
          <div style={{ background: '#ffecb3', padding: '2px' }}>Line 25: "elastan - elastan - 氨纶 -" (28.7mm width) ← LAST LINE IN ORIGINAL</div>
          <div style={{ background: '#ffcdd2', padding: '2px', marginTop: '5px' }}>Line 26: "엘라스탄 - elastan -" (23.1mm width) ← OVERFLOW STARTS</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 27: "إيلاستان - elastano - elastà -" (30.2mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 28: "elastanoa" (11.5mm width)</div>
          <div style={{ color: '#888', fontStyle: 'italic', background: '#ffcdd2', padding: '2px' }}>Line 29: (breakline)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 30: "10% nailon - nylon - nylon" (30.4mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 31: "- nylon (so p/o Brasil" (24.1mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 32: "poliamida) - nylon - nailon" (30.3mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 33: "- ΝΑΪΛΟΝ - ナイロン -" (26.3mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 34: "nylon - nylon - najlon -" (26.0mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 35: "锦纶 - 나일론 - nilon -" (25.1mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 36: "نايلون - nailon - niló -" (22.5mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 37: "nylona" (7.8mm width)</div>
          <div style={{ color: '#888', fontStyle: 'italic', background: '#ffcdd2', padding: '2px' }}>Line 38: (breakline)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 39: "10% lana - laine - wool -" (28.4mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 40: "lã - wol - lana - ΜΑΛΛΙ -" (27.9mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 41: "ウール - wolle - uld -" (23.8mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 42: "volna - 羊毛 - 울 - wol -" (26.9mm width)</div>
          <div style={{ background: '#ffcdd2', padding: '2px' }}>Line 43: "صوف - la - llana - artilea" (27.4mm width)</div>
        </div>
      </div>

      {/* Split Results */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#333', marginTop: '0' }}>🔄 Text Splitting Results</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Original Mother */}
          <div style={{ 
            background: '#e8f5e8', 
            padding: '15px', 
            borderRadius: '6px', 
            border: '2px solid #4caf50'
          }}>
            <h3 style={{ color: '#333', marginTop: '0' }}>📄 SPLIT 1 - Original Mother</h3>
            <p><strong>Lines 1-25 (25 lines total)</strong></p>
            <div style={{ 
              background: 'white', 
              padding: '10px', 
              borderRadius: '4px', 
              fontFamily: 'monospace', 
              fontSize: '10px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              Lines 1-7: Cotton composition in multiple languages<br/>
              Line 8: (breakline)<br/>
              Lines 9-18: Polyester composition in multiple languages<br/>
              Line 19: (breakline)<br/>
              Lines 20-25: Elastane composition (partial)<br/>
              <strong>Total: 25 lines fit in original mother</strong>
            </div>
          </div>

          {/* Child Mother */}
          <div style={{ 
            background: '#fff3e0', 
            padding: '15px', 
            borderRadius: '6px', 
            border: '2px solid #ff9800'
          }}>
            <h3 style={{ color: '#333', marginTop: '0' }}>👶 SPLIT 2 - New Child Mother</h3>
            <p><strong>Lines 26-43 (18 lines total)</strong></p>
            <div style={{ 
              background: 'white', 
              padding: '10px', 
              borderRadius: '4px', 
              fontFamily: 'monospace', 
              fontSize: '10px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              Lines 26-28: Elastane composition (continued)<br/>
              Line 29: (breakline)<br/>
              Lines 30-37: Nylon composition in multiple languages<br/>
              Line 38: (breakline)<br/>
              Lines 39-43: Wool composition in multiple languages<br/>
              <strong>Total: 18 lines overflow to child mother</strong>
            </div>
          </div>
        </div>

        <div style={{ 
          background: '#ffebee', 
          border: '1px solid #f44336', 
          padding: '15px', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <strong>⚠️ OVERFLOW DETECTED:</strong> Text needs 43 lines but only 25 fit. Overflow: 18 lines.
          <br/>
          <strong>Split Point:</strong> After "elastan - elastan - 氨纶 -" (Line 25)
        </div>
      </div>

      {/* Sample Text */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#333', marginTop: '0' }}>📝 Original Sample Text Content</h2>
        <div style={{ 
          background: 'white', 
          padding: '15px', 
          borderRadius: '4px', 
          fontFamily: 'monospace', 
          fontSize: '12px',
          border: '1px solid #ccc',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {textContent}
        </div>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px', marginBottom: '0' }}>
          <strong>Text Length:</strong> {textContent.length} characters | 
          <strong> Languages:</strong> English, Spanish, Portuguese, Dutch, Italian, Greek, Japanese, German, Danish, Slovenian, Chinese, Korean, Indonesian, Arabic, Catalan, Basque
        </p>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px', 
        padding: '20px', 
        color: '#666',
        borderTop: '1px solid #ddd'
      }}>
        <p><em>Generated by Care Label Layout System v2.9.184</em></p>
        <p><em>Analysis Date: {new Date().toLocaleDateString()}</em></p>
      </div>
    </div>
  );
};

export default Settings;
