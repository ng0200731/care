import React from 'react';

interface AIObject {
  name: string;
  typename: string;
  type?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SonMetadata {
  id: string;
  sonType: 'text' | 'barcode' | 'translation' | 'washing-symbol' | 'size-breakdown' | 'composition' | 'special-wording';
  content: string;
  details: any;
}

interface SonDetailsPanelProps {
  selectedObject: AIObject | null;
  sonMetadata: Map<string, SonMetadata>;
  onUpdateMetadata: (objectName: string, metadata: SonMetadata) => void;
}

const SonDetailsPanel: React.FC<SonDetailsPanelProps> = ({
  selectedObject,
  sonMetadata,
  onUpdateMetadata
}) => {
  // Check if selected object is a son
  const isSon = selectedObject?.type?.includes('son');
  
  if (!selectedObject) {
    return (
      <div style={{ padding: '20px', color: '#666' }}>
        <h3>📋 Object Details</h3>
        <p>Select an object to see details</p>
      </div>
    );
  }

  if (!isSon) {
    return (
      <div style={{ padding: '20px' }}>
        <h3>📋 Object Details</h3>
        <div style={{ marginBottom: '15px' }}>
          <strong>Name:</strong> {selectedObject.name}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>Type:</strong> {selectedObject.typename}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>Position:</strong> ({selectedObject.x.toFixed(1)}, {selectedObject.y.toFixed(1)})
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>Size:</strong> {selectedObject.width.toFixed(1)} × {selectedObject.height.toFixed(1)} mm
        </div>
        {selectedObject.type?.includes('mother') && (
          <div style={{ 
            padding: '10px', 
            background: '#fff3e0', 
            borderRadius: '5px',
            color: '#e65100'
          }}>
            👑 This is a mother object. Click on son objects to configure their types and content.
          </div>
        )}
      </div>
    );
  }

  // Get or create metadata for this son
  const currentMetadata = sonMetadata.get(selectedObject.name) || {
    id: selectedObject.name,
    sonType: 'text',
    content: '',
    details: {}
  };

  const handleTypeChange = (newType: SonMetadata['sonType']) => {
    const updatedMetadata: SonMetadata = {
      ...currentMetadata,
      sonType: newType,
      details: {} // Reset details when type changes
    };
    onUpdateMetadata(selectedObject.name, updatedMetadata);
  };

  const handleContentChange = (newContent: string) => {
    const updatedMetadata: SonMetadata = {
      ...currentMetadata,
      content: newContent
    };
    onUpdateMetadata(selectedObject.name, updatedMetadata);
  };

  const renderTypeSpecificFields = () => {
    switch (currentMetadata.sonType) {
      case 'text':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Text Content:
            </label>
            <textarea
              value={currentMetadata.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter text content..."
              style={{
                width: '100%',
                height: '80px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        );
      
      case 'barcode':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Barcode Content:
            </label>
            <input
              type="text"
              value={currentMetadata.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter barcode data..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Barcode Format:
              </label>
              <select style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}>
                <option value="code128">Code 128</option>
                <option value="qr">QR Code</option>
                <option value="ean13">EAN-13</option>
                <option value="datamatrix">Data Matrix</option>
              </select>
            </div>
          </div>
        );
      
      case 'translation':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Base Text:
            </label>
            <input
              type="text"
              value={currentMetadata.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter text to translate..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              background: '#e3f2fd', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              🌍 Translation management will be available in the next milestone
            </div>
          </div>
        );
      
      case 'washing-symbol':
        return (
          <div>
            <div style={{ 
              padding: '10px', 
              background: '#e8f5e8', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              🧺 Washing symbol selection will be available in the next milestone
            </div>
          </div>
        );
      
      case 'size-breakdown':
        return (
          <div>
            <div style={{ 
              padding: '10px', 
              background: '#fff3e0', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              📏 Size breakdown management will be available in the next milestone
            </div>
          </div>
        );
      
      case 'composition':
        return (
          <div>
            <div style={{ 
              padding: '10px', 
              background: '#fce4ec', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              📊 Composition management will be available in the next milestone
            </div>
          </div>
        );
      
      case 'special-wording':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Special Wording:
            </label>
            <textarea
              value={currentMetadata.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter special instructions or wording..."
              style={{
                width: '100%',
                height: '80px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>👶 Son Details</h3>
      
      {/* Basic Object Info */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
        <div style={{ marginBottom: '5px' }}>
          <strong>Name:</strong> {selectedObject.name}
        </div>
        <div style={{ marginBottom: '5px' }}>
          <strong>Type:</strong> {selectedObject.type}
        </div>
        <div style={{ marginBottom: '5px' }}>
          <strong>Position:</strong> ({selectedObject.x.toFixed(1)}, {selectedObject.y.toFixed(1)})
        </div>
        <div>
          <strong>Size:</strong> {selectedObject.width.toFixed(1)} × {selectedObject.height.toFixed(1)} mm
        </div>
      </div>

      {/* Son Type Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          🎯 Son Type:
        </label>
        <select
          value={currentMetadata.sonType}
          onChange={(e) => handleTypeChange(e.target.value as SonMetadata['sonType'])}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px',
            background: 'white'
          }}
        >
          <option value="text">📝 Text</option>
          <option value="barcode">📊 Barcode</option>
          <option value="translation">🌍 Translation</option>
          <option value="washing-symbol">🧺 Washing Symbol</option>
          <option value="size-breakdown">📏 Size Breakdown</option>
          <option value="composition">📊 % Composition</option>
          <option value="special-wording">⭐ Special Wording</option>
        </select>
      </div>

      {/* Type-Specific Fields */}
      <div style={{ marginBottom: '20px' }}>
        {renderTypeSpecificFields()}
      </div>

      {/* Metadata Summary */}
      <div style={{ 
        padding: '10px', 
        background: '#f0f0f0', 
        borderRadius: '5px',
        fontSize: '12px',
        color: '#666'
      }}>
        <strong>Current Configuration:</strong><br />
        Type: {currentMetadata.sonType}<br />
        Content: {currentMetadata.content || '(empty)'}
      </div>
    </div>
  );
};

export default SonDetailsPanel;
