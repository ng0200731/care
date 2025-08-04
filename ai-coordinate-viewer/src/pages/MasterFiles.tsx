import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MasterFiles: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - will be replaced with API calls later
  const masterFiles = [
    {
      id: '1',
      name: 'Mother_1.json',
      description: 'Basic care label layout',
      lastModified: '2 hours ago',
      size: '2.4 KB',
      objects: 5
    },
    {
      id: '2',
      name: 'Complex_Layout.json',
      description: 'Multi-object care label design',
      lastModified: '1 day ago',
      size: '4.1 KB',
      objects: 12
    },
    {
      id: '3',
      name: 'Simple_Design.json',
      description: 'Minimal care label',
      lastModified: '3 days ago',
      size: '1.8 KB',
      objects: 3
    }
  ];

  const filteredFiles = masterFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#2d3748',
            margin: '0 0 5px 0'
          }}>
            Master Files
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#718096',
            margin: 0
          }}>
            Create and manage your label layout designs
          </p>
        </div>
        
        <Link
          to="/master-files/create"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
        >
          <span>➕</span>
          New Master File
        </Link>
      </div>

      {/* Create New Section */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#2d3748',
          marginBottom: '20px'
        }}>
          Create New Master File
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <Link
            to="/coordinate-viewer"
            style={{
              textDecoration: 'none',
              display: 'block'
            }}
          >
            <div style={{
              padding: '20px',
              border: '2px dashed #cbd5e0',
              borderRadius: '12px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.background = '#f7faff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e0';
              e.currentTarget.style.background = 'transparent';
            }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📄</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#4299e1',
                margin: '0 0 8px 0'
              }}>
                Create from Zero
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#718096',
                margin: 0
              }}>
                Start with a blank canvas and design your layout
              </p>
            </div>
          </Link>

          <div style={{
            padding: '20px',
            border: '2px dashed #cbd5e0',
            borderRadius: '12px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#38a169';
            e.currentTarget.style.background = '#f0fff4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e0';
            e.currentTarget.style.background = 'transparent';
          }}
          >
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📥</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#38a169',
              margin: '0 0 8px 0'
            }}>
              Import from JSON
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#718096',
              margin: 0
            }}>
              Load an existing design from a JSON file
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#2d3748',
            margin: 0
          }}>
            Your Master Files ({filteredFiles.length})
          </h2>
          
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              width: '250px',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Files List */}
        {filteredFiles.length > 0 ? (
          <div style={{
            display: 'grid',
            gap: '15px'
          }}>
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.background = '#f7faff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'white';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    background: '#ebf8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    📄
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2d3748',
                      margin: '0 0 5px 0'
                    }}>
                      {file.name}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#718096',
                      margin: '0 0 5px 0'
                    }}>
                      {file.description}
                    </p>
                    <div style={{
                      fontSize: '12px',
                      color: '#a0aec0'
                    }}>
                      {file.objects} objects • {file.size} • Modified {file.lastModified}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    to={`/coordinate-viewer?file=${file.id}`}
                    style={{
                      padding: '8px 16px',
                      background: '#4299e1',
                      color: 'white',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Edit
                  </Link>
                  <button style={{
                    padding: '8px 16px',
                    background: '#f7fafc',
                    color: '#4a5568',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    Download
                  </button>
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
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
            <p style={{ fontSize: '16px', margin: 0 }}>
              {searchTerm ? 'No files match your search' : 'No master files found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterFiles;
