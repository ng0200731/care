import React, { useState, useEffect } from 'react';

export interface NewWashingCareSymbolConfig {
  symbols: string[];
  padding: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  alignment: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    fontSizeUnit: 'px' | 'pt' | 'mm';
  };
  iconSize: number;
}

interface NewWashingCareSymbolDialogProps {
  isOpen: boolean;
  regionId: string;
  regionWidth: number;
  regionHeight: number;
  onSave: (config: NewWashingCareSymbolConfig) => void;
  onCancel: () => void;
  editingContent?: any;
}

const NewWashingCareSymbolDialog: React.FC<NewWashingCareSymbolDialogProps> = ({
  isOpen,
  regionId,
  regionWidth,
  regionHeight,
  onSave,
  onCancel,
  editingContent
}) => {
  // Initialize config based on editing content or defaults
  const getInitialConfig = (): NewWashingCareSymbolConfig => {
    if (editingContent && editingContent.newWashingCareSymbolConfig) {
      return editingContent.newWashingCareSymbolConfig;
    } else if (editingContent) {
      // Convert from existing content structure
      return {
        symbols: editingContent.content?.symbols || ['b', 'G', '5', 'B', 'J'],
        padding: editingContent.layout?.padding || { left: 2, top: 2, right: 2, bottom: 2 },
        alignment: {
          horizontal: editingContent.layout?.horizontalAlign || 'center',
          vertical: editingContent.layout?.verticalAlign || 'center'
        },
        typography: {
          fontFamily: 'Wash Care Symbols M54',
          fontSize: editingContent.content?.iconSize || 8,
          fontSizeUnit: 'mm' as const
        },
        iconSize: editingContent.content?.iconSize || 8
      };
    } else {
      // Default values for new content
      return {
        symbols: ['b', 'G', '5', 'B', 'J'], // Default all 5 symbols
        padding: { left: 2, top: 2, right: 2, bottom: 2 },
        alignment: { horizontal: 'center', vertical: 'center' },
        typography: {
          fontFamily: 'Wash Care Symbols M54',
          fontSize: 8,
          fontSizeUnit: 'mm' as const
        },
        iconSize: 8
      };
    }
  };

  const [config, setConfig] = useState<NewWashingCareSymbolConfig>(getInitialConfig());

  // State for "For all size" padding sync
  const [syncAllPadding, setSyncAllPadding] = useState(false);

  // State for dropdown selections and checkboxes (derived from config)
  const [selections, setSelections] = useState({
    washing: { dropdown: 'option1', checked: true },
    drying: { dropdown: 'option1', checked: true },
    ironing: { dropdown: 'option1', checked: true },
    bleaching: { dropdown: 'option1', checked: true },
    professional: { dropdown: 'option1', checked: true }
  });

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

  // Select All handler
  const handleSelectAll = () => {
    setSelections({
      washing: { dropdown: 'option1', checked: true },
      drying: { dropdown: 'option1', checked: true },
      ironing: { dropdown: 'option1', checked: true },
      bleaching: { dropdown: 'option1', checked: true },
      professional: { dropdown: 'option1', checked: true }
    });
  };

  // Validation and save handler
  const handleSave = () => {
    const allSelected = Object.values(selections).every(item => item.checked);

    if (!allSelected) {
      alert('Please select all 5 care symbols before saving.');
      return;
    }

    // Save the complete configuration
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '700px',
        height: '600px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '24px',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          🧺 Washing Care Symbol
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
          }}>
            Region: {regionId} ({regionWidth}mm × {regionHeight}mm)
          </label>
        </div>

        {/* 5 Washing Care Icons in a row with dropdowns */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          padding: '20px 0'
        }}>
          {/* Icons Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '15px'
          }}>
            {/* Washing Icon */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flex: 1
            }}>
              {/* Washing Symbol using Wash Care Symbols M54 font */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                fontFamily: 'Wash Care Symbols M54',
                fontSize: '32px',
                color: 'black'
              }}>
                b
              </div>
              <select
                value={selections.washing.dropdown}
                onChange={(e) => setSelections(prev => ({
                  ...prev,
                  washing: { ...prev.washing, dropdown: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select</option>
              </select>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={selections.washing.checked}
                  onChange={(e) => setSelections(prev => ({
                    ...prev,
                    washing: { ...prev.washing, checked: e.target.checked }
                  }))}
                />
                Select
              </label>
            </div>

            {/* Drying Icon */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flex: 1
            }}>
              {/* Drying Symbol using Wash Care Symbols M54 font */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                fontFamily: 'Wash Care Symbols M54',
                fontSize: '32px',
                color: 'black'
              }}>
                G
              </div>
              <select
                value={selections.drying.dropdown}
                onChange={(e) => setSelections(prev => ({
                  ...prev,
                  drying: { ...prev.drying, dropdown: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select</option>
              </select>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={selections.drying.checked}
                  onChange={(e) => setSelections(prev => ({
                    ...prev,
                    drying: { ...prev.drying, checked: e.target.checked }
                  }))}
                />
                Select
              </label>
            </div>

            {/* Ironing Icon */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flex: 1
            }}>
              {/* Ironing Symbol using Wash Care Symbols M54 font */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                fontFamily: 'Wash Care Symbols M54',
                fontSize: '32px',
                color: 'black'
              }}>
                5
              </div>
              <select
                value={selections.ironing.dropdown}
                onChange={(e) => setSelections(prev => ({
                  ...prev,
                  ironing: { ...prev.ironing, dropdown: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select</option>
              </select>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={selections.ironing.checked}
                  onChange={(e) => setSelections(prev => ({
                    ...prev,
                    ironing: { ...prev.ironing, checked: e.target.checked }
                  }))}
                />
                Select
              </label>
            </div>

            {/* Bleaching Icon */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flex: 1
            }}>
              {/* Bleaching Symbol using Wash Care Symbols M54 font */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                fontFamily: 'Wash Care Symbols M54',
                fontSize: '32px',
                color: 'black'
              }}>
                B
              </div>
              <select
                value={selections.bleaching.dropdown}
                onChange={(e) => setSelections(prev => ({
                  ...prev,
                  bleaching: { ...prev.bleaching, dropdown: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select</option>
              </select>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={selections.bleaching.checked}
                  onChange={(e) => setSelections(prev => ({
                    ...prev,
                    bleaching: { ...prev.bleaching, checked: e.target.checked }
                  }))}
                />
                Select
              </label>
            </div>

            {/* Professional Care Icon */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flex: 1
            }}>
              {/* Professional Symbol using Wash Care Symbols M54 font */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                fontFamily: 'Wash Care Symbols M54',
                fontSize: '32px',
                color: 'black'
              }}>
                J
              </div>
              <select
                value={selections.professional.dropdown}
                onChange={(e) => setSelections(prev => ({
                  ...prev,
                  professional: { ...prev.professional, dropdown: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select</option>
              </select>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={selections.professional.checked}
                  onChange={(e) => setSelections(prev => ({
                    ...prev,
                    professional: { ...prev.professional, checked: e.target.checked }
                  }))}
                />
                Select
              </label>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Configuration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Left Column - Padding */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Padding (mm):
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={syncAllPadding}
                    onChange={(e) => setSyncAllPadding(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', color: '#666' }}>For all size</span>
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>Top</label>
                  <input
                    type="number"
                    value={config.padding.top}
                    onChange={(e) => handlePaddingChange('top', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>Right</label>
                  <input
                    type="number"
                    value={config.padding.right}
                    onChange={(e) => handlePaddingChange('right', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: syncAllPadding ? '#f5f5f5' : 'white',
                      cursor: syncAllPadding ? 'not-allowed' : 'text'
                    }}
                    disabled={syncAllPadding}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>Bottom</label>
                  <input
                    type="number"
                    value={config.padding.bottom}
                    onChange={(e) => handlePaddingChange('bottom', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: syncAllPadding ? '#f5f5f5' : 'white',
                      cursor: syncAllPadding ? 'not-allowed' : 'text'
                    }}
                    disabled={syncAllPadding}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>Left</label>
                  <input
                    type="number"
                    value={config.padding.left}
                    onChange={(e) => handlePaddingChange('left', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: syncAllPadding ? '#f5f5f5' : 'white',
                      cursor: syncAllPadding ? 'not-allowed' : 'text'
                    }}
                    disabled={syncAllPadding}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Alignment & Icon Size */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Alignment & Size:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Horizontal Alignment */}
                <div>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>Horizontal</label>
                  <select
                    value={config.alignment.horizontal}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      alignment: { ...prev.alignment, horizontal: e.target.value as 'left' | 'center' | 'right' }
                    }))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                {/* Vertical Alignment */}
                <div>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>Vertical</label>
                  <select
                    value={config.alignment.vertical}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      alignment: { ...prev.alignment, vertical: e.target.value as 'top' | 'center' | 'bottom' }
                    }))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
                {/* Icon Size */}
                <div>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>Icon Size (mm)</label>
                  <input
                    type="number"
                    value={config.iconSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setConfig(prev => ({
                        ...prev,
                        iconSize: newSize,
                        typography: {
                          ...prev.typography,
                          fontSize: newSize
                        }
                      }));
                    }}
                    min="4"
                    max="20"
                    step="0.5"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginTop: '20px'
        }}>
          {/* Select All Button */}
          <button
            onClick={handleSelectAll}
            style={{
              padding: '8px 16px',
              border: '2px solid #10b981',
              borderRadius: '6px',
              background: 'white',
              color: '#10b981',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Select All
          </button>

          {/* Cancel and Save buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                border: '2px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
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
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewWashingCareSymbolDialog;
