import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Customer } from '../services/customerService';
import NavigationButtons from '../components/NavigationButtons';

const CreateMethod: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Load selected customer from session storage
  useEffect(() => {
    const customerData = sessionStorage.getItem('selectedCustomer');
    if (customerData) {
      try {
        const customer = JSON.parse(customerData);
        setSelectedCustomer(customer);
      } catch (error) {
        console.error('Error parsing customer data:', error);
        // Redirect back to customer selection if data is invalid
        navigate('/master-files/select-customer');
      }
    } else {
      // No customer selected, redirect back
      navigate('/master-files/select-customer');
    }
  }, [navigate]);

  const handleCreateFromZero = () => {
    navigate('/master-files/create');
  };

  const handleCreateFromJson = () => {
    navigate('/coordinate-viewer');
  };

  if (!selectedCustomer) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px'
      }}>
        <div style={{
          fontSize: '16px',
          color: '#718096'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Navigation Buttons */}
      <NavigationButtons
        previousPagePath="/master-files/select-customer"
        previousPageLabel="Select Customer"
        showMasterFilesButton={true}
        showPreviousButton={true}
      />

      {/* Header */}
      <div style={{
        marginBottom: '40px',
        padding: '0 20px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#2d3748',
          margin: '0 0 8px 0'
        }}>
          Choose Creation Method
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#718096',
          margin: 0
        }}>
          How would you like to create the master file for <strong>{selectedCustomer.customerName}</strong>?
        </p>
      </div>

      {/* Selected Customer Info */}
      <div style={{
        background: '#f7fafc',
        border: '1px solid #e2e8f0',
        padding: '20px',
        marginBottom: '50px',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#2d3748',
          margin: '0 0 8px 0'
        }}>
          Creating Master File For:
        </h3>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#4a5568',
          marginBottom: '5px'
        }}>
          {selectedCustomer.customerName}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#718096'
        }}>
          Contact: {selectedCustomer.person} • Email: {selectedCustomer.email}
        </div>
      </div>

      {/* Creation Method Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        marginBottom: '40px'
      }}>
        {/* Create from Zero Button */}
        <button
          onClick={handleCreateFromZero}
          style={{
            display: 'block',
            padding: '50px 30px',
            background: 'white',
            border: '3px solid #e2e8f0',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            fontSize: 'inherit',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4a5568';
            e.currentTarget.style.background = '#f7fafc';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            fontSize: '64px',
            marginBottom: '25px'
          }}>
            🎨
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2d3748',
            margin: '0 0 15px 0'
          }}>
            Create from Zero
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#718096',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Start with a blank canvas and design your label layout from scratch using our visual editor
          </p>
        </button>

        {/* Create from JSON Button */}
        <button
          onClick={handleCreateFromJson}
          style={{
            display: 'block',
            padding: '50px 30px',
            background: 'white',
            border: '3px solid #e2e8f0',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            fontSize: 'inherit',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4a5568';
            e.currentTarget.style.background = '#f7fafc';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            fontSize: '64px',
            marginBottom: '25px'
          }}>
            📄
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2d3748',
            margin: '0 0 15px 0'
          }}>
            Create from JSON
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#718096',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Import an existing JSON file with your label layout configuration and coordinates
          </p>
        </button>
      </div>

      {/* Additional Info */}
      <div style={{
        background: '#edf2f7',
        border: '1px solid #cbd5e0',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#2d3748',
          margin: '0 0 10px 0'
        }}>
          💡 Need Help Choosing?
        </h4>
        <p style={{
          fontSize: '14px',
          color: '#4a5568',
          margin: 0,
          lineHeight: '1.5'
        }}>
          <strong>Create from Zero</strong> is perfect for new designs or when you want full creative control.<br/>
          <strong>Create from JSON</strong> is ideal when you have existing label configurations to import.
        </p>
      </div>
    </div>
  );
};

export default CreateMethod;
