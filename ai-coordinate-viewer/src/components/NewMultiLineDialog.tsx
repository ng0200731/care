import React, { useState, useEffect } from 'react';
import MovableDialog from './MovableDialog';

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

  // Apply Canvas-First Sync logic-slice to popup preview
  const processTextForPreview = (text: string): string[] => {
    // Calculate available space in pixels (same as Canvas-First Sync logic-slice)
    const regionWidthPx = regionWidth * 3.779527559; // Convert mm to px (96 DPI)
    const regionHeightPx = regionHeight * 3.779527559;
    const paddingLeftPx = config.padding.left * 3.779527559;
    const paddingRightPx = config.padding.right * 3.779527559;
    const paddingTopPx = config.padding.top * 3.779527559;
    const paddingBottomPx = config.padding.bottom * 3.779527559;

    const availableWidthPx = Math.max(0, regionWidthPx - paddingLeftPx - paddingRightPx);
    const availableHeightPx = Math.max(0, regionHeightPx - paddingTopPx - paddingBottomPx);

    // Convert font size to pixels (same as Canvas-First Sync logic-slice)
    let fontSizePx = config.typography.fontSize;
    if (config.typography.fontSizeUnit === 'mm') {
      fontSizePx = config.typography.fontSize * 3.779527559;
    } else if (config.typography.fontSizeUnit === 'pt') {
      fontSizePx = (config.typography.fontSize * 4/3);
    }

    // Use EXACT Canvas-First Sync logic-slice function
    const processedResult = processChildRegionTextWrapping(
      text,
      availableWidthPx,
      availableHeightPx,
      fontSizePx,
      config.typography.fontFamily,
      config.lineBreak.symbol,
      config.lineBreak.lineSpacing
    );

    console.log('✅ Preview: Applied Canvas-First Sync logic-slice:', {
      regionId: regionId,
      availableWidth: availableWidthPx,
      availableHeight: availableHeightPx,
      fontSize: fontSizePx,
      lines: processedResult.lines.length,
      hasOverflow: processedResult.hasOverflow,
      text: text.substring(0, 50) + '...'
    });

    return processedResult.lines;
  };

  // Canvas-First Sync logic-slice function (EXACT COPY from App.tsx)
  const processChildRegionTextWrapping = (
    text: string,
    availableWidthPx: number,
    availableHeightPx: number,
    fontSizePx: number,
    fontFamily: string,
    lineBreakSymbol: string,
    lineSpacing: number
  ): { lines: string[]; hasOverflow: boolean } => {
    // Convert pixels to mm for text measurement (96 DPI: 1mm = 3.779527559px)
    const availableWidthMm = availableWidthPx / 3.779527559;
    const fontSizeMm = fontSizePx / 3.779527559;

    // Text width estimation using canvas measurement
    const estimateTextWidth = (text: string): number => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return text.length * 2; // Fallback

      context.font = `${fontSizePx}px ${fontFamily}`;
      const textWidthPx = context.measureText(text).width;
      return textWidthPx / 3.779527559; // Convert to mm
    };

    // Word wrapping logic
    const wrapTextToLines = (text: string): string[] => {
      const manualLines = text.split(lineBreakSymbol);
      const wrappedLines: string[] = [];

      manualLines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          wrappedLines.push(''); // Preserve empty lines
          return;
        }

        const words = trimmedLine.split(' ');
        let currentLine = '';

        words.forEach((word, index) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = estimateTextWidth(testLine);

          if (testWidth <= availableWidthMm) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              wrappedLines.push(currentLine);
              currentLine = word;
            } else {
              wrappedLines.push(word);
            }
          }
        });

        if (currentLine) {
          wrappedLines.push(currentLine);
        }
      });

      return wrappedLines;
    };

    const lines = wrapTextToLines(text);

    // Check for height overflow
    const lineHeightMm = fontSizeMm * lineSpacing;
    const totalTextHeightMm = lines.length * lineHeightMm;
    const availableHeightMm = availableHeightPx / 3.779527559;
    const hasOverflow = totalTextHeightMm > availableHeightMm;

    // Truncate lines if height overflow
    if (hasOverflow) {
      const maxVisibleLines = Math.floor(availableHeightMm / lineHeightMm);
      return {
        lines: lines.slice(0, maxVisibleLines),
        hasOverflow: true
      };
    }

    return {
      lines,
      hasOverflow: false
    };
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

  return (
    <MovableDialog
      isOpen={isOpen}
      title="Multi-line Text Settings"
      icon="📝"
      width="700px"
      storageKey="multi-line-dialog"
      onClose={onCancel}
    >
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
            border: '2px solid #e2e8f0',
            borderRadius: '6px',
            padding: '16px',
            background: '#f7fafc',
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
                    width: '100%',
                    textAlign: config.alignment.horizontal,
                    fontSize: `${config.typography.fontSize}${config.typography.fontSizeUnit}`,
                    fontFamily: config.typography.fontFamily,
                    lineHeight: config.lineBreak.lineSpacing
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
    </MovableDialog>
  );
};

export default NewMultiLineDialog;
