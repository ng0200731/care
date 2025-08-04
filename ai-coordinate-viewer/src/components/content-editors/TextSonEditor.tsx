import React, { useState } from 'react';

export interface TextSonData {
  id: string;
  type: 'text';
  content: string;
  formatting: {
    fontFamily: string;
    fontSize: number;
    textAlign: 'left' | 'center' | 'right';
    fontWeight: 'normal' | 'bold';
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  overflow: {
    handling: 'resize' | 'lineBreaks';
    lineBreakMethod: 'word' | 'character';
  };
  spaceAllocation: {
    region: string;
    rowHeight: number;
    columns: number;
    selectedColumn: number;
  };
  position: {
    x: number;
    y: number;
  };
}

interface TextSonEditorProps {
  data?: TextSonData;
  onChange: (data: TextSonData) => void;
  onClose: () => void;
}

const TextSonEditor: React.FC<TextSonEditorProps> = ({ data, onChange, onClose }) => {
  const [textData, setTextData] = useState<TextSonData>(data || {
    id: `text-${Date.now()}`,
    type: 'text',
    content: '',
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      textAlign: 'left',
      fontWeight: 'normal'
    },
    margins: {
      top: 2,
      bottom: 2,
      left: 2,
      right: 2
    },
    overflow: {
      handling: 'resize',
      lineBreakMethod: 'word'
    },
    spaceAllocation: {
      region: 'content',
      rowHeight: 10,
      columns: 1,
      selectedColumn: 1
    },
    position: {
      x: 0,
      y: 0
    }
  });

  const handleChange = (field: string, value: any) => {
    const updatedData = { ...textData };
    const fieldParts = field.split('.');
    
    if (fieldParts.length === 1) {
      (updatedData as any)[field] = value;
    } else if (fieldParts.length === 2) {
      (updatedData as any)[fieldParts[0]][fieldParts[1]] = value;
    }
    
    setTextData(updatedData);
    onChange(updatedData);
  };

  const setAllMargins = (value: number) => {
    const updatedData = {
      ...textData,
      margins: {
        top: value,
        bottom: value,
        left: value,
        right: value
      }
    };
    setTextData(updatedData);
    onChange(updatedData);
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    fontSize: '13px',
    color: '#2d3748',
    outline: 'none',
    transition: 'border-color 0.3s ease'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '6px'
  };

  const sectionStyle = {
    marginBottom: '20px',
    padding: '15px',
    border: '1px solid #e2e8f0',
    background: '#f9f9f9'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: 'white',
      borderLeft: '1px solid #e2e8f0',
      zIndex: 1000,
      overflow: 'auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#2d3748'
        }}>
          📝 Text Son Object
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#718096'
          }}
        >
          ✕
        </button>
      </div>

      {/* Son Type Selector */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Son Type:</label>
        <select
          value="text"
          style={inputStyle}
          disabled
        >
          <option value="text">📝 Text</option>
          <option value="image">🖼️ Image</option>
          <option value="barcode">📊 Barcode</option>
          <option value="translation">🌐 Translation</option>
          <option value="washing">🧺 Washing Symbol</option>
          <option value="size">📏 Size Breakdown</option>
          <option value="composition">📊 % Composition</option>
          <option value="special">⭐ Special Wording</option>
        </select>
      </div>

      {/* Text Content */}
      <div style={sectionStyle}>
        <label style={labelStyle}>📝 Text Content:</label>
        <textarea
          value={textData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="Enter text content..."
          style={{
            ...inputStyle,
            minHeight: '80px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Text Formatting */}
      <div style={sectionStyle}>
        <h4 style={{
          margin: '0 0 15px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2d3748'
        }}>
          🎨 Text Formatting
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {/* Font Family */}
          <div>
            <label style={labelStyle}>Font Family:</label>
            <select
              value={textData.formatting.fontFamily}
              onChange={(e) => handleChange('formatting.fontFamily', e.target.value)}
              style={inputStyle}
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label style={labelStyle}>Font Size:</label>
            <input
              type="number"
              value={textData.formatting.fontSize}
              onChange={(e) => handleChange('formatting.fontSize', parseInt(e.target.value))}
              style={inputStyle}
              min="6"
              max="72"
            />
          </div>

          {/* Text Align */}
          <div>
            <label style={labelStyle}>Text Align:</label>
            <select
              value={textData.formatting.textAlign}
              onChange={(e) => handleChange('formatting.textAlign', e.target.value)}
              style={inputStyle}
            >
              <option value="left">⬅️ Left</option>
              <option value="center">↔️ Center</option>
              <option value="right">➡️ Right</option>
            </select>
          </div>

          {/* Font Weight */}
          <div>
            <label style={labelStyle}>Font Weight:</label>
            <select
              value={textData.formatting.fontWeight}
              onChange={(e) => handleChange('formatting.fontWeight', e.target.value)}
              style={inputStyle}
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Text Margins */}
      <div style={sectionStyle}>
        <h4 style={{
          margin: '0 0 15px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2d3748'
        }}>
          📏 Text Margins (mm)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          {/* Top Margin */}
          <div>
            <label style={labelStyle}>⬆️ Top:</label>
            <input
              type="number"
              value={textData.margins.top}
              onChange={(e) => handleChange('margins.top', parseFloat(e.target.value))}
              style={inputStyle}
              min="0"
              step="0.1"
            />
          </div>

          {/* Bottom Margin */}
          <div>
            <label style={labelStyle}>⬇️ Bottom:</label>
            <input
              type="number"
              value={textData.margins.bottom}
              onChange={(e) => handleChange('margins.bottom', parseFloat(e.target.value))}
              style={inputStyle}
              min="0"
              step="0.1"
            />
          </div>

          {/* Left Margin */}
          <div>
            <label style={labelStyle}>⬅️ Left:</label>
            <input
              type="number"
              value={textData.margins.left}
              onChange={(e) => handleChange('margins.left', parseFloat(e.target.value))}
              style={inputStyle}
              min="0"
              step="0.1"
            />
          </div>

          {/* Right Margin */}
          <div>
            <label style={labelStyle}>➡️ Right:</label>
            <input
              type="number"
              value={textData.margins.right}
              onChange={(e) => handleChange('margins.right', parseFloat(e.target.value))}
              style={inputStyle}
              min="0"
              step="0.1"
            />
          </div>
        </div>

        {/* Quick Margin Presets */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setAllMargins(2)}
            style={{
              padding: '6px 12px',
              background: '#f7fafc',
              border: '1px solid #e2e8f0',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f7fafc';
            }}
          >
            📐 2mm All
          </button>
          <button
            onClick={() => setAllMargins(1)}
            style={{
              padding: '6px 12px',
              background: '#f7fafc',
              border: '1px solid #e2e8f0',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f7fafc';
            }}
          >
            🔍 1mm All
          </button>
          <button
            onClick={() => setAllMargins(0)}
            style={{
              padding: '6px 12px',
              background: '#f7fafc',
              border: '1px solid #e2e8f0',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f7fafc';
            }}
          >
            ⭕ No Margins
          </button>
        </div>
      </div>

      {/* Text Overflow Handling */}
      <div style={sectionStyle}>
        <h4 style={{
          margin: '0 0 15px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2d3748'
        }}>
          📏 Text Overflow Handling
        </h4>

        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>When text is too long:</label>
          <select
            value={textData.overflow.handling}
            onChange={(e) => handleChange('overflow.handling', e.target.value)}
            style={inputStyle}
          >
            <option value="resize">🔍 Resize to fit</option>
            <option value="lineBreaks">📝 Accept line breaks</option>
          </select>
        </div>

        {textData.overflow.handling === 'lineBreaks' && (
          <div>
            <label style={labelStyle}>Line break method:</label>
            <select
              value={textData.overflow.lineBreakMethod}
              onChange={(e) => handleChange('overflow.lineBreakMethod', e.target.value)}
              style={inputStyle}
            >
              <option value="word">🔤 Word break (break at word boundaries)</option>
              <option value="character">✂️ Character break with connector</option>
            </select>
          </div>
        )}
      </div>

      {/* Space Allocation */}
      <div style={sectionStyle}>
        <h4 style={{
          margin: '0 0 15px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2d3748'
        }}>
          📐 Space Allocation
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {/* Region */}
          <div>
            <label style={labelStyle}>Region:</label>
            <select
              value={textData.spaceAllocation.region}
              onChange={(e) => handleChange('spaceAllocation.region', e.target.value)}
              style={inputStyle}
            >
              <option value="content">Content</option>
              <option value="header">Header</option>
              <option value="footer">Footer</option>
              <option value="sidebar">Sidebar</option>
            </select>
          </div>

          {/* Row Height */}
          <div>
            <label style={labelStyle}>Row Height:</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                value={textData.spaceAllocation.rowHeight}
                onChange={(e) => handleChange('spaceAllocation.rowHeight', parseFloat(e.target.value))}
                style={{ ...inputStyle, marginRight: '5px' }}
                min="1"
                step="0.1"
              />
              <span style={{ fontSize: '12px', color: '#718096' }}>mm</span>
            </div>
          </div>

          {/* Columns */}
          <div>
            <label style={labelStyle}>Columns:</label>
            <input
              type="number"
              value={textData.spaceAllocation.columns}
              onChange={(e) => handleChange('spaceAllocation.columns', parseInt(e.target.value))}
              style={inputStyle}
              min="1"
              max="12"
            />
          </div>

          {/* Selected Column */}
          <div>
            <label style={labelStyle}>Selected Column:</label>
            <input
              type="number"
              value={textData.spaceAllocation.selectedColumn}
              onChange={(e) => handleChange('spaceAllocation.selectedColumn', parseInt(e.target.value))}
              style={inputStyle}
              min="1"
              max={textData.spaceAllocation.columns}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <button
          onClick={() => {
            onChange(textData);
            onClose();
          }}
          style={{
            flex: 1,
            padding: '12px',
            background: '#2d3748',
            color: 'white',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4a5568';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#2d3748';
          }}
        >
          ✅ Apply Changes
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '12px',
            background: '#f7fafc',
            color: '#2d3748',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f7fafc';
          }}
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  );
};

export default TextSonEditor;
