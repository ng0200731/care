import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, Customer } from '../services/customerService';
import { projectService, Project } from '../services/projectService';



const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);

  // Create project form state
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    customerId: '',
    customerName: '',
    status: 'Draft' as const
  });

  // Customers for selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Load projects from service
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectList = await projectService.getAllProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return '#6c757d';
      case 'In Progress': return '#007bff';
      case 'Review': return '#ffc107';
      case 'Completed': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return '📝';
      case 'In Progress': return '⚡';
      case 'Review': return '👀';
      case 'Completed': return '✅';
      default: return '📝';
    }
  };

  // Load customers when create form opens
  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const customerList = await customerService.getAllCustomers();
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Error loading customers. Please try again.');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      alert('Please enter a project name');
      return;
    }
    if (!newProject.customerId) {
      alert('Please select a customer');
      return;
    }

    setCreating(true);

    try {
      const project = await projectService.createProject({
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        customerName: newProject.customerName,
        customerId: newProject.customerId,
        status: newProject.status
      });

      // Refresh the projects list
      await loadProjects();

      setShowCreateForm(false);
      setCreating(false);

      // Reset form
      setNewProject({
        name: '',
        description: '',
        customerId: '',
        customerName: '',
        status: 'Draft'
      });

      // Navigate to project detail page using readable URL
      navigate(`/projects/${project.slug}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project. Please try again.');
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    const confirmMessage = `Are you sure you want to delete the project "${projectName}"?\n\nThis action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        const success = await projectService.deleteProject(projectId);
        if (success) {
          // Refresh the projects list
          await loadProjects();
        } else {
          alert('Error deleting project. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project. Please try again.');
      }
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );





  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #2196F3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <div style={{ fontSize: '16px', color: '#666' }}>Loading projects...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '36px', fontWeight: 'bold', opacity: '0.9' }}>
          📋 Projects Management
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
          Create and manage multi-page label projects for complete product labeling solutions
        </p>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        gap: '20px'
      }}>
        {/* Search */}
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="🔍 Search projects, customers, or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2196F3'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => {
              setShowCreateForm(true);
              loadCustomers();
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
          >
            ➕ New Project
          </button>

          <button
            onClick={() => navigate('/projects/report')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
          >
            📊 Project Report
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {filteredProjects.map(project => (
          <div
            key={project.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '12px',
              padding: '24px',
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => navigate(`/projects/${project.slug}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Project Header */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                  lineHeight: '1.3'
                }}>
                  {project.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: getStatusColor(project.status),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {getStatusIcon(project.status)} {project.status}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handleDeleteProject(project.id, project.name);
                    }}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Delete Project"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p style={{
                margin: '0 0 12px 0',
                color: '#666',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {project.description}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#888'
              }}>
                <span>👤 {project.customerName}</span>
                <span>•</span>
                <span>📄 {project.pageCount} pages</span>
              </div>
            </div>

            {/* Project Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '1px solid #eee',
              fontSize: '12px',
              color: '#999'
            }}>
              <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
              <span>Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            {searchTerm ? 'No projects found' : 'No projects yet'}
          </h3>
          <p style={{ margin: 0, fontSize: '14px' }}>
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first project to get started with multi-page label design'
            }
          </p>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 'bold' }}>
              📋 Create New Project
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Customer Selection */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  Customer *
                </label>
                {loadingCustomers ? (
                  <div style={{
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    color: '#666',
                    textAlign: 'center'
                  }}>
                    Loading customers...
                  </div>
                ) : (
                  <select
                    value={newProject.customerId}
                    onChange={(e) => {
                      const selectedCustomer = customers.find(c => c.id === e.target.value);
                      setNewProject(prev => ({
                        ...prev,
                        customerId: e.target.value,
                        customerName: selectedCustomer?.customerName || ''
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#007bff'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  >
                    <option value="">Select a customer...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.customerName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Project Name */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Summer Collection 2024"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the project and its purpose..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>



              {/* Status */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  Initial Status
                </label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                >
                  <option value="Draft">📝 Draft</option>
                  <option value="In Progress">⚡ In Progress</option>
                  <option value="Review">👀 Review</option>
                  <option value="Completed">✅ Completed</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: creating ? 0.6 : 1
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleCreateProject}
                disabled={creating || !newProject.name.trim() || !newProject.customerId}
                style={{
                  padding: '12px 24px',
                  backgroundColor: creating ? '#28a745' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (creating || !newProject.name.trim() || !newProject.customerId) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: (creating || !newProject.name.trim() || !newProject.customerId) ? 0.6 : 1
                }}
              >
                {creating ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Creating...
                  </>
                ) : (
                  <>➕ Create Project</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
