import React, { useState, useEffect } from 'react';

interface Layout {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  motherCount: number;
  contentObjectCount: number;
  canvasData: any;
  regionContents: any;
  viewState: any;
}

interface ProjectPageProps {
  projectSlug: string;
  projectName: string;
}

const ProjectPage: React.FC<ProjectPageProps> = ({ projectSlug, projectName }) => {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterFiles, setMasterFiles] = useState<any[]>([]);
  const [showMasterFileSelector, setShowMasterFileSelector] = useState(false);

  useEffect(() => {
    loadProjectLayouts();
    loadMasterFiles();
  }, [projectSlug]);

  const loadProjectLayouts = async () => {
    try {
      console.log('🔄 Loading project layouts for:', projectSlug);
      
      // Try to load from API first
      try {
        const response = await fetch(`/api/projects/${projectSlug}/layouts`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.layouts) {
            setLayouts(data.layouts);
            console.log('✅ Loaded layouts from API:', data.layouts.length);
            return;
          }
        }
      } catch (apiError) {
        console.log('⚠️ API not available, trying localStorage');
      }

      // Fallback: Load from localStorage
      const storageKey = `project_${projectSlug}_layouts`;
      const savedLayouts = localStorage.getItem(storageKey);
      
      if (savedLayouts) {
        const parsedLayouts = JSON.parse(savedLayouts);
        setLayouts(parsedLayouts);
        console.log('✅ Loaded layouts from localStorage:', parsedLayouts.length);
      } else {
        console.log('📝 No saved layouts found');
        setLayouts([]);
      }
    } catch (error) {
      console.error('❌ Error loading project layouts:', error);
      setLayouts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterFiles = async () => {
    try {
      // This would typically load from your master files API
      // For now, using mock data
      setMasterFiles([
        {
          id: '449356c3-5fa9-454f-9267-8284f965e39f',
          name: 'TRS002',
          description: 'Sample master file',
          width: 200,
          height: 189
        }
      ]);
    } catch (error) {
      console.error('❌ Error loading master files:', error);
    }
  };

  const createNewLayout = (masterFileId: string) => {
    const url = `/create_zero?context=projects&projectSlug=${projectSlug}&masterFileId=${masterFileId}&projectName=${projectName}`;
    console.log('🔄 Creating new layout:', url);
    window.location.href = url;
  };

  const editLayout = (layout: Layout) => {
    // For now, create a new layout based on the master file
    // In a full implementation, you'd load the specific layout
    const masterFileId = '449356c3-5fa9-454f-9267-8284f965e39f'; // Default master file
    const url = `/create_zero?context=projects&projectSlug=${projectSlug}&masterFileId=${masterFileId}&projectName=${projectName}&layoutId=${layout.id}`;
    console.log('✏️ Editing layout:', url);
    window.location.href = url;
  };

  const deleteLayout = (layoutId: string) => {
    if (!window.confirm('Are you sure you want to delete this layout?')) {
      return;
    }

    try {
      const updatedLayouts = layouts.filter(layout => layout.id !== layoutId);
      setLayouts(updatedLayouts);

      // Update localStorage
      const storageKey = `project_${projectSlug}_layouts`;
      localStorage.setItem(storageKey, JSON.stringify(updatedLayouts));

      console.log('🗑️ Layout deleted:', layoutId);
    } catch (error) {
      console.error('❌ Error deleting layout:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading project...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>📋 Project: {projectName}</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Project Slug: {projectSlug} | Layouts: {layouts.length}
        </p>
      </div>

      {/* Add New Layout Button */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => setShowMasterFileSelector(!showMasterFileSelector)}
          style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            border: '2px solid #4CAF50',
            color: 'white',
            fontSize: '16px',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)'
          }}
        >
          ➕ Add New Layout
        </button>
      </div>

      {/* Master File Selector */}
      {showMasterFileSelector && (
        <div style={{
          background: '#f5f5f5',
          border: '2px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3>Select Master File Template:</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {masterFiles.map(masterFile => (
              <button
                key={masterFile.id}
                onClick={() => {
                  createNewLayout(masterFile.id);
                  setShowMasterFileSelector(false);
                }}
                style={{
                  background: 'white',
                  border: '2px solid #2196f3',
                  borderRadius: '8px',
                  padding: '15px',
                  cursor: 'pointer',
                  minWidth: '200px',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  📄 {masterFile.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {masterFile.width} × {masterFile.height} mm
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {masterFile.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Layouts Grid */}
      {layouts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f9f9f9',
          borderRadius: '8px',
          border: '2px dashed #ddd'
        }}>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>No layouts yet</h3>
          <p style={{ color: '#999', marginBottom: '20px' }}>
            Add your first layout to start designing your multi-page label project
          </p>
          <button
            onClick={() => setShowMasterFileSelector(true)}
            style={{
              background: '#2196f3',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ➕ Create First Layout
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {layouts.map(layout => (
            <div
              key={layout.id}
              style={{
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                  📄 {layout.name}
                </h3>
                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                  Created: {new Date(layout.createdAt).toLocaleString()}
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                  {layout.motherCount} mothers, {layout.contentObjectCount} content objects
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => editLayout(layout)}
                  style={{
                    background: '#2196f3',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    flex: 1
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => deleteLayout(layout.id)}
                  style={{
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectPage;
