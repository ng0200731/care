import React, { useState, useEffect } from 'react';
import MovableDialog from './MovableDialog';

export interface NewCompTransConfig {
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    fontSizeUnit: string;
  };
  alignment: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
}

interface NewCompTransDialogProps {
  isOpen: boolean;
  regionId: string;
  regionWidth: number;
  regionHeight: number;
  editingContent?: any;
  onSave: (config: NewCompTransConfig) => void;
  onCancel: () => void;
}

const NewCompTransDialog: React.FC<NewCompTransDialogProps> = ({
  isOpen,
  regionId,
  regionWidth,
  regionHeight,
  editingContent,
  onSave,
  onCancel
}) => {
  const [config, setConfig] = useState<NewCompTransConfig>({
    padding: {
      top: 2,
      right: 2,
      bottom: 2,
      left: 2
    },
    typography: {
      fontFamily: 'Arial',
      fontSize: 10,
      fontSizeUnit: 'px'
    },
    alignment: {
      horizontal: 'left',
      vertical: 'top'
    }
  });

  // Initialize config from editing content or defaults
  const getInitialConfig = (): NewCompTransConfig => {
    if (editingContent && editingContent.newCompTransConfig) {
      return editingContent.newCompTransConfig;
    }
    
    return {
      padding: {
        top: 2,
        right: 2,
        bottom: 2,
        left: 2
      },
      typography: {
        fontFamily: 'Arial',
        fontSize: 10,
        fontSizeUnit: 'px'
      },
      alignment: {
        horizontal: 'left',
        vertical: 'top'
      }
    };
  };

  useEffect(() => {
    if (isOpen) {
      setConfig(getInitialConfig());
    }
  }, [isOpen, editingContent]);

  const handleSave = () => {
    onSave(config);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <MovableDialog
      isOpen={isOpen}
      title="Composition Translation Settings"
      icon="🌐"
      width="500px"
      storageKey="comp-trans-dialog"
      onClose={handleCancel}
    >
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
        Region: {regionId} ({regionWidth}×{regionHeight}mm)
      </div>

        {/* Padding Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📏 Padding (mm) • <span style={{ color: '#4CAF50', fontSize: '14px' }}>Green dotted lines in canvas</span>
          </h3>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            For all size
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Left Padding
              </label>
              <input
                type="number"
                value={config.padding.left}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  padding: { ...prev.padding, left: parseFloat(e.target.value) || 0 }
                }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                step="0.1"
                min="0"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Top Padding
              </label>
              <input
                type="number"
                value={config.padding.top}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  padding: { ...prev.padding, top: parseFloat(e.target.value) || 0 }
                }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                step="0.1"
                min="0"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Right Padding
              </label>
              <input
                type="number"
                value={config.padding.right}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  padding: { ...prev.padding, right: parseFloat(e.target.value) || 0 }
                }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                step="0.1"
                min="0"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Bottom Padding
              </label>
              <input
                type="number"
                value={config.padding.bottom}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  padding: { ...prev.padding, bottom: parseFloat(e.target.value) || 0 }
                }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                step="0.1"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Typography Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#333'
          }}>
            ✏️ Typography
          </h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
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
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Font Size
              </label>
              <input
                type="number"
                value={config.typography.fontSize}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  typography: { ...prev.typography, fontSize: parseFloat(e.target.value) || 10 }
                }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                step="0.1"
                min="1"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Unit
              </label>
              <select
                value={config.typography.fontSizeUnit}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  typography: { ...prev.typography, fontSizeUnit: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="px">px</option>
                <option value="pt">pt</option>
                <option value="mm">mm</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alignment Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#333'
          }}>
            📐 Alignment
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Horizontal Alignment
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    alignment: { ...prev.alignment, horizontal: align as any }
                  }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: `2px solid ${config.alignment.horizontal === align ? '#007bff' : '#ddd'}`,
                    borderRadius: '4px',
                    backgroundColor: config.alignment.horizontal === align ? '#e7f3ff' : 'white',
                    color: config.alignment.horizontal === align ? '#007bff' : '#333',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Vertical Alignment
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['top', 'center', 'bottom'].map((align) => (
                <button
                  key={align}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    alignment: { ...prev.alignment, vertical: align as any }
                  }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: `2px solid ${config.alignment.vertical === align ? '#007bff' : '#ddd'}`,
                    borderRadius: '4px',
                    backgroundColor: config.alignment.vertical === align ? '#e7f3ff' : 'white',
                    color: config.alignment.vertical === align ? '#007bff' : '#333',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#666',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#007bff',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {editingContent ? 'Update' : 'Add'} Composition Translation
          </button>
        </div>
    </MovableDialog>
  );
};

export default NewCompTransDialog;
