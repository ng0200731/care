import React, { useState, useEffect, useRef, useCallback } from 'react';

// Universal content data interface
export interface UniversalContentData {
  id: string;
  type: string;
  regionId: string;
  
  // Part 1: Layout & Positioning
  layout: {
    occupyLeftoverSpace: boolean;
    fullWidth: boolean;
    fullHeight: boolean;
    width: {
      value: number;
      unit: '%' | 'mm';
    };
    height: {
      value: number;
      unit: '%' | 'mm';
    };
    horizontalAlign: 'left' | 'center' | 'right';
    verticalAlign: 'top' | 'center' | 'bottom';
    padding: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  
  // Part 2: Typography
  typography: {
    fontFamily: string;
    fontSize: number;
    fontColor: string;
  };
  
  // Part 3: Content Type Specific (varies by type)
  content: any;
}

interface UniversalContentDialogProps {
  isOpen: boolean;
  contentType: {
    id: string;
    name: string;
    icon: string;
  };
  regionId: string;
  regionHeight?: number;
  onSave: (data: UniversalContentData) => void;
  onCancel: () => void;
}

const fontFamilies = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 
  'Georgia', 'Calibri', 'Tahoma', 'Trebuchet MS', 'Comic Sans MS'
];

const UniversalContentDialog: React.FC<UniversalContentDialogProps> = ({
  isOpen,
  contentType,
  regionId,
  regionHeight = 50,
  onSave,
  onCancel
}) => {
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 200, y: 100 });
  const dialogRef = useRef<HTMLDivElement>(null);

  // Form data state
  const [formData, setFormData] = useState<UniversalContentData>({
    id: `${contentType.id}_${Date.now()}`,
    type: contentType.id,
    regionId: regionId,
    layout: {
      occupyLeftoverSpace: false,
      fullWidth: false,
      fullHeight: false,
      width: { value: 100, unit: '%' },
      height: { value: 5, unit: '%' },
      horizontalAlign: 'left',
      verticalAlign: 'top',
      padding: { top: 2, right: 2, bottom: 2, left: 2 }
    },
    typography: {
      fontFamily: 'Arial',
      fontSize: 12,
      fontColor: '#000000'
    },
    content: {}
  });

  // Update regionId when prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      regionId: regionId
    }));
  }, [regionId]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Input handlers
  const handleLayoutChange = (field: string, value: any) => {
    if (field.startsWith('padding.')) {
      const paddingField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          padding: {
            ...prev.layout.padding,
            [paddingField]: value
          }
        }
      }));
    } else if (field.startsWith('width.') || field.startsWith('height.')) {
      const [dimension, property] = field.split('.');
      setFormData(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          [dimension]: {
            ...prev.layout[dimension as 'width' | 'height'],
            [property]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          [field]: value
        }
      }));
    }
  };

  const handleTypographyChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [field]: value
      }
    }));
  };

  const handleContentChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value
      }
    }));
  };

  // Apply padding to all sides
  const applyPaddingToAll = () => {
    const topValue = formData.layout.padding.top;
    setFormData(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        padding: {
          top: topValue,
          right: topValue,
          bottom: topValue,
          left: topValue
        }
      }
    }));
  };

  const handleSave = () => {
    // Basic validation
    if (contentType.id === 'line-text' && !formData.content.text?.trim()) {
      alert('Please enter text content');
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  // Styles
  const sectionStyle = {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#495057',
    fontSize: '14px'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white'
  };

  const smallInputStyle = {
    ...inputStyle,
    width: '80px',
    display: 'inline-block'
  };

  return (
    <div
      ref={dialogRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        width: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        zIndex: 2000,
        border: '2px solid #e2e8f0'
      }}
    >
      {/* Draggable Header */}
      <div 
        style={{ 
          marginBottom: '25px', 
          textAlign: 'center',
          padding: '10px',
          marginTop: '-10px',
          marginLeft: '-10px',
          marginRight: '-10px',
          backgroundColor: '#f7fafc',
          borderRadius: '8px 8px 0 0',
          borderBottom: '1px solid #e2e8f0',
          cursor: 'grab',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#2d3748',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {contentType.icon} {contentType.name} Properties
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#718096',
              padding: '4px'
            }}
            title="Close dialog"
          >
            ✕
          </button>
        </h2>
      </div>

      {/* Form Content - Prevent dragging on form elements */}
      <div onMouseDown={(e) => e.stopPropagation()}>

        {/* PART 1: Layout & Positioning */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '16px' }}>
            📐 Layout & Positioning
          </h3>

          {/* Occupy Leftover Space Option */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={formData.layout.occupyLeftoverSpace}
                onChange={(e) => handleLayoutChange('occupyLeftoverSpace', e.target.checked)}
              />
              <span style={{ fontWeight: 'bold' }}>Occupy all leftover space</span>
            </label>
          </div>

          {/* Width/Height Controls - Only show when not occupying leftover space */}
          {!formData.layout.occupyLeftoverSpace && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              {/* Left Column - Width */}
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.layout.fullWidth}
                      onChange={(e) => handleLayoutChange('fullWidth', e.target.checked)}
                    />
                    <span>Full Width</span>
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>Width:</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={formData.layout.width.value}
                      onChange={(e) => handleLayoutChange('width.value', Number(e.target.value))}
                      style={{
                        ...smallInputStyle,
                        opacity: formData.layout.fullWidth ? 0.5 : 1,
                        cursor: formData.layout.fullWidth ? 'not-allowed' : 'text'
                      }}
                      disabled={formData.layout.fullWidth}
                    />
                    <select
                      value={formData.layout.width.unit}
                      onChange={(e) => handleLayoutChange('width.unit', e.target.value)}
                      style={{
                        ...smallInputStyle,
                        width: '60px',
                        opacity: formData.layout.fullWidth ? 0.5 : 1,
                        cursor: formData.layout.fullWidth ? 'not-allowed' : 'pointer'
                      }}
                      disabled={formData.layout.fullWidth}
                    >
                      <option value="%">%</option>
                      <option value="mm">mm</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column - Height */}
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.layout.fullHeight}
                      onChange={(e) => handleLayoutChange('fullHeight', e.target.checked)}
                    />
                    <span>Full Height</span>
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>Height:</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={formData.layout.height.value}
                      onChange={(e) => handleLayoutChange('height.value', Number(e.target.value))}
                      style={{
                        ...smallInputStyle,
                        opacity: formData.layout.fullHeight ? 0.5 : 1,
                        cursor: formData.layout.fullHeight ? 'not-allowed' : 'text'
                      }}
                      disabled={formData.layout.fullHeight}
                    />
                    <select
                      value={formData.layout.height.unit}
                      onChange={(e) => handleLayoutChange('height.unit', e.target.value)}
                      style={{
                        ...smallInputStyle,
                        width: '60px',
                        opacity: formData.layout.fullHeight ? 0.5 : 1,
                        cursor: formData.layout.fullHeight ? 'not-allowed' : 'pointer'
                      }}
                      disabled={formData.layout.fullHeight}
                    >
                      <option value="%">%</option>
                      <option value="mm">mm</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alignment Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={labelStyle}>Horizontal Alignment:</label>
              <select
                value={formData.layout.horizontalAlign}
                onChange={(e) => handleLayoutChange('horizontalAlign', e.target.value)}
                style={inputStyle}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Vertical Alignment:</label>
              <select
                value={formData.layout.verticalAlign}
                onChange={(e) => handleLayoutChange('verticalAlign', e.target.value)}
                style={inputStyle}
              >
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>

          {/* Padding TRBL */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <label style={labelStyle}>Padding (mm):</label>
              <button
                type="button"
                onClick={applyPaddingToAll}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="Apply top value to all sides"
              >
                Apply to All
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Top</label>
                <input
                  type="number"
                  value={formData.layout.padding.top}
                  onChange={(e) => handleLayoutChange('padding.top', Number(e.target.value))}
                  style={smallInputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Right</label>
                <input
                  type="number"
                  value={formData.layout.padding.right}
                  onChange={(e) => handleLayoutChange('padding.right', Number(e.target.value))}
                  style={smallInputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Bottom</label>
                <input
                  type="number"
                  value={formData.layout.padding.bottom}
                  onChange={(e) => handleLayoutChange('padding.bottom', Number(e.target.value))}
                  style={smallInputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Left</label>
                <input
                  type="number"
                  value={formData.layout.padding.left}
                  onChange={(e) => handleLayoutChange('padding.left', Number(e.target.value))}
                  style={smallInputStyle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* PART 2: Typography */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '16px' }}>
            🔤 Typography
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>Font Family:</label>
              <select
                value={formData.typography.fontFamily}
                onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
                style={inputStyle}
              >
                {fontFamilies.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Font Size (px):</label>
              <input
                type="number"
                value={formData.typography.fontSize}
                onChange={(e) => handleTypographyChange('fontSize', Number(e.target.value))}
                style={inputStyle}
                min="8"
                max="72"
              />
            </div>
            <div>
              <label style={labelStyle}>Font Color:</label>
              <input
                type="color"
                value={formData.typography.fontColor}
                onChange={(e) => handleTypographyChange('fontColor', e.target.value)}
                style={{ ...inputStyle, height: '40px' }}
              />
            </div>
          </div>
        </div>

        {/* PART 3: Content Type Specific */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '16px' }}>
            {contentType.icon} {contentType.name} Content
          </h3>

          {/* Content based on type */}
          {contentType.id === 'line-text' && (
            <div>
              <label style={labelStyle}>Text Content:</label>
              <input
                type="text"
                value={formData.content.text || ''}
                onChange={(e) => handleContentChange('text', e.target.value)}
                style={inputStyle}
                placeholder="Enter your text here..."
              />
            </div>
          )}

          {contentType.id === 'translation-paragraph' && (
            <div>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Primary Language Content:</label>
                <textarea
                  value={formData.content.primaryContent || ''}
                  onChange={(e) => handleContentChange('primaryContent', e.target.value)}
                  style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                  placeholder="Enter primary language text..."
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Secondary Language Content:</label>
                <textarea
                  value={formData.content.secondaryContent || ''}
                  onChange={(e) => handleContentChange('secondaryContent', e.target.value)}
                  style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                  placeholder="Enter secondary language text..."
                />
              </div>
            </div>
          )}

          {contentType.id === 'pure-english-paragraph' && (
            <div>
              <label style={labelStyle}>Paragraph Content:</label>
              <textarea
                value={formData.content.text || ''}
                onChange={(e) => handleContentChange('text', e.target.value)}
                style={{ ...inputStyle, height: '120px', resize: 'vertical' }}
                placeholder="Enter your paragraph content here..."
              />
            </div>
          )}

          {contentType.id === 'washing-symbol' && (
            <div>
              <label style={labelStyle}>Washing Symbol:</label>
              <select
                value={formData.content.symbol || ''}
                onChange={(e) => handleContentChange('symbol', e.target.value)}
                style={inputStyle}
              >
                <option value="">Select a symbol...</option>
                <option value="wash-30">🌡️ Wash 30°C</option>
                <option value="wash-40">🌡️ Wash 40°C</option>
                <option value="wash-60">🌡️ Wash 60°C</option>
                <option value="hand-wash">✋ Hand Wash</option>
                <option value="no-wash">🚫 Do Not Wash</option>
                <option value="dry-clean">🧽 Dry Clean</option>
                <option value="no-bleach">🚫 No Bleach</option>
                <option value="tumble-dry">🌪️ Tumble Dry</option>
              </select>
            </div>
          )}

          {contentType.id === 'image' && (
            <div>
              <label style={labelStyle}>Image Source:</label>
              <input
                type="text"
                value={formData.content.src || ''}
                onChange={(e) => handleContentChange('src', e.target.value)}
                style={inputStyle}
                placeholder="Enter image URL or path..."
              />
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                Note: Image upload functionality will be added later
              </div>
            </div>
          )}

          {contentType.id === 'coo' && (
            <div>
              <label style={labelStyle}>Country of Origin:</label>
              <select
                value={formData.content.country || ''}
                onChange={(e) => handleContentChange('country', e.target.value)}
                style={inputStyle}
              >
                <option value="">Select country...</option>
                <option value="CN">🇨🇳 China</option>
                <option value="US">🇺🇸 United States</option>
                <option value="VN">🇻🇳 Vietnam</option>
                <option value="BD">🇧🇩 Bangladesh</option>
                <option value="IN">🇮🇳 India</option>
                <option value="TR">🇹🇷 Turkey</option>
                <option value="IT">🇮🇹 Italy</option>
                <option value="PT">🇵🇹 Portugal</option>
                <option value="MX">🇲🇽 Mexico</option>
                <option value="OTHER">🌍 Other</option>
              </select>
            </div>
          )}

          {/* Placeholder for unknown content types */}
          {!['line-text', 'translation-paragraph', 'pure-english-paragraph', 'washing-symbol', 'image', 'coo'].includes(contentType.id) && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#666',
              fontStyle: 'italic',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            }}>
              Content configuration for "{contentType.name}" will be added here
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Save
          </button>
        </div>
        </div> {/* End form content wrapper */}
    </div>
  );
};

export default UniversalContentDialog;
