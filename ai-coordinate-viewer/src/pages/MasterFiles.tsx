import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { masterFileService, MasterFile } from '../services/masterFileService';
import { customerService, Customer } from '../services/customerService';

const MasterFiles: React.FC = () => {
  const [masterFiles, setMasterFiles] = useState<MasterFile[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [filesData, customersData] = await Promise.all([
        masterFileService.getAllMasterFiles(),
        customerService.getAllCustomers()
      ]);
      setMasterFiles(filesData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '50px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#2d3748',
          margin: '0 0 12px 0'
        }}>
          Care Label Layout System
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#718096',
          margin: 0
        }}>
          Professional label design and layout management
        </p>
      </div>

      {/* Main Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        maxWidth: '800px',
        margin: '0 auto 50px auto'
      }}>
        {/* Label Designer Button */}
        <Link
          to="/master-files/select-customer"
          style={{
            display: 'block',
            padding: '40px 30px',
            background: 'white',
            border: '2px solid #e2e8f0',
            textDecoration: 'none',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = '#2d3748';
            e.currentTarget.style.background = '#f7fafc';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            🎨
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2d3748',
            margin: '0 0 12px 0'
          }}>
            Start Label Design
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#718096',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Select customer and design care labels with visual layout system
          </p>
        </Link>

        {/* Customer Management Button */}
        <Link
          to="/customers"
          style={{
            display: 'block',
            padding: '40px 30px',
            background: 'white',
            border: '2px solid #e2e8f0',
            textDecoration: 'none',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = '#2d3748';
            e.currentTarget.style.background = '#f7fafc';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            👥
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2d3748',
            margin: '0 0 12px 0'
          }}>
            Customer Management
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#718096',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Manage customer database and contact information
          </p>
        </Link>
      </div>

      {/* System Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'white',
          padding: '25px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#48bb78',
            marginBottom: '8px'
          }}>
            🟢
          </div>
          <div style={{
            fontSize: '14px',
            color: '#718096'
          }}>
            System Online
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#2d3748',
            marginBottom: '8px'
          }}>
            {isLoading ? '...' : customers.length}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#718096'
          }}>
            Active Customers
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#2d3748',
            marginBottom: '8px'
          }}>
            8
          </div>
          <div style={{
            fontSize: '14px',
            color: '#718096'
          }}>
            Content Types
          </div>
        </div>
      </div>

      {/* Quick Access Links */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <Link
          to="/master-files/select-customer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#2d3748',
            color: 'white',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #2d3748',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.background = '#4a5568';
            e.currentTarget.style.borderColor = '#4a5568';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.background = '#2d3748';
            e.currentTarget.style.borderColor = '#2d3748';
          }}
        >
          🎨 Start Designing
        </Link>

        <Link
          to="/suppliers"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#f7fafc',
            color: '#2d3748',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.background = '#edf2f7';
            e.currentTarget.style.borderColor = '#2d3748';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.background = '#f7fafc';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          🏭 Suppliers
        </Link>

        <Link
          to="/orders"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#f7fafc',
            color: '#2d3748',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.background = '#edf2f7';
            e.currentTarget.style.borderColor = '#2d3748';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.background = '#f7fafc';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          📦 Orders
        </Link>
      </div>

      {/* System Features */}
      <div style={{
        background: '#f7fafc',
        border: '1px solid #e2e8f0',
        padding: '30px',
        marginBottom: '40px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#2d3748',
          margin: '0 0 20px 0',
          textAlign: 'center'
        }}>
          🏷️ Care Label Layout System Features
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '15px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', margin: '0 0 4px 0' }}>Text Content</h4>
            <p style={{ fontSize: '12px', color: '#718096', margin: 0 }}>Brand names, product info</p>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '15px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', margin: '0 0 4px 0' }}>Images</h4>
            <p style={{ fontSize: '12px', color: '#718096', margin: 0 }}>Logos, graphics, photos</p>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '15px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', margin: '0 0 4px 0' }}>Barcodes</h4>
            <p style={{ fontSize: '12px', color: '#718096', margin: 0 }}>QR codes, product codes</p>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '15px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌐</div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', margin: '0 0 4px 0' }}>Translation</h4>
            <p style={{ fontSize: '12px', color: '#718096', margin: 0 }}>Multi-language support</p>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '15px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🧺</div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', margin: '0 0 4px 0' }}>Washing Symbols</h4>
            <p style={{ fontSize: '12px', color: '#718096', margin: 0 }}>Care instructions</p>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '15px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📏</div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', margin: '0 0 4px 0' }}>Size Breakdown</h4>
            <p style={{ fontSize: '12px', color: '#718096', margin: 0 }}>Size charts, measurements</p>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '15px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', margin: '0 0 4px 0' }}>% Composition</h4>
            <p style={{ fontSize: '12px', color: '#718096', margin: 0 }}>Material percentages</p>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '15px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⭐</div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', margin: '0 0 4px 0' }}>Special Wording</h4>
            <p style={{ fontSize: '12px', color: '#718096', margin: 0 }}>Legal text, warnings</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterFiles;
