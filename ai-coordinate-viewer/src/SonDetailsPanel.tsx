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
  sonType: 'text' | 'image' | 'barcode' | 'translation' | 'washing-symbol' | 'size-breakdown' | 'composition' | 'special-wording';
  content: string;
  details: any;
  fontFamily?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  textOverflow?: 'resize' | 'linebreak';
  lineBreakType?: 'word' | 'character';
  characterConnector?: string;
  spaceAllocation?: {
    region: string;
    rowHeight: number;
    columns: number;
    selectedColumn: number;
    allocated: boolean;
  };
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

  // Create unique identifier for this object (name + position to handle duplicate names)
  const objectId = `${selectedObject.name}_${selectedObject.x}_${selectedObject.y}`;

  // Get or create metadata for this son
  const currentMetadata = sonMetadata.get(objectId) || {
    id: objectId,
    sonType: 'text',
    content: '',
    details: {},
    fontFamily: 'Arial',
    fontSize: 12,
    textAlign: 'left',
    fontWeight: 'normal',
    textOverflow: 'linebreak',
    lineBreakType: 'word',
    characterConnector: '-'
  };

  const handleTypeChange = (newType: SonMetadata['sonType']) => {
    const updatedMetadata: SonMetadata = {
      ...currentMetadata,
      sonType: newType,
      details: {} // Reset details when type changes
    };
    onUpdateMetadata(objectId, updatedMetadata);
  };

  const handleContentChange = (newContent: string) => {
    const updatedMetadata: SonMetadata = {
      ...currentMetadata,
      content: newContent
    };
    onUpdateMetadata(objectId, updatedMetadata);
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

            {/* Font Formatting Controls */}
            <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>🎨 Text Formatting</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                {/* Font Family */}
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px', fontWeight: 'bold' }}>
                    Font Family:
                  </label>
                  <select
                    value={currentMetadata.fontFamily || 'Arial'}
                    onChange={(e) => {
                      const updatedMetadata = { ...currentMetadata, fontFamily: e.target.value };
                      onUpdateMetadata(objectId, updatedMetadata);
                    }}
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Georgia">Georgia</option>
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px', fontWeight: 'bold' }}>
                    Font Size:
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="72"
                    value={currentMetadata.fontSize || 12}
                    onChange={(e) => {
                      const updatedMetadata = { ...currentMetadata, fontSize: parseInt(e.target.value) };
                      onUpdateMetadata(objectId, updatedMetadata);
                    }}
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Text Alignment */}
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px', fontWeight: 'bold' }}>
                    Text Align:
                  </label>
                  <select
                    value={currentMetadata.textAlign || 'left'}
                    onChange={(e) => {
                      const updatedMetadata = { ...currentMetadata, textAlign: e.target.value as 'left' | 'center' | 'right' };
                      onUpdateMetadata(objectId, updatedMetadata);
                    }}
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="left">⬅️ Left</option>
                    <option value="center">⬅️➡️ Center</option>
                    <option value="right">➡️ Right</option>
                  </select>
                </div>

                {/* Font Weight */}
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px', fontWeight: 'bold' }}>
                    Font Weight:
                  </label>
                  <select
                    value={currentMetadata.fontWeight || 'normal'}
                    onChange={(e) => {
                      const updatedMetadata = { ...currentMetadata, fontWeight: e.target.value as 'normal' | 'bold' };
                      onUpdateMetadata(objectId, updatedMetadata);
                    }}
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>

              {/* Text Overflow Handling */}
              <div style={{ marginTop: '15px', padding: '10px', background: '#fff3e0', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#e65100' }}>📏 Text Overflow Handling</h4>

                {/* Overflow Method */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                    When text is too long:
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="textOverflow"
                        value="resize"
                        checked={currentMetadata.textOverflow === 'resize'}
                        onChange={(e) => {
                          const updatedMetadata = { ...currentMetadata, textOverflow: e.target.value as 'resize' | 'linebreak' };
                          onUpdateMetadata(objectId, updatedMetadata);
                        }}
                        style={{ marginRight: '5px' }}
                      />
                      🔍 Resize to fit
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="textOverflow"
                        value="linebreak"
                        checked={currentMetadata.textOverflow === 'linebreak'}
                        onChange={(e) => {
                          const updatedMetadata = { ...currentMetadata, textOverflow: e.target.value as 'resize' | 'linebreak' };
                          onUpdateMetadata(objectId, updatedMetadata);
                        }}
                        style={{ marginRight: '5px' }}
                      />
                      📝 Accept line breaks
                    </label>
                  </div>
                </div>

                {/* Line Break Options (only show when linebreak is selected) */}
                {currentMetadata.textOverflow === 'linebreak' && (
                  <div style={{ marginLeft: '20px', padding: '8px', background: 'rgba(255,255,255,0.7)', borderRadius: '3px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                      Line break method:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="lineBreakType"
                          value="word"
                          checked={currentMetadata.lineBreakType === 'word'}
                          onChange={(e) => {
                            const updatedMetadata = { ...currentMetadata, lineBreakType: e.target.value as 'word' | 'character' };
                            onUpdateMetadata(objectId, updatedMetadata);
                          }}
                          style={{ marginRight: '5px' }}
                        />
                        🔤 Word break (break at word boundaries)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="lineBreakType"
                          value="character"
                          checked={currentMetadata.lineBreakType === 'character'}
                          onChange={(e) => {
                            const updatedMetadata = { ...currentMetadata, lineBreakType: e.target.value as 'word' | 'character' };
                            onUpdateMetadata(objectId, updatedMetadata);
                          }}
                          style={{ marginRight: '5px' }}
                        />
                        ✂️ Character break with connector
                      </label>

                      {/* Character Connector Input (only show when character break is selected) */}
                      {currentMetadata.lineBreakType === 'character' && (
                        <div style={{ marginLeft: '20px', marginTop: '5px' }}>
                          <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px', fontWeight: 'bold' }}>
                            Connector character:
                          </label>
                          <input
                            type="text"
                            maxLength={3}
                            value={currentMetadata.characterConnector || '-'}
                            onChange={(e) => {
                              const updatedMetadata = { ...currentMetadata, characterConnector: e.target.value };
                              onUpdateMetadata(objectId, updatedMetadata);
                            }}
                            placeholder="-"
                            style={{
                              width: '60px',
                              padding: '3px 6px',
                              border: '1px solid #ddd',
                              borderRadius: '3px',
                              fontSize: '12px',
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ fontSize: '10px', color: '#666', marginLeft: '5px' }}>
                            (e.g., -, /, |)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Space Allocation Info (if allocated) */}
              {currentMetadata.spaceAllocation?.allocated && (
                <div style={{ marginTop: '15px', padding: '10px', background: '#e8f5e8', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#2e7d32' }}>📐 Space Allocation</h4>
                  <div style={{ fontSize: '12px', color: '#2e7d32' }}>
                    <div><strong>Region:</strong> {currentMetadata.spaceAllocation.region}</div>
                    <div><strong>Row Height:</strong> {currentMetadata.spaceAllocation.rowHeight}mm</div>
                    <div><strong>Columns:</strong> {currentMetadata.spaceAllocation.columns}</div>
                    <div><strong>Selected Column:</strong> {currentMetadata.spaceAllocation.selectedColumn}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'image':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Image File:
            </label>
            <input
              type="file"
              accept="image/*"
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
              🖼️ Image processing and optimization will be available in the next milestone
            </div>
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
          <option value="image">🖼️ Image</option>
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
