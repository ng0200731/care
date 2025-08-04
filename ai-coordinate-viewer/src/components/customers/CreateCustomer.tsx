import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerService, CreateCustomerRequest } from '../../services/customerService';

const CreateCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    customerName: '',
    person: '',
    email: '',
    tel: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateCustomerRequest>>({});

  const dummyData = [
    {
      customerName: 'Fashion Forward Inc.',
      person: 'Emma Johnson',
      email: 'emma.johnson@fashionforward.com',
      tel: '+1-555-0101'
    },
    {
      customerName: 'Global Textile Solutions',
      person: 'Michael Chen',
      email: 'm.chen@globaltextile.com',
      tel: '+1-555-0202'
    },
    {
      customerName: 'Premium Apparel Co.',
      person: 'Sarah Williams',
      email: 'sarah.w@premiumapparel.com',
      tel: '+1-555-0303'
    },
    {
      customerName: 'Urban Style Brands',
      person: 'David Rodriguez',
      email: 'david.r@urbanstyle.com',
      tel: '+1-555-0404'
    },
    {
      customerName: 'Eco-Friendly Fashion',
      person: 'Lisa Thompson',
      email: 'lisa.t@ecofashion.com',
      tel: '+1-555-0505'
    }
  ];

  const handleDummyFill = () => {
    const randomData = dummyData[Math.floor(Math.random() * dummyData.length)];
    setFormData(randomData);
    setErrors({}); // Clear any existing errors
  };

  const handleInputChange = (field: keyof CreateCustomerRequest, value: string) => {
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
    const newErrors: Partial<CreateCustomerRequest> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.person.trim()) {
      newErrors.person = 'Contact person is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.tel.trim()) {
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

    setIsLoading(true);

    try {
      const newCustomer = await customerService.createCustomer(formData);
      console.log('Customer created:', newCustomer);
      
      // Navigate to customers list
      navigate('/customers');
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error creating customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#2d3748',
    outline: 'none',
    transition: 'border-color 0.3s ease'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '8px'
  };

  const errorStyle = {
    color: '#e53e3e',
    fontSize: '12px',
    marginTop: '4px'
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
            Create New Customer
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#718096',
            margin: 0
          }}>
            Add a new customer to your system
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={handleDummyFill}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#2d3748',
              background: '#f7fafc',
              fontSize: '14px',
              fontWeight: '500',
              padding: '10px 15px',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#edf2f7';
              e.currentTarget.style.borderColor = '#2d3748';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f7fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <span>🎲</span>
            Dummy Fill
          </button>

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
        </div>
      </div>

      {/* Form */}
      <div style={{
        background: 'white',
        padding: '40px',
        border: '1px solid #e2e8f0',
        maxWidth: '600px'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Customer Name */}
          <div style={{ marginBottom: '25px' }}>
            <label style={labelStyle}>Customer Name *</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              placeholder="Enter customer company name (e.g., ABC Fashion Co.)"
              style={{
                ...inputStyle,
                borderColor: errors.customerName ? '#e53e3e' : '#e2e8f0'
              }}
              onFocus={(e) => e.target.style.borderColor = errors.customerName ? '#e53e3e' : '#4a5568'}
              onBlur={(e) => e.target.style.borderColor = errors.customerName ? '#e53e3e' : '#e2e8f0'}
            />
            {errors.customerName && (
              <div style={errorStyle}>{errors.customerName}</div>
            )}
          </div>

          {/* Contact Person */}
          <div style={{ marginBottom: '25px' }}>
            <label style={labelStyle}>Contact Person *</label>
            <input
              type="text"
              value={formData.person}
              onChange={(e) => handleInputChange('person', e.target.value)}
              placeholder="Enter contact person name (e.g., John Smith)"
              style={{
                ...inputStyle,
                borderColor: errors.person ? '#e53e3e' : '#e2e8f0'
              }}
              onFocus={(e) => e.target.style.borderColor = errors.person ? '#e53e3e' : '#4a5568'}
              onBlur={(e) => e.target.style.borderColor = errors.person ? '#e53e3e' : '#e2e8f0'}
            />
            {errors.person && (
              <div style={errorStyle}>{errors.person}</div>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '25px' }}>
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address (e.g., john@company.com)"
              style={{
                ...inputStyle,
                borderColor: errors.email ? '#e53e3e' : '#e2e8f0'
              }}
              onFocus={(e) => e.target.style.borderColor = errors.email ? '#e53e3e' : '#4a5568'}
              onBlur={(e) => e.target.style.borderColor = errors.email ? '#e53e3e' : '#e2e8f0'}
            />
            {errors.email && (
              <div style={errorStyle}>{errors.email}</div>
            )}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '35px' }}>
            <label style={labelStyle}>Phone Number *</label>
            <input
              type="tel"
              value={formData.tel}
              onChange={(e) => handleInputChange('tel', e.target.value)}
              placeholder="Enter phone number (e.g., +1-555-0123)"
              style={{
                ...inputStyle,
                borderColor: errors.tel ? '#e53e3e' : '#e2e8f0'
              }}
              onFocus={(e) => e.target.style.borderColor = errors.tel ? '#e53e3e' : '#4a5568'}
              onBlur={(e) => e.target.style.borderColor = errors.tel ? '#e53e3e' : '#e2e8f0'}
            />
            {errors.tel && (
              <div style={errorStyle}>{errors.tel}</div>
            )}
          </div>

          {/* Submit Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '15px',
            paddingTop: '25px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <Link
              to="/master-files"
              style={{
                padding: '12px 25px',
                background: '#f7fafc',
                color: '#4a5568',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = '#edf2f7';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = '#f7fafc';
              }}
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '12px 25px',
                background: isLoading ? '#a0aec0' : '#2d3748',
                color: 'white',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = '#4a5568';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = '#2d3748';
                }
              }}
            >
              {isLoading ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCustomer;
