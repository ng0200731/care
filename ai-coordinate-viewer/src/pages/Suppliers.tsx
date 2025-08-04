import React from 'react';

const Suppliers: React.FC = () => {
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#2d3748',
            margin: '0 0 5px 0'
          }}>
            Suppliers
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#718096',
            margin: 0
          }}>
            Manage your supplier information and contacts
          </p>
        </div>
        
        <button style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <span>➕</span>
          Add Supplier
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        padding: '60px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏭</div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#2d3748',
          marginBottom: '10px'
        }}>
          Supplier Management
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#718096',
          marginBottom: '30px'
        }}>
          This feature will be available in Phase 2B
        </p>
        <div style={{
          background: '#f7fafc',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#4a5568',
            margin: 0
          }}>
            Coming soon: Add suppliers, manage contact information, track capabilities and pricing
          </p>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
