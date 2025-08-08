import React, { useState } from 'react';
import MovableDialog from '../MovableDialog';

export interface RegionOccupationData {
  occupyFullRegion: boolean;
  heightValue: number;
  heightUnit: 'mm' | 'percentage';
  position: 'top' | 'center' | 'bottom';
}

interface RegionOccupationDialogProps {
  isOpen: boolean;
  contentType: string;
  contentIcon: string;
  regionId: string;
  regionHeight: number; // in mm
  onConfirm: (data: RegionOccupationData) => void;
  onCancel: () => void;
}

const RegionOccupationDialog: React.FC<RegionOccupationDialogProps> = ({
  isOpen,
  contentType,
  contentIcon,
  regionId,
  regionHeight,
  onConfirm,
  onCancel
}) => {
  const [occupyFullRegion, setOccupyFullRegion] = useState(true);
  const [heightValue, setHeightValue] = useState(10);
  const [heightUnit, setHeightUnit] = useState<'mm' | 'percentage'>('mm');
  const [position, setPosition] = useState<'top' | 'center' | 'bottom'>('top');

  const handleConfirm = () => {
    // Validate height
    const maxValue = heightUnit === 'mm' ? regionHeight : 100;
    if (heightValue <= 0 || heightValue > maxValue) {
      alert(`Height must be between 1 and ${maxValue} ${heightUnit === 'mm' ? 'mm' : '%'}`);
      return;
    }

    onConfirm({
      occupyFullRegion,
      heightValue,
      heightUnit,
      position
    });
  };

  const getMaxHeight = () => {
    return heightUnit === 'mm' ? regionHeight : 100;
  };

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

  return (
    <MovableDialog
      isOpen={isOpen}
      title="Region Occupation Settings"
      icon="📐"
      onClose={onCancel}
      width="500px"
      storageKey="region-occupation"
    >
      {/* Content Type Info */}
      <div style={{
        backgroundColor: '#f7fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '24px' }}>{contentIcon}</span>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748' }}>
            {contentType}
          </div>
          <div style={{ fontSize: '12px', color: '#718096' }}>
            Region: {regionId} • Height: {regionHeight.toFixed(1)}mm
          </div>
        </div>
      </div>

      {/* Full Region Question */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Will you occupy the full region?</label>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="occupyFull"
              checked={occupyFullRegion}
              onChange={() => setOccupyFullRegion(true)}
            />
            <span style={{ fontSize: '14px', color: '#2d3748' }}>Yes, occupy full region</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="occupyFull"
              checked={!occupyFullRegion}
              onChange={() => setOccupyFullRegion(false)}
            />
            <span style={{ fontSize: '14px', color: '#2d3748' }}>No, specify height</span>
          </label>
        </div>
      </div>

      {/* Height Specification (only if not full region) */}
      {!occupyFullRegion && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Height Specification:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <input
                type="number"
                value={heightValue}
                onChange={(e) => setHeightValue(parseFloat(e.target.value) || 0)}
                min="1"
                max={getMaxHeight()}
                step={heightUnit === 'mm' ? '0.5' : '1'}
                style={inputStyle}
                placeholder={`Enter height (1-${getMaxHeight()})`}
              />
              <select
                value={heightUnit}
                onChange={(e) => setHeightUnit(e.target.value as 'mm' | 'percentage')}
                style={inputStyle}
              >
                <option value="mm">mm</option>
                <option value="percentage">%</option>
              </select>
            </div>
            <div style={{ fontSize: '11px', color: '#718096', marginTop: '5px' }}>
              {heightUnit === 'mm' 
                ? `Maximum: ${regionHeight.toFixed(1)}mm`
                : 'Percentage of region height'
              }
            </div>
          </div>

          {/* Position Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Content Position in Region:</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as 'top' | 'center' | 'bottom')}
              style={inputStyle}
            >
              <option value="top">Top of Region</option>
              <option value="center">Center of Region</option>
              <option value="bottom">Bottom of Region</option>
            </select>
          </div>
        </>
      )}

      {/* Preview Info */}
      <div style={{
        backgroundColor: '#e6fffa',
        border: '1px solid #38b2ac',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '12px', color: '#234e52', fontWeight: '600', marginBottom: '5px' }}>
          📋 Summary:
        </div>
        <div style={{ fontSize: '11px', color: '#234e52', lineHeight: '1.4' }}>
          {occupyFullRegion 
            ? `Content will occupy the entire region (${regionHeight.toFixed(1)}mm height)`
            : `Content will use ${heightValue}${heightUnit === 'mm' ? 'mm' : '%'} height, positioned at ${position} of region`
          }
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
          onClick={handleConfirm}
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
          Continue
        </button>
      </div>
    </MovableDialog>
  );
};

export default RegionOccupationDialog;
