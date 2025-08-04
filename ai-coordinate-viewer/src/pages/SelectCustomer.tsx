import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerService, Customer } from '../services/customerService';
import NavigationButtons from '../components/NavigationButtons';

const SelectCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const customersData = await customerService.getAllCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter customers based on search term and sort by creation date (newest first)
  const filteredCustomers = customers
    .filter(customer =>
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by creation date (newest first)
      const dateA = new Date(a.createdAt || '1970-01-01');
      const dateB = new Date(b.createdAt || '1970-01-01');
      return dateB.getTime() - dateA.getTime();
    });

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleProceedToDesigner = () => {
    if (!selectedCustomer) return;

    // Store selected customer in sessionStorage for the label designer
    sessionStorage.setItem('selectedCustomer', JSON.stringify(selectedCustomer));

    // Navigate directly to the coordinate viewer (label designer)
    navigate('/coordinate-viewer');
  };

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Navigation Buttons */}
      <NavigationButtons
        previousPagePath="/master-files"
        previousPageLabel="Master Files"
        showMasterFilesButton={true}
        showPreviousButton={true}
      />

      {/* Header */}
      <div style={{
        marginBottom: '30px',
        padding: '0 20px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#2d3748',
          margin: '0 0 8px 0'
        }}>
          Select Customer for Label Design
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#718096',
          margin: 0
        }}>
          Choose a customer to start designing care labels in the visual layout system
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        marginBottom: '20px'
      }}>
        <input
          type="text"
          placeholder="Search customers by name, contact person, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            color: '#2d3748',
            outline: 'none',
            transition: 'border-color 0.3s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#4a5568';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
          }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '30px'
      }}>
        {/* Customer List */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#2d3748',
              margin: '0'
            }}>
              Available Customers ({filteredCustomers.length})
            </h2>
            <div style={{
              fontSize: '11px',
              color: '#718096',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>📅</span>
              Newest first
            </div>
          </div>

          {isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#718096'
            }}>
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#718096'
            }}>
              {searchTerm ? 'No customers found matching your search.' : 'No customers available.'}
              <div style={{ marginTop: '15px' }}>
                <Link
                  to="/customers/create"
                  style={{
                    color: '#4a5568',
                    textDecoration: 'underline'
                  }}
                >
                  Create your first customer
                </Link>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '10px'
            }}>
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  style={{
                    padding: '15px',
                    border: selectedCustomer?.id === customer.id ? '2px solid #4a5568' : '1px solid #e2e8f0',
                    background: selectedCustomer?.id === customer.id ? '#f7fafc' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCustomer?.id !== customer.id) {
                      e.currentTarget.style.background = '#f7fafc';
                      e.currentTarget.style.borderColor = '#cbd5e0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCustomer?.id !== customer.id) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '5px'
                      }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#2d3748',
                          margin: 0
                        }}>
                          {customer.customerName}
                        </h3>
                        {(() => {
                          const createdDate = new Date(customer.createdAt || '1970-01-01');
                          const now = new Date();
                          const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
                          return hoursDiff <= 24 ? (
                            <span style={{
                              background: '#48bb78',
                              color: 'white',
                              fontSize: '9px',
                              fontWeight: '600',
                              padding: '2px 5px',
                              borderRadius: '3px',
                              textTransform: 'uppercase'
                            }}>
                              NEW
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <p style={{
                        fontSize: '14px',
                        color: '#718096',
                        margin: '0 0 3px 0'
                      }}>
                        Contact: {customer.person}
                      </p>
                      <p style={{
                        fontSize: '14px',
                        color: '#718096',
                        margin: '0 0 3px 0'
                      }}>
                        Email: {customer.email}
                      </p>
                      <p style={{
                        fontSize: '14px',
                        color: '#718096',
                        margin: 0
                      }}>
                        Phone: {customer.tel}
                      </p>
                    </div>
                    {selectedCustomer?.id === customer.id && (
                      <div style={{
                        color: '#4a5568',
                        fontSize: '18px'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Creation Options */}
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '15px'
          }}>
            Creation Method
          </h2>

          {!selectedCustomer ? (
            <div style={{
              padding: '20px',
              border: '1px solid #e2e8f0',
              background: '#f7fafc',
              textAlign: 'center',
              color: '#718096'
            }}>
              Please select a customer first
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '15px'
            }}>
              {/* Selected Customer Info */}
              <div style={{
                padding: '15px',
                border: '1px solid #e2e8f0',
                background: '#f7fafc'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2d3748',
                  margin: '0 0 8px 0'
                }}>
                  Selected Customer:
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: '#4a5568',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {selectedCustomer.customerName}
                </p>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleProceedToDesigner}
                style={{
                  width: '100%',
                  padding: '20px',
                  border: '2px solid #4a5568',
                  background: '#4a5568',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2d3748';
                  e.currentTarget.style.borderColor = '#2d3748';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#4a5568';
                  e.currentTarget.style.borderColor = '#4a5568';
                }}
              >
                🎨 Start Label Designer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectCustomer;
