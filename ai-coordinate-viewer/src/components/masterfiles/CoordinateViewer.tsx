import React from 'react';
import { Link } from 'react-router-dom';
import App from '../../App'; // Your existing coordinate viewer

const CoordinateViewer: React.FC = () => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Action buttons bar - simplified since Layout provides the main header */}
      <div style={{
        background: 'white',
        padding: '15px 25px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link
            to="/master-files"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#2d3748',
              textDecoration: 'none',
              fontSize: '13px', // Reduced font size
              fontWeight: '500',
              padding: '6px 10px', // Reduced padding
              border: '1px solid #4a5568',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.background = '#4a5568';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#2d3748';
            }}
          >
            <span>←</span>
            Back to Master Files
          </Link>

          <h2 style={{
            fontSize: '16px', // Reduced from 18px
            fontWeight: '600',
            color: '#2d3748',
            margin: 0
          }}>
            Coordinate Viewer
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            padding: '6px 12px', // Reduced padding
            background: '#f7fafc',
            color: '#4a5568',
            border: '1px solid #e2e8f0',
            fontSize: '13px', // Reduced font size
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#edf2f7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f7fafc';
          }}
          >
            💾 Save Draft
          </button>

          <button style={{
            padding: '6px 12px', // Reduced padding
            background: '#2d3748',
            color: 'white',
            border: 'none',
            fontSize: '13px', // Reduced font size
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4a5568';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#2d3748';
          }}
          >
            💾 Save & Close
          </button>
        </div>
      </div>

      {/* Your existing coordinate viewer */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <App />
      </div>
    </div>
  );
};

export default CoordinateViewer;
