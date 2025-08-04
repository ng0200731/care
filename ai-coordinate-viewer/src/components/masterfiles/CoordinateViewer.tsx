import React from 'react';
import { Link } from 'react-router-dom';
import App from '../../App'; // Your existing coordinate viewer

const CoordinateViewer: React.FC = () => {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with navigation */}
      <div style={{
        background: 'white',
        padding: '15px 25px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link
            to="/master-files"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#4299e1',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.background = '#f7faff';
              e.currentTarget.style.borderColor = '#4299e1';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <span>←</span>
            Back to Master Files
          </Link>
          
          <div style={{
            height: '20px',
            width: '1px',
            background: '#e2e8f0'
          }} />
          
          <div>
            <h1 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#2d3748',
              margin: 0
            }}>
              Coordinate Viewer
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#718096',
              margin: 0
            }}>
              Design your care label layout
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{
            padding: '8px 16px',
            background: '#f7fafc',
            color: '#4a5568',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '14px',
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
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
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
