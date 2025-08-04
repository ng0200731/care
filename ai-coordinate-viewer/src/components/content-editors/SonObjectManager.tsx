import React, { useState } from 'react';
import TextSonEditor, { TextSonData } from './TextSonEditor';

export type SonObjectType = 'text' | 'image' | 'barcode' | 'translation' | 'washing' | 'size' | 'composition' | 'special';

export interface BaseSonObject {
  id: string;
  type: SonObjectType;
  position: {
    x: number;
    y: number;
  };
}

export type SonObject = TextSonData; // Will expand as we add more types

interface SonObjectManagerProps {
  sonObjects: SonObject[];
  onSonObjectsChange: (objects: SonObject[]) => void;
}

const SonObjectManager: React.FC<SonObjectManagerProps> = ({ sonObjects, onSonObjectsChange }) => {
  const [activeEditor, setActiveEditor] = useState<{
    type: SonObjectType;
    data?: SonObject;
    index?: number;
  } | null>(null);

  const sonObjectTypes = [
    { type: 'text' as SonObjectType, icon: '📝', label: 'Text' },
    { type: 'image' as SonObjectType, icon: '🖼️', label: 'Image' },
    { type: 'barcode' as SonObjectType, icon: '📊', label: 'Barcode' },
    { type: 'translation' as SonObjectType, icon: '🌐', label: 'Translation' },
    { type: 'washing' as SonObjectType, icon: '🧺', label: 'Washing Symbol' },
    { type: 'size' as SonObjectType, icon: '📏', label: 'Size Breakdown' },
    { type: 'composition' as SonObjectType, icon: '📊', label: '% Composition' },
    { type: 'special' as SonObjectType, icon: '⭐', label: 'Special Wording' }
  ];

  const handleCreateSonObject = (type: SonObjectType) => {
    setActiveEditor({ type });
  };

  const handleEditSonObject = (object: SonObject, index: number) => {
    setActiveEditor({ type: object.type, data: object, index });
  };

  const handleSonObjectChange = (updatedObject: SonObject) => {
    const newObjects = [...sonObjects];
    
    if (activeEditor?.index !== undefined) {
      // Editing existing object
      newObjects[activeEditor.index] = updatedObject;
    } else {
      // Creating new object
      newObjects.push(updatedObject);
    }
    
    onSonObjectsChange(newObjects);
  };

  const handleDeleteSonObject = (index: number) => {
    const newObjects = sonObjects.filter((_, i) => i !== index);
    onSonObjectsChange(newObjects);
  };

  const closeEditor = () => {
    setActiveEditor(null);
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: '#f7fafc',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    fontWeight: '500',
    color: '#2d3748',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    textAlign: 'left' as const
  };

  const objectItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    background: 'white',
    border: '1px solid #e2e8f0',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '350px',
      height: '100vh',
      background: '#f9f9f9',
      borderLeft: '1px solid #e2e8f0',
      zIndex: 999,
      overflow: 'auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '25px',
        paddingBottom: '15px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#2d3748'
        }}>
          🎯 Son Object Manager
        </h3>
        <p style={{
          margin: '5px 0 0 0',
          fontSize: '13px',
          color: '#718096'
        }}>
          Add content elements to your template
        </p>
      </div>

      {/* Create New Son Object */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{
          margin: '0 0 15px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2d3748'
        }}>
          ➕ Add New Son Object
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {sonObjectTypes.map((sonType) => (
            <button
              key={sonType.type}
              onClick={() => handleCreateSonObject(sonType.type)}
              style={buttonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f7fafc';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              disabled={sonType.type !== 'text'} // Only text is implemented for now
              title={sonType.type !== 'text' ? 'Coming soon' : ''}
            >
              <span style={{ fontSize: '16px' }}>{sonType.icon}</span>
              <span style={{ 
                fontSize: '12px',
                opacity: sonType.type !== 'text' ? 0.5 : 1
              }}>
                {sonType.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Existing Son Objects */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{
          margin: '0 0 15px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2d3748'
        }}>
          📋 Existing Son Objects ({sonObjects.length})
        </h4>
        
        {sonObjects.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#718096',
            fontSize: '13px',
            background: 'white',
            border: '1px solid #e2e8f0'
          }}>
            No son objects created yet.<br />
            Click "Add New Son Object" to get started.
          </div>
        ) : (
          sonObjects.map((object, index) => {
            const sonType = sonObjectTypes.find(t => t.type === object.type);
            return (
              <div
                key={object.id}
                style={objectItemStyle}
                onClick={() => handleEditSonObject(object, index)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f7fafc';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{sonType?.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>
                      {sonType?.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#718096' }}>
                      {object.type === 'text' && (object as TextSonData).content
                        ? `"${(object as TextSonData).content.substring(0, 30)}${(object as TextSonData).content.length > 30 ? '...' : ''}"`
                        : 'No content'
                      }
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSonObject(index);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e53e3e',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title="Delete son object"
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Active Editor */}
      {activeEditor && activeEditor.type === 'text' && (
        <TextSonEditor
          data={activeEditor.data as TextSonData}
          onChange={handleSonObjectChange}
          onClose={closeEditor}
        />
      )}
    </div>
  );
};

export default SonObjectManager;
