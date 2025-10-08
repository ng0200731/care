import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { customerService, Customer, UpdateCustomerRequest } from '../../services/customerService';

const EditCustomer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<UpdateCustomerRequest>({
    id: '',
    customerName: '',
    person: '',
    email: '',
    tel: '',
    currency: 'USD'
  });
  const [errors, setErrors] = useState<Partial<UpdateCustomerRequest>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load customer data on component mount
  useEffect(() => {
    if (id) {
      loadCustomer(id);
    }
  }, [id]);

  const loadCustomer = async (customerId: string) => {
    try {
      setIsLoading(true);
      const customer = await customerService.getCustomerById(customerId);
      if (customer) {
        setFormData({
          id: customer.id,
          customerName: customer.customerName,
          person: customer.person,
          email: customer.email,
          tel: customer.tel,
          currency: customer.currency || 'USD'
        });
      } else {
        // Customer not found, redirect back
        navigate('/customers');
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      navigate('/customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateCustomerRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<UpdateCustomerRequest> = {};

    if (!formData.customerName?.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.person?.trim()) {
      newErrors.person = 'Contact person is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.tel?.trim()) {
      newErrors.tel = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await customerService.updateCustomer(formData);
      
      // Success - redirect back to customers list
      navigate('/customers');
    } catch (error) {
      console.error('Error updating customer:', error);
      // You could show an error message here
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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
          Loading customer...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px'
    }}>
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
            Edit Customer
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#718096',
            margin: 0
          }}>
            Update customer information
          </p>
        </div>
        
        <Link
          to="/customers"
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
          Back to Customers
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '30px',
        border: '1px solid #e2e8f0'
      }}>
        {/* Customer Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '6px'
          }}>
            Customer Name *
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: errors.customerName ? '2px solid #e53e3e' : '1px solid #e2e8f0',
              fontSize: '14px',
              color: '#2d3748',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              if (!errors.customerName) {
                e.target.style.borderColor = '#4a5568';
              }
            }}
            onBlur={(e) => {
              if (!errors.customerName) {
                e.target.style.borderColor = '#e2e8f0';
              }
            }}
            placeholder="Enter customer name"
          />
          {errors.customerName && (
            <div style={{
              fontSize: '12px',
              color: '#e53e3e',
              marginTop: '4px'
            }}>
              {errors.customerName}
            </div>
          )}
        </div>

        {/* Contact Person */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '6px'
          }}>
            Contact Person *
          </label>
          <input
            type="text"
            value={formData.person}
            onChange={(e) => handleInputChange('person', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: errors.person ? '2px solid #e53e3e' : '1px solid #e2e8f0',
              fontSize: '14px',
              color: '#2d3748',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              if (!errors.person) {
                e.target.style.borderColor = '#4a5568';
              }
            }}
            onBlur={(e) => {
              if (!errors.person) {
                e.target.style.borderColor = '#e2e8f0';
              }
            }}
            placeholder="Enter contact person name"
          />
          {errors.person && (
            <div style={{
              fontSize: '12px',
              color: '#e53e3e',
              marginTop: '4px'
            }}>
              {errors.person}
            </div>
          )}
        </div>

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '6px'
          }}>
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: errors.email ? '2px solid #e53e3e' : '1px solid #e2e8f0',
              fontSize: '14px',
              color: '#2d3748',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              if (!errors.email) {
                e.target.style.borderColor = '#4a5568';
              }
            }}
            onBlur={(e) => {
              if (!errors.email) {
                e.target.style.borderColor = '#e2e8f0';
              }
            }}
            placeholder="Enter email address"
          />
          {errors.email && (
            <div style={{
              fontSize: '12px',
              color: '#e53e3e',
              marginTop: '4px'
            }}>
              {errors.email}
            </div>
          )}
        </div>

        {/* Phone Number */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '6px'
          }}>
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.tel}
            onChange={(e) => handleInputChange('tel', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: errors.tel ? '2px solid #e53e3e' : '1px solid #e2e8f0',
              fontSize: '14px',
              color: '#2d3748',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              if (!errors.tel) {
                e.target.style.borderColor = '#4a5568';
              }
            }}
            onBlur={(e) => {
              if (!errors.tel) {
                e.target.style.borderColor = '#e2e8f0';
              }
            }}
            placeholder="Enter phone number"
          />
          {errors.tel && (
            <div style={{
              fontSize: '12px',
              color: '#e53e3e',
              marginTop: '4px'
            }}>
              {errors.tel}
            </div>
          )}
        </div>

        {/* Currency */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '6px'
          }}>
            Currency
          </label>
          <select
            value={formData.currency || 'USD'}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              color: '#2d3748',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4a5568';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CNY">CNY - Chinese Yuan</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CHF">CHF - Swiss Franc</option>
            <option value="HKD">HKD - Hong Kong Dollar</option>
            <option value="SGD">SGD - Singapore Dollar</option>
            <option value="KRW">KRW - South Korean Won</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="MXN">MXN - Mexican Peso</option>
            <option value="BRL">BRL - Brazilian Real</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            background: isSubmitting ? '#a0aec0' : '#2d3748',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = '#1a202c';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = '#2d3748';
            }
          }}
        >
          {isSubmitting ? 'Updating Customer...' : 'Update Customer'}
        </button>
      </form>
    </div>
  );
};

export default EditCustomer;
