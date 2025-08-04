import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface MasterFileData {
  name: string;
  description: string;
  category: string;
  tags: string[];
  dimensions: {
    width: number;
    height: number;
  };
}

const CreateMasterFile: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<MasterFileData>({
    name: '',
    description: '',
    category: 'care-label',
    tags: [],
    dimensions: {
      width: 50,
      height: 30
    }
  });
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { value: 'care-label', label: 'Care Label' },
    { value: 'size-label', label: 'Size Label' },
    { value: 'brand-label', label: 'Brand Label' },
    { value: 'custom', label: 'Custom Layout' }
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'dimensions') {
        setFormData(prev => ({
          ...prev,
          dimensions: {
            ...prev.dimensions,
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      console.log('Creating master file:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to coordinate viewer with new file data
      navigate('/coordinate-viewer', { 
        state: { 
          newFile: true, 
          fileData: formData 
        } 
      });
    } catch (error) {
      console.error('Error creating master file:', error);
      alert('Error creating master file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    fontSize: '13px',
    color: '#2d3748',
    outline: 'none',
    transition: 'border-color 0.3s ease'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '6px'
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px'
      }}>
        <div>
          <h1 style={{
            fontSize: '26px', // Reduced by 10%
            fontWeight: 'bold',
            color: '#2d3748',
            margin: '0 0 5px 0'
          }}>
            Create New Master File
          </h1>
          <p style={{
            fontSize: '14px', // Reduced by 10%
            color: '#718096',
            margin: 0
          }}>
            Set up a new label layout design
          </p>
        </div>
        
        <Link
          to="/master-files"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#2d3748',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '500',
            padding: '8px 12px',
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

      {/* Form */}
      <div style={{
        background: 'white',
        padding: '30px',
        border: '1px solid #e2e8f0'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '25px',
            marginBottom: '25px'
          }}>
            {/* Left Column */}
            <div>
              {/* File Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>File Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter file name (e.g., Basic_Care_Label)"
                  style={inputStyle}
                  required
                  onFocus={(e) => e.target.style.borderColor = '#4a5568'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the purpose of this master file..."
                  style={{
                    ...inputStyle,
                    height: '80px',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4a5568'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Category */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={inputStyle}
                  required
                  onFocus={(e) => e.target.style.borderColor = '#4a5568'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Dimensions */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Dimensions (mm) *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={formData.dimensions.width}
                      onChange={(e) => handleInputChange('dimensions.width', parseFloat(e.target.value) || 0)}
                      placeholder="Width"
                      style={inputStyle}
                      min="1"
                      required
                      onFocus={(e) => e.target.style.borderColor = '#4a5568'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <small style={{ color: '#718096', fontSize: '11px' }}>Width</small>
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={formData.dimensions.height}
                      onChange={(e) => handleInputChange('dimensions.height', parseFloat(e.target.value) || 0)}
                      placeholder="Height"
                      style={inputStyle}
                      min="1"
                      required
                      onFocus={(e) => e.target.style.borderColor = '#4a5568'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <small style={{ color: '#718096', fontSize: '11px' }}>Height</small>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Tags</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    style={{ ...inputStyle, flex: 1 }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4a5568'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    style={{
                      padding: '10px 15px',
                      background: '#4a5568',
                      color: 'white',
                      border: 'none',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2d3748'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#4a5568'}
                  >
                    Add
                  </button>
                </div>
                
                {/* Tag Display */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        background: '#f7fafc',
                        color: '#2d3748',
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#718096',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '0',
                          marginLeft: '2px'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '20px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <Link
              to="/master-files"
              style={{
                padding: '10px 20px',
                background: '#f7fafc',
                color: '#4a5568',
                textDecoration: 'none',
                fontSize: '13px',
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
              disabled={isLoading || !formData.name.trim()}
              style={{
                padding: '10px 20px',
                background: isLoading || !formData.name.trim() ? '#a0aec0' : '#2d3748',
                color: 'white',
                border: 'none',
                fontSize: '13px',
                fontWeight: '500',
                cursor: isLoading || !formData.name.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && formData.name.trim()) {
                  e.currentTarget.style.background = '#4a5568';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && formData.name.trim()) {
                  e.currentTarget.style.background = '#2d3748';
                }
              }}
            >
              {isLoading ? 'Creating...' : 'Create & Open Designer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMasterFile;
