import React from 'react';
import MovableDialog from './MovableDialog';

export interface PreviewSettings {
  globalPreviewMode: boolean;
  perRegionPreview: Map<string, boolean>;
  editModeInPreview: boolean;
  dragDropInPreview: boolean;
}

interface PreviewControlPanelProps {
  isOpen: boolean;
  settings: PreviewSettings;
  onSettingsChange: (settings: PreviewSettings) => void;
  onClose: () => void;
  regionIds: string[];
}

const PreviewControlPanel: React.FC<PreviewControlPanelProps> = ({
  isOpen,
  settings,
  onSettingsChange,
  onClose,
  regionIds
}) => {
  const updateSettings = (updates: Partial<PreviewSettings>) => {
    onSettingsChange({
      ...settings,
      ...updates
    });
  };

  const toggleGlobalPreview = () => {
    const newGlobalMode = !settings.globalPreviewMode;
    updateSettings({
      globalPreviewMode: newGlobalMode,
      // If enabling global, enable all regions
      perRegionPreview: newGlobalMode 
        ? new Map(regionIds.map(id => [id, true]))
        : new Map(regionIds.map(id => [id, false]))
    });
  };

  const toggleRegionPreview = (regionId: string) => {
    const newPerRegionPreview = new Map(settings.perRegionPreview);
    newPerRegionPreview.set(regionId, !newPerRegionPreview.get(regionId));
    
    // Check if all regions are now enabled/disabled
    const allEnabled = regionIds.every(id => newPerRegionPreview.get(id));
    const allDisabled = regionIds.every(id => !newPerRegionPreview.get(id));
    
    updateSettings({
      perRegionPreview: newPerRegionPreview,
      globalPreviewMode: allEnabled
    });
  };

  const buttonStyle = {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#3182ce',
    color: 'white',
    borderColor: '#3182ce'
  };

  const inactiveButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'white',
    color: '#4a5568',
    borderColor: '#e2e8f0'
  };

  return (
    <MovableDialog
      isOpen={isOpen}
      title="Preview Controls"
      icon="👁️"
      onClose={onClose}
      width="320px"
      storageKey="preview-controls"
    >

      {/* Global Preview Toggle */}
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={toggleGlobalPreview}
          style={settings.globalPreviewMode ? activeButtonStyle : inactiveButtonStyle}
        >
          {settings.globalPreviewMode ? '🔍 Exit Global Preview' : '👁️ Global Preview'}
        </button>
      </div>

      {/* Per-Region Preview */}
      {regionIds.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#4a5568',
            marginBottom: '8px'
          }}>
            Per-Region Preview:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {regionIds.map(regionId => (
              <button
                key={regionId}
                onClick={() => toggleRegionPreview(regionId)}
                style={{
                  ...(settings.perRegionPreview.get(regionId) ? activeButtonStyle : inactiveButtonStyle),
                  fontSize: '11px',
                  padding: '6px 10px',
                  textAlign: 'left'
                }}
              >
                {settings.perRegionPreview.get(regionId) ? '👁️' : '📋'} {regionId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview Mode Settings */}
      <div style={{
        paddingTop: '15px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#4a5568',
          marginBottom: '10px'
        }}>
          Preview Settings:
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}>
            <input
              type="checkbox"
              checked={settings.editModeInPreview}
              onChange={(e) => updateSettings({ editModeInPreview: e.target.checked })}
            />
            <span>Allow editing in preview mode</span>
          </label>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}>
            <input
              type="checkbox"
              checked={settings.dragDropInPreview}
              onChange={(e) => updateSettings({ dragDropInPreview: e.target.checked })}
            />
            <span>Allow drag & drop in preview</span>
          </label>
        </div>
      </div>

      {/* Status Info */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#f7fafc',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#4a5568'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Status:</div>
        <div>
          Mode: {settings.globalPreviewMode ? 'Global Preview' : 'Block Mode'}<br/>
          Active Regions: {Array.from(settings.perRegionPreview.values()).filter(Boolean).length}/{regionIds.length}<br/>
          Edit: {settings.editModeInPreview ? 'Enabled' : 'Disabled'}<br/>
          Drag & Drop: {settings.dragDropInPreview ? 'Enabled' : 'Disabled'}
        </div>
      </div>
    </MovableDialog>
  );
};

export default PreviewControlPanel;
