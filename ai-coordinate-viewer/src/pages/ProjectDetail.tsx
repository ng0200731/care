import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { mockDatabase } from '../database/mockDatabase';

interface ProjectPage {
  id: string;
  name: string;
  width: number;
  height: number;
  masterFileId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  customerName: string;
  customerId: string;
  status: 'Draft' | 'In Progress' | 'Review' | 'Completed';
  createdAt: string;
  updatedAt: string;
  pages: ProjectPage[];
}

const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPage, setNewPage] = useState({
    name: '',
    masterFileId: ''
  });

  // Master files for the project's customer
  const [masterFiles, setMasterFiles] = useState<any[]>([]);
  const [loadingMasterFiles, setLoadingMasterFiles] = useState(false);

  // Load project data
  useEffect(() => {
    loadProject();
  }, [slug]);

  const loadProject = async () => {
    if (!slug) return;

    setLoading(true);
    try {
      const projectData = await projectService.getProjectBySlug(slug);
      if (projectData) {
        // Convert to ProjectDetail format
        const projectDetail: ProjectDetail = {
          ...projectData,
          pages: [] // Start with empty pages - will be loaded separately if needed
        };
        setProject(projectDetail);
      } else {
        console.error('Project not found');
      }
    } catch (error) {
      console.error('Error loading project:', error);
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

  // Load master files for the project's customer
  const loadMasterFiles = async () => {
    if (!project) return;

    setLoadingMasterFiles(true);
    try {
      // Get all master files and filter by customerId (not customerName)
      const allMasterFiles = await mockDatabase.getAllMasterFiles();

      // Filter by customerId if available, otherwise fall back to customerName
      const customerMasterFiles = allMasterFiles.filter(mf => {
        if (project.customerId) {
          // Match by customerId (more reliable)
          return mf.customerId === project.customerId;
        } else {
          // Fallback to customerName matching
          return mf.customerName === project.customerName;
        }
      });

      // Convert to the format expected by the UI
      const formattedMasterFiles = customerMasterFiles.map(mf => {
        // Create a fallback SVG placeholder using URL encoding instead of btoa
        const svgContent = `<svg width="${mf.width}" height="${mf.height}" viewBox="0 0 ${mf.width} ${mf.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="${mf.width}" height="${mf.height}" fill="white" stroke="#ddd" stroke-width="1"/>
          <text x="${mf.width/2}" y="${mf.height/2}" text-anchor="middle" font-size="8" fill="#666" dominant-baseline="middle">
            ${mf.name.substring(0, 10).replace(/[^\w\s]/g, '')}
          </text>
          <text x="${mf.width/2}" y="${mf.height/2 + 12}" text-anchor="middle" font-size="6" fill="#999" dominant-baseline="middle">
            ${mf.width}x${mf.height}mm
          </text>
        </svg>`;

        const fallbackSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;

        return {
          id: mf.id,
          name: mf.name,
          width: mf.width,
          height: mf.height,
          customerName: mf.customerName,
          createdAt: mf.createdAt.toISOString().split('T')[0],
          thumbnail: mf.canvasImage && mf.canvasImage.startsWith('data:image/') ? mf.canvasImage : fallbackSvg
        };
      });

      setMasterFiles(formattedMasterFiles);
    } catch (error) {
      console.error('Error loading master files:', error);
      setMasterFiles([]);
    } finally {
      setLoadingMasterFiles(false);
    }
  };

  const handleAddPage = () => {
    if (!newPage.masterFileId) {
      alert('Please select a master file');
      return;
    }

    const selectedMasterFile = masterFiles.find(mf => mf.id === newPage.masterFileId);
    if (!selectedMasterFile) return;

    // Navigate directly to canvas with project context (no popup needed)
    navigate(`/create_zero?context=projects&projectSlug=${slug}&masterFileId=${selectedMasterFile.id}&projectName=${encodeURIComponent(project?.name || '')}`);
  };

  const handleEditPage = (pageId: string) => {
    // Navigate to canvas with project context
    navigate(`/create_zero?context=projects&projectSlug=${slug}&pageId=${pageId}`);
  };

  const handleDeletePage = (pageId: string) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      setProject(prev => prev ? {
        ...prev,
        pages: prev.pages.filter(p => p.id !== pageId)
      } : null);
    }
  };



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
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <div style={{ fontSize: '16px', color: '#666' }}>Loading project...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Project not found</h2>
        <button onClick={() => navigate('/projects')}>
          ← Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: 'white',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '30px' 
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
              📋 {project.name}
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: getStatusColor(project.status),
              color: 'white',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {project.status}
            </div>
          </div>
          
          <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '16px', lineHeight: '1.5' }}>
            {project.description}
          </p>
          
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#888' }}>
            <span>👤 Customer: <strong>{project.customerName}</strong></span>
            <span>📄 Pages: <strong>{project.pages.length}</strong></span>
            <span>📅 Created: <strong>{new Date(project.createdAt).toLocaleDateString()}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/projects')}
            style={{
              padding: '12px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ← Back to Projects
          </button>



          <button
            onClick={() => {
              setShowAddPage(true);
              loadMasterFiles();
            }}
            style={{
              padding: '12px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ Add Page
          </button>
        </div>
      </div>

      {/* Pages Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {project.pages.map(page => (
          <div
            key={page.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '12px',
              padding: '20px',
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            {/* Page Header */}
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
                📄 {page.name}
              </h3>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                Dimensions: {page.width} × {page.height} mm
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                Created: {new Date(page.createdAt).toLocaleDateString()}
                {page.updatedAt !== page.createdAt && (
                  <span> • Updated: {new Date(page.updatedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Page Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleEditPage(page.id)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: page.masterFileId ? '#007bff' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                {page.masterFileId ? '✏️ Edit' : '🎨 Design'}
              </button>
              
              <button
                onClick={() => handleDeletePage(page.id)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {project.pages.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>No pages yet</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px' }}>
            Add your first page to start designing your multi-page label project
          </p>
          <button
            onClick={() => {
              setShowAddPage(true);
              loadMasterFiles();
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ➕ Add First Page
          </button>
        </div>
      )}

      {/* Add Page Modal */}
      {showAddPage && (
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
            maxWidth: '900px',
            width: '95%',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 'bold' }}>
              📄 Select Master File for New Page
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: '0 0 20px 0',
              lineHeight: '1.5'
            }}>
              Choose a master file from <strong>{project?.customerName}</strong> to use as the template for this page
            </p>



            {loadingMasterFiles ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#666'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #007bff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                Loading master files for {project?.customerName}...
              </div>
            ) : masterFiles.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#666',
                border: '2px dashed #ddd',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>No Master Files Found</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
                  No master files found for <strong>{project?.customerName}</strong>.
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                  Create master files in Master File Management first.
                </p>
              </div>
            ) : (
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '20px',
                maxHeight: '500px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Fixed Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 2fr 100px 100px 120px',
                  gap: '0',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #ddd',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#333',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  <div style={{ padding: '16px 12px', borderRight: '1px solid #ddd' }}>Preview</div>
                  <div style={{ padding: '16px 12px', borderRight: '1px solid #ddd' }}>Master File Name</div>
                  <div style={{ padding: '16px 12px', borderRight: '1px solid #ddd', textAlign: 'center' }}>Width (mm)</div>
                  <div style={{ padding: '16px 12px', borderRight: '1px solid #ddd', textAlign: 'center' }}>Height (mm)</div>
                  <div style={{ padding: '16px 12px', textAlign: 'center' }}>Action</div>
                </div>

                {/* Scrollable Table Body */}
                <div style={{
                  overflowY: 'auto',
                  maxHeight: '400px'
                }}>
                  {masterFiles.map((masterFile, index) => (
                    <div
                      key={masterFile.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '120px 2fr 100px 100px 120px',
                        gap: '0',
                        backgroundColor: newPage.masterFileId === masterFile.id ? '#e3f2fd' :
                                        index % 2 === 0 ? 'white' : '#f9f9f9',
                        borderBottom: '1px solid #eee',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setNewPage(prev => ({ ...prev, masterFileId: masterFile.id }));
                      }}
                      onMouseEnter={(e) => {
                        if (newPage.masterFileId !== masterFile.id) {
                          e.currentTarget.style.backgroundColor = '#f0f8ff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newPage.masterFileId !== masterFile.id) {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9f9f9';
                        }
                      }}
                    >
                      {/* Preview Image */}
                      <div style={{
                        padding: '12px',
                        borderRight: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          width: '80px',
                          height: '60px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'white'
                        }}>
                          <img
                            src={masterFile.thumbnail}
                            alt={masterFile.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              // If image fails to load, show a placeholder
                              const target = e.target as HTMLImageElement;
                              const placeholderSvg = `<svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="80" height="60" fill="#f8f9fa" stroke="#ddd"/>
                                <text x="40" y="25" text-anchor="middle" font-size="10" fill="#666">No Image</text>
                                <text x="40" y="40" text-anchor="middle" font-size="8" fill="#999">${masterFile.width}x${masterFile.height}mm</text>
                              </svg>`;
                              target.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(placeholderSvg)}`;
                            }}
                          />
                        </div>
                      </div>

                      {/* File Name */}
                      <div style={{
                        padding: '12px',
                        borderRight: '1px solid #eee',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '15px',
                          marginBottom: '4px',
                          color: '#333',
                          lineHeight: '1.3'
                        }}>
                          {masterFile.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          Created: {new Date(masterFile.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Width */}
                      <div style={{
                        padding: '12px',
                        borderRight: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        {masterFile.width}
                      </div>

                      {/* Height */}
                      <div style={{
                        padding: '12px',
                        borderRight: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        {masterFile.height}
                      </div>

                      {/* Action */}
                      <div style={{
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {newPage.masterFileId === masterFile.id ? (
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            ✓ Selected
                          </div>
                        ) : (
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}>
                            Click to Select
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}



            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px', 
              marginTop: '24px' 
            }}>
              <button
                onClick={() => {
                  setShowAddPage(false);
                  setNewPage({ name: '', masterFileId: '' });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleAddPage}
                disabled={!newPage.masterFileId}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: newPage.masterFileId ? 'pointer' : 'not-allowed',
                  opacity: newPage.masterFileId ? 1 : 0.6,
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                🎨 Open in Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
