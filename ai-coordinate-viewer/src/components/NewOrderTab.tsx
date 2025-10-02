/**
 * NewOrderTab Component
 *
 * NEW tab content for creating new orders
 * Contains: Customer Management, Project Info, Order Data, Submit Options
 */

import React, { useState, useEffect } from 'react';
import { useOrderVariable } from '../contexts/OrderVariableContext';
import { customerService, Customer } from '../services/customerService';
import { projectService, Project } from '../services/projectService';
import { masterFileService } from '../services/masterFileService';

interface OrderFormData {
  // Customer Management
  customerId: string;
  customerName: string;
  contact: string;
  phone: string;
  email: string;
  address: string;

  // Project Information
  projectId: string;
  masterId: string;

  // Order Data
  orderNumber: string;
  variableValues: { [key: string]: string | number };

  // Submit Options
  status: 'draft' | 'send' | 'confirmed' | 'in_production' | 'completed';
}

interface MasterFile {
  id: string;
  name: string;
  customerId: string;
}

const NewOrderTab: React.FC = () => {
  const { getAllProjects, createProject, createOrder } = useOrderVariable();

  const [formData, setFormData] = useState<OrderFormData>({
    customerId: '',
    customerName: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    projectId: '',
    masterId: '',
    orderNumber: '',
    variableValues: {},
    status: 'draft'
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [masterFiles, setMasterFiles] = useState<MasterFile[]>([]);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMasterFiles, setLoadingMasterFiles] = useState(false);

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const allCustomers = await customerService.getAllCustomers();
        setCustomers(allCustomers);
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  // Load projects and master files for selected customer
  useEffect(() => {
    const loadCustomerData = async () => {
      if (!formData.customerId || formData.customerId === 'new') {
        setProjects([]);
        setMasterFiles([]);
        return;
      }

      // Load projects for this customer
      setLoadingProjects(true);
      try {
        const allProjects = await projectService.getAllProjects();
        const customerProjects = allProjects.filter(p => p.customerId === formData.customerId);
        setProjects(customerProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoadingProjects(false);
      }

      // Load master files for this customer
      setLoadingMasterFiles(true);
      try {
        const response = await masterFileService.getAllMasterFiles();
        if (response.success && response.data) {
          const customerMasterFiles = response.data
            .filter(mf => mf.customerId === formData.customerId)
            .map(mf => ({
              id: mf.id,
              name: mf.name,
              customerId: mf.customerId
            }));
          setMasterFiles(customerMasterFiles);
        }
      } catch (error) {
        console.error('Failed to load master files:', error);
      } finally {
        setLoadingMasterFiles(false);
      }
    };

    loadCustomerData();
  }, [formData.customerId]);

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    const selectedCustomer = customers.find(c => c.id === customerId);

    if (selectedCustomer) {
      setFormData({
        ...formData,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.customerName,
        contact: selectedCustomer.person,
        phone: selectedCustomer.tel,
        email: selectedCustomer.email,
        address: '', // Customer service doesn't have address field, leave empty
        projectId: '', // Reset project and master file when customer changes
        masterId: ''
      });
    } else {
      // Clear customer data if "New Customer" is selected
      setFormData({
        ...formData,
        customerId: '',
        customerName: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        projectId: '',
        masterId: ''
      });
    }
  };

  const handleSaveDraft = () => {
    // TODO: Implement save draft logic
    console.log('Save Draft:', formData);
  };

  const handleSubmitOrder = () => {
    // TODO: Implement submit order logic
    console.log('Submit Order:', formData);
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* a) CUSTOMER MANAGEMENT */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a202c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          👤 CUSTOMER MANAGEMENT
        </h3>

        {/* Customer Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#4a5568',
            marginBottom: '6px'
          }}>
            Select Customer <span style={{ color: '#3b82f6' }}>*</span>
          </label>
          <select
            value={formData.customerId}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            disabled={loadingCustomers}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '2px solid #3b82f6',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: loadingCustomers ? '#f7fafc' : 'white',
              cursor: loadingCustomers ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">
              {loadingCustomers ? 'Loading customers...' : '-- Select Existing Customer or Create New --'}
            </option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.customerName} ({customer.person})
              </option>
            ))}
            <option value="new" style={{ fontWeight: 'bold', color: '#3b82f6' }}>
              ➕ Create New Customer
            </option>
          </select>
        </div>

        {/* Customer Details - Auto-filled or Editable */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          padding: '16px',
          backgroundColor: formData.customerId ? '#f0f9ff' : '#f7fafc',
          borderRadius: '6px',
          border: `2px dashed ${formData.customerId ? '#3b82f6' : '#cbd5e0'}`
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Customer Name
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="ABC Garment Factory"
              disabled={!!formData.customerId && formData.customerId !== 'new'}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: (!!formData.customerId && formData.customerId !== 'new') ? '#e2e8f0' : 'white',
                cursor: (!!formData.customerId && formData.customerId !== 'new') ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => {
                if (!formData.customerId || formData.customerId === 'new') {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }
              }}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Contact Person
            </label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="John Smith"
              disabled={!!formData.customerId && formData.customerId !== 'new'}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: (!!formData.customerId && formData.customerId !== 'new') ? '#e2e8f0' : 'white',
                cursor: (!!formData.customerId && formData.customerId !== 'new') ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => {
                if (!formData.customerId || formData.customerId === 'new') {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }
              }}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-555-1234"
              disabled={!!formData.customerId && formData.customerId !== 'new'}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: (!!formData.customerId && formData.customerId !== 'new') ? '#e2e8f0' : 'white',
                cursor: (!!formData.customerId && formData.customerId !== 'new') ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => {
                if (!formData.customerId || formData.customerId === 'new') {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }
              }}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@abc.com"
              disabled={!!formData.customerId && formData.customerId !== 'new'}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: (!!formData.customerId && formData.customerId !== 'new') ? '#e2e8f0' : 'white',
                cursor: (!!formData.customerId && formData.customerId !== 'new') ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => {
                if (!formData.customerId || formData.customerId === 'new') {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }
              }}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Address (Optional)
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street, City, Country"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          {formData.customerId && formData.customerId !== 'new' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{
                fontSize: '13px',
                color: '#3b82f6',
                margin: 0,
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ℹ️ Customer data loaded from Master File. Fields are read-only.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* b) PROJECT INFORMATION */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a202c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📋 PROJECT INFORMATION
        </h3>

        {!formData.customerId || formData.customerId === 'new' ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#fff7ed',
            border: '2px dashed #fb923c',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#c2410c',
              margin: 0,
              fontWeight: '500'
            }}>
              ⚠️ Please select a customer first to view related projects and master files
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                marginBottom: '6px'
              }}>
                Project Name <span style={{ color: '#3b82f6' }}>*</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                disabled={loadingProjects || projects.length === 0}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: (loadingProjects || projects.length === 0) ? '#f7fafc' : 'white',
                  cursor: (loadingProjects || projects.length === 0) ? 'not-allowed' : 'pointer'
                }}
                onFocus={(e) => {
                  if (!loadingProjects && projects.length > 0) {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }
                }}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="">
                  {loadingProjects ? 'Loading projects...' :
                   projects.length === 0 ? 'No projects found for this customer' :
                   'Select Project...'}
                </option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {!loadingProjects && projects.length > 0 && (
                <p style={{
                  fontSize: '12px',
                  color: '#10b981',
                  margin: '4px 0 0 0',
                  fontStyle: 'italic'
                }}>
                  ✓ {projects.length} project(s) found
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                marginBottom: '6px'
              }}>
                Master File <span style={{ color: '#3b82f6' }}>*</span>
              </label>
              <select
                value={formData.masterId}
                onChange={(e) => setFormData({ ...formData, masterId: e.target.value })}
                disabled={loadingMasterFiles || masterFiles.length === 0}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: (loadingMasterFiles || masterFiles.length === 0) ? '#f7fafc' : 'white',
                  cursor: (loadingMasterFiles || masterFiles.length === 0) ? 'not-allowed' : 'pointer'
                }}
                onFocus={(e) => {
                  if (!loadingMasterFiles && masterFiles.length > 0) {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }
                }}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="">
                  {loadingMasterFiles ? 'Loading master files...' :
                   masterFiles.length === 0 ? 'No master files found for this customer' :
                   'Select Master File...'}
                </option>
                {masterFiles.map(masterFile => (
                  <option key={masterFile.id} value={masterFile.id}>
                    {masterFile.name}
                  </option>
                ))}
              </select>
              {!loadingMasterFiles && masterFiles.length > 0 && (
                <p style={{
                  fontSize: '12px',
                  color: '#10b981',
                  margin: '4px 0 0 0',
                  fontStyle: 'italic'
                }}>
                  ✓ {masterFiles.length} master file(s) found
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                marginBottom: '6px'
              }}>
                Date
              </label>
              <input
                type="text"
                value={new Date().toLocaleDateString()}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#f7fafc',
                  color: '#718096'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* c) ORDER DATA */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a202c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📝 ORDER DATA
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#4a5568',
            marginBottom: '6px'
          }}>
            Order Number
          </label>
          <input
            type="text"
            value={formData.orderNumber}
            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
            placeholder="#001"
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: '#f7fafc',
          borderRadius: '6px',
          border: '1px dashed #cbd5e0'
        }}>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: '500',
            color: '#4a5568'
          }}>
            Variable Fields (for selected master):
          </p>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#718096',
            fontStyle: 'italic'
          }}>
            Select a project and master file to define variable fields
          </p>

          {/* TODO: Dynamic variable input fields based on selected master */}

          <button
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#3b82f6',
              backgroundColor: 'transparent',
              border: '2px dashed #3b82f6',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            + Add Variable Field
          </button>
        </div>
      </div>

      {/* d) SUBMIT OPTIONS */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a202c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📤 SUBMIT OPTIONS
        </h3>

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#4a5568',
            marginBottom: '6px'
          }}>
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <option value="draft">Draft</option>
            <option value="send">Send</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_production">In Production</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        paddingTop: '12px'
      }}>
        <button
          onClick={handleSaveDraft}
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#475569',
            backgroundColor: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = '#cbd5e0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          💾 Save Draft
        </button>

        <button
          onClick={handleSubmitOrder}
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: '#3b82f6',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          📤 Submit Order
        </button>
      </div>
    </div>
  );
};

export default NewOrderTab;
