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
  regionWidth?: number;
  regionContents?: any[];
  editingContent?: UniversalContentData | null; // Add editing content prop
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
  regionWidth = 100,
  regionContents = [],
  editingContent = null, // Add editing content prop
  onSave,
  onCancel
}) => {
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 200, y: 100 });
  const dialogRef = useRef<HTMLDivElement>(null);

  // Validation state
  const [validationWarning, setValidationWarning] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');

  // Padding toggle state
  const [applyPaddingToAll, setApplyPaddingToAll] = useState(false);

  // Form data state - Initialize with editing content if provided
  const [formData, setFormData] = useState<UniversalContentData>(() => {
    if (editingContent) {
      // Use existing content data for editing
      return {
        ...editingContent,
        regionId: regionId // Ensure region ID is current
      };
    } else {
      // Default values for new content
      return {
        id: `${contentType.id}_${Date.now()}`,
        type: contentType.id,
        regionId: regionId,
        layout: {
          occupyLeftoverSpace: false, // Keep this from remote
          fullWidth: false,
          fullHeight: false,
          width: { value: 0, unit: '%' }, // Default blank (0) with % unit
          height: { value: 0, unit: '%' }, // Default blank (0) with % unit
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
      };
    }
  });

  // Update form data when editing content or regionId changes
  useEffect(() => {
    if (editingContent) {
      // Debug: Log the editing content structure
      console.log('🔍 Editing content received:', editingContent);
      console.log('🔍 Content layout:', editingContent.layout);
      console.log('🔍 Content typography:', editingContent.typography);

      // Load existing content data for editing
      setFormData({
        ...editingContent,
        regionId: regionId // Ensure region ID is current
      });
    } else {
      // Reset to default values for new content
      setFormData({
        id: `${contentType.id}_${Date.now()}`,
        type: contentType.id,
        regionId: regionId,
        layout: {
          occupyLeftoverSpace: false, // Add missing property
          fullWidth: false,
          fullHeight: false,
          width: { value: 0, unit: '%' },
          height: { value: 0, unit: '%' },
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
    }
  }, [editingContent, regionId, contentType.id]);

  // Calculate remaining space in region
  const calculateRemainingSpace = () => {
    const regionArea = regionWidth * regionHeight;
    const usedArea = regionContents.reduce((sum, content) => {
      let contentWidth = regionWidth;
      let contentHeight = 0;

      if (content.layout.fullWidth || content.layout.width.value === 100) {
        contentWidth = regionWidth;
      } else if (content.layout.width.unit === 'mm') {
        contentWidth = content.layout.width.value;
      } else {
        contentWidth = (content.layout.width.value / 100) * regionWidth;
      }

      if (content.layout.fullHeight || content.layout.height.value === 100) {
        contentHeight = regionHeight;
      } else if (content.layout.height.unit === 'mm') {
        contentHeight = content.layout.height.value;
      } else {
        contentHeight = (content.layout.height.value / 100) * regionHeight;
      }

      // Fix floating point precision errors by rounding
      return sum + Math.round((contentWidth * contentHeight) * 1000000) / 1000000;
    }, 0);

    // Fix floating point precision errors by rounding to 6 decimal places
    const remainingArea = Math.max(0, Math.round((regionArea - usedArea) * 1000000) / 1000000);
    const remainingPercent = regionArea > 0 ? Math.round(((remainingArea / regionArea) * 100) * 1000000) / 1000000 : 0;



    return { remainingArea, remainingPercent, usedArea, regionArea };
  };

  // Validate input values
  const validateInput = (field: string, value: number, unit: string) => {
    setInputError('');
    setValidationWarning('');

    if (field === 'width') {
      if (unit === '%' && value > 100) {
        setInputError('Maximum width is 100%');
        return false;
      }
      if (unit === 'mm' && value > regionWidth) {
        setInputError(`Maximum width is ${regionWidth}mm`);
        return false;
      }
    }

    if (field === 'height') {
      if (unit === '%' && value > 100) {
        setInputError('Maximum height is 100%');
        return false;
      }
      if (unit === 'mm' && value > regionHeight) {
        setInputError(`Maximum height is ${regionHeight}mm`);
        return false;
      }
    }

    // Check remaining space warning
    const remaining = calculateRemainingSpace();
    let proposedWidth = formData.layout.width.value;
    let proposedHeight = formData.layout.height.value;

    if (field === 'width') proposedWidth = value;
    if (field === 'height') proposedHeight = value;

    // Calculate proposed area based on units
    let proposedArea = 0;
    if (formData.layout.width.unit === '%' && formData.layout.height.unit === '%') {
      proposedArea = (proposedWidth / 100 * regionWidth) * (proposedHeight / 100 * regionHeight);
    } else if (formData.layout.width.unit === 'mm' && formData.layout.height.unit === 'mm') {
      proposedArea = proposedWidth * proposedHeight;
    } else {
      // Mixed units
      const widthMm = formData.layout.width.unit === 'mm' ? proposedWidth : (proposedWidth / 100 * regionWidth);
      const heightMm = formData.layout.height.unit === 'mm' ? proposedHeight : (proposedHeight / 100 * regionHeight);
      proposedArea = widthMm * heightMm;
    }

    if (proposedArea > remaining.remainingArea) {
      setValidationWarning(`Only ${remaining.remainingPercent.toFixed(1)}% space remaining`);
    } else {
      setValidationWarning(''); // Clear warning if valid
    }

    return true;
  };

  // Check if save should be blocked
  const isSaveBlocked = () => {
    const remaining = calculateRemainingSpace();

    // Calculate current proposed area with floating point precision fix
    let proposedArea = 0;
    if (formData.layout.width.unit === '%' && formData.layout.height.unit === '%') {
      proposedArea = Math.round(((formData.layout.width.value / 100 * regionWidth) * (formData.layout.height.value / 100 * regionHeight)) * 1000000) / 1000000;
    } else if (formData.layout.width.unit === 'mm' && formData.layout.height.unit === 'mm') {
      proposedArea = Math.round((formData.layout.width.value * formData.layout.height.value) * 1000000) / 1000000;
    } else {
      // Mixed units
      const widthMm = formData.layout.width.unit === 'mm' ? formData.layout.width.value : (formData.layout.width.value / 100 * regionWidth);
      const heightMm = formData.layout.height.unit === 'mm' ? formData.layout.height.value : (formData.layout.height.value / 100 * regionHeight);
      proposedArea = Math.round((widthMm * heightMm) * 1000000) / 1000000;
    }

    // Allow exactly 100% usage, block only when exceeding (with precision fix)
    const totalUsedArea = Math.round((remaining.usedArea + proposedArea) * 1000000) / 1000000;
    const usagePercent = Math.round(((totalUsedArea / remaining.regionArea) * 100) * 1000000) / 1000000;



    return usagePercent > 100 || inputError !== '';
  };

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
    // Validate width and height inputs
    if (field === 'width.value' || field === 'height.value') {
      const dimension = field.split('.')[0];
      const currentUnit = dimension === 'width' ? formData.layout.width.unit : formData.layout.height.unit;

      if (!validateInput(dimension, value, currentUnit)) {
        return; // Block invalid input
      }
    }

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

      // Re-validate after unit change
      if (property === 'unit') {
        const currentValue = dimension === 'width' ? formData.layout.width.value : formData.layout.height.value;
        validateInput(dimension, currentValue, value);
      }
    } else {
      setFormData(prev => {
        const newLayout = {
          ...prev.layout,
          [field]: value
        };

        // Auto-set values when Full Width/Height is checked
        if (field === 'fullWidth' && value === true) {
          newLayout.width.value = 100;
          newLayout.width.unit = '%';
        }
        if (field === 'fullHeight' && value === true) {
          newLayout.height.value = 100;
          newLayout.height.unit = '%';
        }

        return {
          ...prev,
          layout: newLayout
        };
      });
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
  const handleApplyPaddingToAllToggle = () => {
    const newToggleState = !applyPaddingToAll;
    setApplyPaddingToAll(newToggleState);

    if (newToggleState) {
      // When toggled on, apply top value to all sides
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
    }
  };

  const handlePaddingChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    if (applyPaddingToAll) {
      // When "apply to all" is enabled, update all sides
      setFormData(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          padding: {
            top: value,
            right: value,
            bottom: value,
            left: value
          }
        }
      }));
    } else {
      // Normal behavior - update only the specific side
      setFormData(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          padding: {
            ...prev.layout.padding,
            [side]: value
          }
        }
      }));
    }
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
        top: 0, // Always start from top
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '0', // Remove padding from main container
        width: '700px',
        height: '100vh', // Full height exactly from top
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        zIndex: 2000,
        border: '2px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Fixed Draggable Header */}
      <div
        style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f7fafc',
          borderRadius: '10px 10px 0 0',
          borderBottom: '1px solid #e2e8f0',
          cursor: 'grab',
          userSelect: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexShrink: 0 // Prevent header from shrinking
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
            <span style={{ fontSize: '18px', color: '#666', fontWeight: 'bold' }}>↔️</span> {contentType.name} property
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

      {/* Scrollable Form Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '30px'
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >

        {/* PART 1: Layout & Positioning */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '16px' }}>
            📐 Layout & Positioning
          </h3>

          {/* Width/Height with Checkboxes Above */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              {/* Full Width Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.layout.fullWidth}
                  onChange={(e) => handleLayoutChange('fullWidth', e.target.checked)}
                />
                <span>Full Width</span>
              </label>
              {/* Width Input */}
              <label style={labelStyle}>Width:</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={formData.layout.fullWidth ? 100 : (formData.layout.width.value === 0 ? '' : formData.layout.width.value)} // Show 100 when fullWidth, blank when 0
                  placeholder=""
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value);
                    handleLayoutChange('width.value', value);
                  }}
                  style={{
                    ...smallInputStyle,
                    backgroundColor: formData.layout.fullWidth ? '#f5f5f5' : 'white',
                    cursor: formData.layout.fullWidth ? 'not-allowed' : 'text'
                  }}
                  disabled={formData.layout.fullWidth}
                />
                <select
                  value={formData.layout.fullWidth ? '%' : formData.layout.width.unit}
                  onChange={(e) => handleLayoutChange('width.unit', e.target.value)}
                  style={{
                    ...smallInputStyle,
                    width: '60px',
                    backgroundColor: formData.layout.fullWidth ? '#f5f5f5' : 'white',
                    cursor: formData.layout.fullWidth ? 'not-allowed' : 'pointer'
                  }}
                  disabled={formData.layout.fullWidth}
                >
                  <option value="%">%</option>
                  <option value="mm">mm</option>
                </select>
              </div>
            </div>
            <div>
              {/* Full Height Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.layout.fullHeight}
                  onChange={(e) => handleLayoutChange('fullHeight', e.target.checked)}
                />
                <span>Full Height</span>
              </label>
              {/* Height Input */}
              <label style={labelStyle}>Height:</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={formData.layout.fullHeight ? 100 : (formData.layout.height.value === 0 ? '' : formData.layout.height.value)} // Show 100 when fullHeight, blank when 0
                  placeholder=""
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value);
                    handleLayoutChange('height.value', value);
                  }}
                  style={{
                    ...smallInputStyle,
                    backgroundColor: formData.layout.fullHeight ? '#f5f5f5' : 'white',
                    cursor: formData.layout.fullHeight ? 'not-allowed' : 'text'
                  }}
                  disabled={formData.layout.fullHeight}
                />
                <select
                  value={formData.layout.fullHeight ? '%' : formData.layout.height.unit}
                  onChange={(e) => handleLayoutChange('height.unit', e.target.value)}
                  style={{
                    ...smallInputStyle,
                    width: '60px',
                    backgroundColor: formData.layout.fullHeight ? '#f5f5f5' : 'white',
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

          {/* Validation Messages */}
          {inputError && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '15px',
              border: '1px solid #ef5350'
            }}>
              ❌ {inputError}
            </div>
          )}
          {validationWarning && (
            <div style={{
              background: '#fff3e0',
              color: '#ef6c00',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '15px',
              border: '1px solid #ffb74d'
            }}>
              ⚠️ {validationWarning}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={applyPaddingToAll}
                  onChange={handleApplyPaddingToAllToggle}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px', color: '#666' }}>Apply to All</span>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Top</label>
                <input
                  type="number"
                  value={formData.layout.padding.top}
                  onChange={(e) => handlePaddingChange('top', Number(e.target.value))}
                  style={smallInputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Right</label>
                <input
                  type="number"
                  value={formData.layout.padding.right}
                  onChange={(e) => handlePaddingChange('right', Number(e.target.value))}
                  style={{
                    ...smallInputStyle,
                    backgroundColor: applyPaddingToAll ? '#f5f5f5' : 'white',
                    cursor: applyPaddingToAll ? 'not-allowed' : 'text'
                  }}
                  disabled={applyPaddingToAll}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Bottom</label>
                <input
                  type="number"
                  value={formData.layout.padding.bottom}
                  onChange={(e) => handlePaddingChange('bottom', Number(e.target.value))}
                  style={{
                    ...smallInputStyle,
                    backgroundColor: applyPaddingToAll ? '#f5f5f5' : 'white',
                    cursor: applyPaddingToAll ? 'not-allowed' : 'text'
                  }}
                  disabled={applyPaddingToAll}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Left</label>
                <input
                  type="number"
                  value={formData.layout.padding.left}
                  onChange={(e) => handlePaddingChange('left', Number(e.target.value))}
                  style={{
                    ...smallInputStyle,
                    backgroundColor: applyPaddingToAll ? '#f5f5f5' : 'white',
                    cursor: applyPaddingToAll ? 'not-allowed' : 'text'
                  }}
                  disabled={applyPaddingToAll}
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
            disabled={isSaveBlocked()}
            style={{
              padding: '10px 20px',
              backgroundColor: isSaveBlocked() ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSaveBlocked() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: isSaveBlocked() ? 0.6 : 1
            }}
          >
            Save
          </button>
        </div>
      </div> {/* End scrollable form content wrapper */}
    </div>
  );
};

export default UniversalContentDialog;
