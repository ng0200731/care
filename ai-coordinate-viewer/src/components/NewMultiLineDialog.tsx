import React, { useState, useEffect } from 'react';

interface NewMultiLineDialogProps {
  isOpen: boolean;
  regionId: string;
  regionWidth: number;
  regionHeight: number;
  onSave: (config: NewMultiLineConfig) => void;
  onCancel: () => void;
  editingContent?: any;
}

export interface NewMultiLineConfig {
  padding: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    fontSizeUnit: 'px' | 'pt' | 'mm';
  };
  alignment: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
  textContent: string;
  lineBreak: {
    symbol: string;
    lineSpacing: number;
    lineWidth: number;
  };
  processedLines?: string[]; // Exact lines from preview for canvas to use
}

const NewMultiLineDialog: React.FC<NewMultiLineDialogProps> = ({
  isOpen,
  regionId,
  regionWidth,
  regionHeight,
  onSave,
  onCancel,
  editingContent
}) => {
  // Initialize config based on editing content or defaults
  const getInitialConfig = (): NewMultiLineConfig => {
    if (editingContent && editingContent.newMultiLineConfig) {
      return editingContent.newMultiLineConfig;
    } else if (editingContent) {
      // Convert from existing content structure
      return {
        padding: editingContent.layout?.padding || { left: 2, top: 2, right: 2, bottom: 2 },
        typography: {
          fontFamily: editingContent.typography?.fontFamily || 'Arial',
          fontSize: editingContent.typography?.fontSize || 14,
          fontSizeUnit: editingContent.typography?.fontSizeUnit || 'px'
        },
        alignment: {
          horizontal: editingContent.layout?.horizontalAlign || 'center',
          vertical: editingContent.layout?.verticalAlign || 'center'
        },
        textContent: editingContent.content?.text || 'multiple line',
        lineBreak: {
          symbol: '\\n',
          lineSpacing: 1.2,
          lineWidth: 100
        }
      };
    } else {
      // Default values for new content
      return {
        padding: { left: 2, top: 2, right: 2, bottom: 2 },
        typography: { fontFamily: 'Arial', fontSize: 14, fontSizeUnit: 'px' },
        alignment: { horizontal: 'center', vertical: 'center' },
        textContent: 'multiple line',
        lineBreak: {
          symbol: '\\n',
          lineSpacing: 1.2,
          lineWidth: 100
        }
      };
    }
  };

  const [config, setConfig] = useState<NewMultiLineConfig>(getInitialConfig());
  
  // State for "For all size" padding sync
  const [syncAllPadding, setSyncAllPadding] = useState(false);

  // Update config when editing content changes
  useEffect(() => {
    setConfig(getInitialConfig());
  }, [editingContent]);

  // Handle synchronized padding changes
  const handlePaddingChange = (side: 'left' | 'top' | 'right' | 'bottom', value: number) => {
    if (syncAllPadding) {
      // Update all sides with the same value
      setConfig(prev => ({
        ...prev,
        padding: {
          left: value,
          top: value,
          right: value,
          bottom: value
        }
      }));
    } else {
      // Update only the specific side
      setConfig(prev => ({
        ...prev,
        padding: { ...prev.padding, [side]: value }
      }));
    }
  };

  // Font options
  const fontOptions = [
    'Arial',
    'Times New Roman',
    'Helvetica',
    'Calibri',
    'Verdana',
    'Georgia',
    'Trebuchet MS',
    'Comic Sans MS'
  ];

  // Line break symbol options
  const lineBreakSymbols = [
    { value: '\\n', label: '\\n (Standard)' },
    { value: '<br>', label: '<br> (HTML)' },
    { value: '|', label: '| (Pipe)' },
    { value: '/', label: '/ (Slash)' },
    { value: '\\', label: '\\ (Backslash)' }
  ];

  // Calculate available width for text (use full width after padding for wrapping calculation)
  const paddingAdjustedWidth = regionWidth - config.padding.left - config.padding.right;
  const availableWidth = paddingAdjustedWidth; // Use full width for text wrapping calculation

  // More accurate text width estimation using canvas measurement (same as line text)
  const estimateTextWidth = (text: string, fontSize: number, fontSizeUnit: string, fontFamily: string): number => {
    // Create a temporary canvas for accurate text measurement
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return text.length * 2; // Fallback

    // Convert font size to pixels for canvas measurement
    let fontSizeInPixels = fontSize;
    if (fontSizeUnit === 'pt') {
      fontSizeInPixels = fontSize * 4/3; // 1 point = 4/3 pixels
    } else if (fontSizeUnit === 'mm') {
      fontSizeInPixels = fontSize * 3.779527559; // 1 mm = ~3.78 pixels at 96 DPI
    }

    // Debug font conversion for Arial 6pt
    if (fontSize === 6 && fontSizeUnit === 'pt' && fontFamily === 'Arial') {
      console.log('🔍 Font conversion for Arial 6pt:', {
        originalSize: fontSize + fontSizeUnit,
        convertedPixels: fontSizeInPixels + 'px',
        expectedPixels: '8px (6 * 4/3)'
      });
    }

    // Set font for measurement
    context.font = `${fontSizeInPixels}px ${fontFamily}`;

    // Measure text width in pixels
    const textWidthPx = context.measureText(text).width;

    // Convert pixels to mm (96 DPI standard)
    const textWidthMm = textWidthPx / 3.779527559;

    // Apply a more aggressive optimization factor to maximize space utilization
    // Canvas measurement tends to be significantly more conservative than actual SVG rendering
    const optimizationFactor = 0.85; // Use 85% of measured width for much more aggressive fitting
    const optimizedWidth = textWidthMm * optimizationFactor;

    console.log(`📏 Text measurement: "${text}" | Raw: ${textWidthMm.toFixed(2)}mm | Optimized: ${optimizedWidth.toFixed(2)}mm`);

    return optimizedWidth;
  };

  // Intelligent word wrapping - whole words move to next line
  const wrapTextToLines = (text: string): string[] => {
    console.log('🔍 Input text analysis:', {
      originalText: JSON.stringify(text),
      lineBreakSymbol: JSON.stringify(config.lineBreak.symbol),
      containsActualNewlines: text.includes('\n'),
      containsSymbol: text.includes(config.lineBreak.symbol)
    });

    // First split by manual line break symbols
    // Handle both actual newlines and the configured symbol
    let manualLines: string[];
    if (config.lineBreak.symbol === '\\n' || config.lineBreak.symbol === '\n') {
      // For newline symbols, split by actual newlines
      manualLines = text.split('\n');
    } else {
      // For other symbols, split by the symbol
      manualLines = text.split(config.lineBreak.symbol);
    }

    console.log('🔍 Manual lines after split:', manualLines);
    const wrappedLines: string[] = [];

    manualLines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        wrappedLines.push(''); // Preserve empty lines
        return;
      }

      // Check if the entire line fits (with aggressive fitting buffer)
      const lineWidth = estimateTextWidth(
        trimmedLine,
        config.typography.fontSize,
        config.typography.fontSizeUnit,
        config.typography.fontFamily
      );

      const fittingBuffer = 1.0; // 1.0mm buffer for much more aggressive text fitting
      const effectiveAvailableWidth = availableWidth + fittingBuffer;

      if (lineWidth <= effectiveAvailableWidth) {
        // Line fits completely
        wrappedLines.push(trimmedLine);
        return;
      }

      // Line is too long, need to wrap words
      const words = trimmedLine.split(' ');
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;

        const testWidth = estimateTextWidth(
          testLine,
          config.typography.fontSize,
          config.typography.fontSizeUnit,
          config.typography.fontFamily
        );

        // Add a larger buffer to available width for much more aggressive fitting
        const fittingBuffer = 1.0; // 1.0mm buffer for much more aggressive text fitting
        const effectiveAvailableWidth = availableWidth + fittingBuffer;

        console.log(`🔍 Testing: "${testLine}" | Width: ${testWidth.toFixed(2)}mm | Available: ${availableWidth.toFixed(2)}mm | Effective: ${effectiveAvailableWidth.toFixed(2)}mm | Fits: ${testWidth <= effectiveAvailableWidth}`);

        if (testWidth <= effectiveAvailableWidth) {
          // Word fits on current line
          currentLine = testLine;
        } else {
          // Word doesn't fit, start new line
          if (currentLine) {
            // Push current line and start new line with the word that didn't fit
            wrappedLines.push(currentLine);
            const lineWidth = estimateTextWidth(currentLine, config.typography.fontSize, config.typography.fontSizeUnit, config.typography.fontFamily);
            console.log(`📄 Line complete: "${currentLine}" | Length: ${currentLine.length} chars | Width: ${lineWidth.toFixed(2)}mm | Available: ${availableWidth.toFixed(2)}mm | Usage: ${((lineWidth/availableWidth)*100).toFixed(1)}%`);
            currentLine = word;
            console.log(`📄 Word wrap: "${word}" moved to new line (would exceed ${availableWidth.toFixed(1)}mm)`);
          } else {
            // Single word is too long for available width, but we never break words
            // Add it anyway to preserve word integrity
            wrappedLines.push(word);
            console.log(`⚠️ Long word: "${word}" exceeds available width but kept whole`);
          }
        }
      }

      // Add the last line if it has content
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    });

    return wrappedLines;
  };

  // Process text with intelligent word wrapping for preview
  const processTextForPreview = (text: string): string[] => {
    // Test specific phrases to verify calculations
    const testPhrase = "EN Wash with similar colors";
    const testWidth = estimateTextWidth(testPhrase, config.typography.fontSize, config.typography.fontSizeUnit, config.typography.fontFamily);

    console.log('🧪 EXACT TEST for your phrase:', {
      testPhrase: testPhrase,
      calculatedWidth: testWidth.toFixed(2) + 'mm',
      availableWidth: availableWidth.toFixed(2) + 'mm',
      shouldFitOnOneLine: testWidth <= availableWidth,
      widthUsagePercentage: ((testWidth / availableWidth) * 100).toFixed(1) + '%'
    });

    const wrappedLines = wrapTextToLines(text);

    // Debug logging for word wrapping with detailed measurements
    console.log('📏 DETAILED MEASUREMENTS:');
    console.log('  Label Width (Region):', regionWidth.toFixed(2) + 'mm');
    console.log('  Padding Left:', config.padding.left.toFixed(2) + 'mm');
    console.log('  Padding Right:', config.padding.right.toFixed(2) + 'mm');
    console.log('  Total Padding:', (config.padding.left + config.padding.right).toFixed(2) + 'mm');
    console.log('  Width after Padding:', (regionWidth - config.padding.left - config.padding.right).toFixed(2) + 'mm');
    console.log('  Line Width % (for reference):', config.lineBreak.lineWidth + '%');
    console.log('  Available Width for Text (full width after padding):', availableWidth.toFixed(2) + 'mm');
    console.log('  Effective Width with Aggressive Fitting (+1.0mm buffer):', (availableWidth + 1.0).toFixed(2) + 'mm');
    console.log('  Font:', `${config.typography.fontSize}${config.typography.fontSizeUnit} ${config.typography.fontFamily}`);

    console.log('📄 EACH LINE MEASUREMENTS:');
    wrappedLines.forEach((line, index) => {
      const lineWidth = estimateTextWidth(line, config.typography.fontSize, config.typography.fontSizeUnit, config.typography.fontFamily);
      const usage = ((lineWidth / availableWidth) * 100);
      console.log(`  Line ${index + 1}: "${line}"`);
      console.log(`    Width: ${lineWidth.toFixed(2)}mm | Available: ${availableWidth.toFixed(2)}mm | Usage: ${usage.toFixed(1)}%`);
    });

    console.log('📄 SUMMARY:', {
      totalLines: wrappedLines.length,
      averageUsage: (wrappedLines.reduce((sum, line) => {
        const lineWidth = estimateTextWidth(line, config.typography.fontSize, config.typography.fontSizeUnit, config.typography.fontFamily);
        return sum + (lineWidth / availableWidth);
      }, 0) / wrappedLines.length * 100).toFixed(1) + '%'
    });

    return wrappedLines;
  };

  const handleSave = () => {
    // Generate the exact wrapped lines that the preview shows
    const wrappedLines = processTextForPreview(config.textContent);

    // Add the processed lines to the config so canvas can use them directly
    const configWithProcessedLines = {
      ...config,
      processedLines: wrappedLines // Store exact preview lines for canvas
    };

    console.log('💾 Saving multi-line config with processed lines:', {
      originalText: config.textContent,
      processedLines: wrappedLines,
      totalLines: wrappedLines.length
    });

    onSave(configWithProcessedLines);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        minWidth: '600px',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '16px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '24px' }}>📄</span>
            Configure Multi-line Text
          </h2>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: '#718096'
          }}>
            Region: {regionId} ({regionWidth}×{regionHeight}mm)
          </p>
        </div>

        {/* Padding Controls */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: '#2d3748'
            }}>
              Padding (mm) <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 'normal' }}>• Green dotted lines in canvas</span>
            </h3>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#4a5568',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={syncAllPadding}
                onChange={(e) => setSyncAllPadding(e.target.checked)}
              />
              For all size
            </label>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
                Left Padding
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.padding.left}
                onChange={(e) => handlePaddingChange('left', parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
                Top Padding
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.padding.top}
                onChange={(e) => handlePaddingChange('top', parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
                Right Padding
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.padding.right}
                onChange={(e) => handlePaddingChange('right', parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
                Bottom Padding
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.padding.bottom}
                onChange={(e) => handlePaddingChange('bottom', parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Typography Settings */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#2d3748'
          }}>
            Typography
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '12px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
                Font Family
              </label>
              <select
                value={config.typography.fontFamily}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  typography: { ...prev.typography, fontFamily: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                {fontOptions.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
                Font Size
              </label>
              <input
                type="number"
                min="1"
                value={config.typography.fontSize}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  typography: { ...prev.typography, fontSize: parseInt(e.target.value) || 14 }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
                Unit
              </label>
              <select
                value={config.typography.fontSizeUnit}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  typography: { ...prev.typography, fontSizeUnit: e.target.value as 'px' | 'pt' | 'mm' }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="px">px</option>
                <option value="pt">pt</option>
                <option value="mm">mm</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alignment Settings */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#2d3748'
          }}>
            Alignment
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '8px' }}>
                Horizontal Alignment
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['left', 'center', 'right'] as const).map(align => (
                  <label key={align} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    <input
                      type="radio"
                      name="horizontal"
                      value={align}
                      checked={config.alignment.horizontal === align}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        alignment: { ...prev.alignment, horizontal: e.target.value as 'left' | 'center' | 'right' }
                      }))}
                    />
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '8px' }}>
                Vertical Alignment
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['top', 'center', 'bottom'] as const).map(align => (
                  <label key={align} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    <input
                      type="radio"
                      name="vertical"
                      value={align}
                      checked={config.alignment.vertical === align}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        alignment: { ...prev.alignment, vertical: e.target.value as 'top' | 'center' | 'bottom' }
                      }))}
                    />
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#2d3748'
          }}>
            Text Content
          </h3>
          <div>
            <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
              Text Value (use {config.lineBreak.symbol} for line breaks)
              <span style={{ fontSize: '12px', color: '#718096', fontStyle: 'italic' }}>
                {' '}• Words will never be cut - whole words move to next line
              </span>
            </label>
            <textarea
              value={config.textContent}
              onChange={(e) => setConfig(prev => ({ ...prev, textContent: e.target.value }))}
              placeholder={`Enter multi-line text...${config.lineBreak.symbol}Use ${config.lineBreak.symbol} for line breaks${config.lineBreak.symbol}Example: This is a long sentence that will wrap at word boundaries when it reaches the padding dotted line`}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: config.typography.fontFamily,
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Line Break Controls */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#2d3748'
          }}>
            Line Break Settings
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '12px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
                Line Break Symbol
              </label>
              <select
                value={config.lineBreak.symbol}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  lineBreak: { ...prev.lineBreak, symbol: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                {lineBreakSymbols.map(symbol => (
                  <option key={symbol.value} value={symbol.value}>{symbol.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
                Line Spacing
              </label>
              <input
                type="number"
                min="0.5"
                max="3"
                step="0.1"
                value={config.lineBreak.lineSpacing}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  lineBreak: { ...prev.lineBreak, lineSpacing: parseFloat(e.target.value) || 1.2 }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#4a5568', display: 'block', marginBottom: '4px' }}>
                Line Width (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={config.lineBreak.lineWidth}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  lineBreak: { ...prev.lineBreak, lineWidth: parseInt(e.target.value) || 100 }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#2d3748'
          }}>
            Preview
          </h3>
          <div style={{
            border: '3px solid #ff0000', // Debug: red border to make it visible
            borderRadius: '6px',
            padding: '16px',
            background: '#ffff00', // Debug: yellow background to make it visible
            position: 'relative',
            minHeight: '200px',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            <div style={{
              fontFamily: config.typography.fontFamily,
              fontSize: `${config.typography.fontSize}${config.typography.fontSizeUnit}`,
              textAlign: config.alignment.horizontal,
              display: 'flex',
              flexDirection: 'column',
              alignItems: config.alignment.horizontal === 'left' ? 'flex-start' :
                            config.alignment.horizontal === 'center' ? 'center' : 'flex-end',
              justifyContent: config.alignment.vertical === 'top' ? 'flex-start' :
                             config.alignment.vertical === 'center' ? 'center' : 'flex-end',
              height: 'auto',
              minHeight: '180px',
              padding: `${config.padding.top}mm ${config.padding.right}mm ${config.padding.bottom}mm ${config.padding.left}mm`,
              border: '1px dashed #cbd5e0',
              background: 'white',
              lineHeight: config.lineBreak.lineSpacing
            }}>
              {(() => {
                const previewLines = processTextForPreview(config.textContent);
                console.log('🖼️ PREVIEW RENDER:', {
                  totalLines: previewLines.length,
                  lines: previewLines,
                  regionId: regionId,
                  regionWidth: regionWidth,
                  regionHeight: regionHeight,
                  textContent: config.textContent.substring(0, 50) + '...'
                });
                return previewLines.map((line, index) => (
                  <div key={index} style={{
                    width: '100%', // Use full available width for text display
                    textAlign: config.alignment.horizontal,
                    backgroundColor: index % 2 === 0 ? 'rgba(0,255,0,0.1)' : 'rgba(0,0,255,0.1)', // Debug: alternating colors
                    border: '1px solid red', // Debug: visible border
                    padding: '2px'
                  }}>
                    {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '16px'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              background: 'white',
              color: '#4a5568',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e0';
              e.currentTarget.style.background = '#f7fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = 'white';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              border: '2px solid #6b46c1',
              borderRadius: '6px',
              background: '#6b46c1',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#553c9a';
              e.currentTarget.style.borderColor = '#553c9a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#6b46c1';
              e.currentTarget.style.borderColor = '#6b46c1';
            }}
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMultiLineDialog;
