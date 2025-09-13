import React, { useState } from 'react';

interface NewWashingCareSymbolDialogProps {
  isOpen: boolean;
  regionId: string;
  regionWidth: number;
  regionHeight: number;
  onSave: (selectedSymbols: string[]) => void;
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
  // State for dropdown selections and checkboxes
  const [selections, setSelections] = useState({
    washing: { dropdown: '', checked: false },
    drying: { dropdown: '', checked: false },
    ironing: { dropdown: '', checked: false },
    bleaching: { dropdown: '', checked: false },
    professional: { dropdown: '', checked: false }
  });

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

    // Create array of selected symbols for display using Wash Care Symbols M54 font
    const selectedSymbols = [
      'b', // Washing symbol
      'G', // Drying symbol
      '5', // Ironing symbol
      'B', // Bleaching symbol
      'J'  // Professional symbol
    ];

    onSave(selectedSymbols);
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
        width: '600px',
        height: '350px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column'
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
