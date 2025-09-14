import React, { useState, useEffect } from 'react';
import MovableDialog from './MovableDialog';

// Available languages from composition table (18 languages)
const availableLanguages = [
  { code: 'AR', name: 'Arabic', flag: '🇸🇦' },
  { code: 'BS', name: 'Basque', flag: '🏴' },
  { code: 'CA', name: 'Catalan', flag: '🏴' },
  { code: 'CH', name: 'Chinese', flag: '🇨🇳' },
  { code: 'DA', name: 'Danish', flag: '🇩🇰' },
  { code: 'DU', name: 'Dutch', flag: '🇳🇱' },
  { code: 'EN', name: 'English', flag: '🇺🇸' },
  { code: 'FR', name: 'French', flag: '🇫🇷' },
  { code: 'GA', name: 'Galician', flag: '🏴' },
  { code: 'DE', name: 'German', flag: '🇩🇪' },
  { code: 'GR', name: 'Greek', flag: '🇬🇷' },
  { code: 'ID', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'JA', name: 'Japanese', flag: '🇯🇵' },
  { code: 'KO', name: 'Korean', flag: '🇰🇷' },
  { code: 'PT', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'SL', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'ES', name: 'Spanish', flag: '🇪🇸' }
];

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
  selectedLanguages: string[];
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
    },
    selectedLanguages: ['EN'] // Default to English
  });

  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Initialize config from editing content or defaults
  const getInitialConfig = (): NewCompTransConfig => {
    if (editingContent && editingContent.newCompTransConfig) {
      // Ensure selectedLanguages exists in existing config
      return {
        ...editingContent.newCompTransConfig,
        selectedLanguages: editingContent.newCompTransConfig.selectedLanguages || ['EN']
      };
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
      },
      selectedLanguages: ['EN'] // Default to English
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

  const handleLanguageToggle = (languageCode: string) => {
    setConfig(prev => {
      const currentLanguages = prev.selectedLanguages || [];
      return {
        ...prev,
        selectedLanguages: currentLanguages.includes(languageCode)
          ? currentLanguages.filter(code => code !== languageCode)
          : [...currentLanguages, languageCode]
      };
    });
  };

  const handleSelectAllLanguages = () => {
    setConfig(prev => ({
      ...prev,
      selectedLanguages: availableLanguages.map(lang => lang.code)
    }));
  };

  const handleDeselectAllLanguages = () => {
    setConfig(prev => ({
      ...prev,
      selectedLanguages: []
    }));
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

        {/* Row 1: 3 Columns - Padding | Alignment | Typography */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* Column 1: Padding Section */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              textAlign: 'center'
            }}>
              📏 Padding (mm)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                  Left:
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
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                  Top:
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
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                  Right:
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
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                  Bottom:
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
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Column 2: Alignment Section */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              textAlign: 'center'
            }}>
              📐 Alignment
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '500' }}>
                Horizontal:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <input
                    type="radio"
                    name="horizontal"
                    value="left"
                    checked={config.alignment.horizontal === 'left'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      alignment: { ...prev.alignment, horizontal: e.target.value as 'left' | 'center' | 'right' }
                    }))}
                    style={{ margin: 0 }}
                  />
                  Left
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <input
                    type="radio"
                    name="horizontal"
                    value="center"
                    checked={config.alignment.horizontal === 'center'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      alignment: { ...prev.alignment, horizontal: e.target.value as 'left' | 'center' | 'right' }
                    }))}
                    style={{ margin: 0 }}
                  />
                  Center
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <input
                    type="radio"
                    name="horizontal"
                    value="right"
                    checked={config.alignment.horizontal === 'right'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      alignment: { ...prev.alignment, horizontal: e.target.value as 'left' | 'center' | 'right' }
                    }))}
                    style={{ margin: 0 }}
                  />
                  Right
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '500' }}>
                Vertical:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <input
                    type="radio"
                    name="vertical"
                    value="top"
                    checked={config.alignment.vertical === 'top'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      alignment: { ...prev.alignment, vertical: e.target.value as 'top' | 'center' | 'bottom' }
                    }))}
                    style={{ margin: 0 }}
                  />
                  Top
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <input
                    type="radio"
                    name="vertical"
                    value="center"
                    checked={config.alignment.vertical === 'center'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      alignment: { ...prev.alignment, vertical: e.target.value as 'top' | 'center' | 'bottom' }
                    }))}
                    style={{ margin: 0 }}
                  />
                  Center
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <input
                    type="radio"
                    name="vertical"
                    value="bottom"
                    checked={config.alignment.vertical === 'bottom'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      alignment: { ...prev.alignment, vertical: e.target.value as 'top' | 'center' | 'bottom' }
                    }))}
                    style={{ margin: 0 }}
                  />
                  Bottom
                </label>
              </div>
            </div>
          </div>

          {/* Column 3: Typography Section */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              textAlign: 'center'
            }}>
              ✏️ Typography
            </h3>
          
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                Font Family:
              </label>
              <select
                value={config.typography.fontFamily}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  typography: { ...prev.typography, fontFamily: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '11px'
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

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                Font Size:
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  value={config.typography.fontSize}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    typography: { ...prev.typography, fontSize: parseFloat(e.target.value) || 10 }
                  }))}
                  style={{
                    flex: 1,
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                  step="0.1"
                  min="1"
                />
                <select
                  value={config.typography.fontSizeUnit}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    typography: { ...prev.typography, fontSizeUnit: e.target.value }
                  }))}
                  style={{
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px',
                    minWidth: '45px'
                  }}
                >
                  <option value="px">px</option>
                  <option value="pt">pt</option>
                  <option value="mm">mm</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Language Selection from Composition Table */}
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
            🌐 Translation Languages ({(config.selectedLanguages || []).length} selected)
          </h3>

          <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleSelectAllLanguages}
              style={{
                padding: '6px 12px',
                border: '1px solid #007bff',
                borderRadius: '4px',
                backgroundColor: '#007bff',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAllLanguages}
              style={{
                padding: '6px 12px',
                border: '1px solid #dc3545',
                borderRadius: '4px',
                backgroundColor: '#dc3545',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Deselect All
            </button>
          </div>

          {/* Multi-select Language Checkboxes - 18 Languages in Grid */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#fafafa',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {availableLanguages.map(language => (
                <label
                  key={language.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: (config.selectedLanguages || []).includes(language.code) ? '#e3f2fd' : 'white',
                    borderColor: (config.selectedLanguages || []).includes(language.code) ? '#2196f3' : '#ddd',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(config.selectedLanguages || []).includes(language.code)}
                    onChange={() => handleLanguageToggle(language.code)}
                    style={{ margin: 0, transform: 'scale(0.9)' }}
                  />
                  <span style={{ fontSize: '14px' }}>{language.flag}</span>
                  <span>{language.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Selected Languages Display */}
          {(config.selectedLanguages || []).length > 0 && (
            <div style={{
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#666' }}>
                Selected Languages:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(config.selectedLanguages || []).map(langCode => {
                  const language = availableLanguages.find(l => l.code === langCode);
                  return language ? (
                    <span
                      key={langCode}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}
                    >
                      {language.flag} {language.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
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
