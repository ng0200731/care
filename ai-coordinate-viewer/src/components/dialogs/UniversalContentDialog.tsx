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
  // Overflow props
  isOverflowEnabled?: (contentId: string) => boolean;
  getOverflowRole?: (contentId: string) => 'initiator' | 'connector' | 'none';
  onOverflowToggle?: (contentId: string, regionId: string, enabled: boolean) => void;
  onGetMasterProperties?: (contentId: string) => { layout: any; typography: any } | null;
  onRecalculateOverflow?: (masterContentId: string) => void;
  masterPropertiesVersion?: number; // Add version number to trigger updates
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
  // Overflow props
  isOverflowEnabled,
  getOverflowRole,
  onOverflowToggle,
  onGetMasterProperties,
  onRecalculateOverflow,
  masterPropertiesVersion,
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

  // Local overflow state for both new and editing content
  const [localOverflowEnabled, setLocalOverflowEnabled] = useState(false);

  // Initialize local overflow state when editing content - only run once when dialog opens
  useEffect(() => {
    if (editingContent && isOverflowEnabled) {
      const initialState = isOverflowEnabled(editingContent.id);
      setLocalOverflowEnabled(initialState);
    } else {
      setLocalOverflowEnabled(false);
    }
  }, [editingContent?.id]); // Only depend on editingContent.id, not the isOverflowEnabled function

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

      // Check if this is a connector in an overflow chain
      const role = getOverflowRole ? getOverflowRole(editingContent.id) : 'none';
      const isConnector = role === 'connector';

      if (isConnector && onGetMasterProperties) {
        // Get master properties for connector objects
        const masterProperties = onGetMasterProperties(editingContent.id);

        setFormData({
          ...editingContent,
          regionId: regionId,
          layout: masterProperties?.layout || editingContent.layout,
          typography: masterProperties?.typography || editingContent.typography
        });
      } else {
        // Load existing content data for editing (master or non-overflow)
        setFormData({
          ...editingContent,
          regionId: regionId // Ensure region ID is current
        });
      }
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
  }, [editingContent?.id, regionId, contentType.id]);

  // Get master properties for display in connector dialogs
  const getMasterPropertiesForDisplay = () => {
    if (editingContent && getOverflowRole && onGetMasterProperties) {
      const role = getOverflowRole(editingContent.id);
      if (role === 'connector') {
        const masterProperties = onGetMasterProperties(editingContent.id);
        return masterProperties;
      }
    }
    return null;
  };

  // Trigger overflow recalculation for initiators and connectors
  const triggerOverflowRecalculation = () => {
    if (editingContent && getOverflowRole && onRecalculateOverflow) {
      const role = getOverflowRole(editingContent.id);
      if (role === 'initiator') {
        setTimeout(() => {
          onRecalculateOverflow(editingContent.id);
        }, 0);
      } else if (role === 'connector') {
        setTimeout(() => {
          onRecalculateOverflow(editingContent.id);
        }, 0);
      }
    }
  };

  const masterProperties = getMasterPropertiesForDisplay();
  const isConnector = editingContent && getOverflowRole && getOverflowRole(editingContent.id) === 'connector';

  // Debug: Check if master properties are being retrieved
  if (isConnector) {
    console.log('🔍 CONNECTOR DEBUG:', {
      contentId: editingContent?.id,
      isConnector,
      masterProperties,
      hasGetMasterProps: !!onGetMasterProperties
    });
  }

  // Update connector properties when master changes
  useEffect(() => {
    if (editingContent && getOverflowRole && onGetMasterProperties) {
      const role = getOverflowRole(editingContent.id);
      if (role === 'connector') {
        const masterProperties = onGetMasterProperties(editingContent.id);
        if (masterProperties) {
          setFormData(prev => ({
            ...prev,
            layout: masterProperties.layout,
            typography: masterProperties.typography
          }));
        }
      }
    }
  }, [editingContent?.id, masterPropertiesVersion]);

  // Calculate remaining space in region
  const calculateRemainingSpace = () => {
    const regionArea = regionWidth * regionHeight;

    // Calculate used area by existing content (excluding current content being edited)
    const usedArea = regionContents.reduce((sum, content) => {
      // Skip the content we're currently editing to avoid double counting
      if (editingContent && content.id === editingContent.id) {
        return sum;
      }

      let contentWidth = regionWidth;
      let contentHeight = 0;

      // Check if content occupies leftover space
      if (content.layout.occupyLeftoverSpace) {
        // For "occupy leftover space" content, we need to calculate what space was available when it was created
        // For now, we'll treat it as using remaining space at that time
        // This is complex to calculate retroactively, so we'll use a simplified approach
        contentWidth = regionWidth;
        contentHeight = regionHeight; // Simplified: assume it took all remaining space
      } else {
        // Normal width calculation
        if (content.layout.fullWidth || content.layout.width.value === 100) {
          contentWidth = regionWidth;
        } else if (content.layout.width.unit === 'mm') {
          contentWidth = content.layout.width.value;
        } else {
          contentWidth = (content.layout.width.value / 100) * regionWidth;
        }

        // Normal height calculation
        if (content.layout.fullHeight || content.layout.height.value === 100) {
          contentHeight = regionHeight;
        } else if (content.layout.height.unit === 'mm') {
          contentHeight = content.layout.height.value;
        } else {
          contentHeight = (content.layout.height.value / 100) * regionHeight;
        }
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
    // If there's an input error, block save
    if (inputError !== '') {
      return true;
    }

    // If occupying leftover space, always allow save (no area calculation needed)
    if (formData.layout.occupyLeftoverSpace) {
      return false;
    }

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

    return usagePercent > 100;
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

    // Trigger overflow recalculation for font size changes
    if (field === 'fontSize') {
      console.log(`📏 FONT SIZE CHANGED: ${value} - triggering redistribution...`);
      triggerOverflowRecalculation();
    }
  };

  const handleContentChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value
      }
    }));

    // Trigger overflow recalculation for text content changes
    if (field === 'text') {
      triggerOverflowRecalculation();
    }
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

    // Trigger overflow recalculation for padding changes (affects text capacity)
    triggerOverflowRecalculation();
  };

  const handleSave = () => {
    // Basic validation for text-based content types
    if (contentType.id === 'line-text' && !formData.content.text?.trim()) {
      alert('Please enter text content');
      return;
    }
    if (contentType.id === 'pure-english-paragraph' && !formData.content.text?.trim()) {
      alert('Please enter paragraph content');
      return;
    }
    if (contentType.id === 'translation-paragraph' && (!formData.content.primaryContent?.trim() || !formData.content.secondaryContent?.trim())) {
      alert('Please enter both primary and secondary language content');
      return;
    }

    // Handle overflow for text-based content types (line-text, paragraphs)
    const textContentTypes = ['line-text', 'pure-english-paragraph', 'translation-paragraph'];
    if (textContentTypes.includes(contentType.id) && onOverflowToggle) {
      if (editingContent) {
        // For editing content, apply overflow state immediately
        onOverflowToggle(editingContent.id, regionId, localOverflowEnabled);
      } else if (localOverflowEnabled) {
        // For new content, trigger overflow after save
        setTimeout(() => {
          onOverflowToggle(formData.id, regionId, true);
        }, 100); // Small delay to ensure content is saved first
      }
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
            {editingContent && (
              <span style={{
                fontSize: '12px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: getOverflowRole && getOverflowRole(editingContent.id) === 'connector' ? '#ffebee' : '#e8f5e8',
                color: getOverflowRole && getOverflowRole(editingContent.id) === 'connector' ? '#c62828' : '#2e7d32',
                fontWeight: 'bold'
              }}>
                {getOverflowRole ? getOverflowRole(editingContent.id).toUpperCase() : 'NONE'}
              </span>
            )}
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



        {/* PART 1: Layout & Positioning (Simplified) */}
        <div style={{
          ...sectionStyle,
          backgroundColor: isConnector ? '#f8f9fa' : 'white',
          opacity: isConnector ? 0.5 : 1,
          pointerEvents: isConnector ? 'none' : 'auto'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '16px' }}>
            📐 Layout & Positioning
            {isConnector && (
              <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '10px' }}>
                (Inherited from chain master)
              </span>
            )}
          </h3>

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
                value={isConnector && masterProperties ? masterProperties.layout.horizontalAlign : formData.layout.horizontalAlign}
                onChange={(e) => handleLayoutChange('horizontalAlign', e.target.value)}
                style={inputStyle}
                disabled={!!isConnector}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Vertical Alignment:</label>
              <select
                value={isConnector && masterProperties ? masterProperties.layout.verticalAlign : formData.layout.verticalAlign}
                onChange={(e) => handleLayoutChange('verticalAlign', e.target.value)}
                style={inputStyle}
                disabled={!!isConnector}
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
        <div style={{
          ...sectionStyle,
          backgroundColor: isConnector ? '#f8f9fa' : 'white',
          opacity: isConnector ? 0.5 : 1,
          pointerEvents: isConnector ? 'none' : 'auto'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '16px' }}>
            🔤 Typography
            {isConnector && (
              <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '10px' }}>
                (Inherited from chain master)
              </span>
            )}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>Font Family:</label>
              <select
                value={isConnector && masterProperties ? masterProperties.typography.fontFamily : formData.typography.fontFamily}
                onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
                style={inputStyle}
                disabled={!!isConnector}
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
                value={isConnector && masterProperties ? masterProperties.typography.fontSize : formData.typography.fontSize}
                onChange={(e) => handleTypographyChange('fontSize', Number(e.target.value))}
                style={inputStyle}
                min="8"
                max="72"
                disabled={!!isConnector}
              />
            </div>
            <div>
              <label style={labelStyle}>Font Color:</label>
              <input
                type="color"
                value={isConnector && masterProperties ? masterProperties.typography.fontColor : formData.typography.fontColor}
                onChange={(e) => handleTypographyChange('fontColor', e.target.value)}
                style={{ ...inputStyle, height: '40px' }}
                disabled={!!isConnector}
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

              {/* Overflow Toggle for Line Text */}
              {onOverflowToggle && isOverflowEnabled && getOverflowRole && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: localOverflowEnabled ? '#e3f2fd' : '#f8f9fa',
                  borderRadius: '6px',
                  border: localOverflowEnabled ? '2px solid #2196f3' : '1px solid #e9ecef',
                  transition: 'all 0.2s ease'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={localOverflowEnabled}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setLocalOverflowEnabled(newValue);
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#2196f3'
                      }}
                    />
                    <span style={{
                      fontWeight: 'bold',
                      color: localOverflowEnabled ? '#1976d2' : '#495057',
                      transition: 'color 0.2s ease'
                    }}>
                      Enable Overflow {localOverflowEnabled ? '✓' : ''}
                    </span>
                  </label>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px', marginLeft: '24px' }}>
                    When enabled, content will flow to connected regions when this region is full
                  </div>
                </div>
              )}
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

              {/* Overflow Toggle for Translation Paragraph */}
              {onOverflowToggle && isOverflowEnabled && getOverflowRole && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: localOverflowEnabled ? '#e3f2fd' : '#f8f9fa',
                  borderRadius: '6px',
                  border: localOverflowEnabled ? '2px solid #2196f3' : '1px solid #e9ecef',
                  transition: 'all 0.2s ease'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={localOverflowEnabled}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setLocalOverflowEnabled(newValue);
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#2196f3'
                      }}
                    />
                    <span style={{
                      fontWeight: 'bold',
                      color: localOverflowEnabled ? '#1976d2' : '#495057',
                      transition: 'color 0.2s ease'
                    }}>
                      Enable Overflow {localOverflowEnabled ? '✓' : ''}
                    </span>
                  </label>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px', marginLeft: '24px' }}>
                    When enabled, content will flow to connected regions when this region is full
                  </div>
                </div>
              )}
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

              {/* Overflow Toggle for Pure English Paragraph */}
              {onOverflowToggle && isOverflowEnabled && getOverflowRole && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: localOverflowEnabled ? '#e3f2fd' : '#f8f9fa',
                  borderRadius: '6px',
                  border: localOverflowEnabled ? '2px solid #2196f3' : '1px solid #e9ecef',
                  transition: 'all 0.2s ease'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={localOverflowEnabled}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setLocalOverflowEnabled(newValue);
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#2196f3'
                      }}
                    />
                    <span style={{
                      fontWeight: 'bold',
                      color: localOverflowEnabled ? '#1976d2' : '#495057',
                      transition: 'color 0.2s ease'
                    }}>
                      Enable Overflow {localOverflowEnabled ? '✓' : ''}
                    </span>
                  </label>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px', marginLeft: '24px' }}>
                    When enabled, content will flow to connected regions when this region is full
                  </div>
                </div>
              )}
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
