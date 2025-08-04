// Master Files Management Page
// Level 1: Master File Management with real database integration

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MasterFileWithSummary, CreateMasterFileRequest } from '../types/database';
import { masterFileService } from '../services/masterFileService';
import { customerService, Customer } from '../services/customerService';

const MasterFilesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [masterFiles, setMasterFiles] = useState<MasterFileWithSummary[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  
  // Create form state
  const [createForm, setCreateForm] = useState<CreateMasterFileRequest>({
    name: '',
    width: 200,
    height: 150,
    customerId: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load customers
      const customersResult = await customerService.getAllCustomers();
      setCustomers(customersResult);

      // Load master files
      const filters = {
        search: searchTerm || undefined,
        customerId: selectedCustomer || undefined
      };
      const masterFilesResult = await masterFileService.getAllMasterFiles(filters);
      if (masterFilesResult.success) {
        setMasterFiles(masterFilesResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMasterFile = async () => {
    if (!createForm.name || !createForm.customerId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const result = await masterFileService.createMasterFile(createForm);
      if (result.success) {
        setShowCreateForm(false);
        setCreateForm({
          name: '',
          width: 200,
          height: 150,
          customerId: '',
          description: ''
        });
        loadData(); // Reload the list
        alert('Master file created successfully!');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating master file:', error);
      alert('Failed to create master file');
    }
  };

  const handleDeleteMasterFile = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete all associated templates and son objects.`)) {
      try {
        const result = await masterFileService.deleteMasterFile(id);
        if (result.success) {
          loadData(); // Reload the list
          alert('Master file deleted successfully!');
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting master file:', error);
        alert('Failed to delete master file');
      }
    }
  };

  const handleSelectMasterFile = (masterFile: MasterFileWithSummary) => {
    // Navigate to template management for this master file
    navigate(`/master-files/${masterFile.id}/templates`);
  };

  const handleEditMasterFile = (masterFile: MasterFileWithSummary) => {
    // Navigate to coordinate viewer with master file ID for editing
    navigate(`/coordinate-viewer?masterFileId=${masterFile.id}`);
  };

  const filteredMasterFiles = masterFiles.filter(mf => 
    (!searchTerm || mf.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (mf.description && mf.description.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (!selectedCustomer || mf.customerId === selectedCustomer)
  );

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading master files...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back to Master Files Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/master-files')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4a5568',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2d3748';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4a5568';
          }}
        >
          ← Back to Master Files
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
          📁 Master Files Management
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
          Create and manage master files for your care label layouts
        </p>
      </div>

      {/* Actions Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1 }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search master files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '200px'
            }}
          />
          
          {/* Customer Filter */}
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="">All Customers</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.customerName}
              </option>
            ))}
          </select>
          
          {/* Search Button */}
          <button
            onClick={loadData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔍 Search
          </button>
        </div>

        {/* Create Button */}
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          ➕ Create New Master File
        </button>
      </div>

      {/* Master Files Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '20px',
        marginBottom: '20px'
      }}>
        {filteredMasterFiles.map(masterFile => (
          <div
            key={masterFile.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => handleSelectMasterFile(masterFile)}
          >
            {/* Master File Header */}
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
                📄 {masterFile.name}
              </h3>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Customer: {masterFile.customerName}
              </div>
            </div>

            {/* Dimensions */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                📐 Dimensions
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {masterFile.width} × {masterFile.height} mm
              </div>
            </div>

            {/* Templates Info */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                📋 Templates
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {masterFile.templateCount} template{masterFile.templateCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Design Data Info */}
            {(masterFile as any).designData && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  🎨 Design Objects
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {(masterFile as any).designData.objects?.length || 0} objects
                  {(masterFile as any).designData.metadata?.createdInWebMode && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      borderRadius: '3px',
                      fontSize: '11px'
                    }}>
                      WEB CREATED
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {masterFile.description && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  📝 Description
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {masterFile.description}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', color: '#999' }}>
                Created: {masterFile.createdAt.toLocaleDateString()}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                Updated: {masterFile.updatedAt.toLocaleDateString()}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditMasterFile(masterFile);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectMasterFile(masterFile);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🎨 Manage Templates
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMasterFile(masterFile.id, masterFile.name);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMasterFiles.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📁</div>
          <h3>No Master Files Found</h3>
          <p>Create your first master file to get started with care label layouts.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            ➕ Create Master File
          </button>
        </div>
      )}

      {/* Create Master File Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0' }}>Create New Master File</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Master File Name *
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter master file name"
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Width (mm) *
                </label>
                <input
                  type="number"
                  value={createForm.width}
                  onChange={(e) => setCreateForm({...createForm, width: parseFloat(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  min="1"
                  step="0.1"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Height (mm) *
                </label>
                <input
                  type="number"
                  value={createForm.height}
                  onChange={(e) => setCreateForm({...createForm, height: parseFloat(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  min="1"
                  step="0.1"
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Customer *
              </label>
              <select
                value={createForm.customerId}
                onChange={(e) => setCreateForm({...createForm, customerId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Optional description"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMasterFile}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Create Master File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterFilesManagement;
