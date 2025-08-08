import React, { useState, useEffect } from 'react';
// import MovableDialog from '../MovableDialog';

export interface TranslationParagraphData {
  id: string;
  type: 'translation-paragraph';
  regionId: string;
  primaryLanguage: string;
  primaryContent: string;
  secondaryLanguage: string;
  secondaryContent: string;
  tertiaryLanguage: string;
  tertiaryContent: string;
  fontFamily: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  color: string;
  // Region occupation settings
  occupyFullRegion: boolean;
  heightValue: number;
  heightUnit: 'mm' | 'percentage';
  position: 'top' | 'center' | 'bottom';
}

interface TranslationParagraphDialogProps {
  isOpen: boolean;
  regionId: string;
  regionHeight?: number; // in mm
  occupationData?: {
    occupyFullRegion: boolean;
    heightValue: number;
    heightUnit: 'mm' | 'percentage';
    position: 'top' | 'center' | 'bottom';
  };
  onSave: (data: TranslationParagraphData) => void;
  onCancel: () => void;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: 'Chinese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ru', name: 'Russian' }
];

const fontFamilies = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia'];

const TranslationParagraphDialog: React.FC<TranslationParagraphDialogProps> = ({
  isOpen,
  regionId,
  regionHeight = 50,
  occupationData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<TranslationParagraphData>({
    id: `translation-${Date.now()}`,
    type: 'translation-paragraph',
    regionId,
    primaryLanguage: 'en',
    primaryContent: '',
    secondaryLanguage: 'zh',
    secondaryContent: '',
    tertiaryLanguage: 'es',
    tertiaryContent: '',
    fontFamily: 'Arial',
    fontSize: 12,
    textAlign: 'left',
    fontWeight: 'normal',
    color: '#000000',
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

  const handleInputChange = (field: keyof TranslationParagraphData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (!formData.primaryContent.trim()) {
      alert('Please enter primary language content');
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
            🌐 Translation Paragraph Properties
          </h2>
        </div>

        {/* Primary Language */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Primary Language:</label>
          <select
            value={formData.primaryLanguage}
            onChange={(e) => handleInputChange('primaryLanguage', e.target.value)}
            style={inputStyle}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <div style={{ marginTop: '8px' }}>
            <textarea
              value={formData.primaryContent}
              onChange={(e) => handleInputChange('primaryContent', e.target.value)}
              placeholder="Enter primary language text here..."
              style={{
                ...inputStyle,
                height: '80px',
                resize: 'vertical' as const
              }}
            />
          </div>
        </div>

        {/* Secondary Language */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Secondary Language:</label>
          <select
            value={formData.secondaryLanguage}
            onChange={(e) => handleInputChange('secondaryLanguage', e.target.value)}
            style={inputStyle}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <div style={{ marginTop: '8px' }}>
            <textarea
              value={formData.secondaryContent}
              onChange={(e) => handleInputChange('secondaryContent', e.target.value)}
              placeholder="Enter secondary language text here..."
              style={{
                ...inputStyle,
                height: '80px',
                resize: 'vertical' as const
              }}
            />
          </div>
        </div>

        {/* Tertiary Language */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Tertiary Language:</label>
          <select
            value={formData.tertiaryLanguage}
            onChange={(e) => handleInputChange('tertiaryLanguage', e.target.value)}
            style={inputStyle}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <div style={{ marginTop: '8px' }}>
            <textarea
              value={formData.tertiaryContent}
              onChange={(e) => handleInputChange('tertiaryContent', e.target.value)}
              placeholder="Enter tertiary language text here..."
              style={{
                ...inputStyle,
                height: '80px',
                resize: 'vertical' as const
              }}
            />
          </div>
        </div>

        {/* Font Settings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
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
              onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))}
              min="8"
              max="72"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
          <div>
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
          <div>
            <label style={labelStyle}>Font Weight:</label>
            <select
              value={formData.fontWeight}
              onChange={(e) => handleInputChange('fontWeight', e.target.value)}
              style={inputStyle}
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
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

export default TranslationParagraphDialog;
