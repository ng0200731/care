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
          Master Files Management
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#718096',
          margin: 0
        }}>
          Choose an action to get started
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
        {/* Create Customer Button */}
        <Link
          to="/customers/create"
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
            🏢
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2d3748',
            margin: '0 0 12px 0'
          }}>
            Create Customer
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#718096',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Add a new customer with contact information to your database
          </p>
        </Link>

        {/* Create Master File Button */}
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
            📄
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2d3748',
            margin: '0 0 12px 0'
          }}>
            Create Master File
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#718096',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Create a new label layout design for an existing customer
          </p>
        </Link>
      </div>

      {/* Statistics Cards */}
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
            color: '#2d3748',
            marginBottom: '8px'
          }}>
            {isLoading ? '...' : customers.length}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#718096'
          }}>
            Total Customers
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
            {isLoading ? '...' : masterFiles.length}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#718096'
          }}>
            Master Files
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
            {isLoading ? '...' : masterFiles.filter(f => f.lastModified.includes('hour') || f.lastModified.includes('Just now')).length}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#718096'
          }}>
            Recent Files
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <Link
          to="/customers"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
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
          👥 Manage Customers
        </Link>

        <Link
          to="/master-files/list"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
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
          📋 View All Files
        </Link>
      </div>
    </div>
  );
};

export default MasterFiles;
