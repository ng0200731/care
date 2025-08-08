import React, { useState, useEffect } from 'react';
// import MovableDialog from '../MovableDialog';

export interface PureEnglishParagraphData {
  id: string;
  type: 'pure-english-paragraph';
  regionId: string;
  content: string;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontFamily: string;
  fontSize: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineBreakMethod: 'word' | 'alphabet';
  lineBreakSymbol: string;
  // Region occupation settings
  occupyFullRegion: boolean;
  heightValue: number;
  heightUnit: 'mm' | 'percentage';
  position: 'top' | 'center' | 'bottom';
}

interface PureEnglishParagraphDialogProps {
  isOpen: boolean;
  regionId: string;
  regionHeight?: number; // in mm
  occupationData?: {
    occupyFullRegion: boolean;
    heightValue: number;
    heightUnit: 'mm' | 'percentage';
    position: 'top' | 'center' | 'bottom';
  };
  onSave: (data: PureEnglishParagraphData) => void;
  onCancel: () => void;
}

const fontFamilies = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 
  'Georgia', 'Calibri', 'Tahoma', 'Trebuchet MS', 'Comic Sans MS'
];

const PureEnglishParagraphDialog: React.FC<PureEnglishParagraphDialogProps> = ({
  isOpen,
  regionId,
  regionHeight = 50,
  occupationData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<PureEnglishParagraphData>({
    id: `pure-english-${Date.now()}`,
    type: 'pure-english-paragraph',
    regionId,
    content: '',
    padding: {
      top: 2,
      right: 2,
      bottom: 2,
      left: 2
    },
    fontFamily: 'Arial',
    fontSize: 12,
    color: '#000000',
    textAlign: 'left',
    lineBreakMethod: 'word',
    lineBreakSymbol: '-',
    // Region occupation settings
    occupyFullRegion: occupationData?.occupyFullRegion ?? true,
    heightValue: occupationData?.heightValue ?? 10,
    heightUnit: occupationData?.heightUnit ?? 'mm',
    position: occupationData?.position ?? 'top'
  });

  // Update regionId when prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      regionId: regionId
    }));
  }, [regionId]);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('padding.')) {
      const paddingField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        padding: {
          ...prev.padding,
          [paddingField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const setAllPadding = (value: number) => {
    setFormData(prev => ({
      ...prev,
      padding: {
        top: value,
        right: value,
        bottom: value,
        left: value
      }
    }));
  };

  const handleSave = () => {
    if (!formData.content.trim()) {
      alert('Please enter paragraph content');
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#2d3748',
    outline: 'none',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '6px'
  };

  const sectionStyle = {
    marginBottom: '20px'
  };

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
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        width: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '25px', textAlign: 'center' }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            📄 Pure English Paragraph Properties
          </h2>
        </div>

        {/* Content */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Paragraph Content:</label>
          <textarea
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="Enter your English paragraph text here..."
            style={{
              ...inputStyle,
              height: '120px',
              resize: 'vertical' as const
            }}
          />
        </div>

        {/* Padding Settings */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Padding (mm):</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Top:</label>
              <input
                type="number"
                value={formData.padding.top}
                onChange={(e) => handleInputChange('padding.top', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Right:</label>
              <input
                type="number"
                value={formData.padding.right}
                onChange={(e) => handleInputChange('padding.right', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Bottom:</label>
              <input
                type="number"
                value={formData.padding.bottom}
                onChange={(e) => handleInputChange('padding.bottom', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Left:</label>
              <input
                type="number"
                value={formData.padding.left}
                onChange={(e) => handleInputChange('padding.left', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                style={inputStyle}
              />
            </div>
          </div>
          <button
            onClick={() => setAllPadding(2)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Set All to 2mm
          </button>
        </div>

        {/* Font Settings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Font Family:</label>
            <select
              value={formData.fontFamily}
              onChange={(e) => handleInputChange('fontFamily', e.target.value)}
              style={inputStyle}
            >
              {fontFamilies.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Font Size:</label>
            <input
              type="number"
              value={formData.fontSize}
              onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value) || 12)}
              min="6"
              max="72"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Text Color:</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              style={{
                ...inputStyle,
                height: '40px',
                padding: '2px'
              }}
            />
          </div>
        </div>

        {/* Text Alignment */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Text Alignment:</label>
          <select
            value={formData.textAlign}
            onChange={(e) => handleInputChange('textAlign', e.target.value)}
            style={inputStyle}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        {/* Line Break Settings */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Line Break Method:</label>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="lineBreakMethod"
                value="word"
                checked={formData.lineBreakMethod === 'word'}
                onChange={(e) => handleInputChange('lineBreakMethod', e.target.value)}
              />
              <span style={{ fontSize: '13px', color: '#2d3748' }}>Break by Word</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="lineBreakMethod"
                value="alphabet"
                checked={formData.lineBreakMethod === 'alphabet'}
                onChange={(e) => handleInputChange('lineBreakMethod', e.target.value)}
              />
              <span style={{ fontSize: '13px', color: '#2d3748' }}>Break by Alphabet</span>
            </label>
          </div>
          
          <label style={labelStyle}>Line Break Symbol:</label>
          <input
            type="text"
            value={formData.lineBreakSymbol}
            onChange={(e) => handleInputChange('lineBreakSymbol', e.target.value)}
            placeholder="Enter symbol (e.g., -, /, |)"
            maxLength={3}
            style={inputStyle}
          />
        </div>

        {/* Position Settings */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Content Position in Region:</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '12px' }}>Position:</label>
              <select
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                style={inputStyle}
              >
                <option value="top">Top of Region</option>
                <option value="center">Center of Region</option>
                <option value="bottom">Bottom of Region</option>
              </select>
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '12px' }}>Height Mode:</label>
              <div style={{ fontSize: '12px', color: '#718096', padding: '8px' }}>
                {formData.occupyFullRegion
                  ? `Full Region (${regionHeight.toFixed(1)}mm)`
                  : `${formData.heightValue}${formData.heightUnit === 'mm' ? 'mm' : '%'}`
                }
              </div>
            </div>
          </div>
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
      </div>
    </div>
  );
};

export default PureEnglishParagraphDialog;
