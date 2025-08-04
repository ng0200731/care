import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerService, Customer } from '../services/customerService';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const customerList = await customerService.getAllCustomers();
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter customers based on search term and sort by creation date (newest first)
  const filteredCustomers = customers
    .filter(customer => {
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.customerName.toLowerCase().includes(searchLower) ||
        customer.person.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.tel.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Sort by creation date (newest first)
      const dateA = new Date(a.createdAt || '1970-01-01');
      const dateB = new Date(b.createdAt || '1970-01-01');
      return dateB.getTime() - dateA.getTime();
    });

  const handleDeleteCustomer = async (id: string, customerName: string) => {
    if (window.confirm(`Are you sure you want to delete "${customerName}"? This action cannot be undone.`)) {
      try {
        await customerService.deleteCustomer(id);
        await loadCustomers(); // Reload the list
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2d3748',
            margin: '0 0 8px 0'
          }}>
            Customer Management
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#718096',
            margin: 0
          }}>
            Manage your customer database
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/master-files"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#2d3748',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              padding: '10px 15px',
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

          <Link
            to="/customers/create"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 15px',
              background: '#2d3748',
              color: 'white',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.background = '#4a5568';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.background = '#2d3748';
            }}
          >
            <span>➕</span>
            Add New Customer
          </Link>
        </div>
      </div>

      {/* Search */}
      <div style={{
        background: 'white',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Search customers by name, contact person, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 15px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              color: '#2d3748',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#4a5568'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#2d3748',
            margin: '0'
          }}>
            Customers ({filteredCustomers.length})
          </h2>
          <div style={{
            fontSize: '12px',
            color: '#718096',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span>📅</span>
            Sorted by newest first
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div style={{
        background: 'white',
        padding: '25px',
        border: '1px solid #e2e8f0'
      }}>
        {/* Loading State */}
        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#718096'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
            <p style={{ fontSize: '16px', margin: 0 }}>
              Loading customers...
            </p>
          </div>
        ) : (
          filteredCustomers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  style={{
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4a5568';
                    e.currentTarget.style.background = '#f7fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                        marginBottom: '15px'
                      }}>
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '8px'
                          }}>
                            <h3 style={{
                              fontSize: '18px',
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
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  padding: '2px 6px',
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
                            color: '#4a5568',
                            margin: '0 0 4px 0'
                          }}>
                            <strong>Contact:</strong> {customer.person}
                          </p>
                          <p style={{
                            fontSize: '14px',
                            color: '#4a5568',
                            margin: '0'
                          }}>
                            <strong>Created:</strong> {formatDate(customer.createdAt)}
                          </p>
                        </div>
                        
                        <div>
                          <p style={{
                            fontSize: '14px',
                            color: '#4a5568',
                            margin: '0 0 4px 0'
                          }}>
                            <strong>Email:</strong> {customer.email}
                          </p>
                          <p style={{
                            fontSize: '14px',
                            color: '#4a5568',
                            margin: '0'
                          }}>
                            <strong>Phone:</strong> {customer.tel}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                      <button
                        onClick={() => {
                          navigate(`/customers/edit/${customer.id}`);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#f7fafc',
                          color: '#4a5568',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
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
                        ✏️ Edit
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomer(customer.id, customer.customerName);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#fed7d7',
                          color: '#c53030',
                          border: '1px solid #feb2b2',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fc8181';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fed7d7';
                          e.currentTarget.style.color = '#c53030';
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#718096'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
              <p style={{ fontSize: '16px', margin: 0 }}>
                No customers found
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Customers;
