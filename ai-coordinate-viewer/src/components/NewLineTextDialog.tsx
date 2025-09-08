import React, { useState, useEffect } from 'react';

interface NewLineTextDialogProps {
  isOpen: boolean;
  regionId: string;
  regionWidth: number;
  regionHeight: number;
  editingContent?: any;
  onSave: (config: NewLineTextConfig) => void;
  onCancel: () => void;
}

export interface NewLineTextConfig {
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
}

const NewLineTextDialog: React.FC<NewLineTextDialogProps> = ({
  isOpen,
  regionId,
  regionWidth,
  regionHeight,
  editingContent,
  onSave,
  onCancel
}) => {
  // Initialize config with default values or from editing content
  const getInitialConfig = (): NewLineTextConfig => {
    if (editingContent && editingContent.newLineTextConfig) {
      // Use the stored configuration from existing content
      return editingContent.newLineTextConfig;
    } else if (editingContent) {
      // Create config from existing content properties
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
        textContent: editingContent.content?.text || 'line text'
      };
    } else {
      // Default values for new content
      return {
        padding: { left: 2, top: 2, right: 2, bottom: 2 },
        typography: { fontFamily: 'Arial', fontSize: 14, fontSizeUnit: 'px' },
        alignment: { horizontal: 'center', vertical: 'center' },
        textContent: 'line text'
      };
    }
  };

  const [config, setConfig] = useState<NewLineTextConfig>(getInitialConfig());

  const [isTextTruncated, setIsTextTruncated] = useState(false);

  // Update config when editing content changes
  useEffect(() => {
    setConfig(getInitialConfig());
  }, [editingContent]);

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

  // Calculate available width for text
  const availableWidth = regionWidth - config.padding.left - config.padding.right;

  // Estimate text width (rough calculation)
  const estimateTextWidth = (text: string, fontSize: number, fontFamily: string): number => {
    // Rough character width estimation based on font size
    const avgCharWidth = fontSize * 0.6; // Approximate character width
    return text.length * avgCharWidth;
  };

  // Check if text needs truncation
  useEffect(() => {
    const estimatedWidth = estimateTextWidth(config.textContent, config.typography.fontSize, config.typography.fontFamily);
    setIsTextTruncated(estimatedWidth > availableWidth);
  }, [config.textContent, config.typography.fontSize, config.typography.fontFamily, availableWidth]);

  // Handle text truncation
  const getTruncatedText = (text: string): string => {
    if (!isTextTruncated) return text;
    
    // Binary search for maximum characters that fit
    let left = 0;
    let right = text.length;
    let maxFitLength = 0;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const testText = text.substring(0, mid) + '...';
      const estimatedWidth = estimateTextWidth(testText, config.typography.fontSize, config.typography.fontFamily);
      
      if (estimatedWidth <= availableWidth) {
        maxFitLength = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return text.substring(0, maxFitLength) + '...';
  };

  const handleSave = () => {
    onSave(config);
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
        minWidth: '500px',
        maxWidth: '600px',
        maxHeight: '80vh',
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
            <span style={{ fontSize: '24px' }}>📝</span>
            {editingContent ? 'Edit Line Text' : 'Configure Line Text'}
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
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#2d3748'
          }}>
            Padding (mm)
          </h3>
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
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  padding: { ...prev.padding, left: parseFloat(e.target.value) || 0 }
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
                Top Padding
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.padding.top}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  padding: { ...prev.padding, top: parseFloat(e.target.value) || 0 }
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
                Right Padding
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.padding.right}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  padding: { ...prev.padding, right: parseFloat(e.target.value) || 0 }
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
                Bottom Padding
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.padding.bottom}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  padding: { ...prev.padding, bottom: parseFloat(e.target.value) || 0 }
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
              Text Value
            </label>
            <input
              type="text"
              value={config.textContent}
              onChange={(e) => setConfig(prev => ({ ...prev, textContent: e.target.value }))}
              placeholder="Enter single line text..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontFamily: config.typography.fontFamily,
                fontSize: `${config.typography.fontSize}${config.typography.fontSizeUnit}`
              }}
            />
            {isTextTruncated && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#856404'
              }}>
                ⚠️ Text will be truncated to fit available width ({availableWidth.toFixed(1)}mm)
                <br />
                Preview: "{getTruncatedText(config.textContent)}"
              </div>
            )}
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
            minHeight: '60px'
          }}>
            <div style={{
              fontFamily: config.typography.fontFamily,
              fontSize: `${config.typography.fontSize}${config.typography.fontSizeUnit}`,
              textAlign: config.alignment.horizontal,
              display: 'flex',
              alignItems: config.alignment.vertical === 'top' ? 'flex-start' :
                         config.alignment.vertical === 'center' ? 'center' : 'flex-end',
              justifyContent: config.alignment.horizontal === 'left' ? 'flex-start' :
                            config.alignment.horizontal === 'center' ? 'center' : 'flex-end',
              height: '100%',
              minHeight: '60px',
              padding: `${config.padding.top}mm ${config.padding.right}mm ${config.padding.bottom}mm ${config.padding.left}mm`,
              border: '1px dashed #cbd5e0',
              background: 'white'
            }}>
              {isTextTruncated ? getTruncatedText(config.textContent) : config.textContent}
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
            {editingContent ? 'Update Text' : 'Save & Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewLineTextDialog;
