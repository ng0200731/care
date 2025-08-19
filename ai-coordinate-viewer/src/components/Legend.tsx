import React from 'react';
import { contentTypes } from './ContentMenu';
import { getTypeHex } from '../constants/contentColors';

interface LegendProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  showTint: boolean;
  onToggleTint: () => void;
  regionContents: Map<string, any[]>;
  onClickFilter?: (typeId: string) => void; // highlight/filter callback
  activeTypes?: Set<string>;
}

const Legend: React.FC<LegendProps> = ({
  isCollapsed,
  onToggleCollapsed,
  showTint,
  onToggleTint,
  regionContents,
  onClickFilter,
  activeTypes
}) => {
  // Compute counts by type
  const counts: Record<string, number> = {};
  regionContents.forEach((arr, regionId) => {
    if (arr && arr.length > 0) {
      const t = arr[0].type;
      counts[t] = (counts[t] || 0) + 1;
    }
  });

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong>Legend</strong>
          <button
            onClick={onToggleCollapsed}
            style={{ padding: '2px 6px', fontSize: 12 }}
            title={isCollapsed ? 'Expand legend' : 'Collapse legend'}
          >
            {isCollapsed ? '▸' : '▾'}
          </button>
        </div>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showTint} onChange={onToggleTint} />
          Show tint (T)
        </label>
      </div>

      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contentTypes.map(ct => {
            const hex = getTypeHex(ct.id);
            const count = counts[ct.id] || 0;
            const isActive = activeTypes?.has(ct.id);
            return (
              <button
                key={ct.id}
                onClick={() => onClickFilter && onClickFilter(ct.id)}
                title={`${ct.name} • Used in ${count} region(s)`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 6, background: '#fff', border: isActive ? `2px solid ${hex}` : '1px solid #e2e8f0',
                  cursor: onClickFilter ? 'pointer' : 'default'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: hex, border: '1px solid #cbd5e1' }} />
                  <span style={{ fontSize: 12 }}>{ct.name}</span>
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Legend;

