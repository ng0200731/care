import React, { useState, useCallback } from 'react';

interface AIObject {
  name: string;
  typename: string;
  type?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HierarchyNode {
  object: AIObject;
  children: AIObject[];
  isExpanded: boolean;
}

interface AIData {
  document: string;
  totalObjects: number;
  objects: AIObject[];
}

function App() {
  const [data, setData] = useState<AIData | null>(null);
  const [selectedObject, setSelectedObject] = useState<AIObject | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedMothers, setExpandedMothers] = useState<Set<string>>(new Set());

  // Build hierarchy from objects
  const buildHierarchy = (objects: AIObject[]) => {
    const mothers: HierarchyNode[] = [];
    const orphans: AIObject[] = [];
    
    // Find all mothers
    const motherObjects = objects.filter(obj => obj.type?.includes('mother'));
    
    motherObjects.forEach(mother => {
      const motherNum = mother.type?.match(/mother (\d+)/)?.[1];
      const sons = objects.filter(obj => 
        obj.type?.includes('son') && obj.type?.includes(`son ${motherNum}-`)
      );
      
      mothers.push({
        object: mother,
        children: sons,
        isExpanded: expandedMothers.has(mother.name) // This should work now
      });
    });
    
    // Find orphan objects (not mothers or sons)
    objects.forEach(obj => {
      const isMother = obj.type?.includes('mother');
      const isSon = obj.type?.includes('son');
      if (!isMother && !isSon) {
        orphans.push(obj);
      }
    });
    
    return { mothers, orphans };
  };

  const toggleMother = (motherName: string) => {
    const newExpanded = new Set(expandedMothers);
    if (newExpanded.has(motherName)) {
      newExpanded.delete(motherName);
    } else {
      newExpanded.add(motherName);
    }
    setExpandedMothers(newExpanded);
  };

  const renderHierarchicalList = () => {
    if (!data) return null;
    
    const { mothers, orphans } = buildHierarchy(data.objects);
    
    return (
      <div>
        <h4>📋 Objects Hierarchy:</h4>
        
        {/* Mothers with their sons */}
        {mothers.map((mother, index) => {
          const isExpanded = expandedMothers.has(mother.object.name);
          
          return (
            <div key={index} style={{marginBottom: '10px'}}>
              {/* Mother */}
              <div 
                onClick={() => setSelectedObject(mother.object)}
                style={{
                  padding: '10px',
                  background: selectedObject === mother.object ? '#d32f2f' : '#ffebee',
                  color: selectedObject === mother.object ? 'white' : '#d32f2f',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div>👑 {mother.object.name}</div>
                  <div style={{fontSize: '0.8em', opacity: 0.8}}>
                    {mother.object.typename} ({mother.children.length} sons)
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMother(mother.object.name);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    fontSize: '1.2em',
                    cursor: 'pointer',
                    padding: '5px'
                  }}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>
              
              {/* Sons (collapsible) */}
              {isExpanded && mother.children.map((son, sonIndex) => (
                <div 
                  key={sonIndex}
                  onClick={() => setSelectedObject(son)}
                  style={{
                    padding: '8px 10px 8px 30px',
                    margin: '2px 0 2px 20px',
                    background: selectedObject === son ? '#388e3c' : '#e8f5e8',
                    color: selectedObject === son ? 'white' : '#388e3c',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    borderLeft: '3px solid #388e3c'
                  }}
                >
                  <div>👶 {son.name}</div>
                  <div style={{fontSize: '0.8em', opacity: 0.8}}>{son.typename}</div>
                </div>
              ))}
            </div>
          );
        })}
        
        {/* Orphan objects */}
        {orphans.length > 0 && (
          <div style={{marginTop: '20px'}}>
            <h5 style={{color: '#666', margin: '10px 0'}}>🔸 Other Objects:</h5>
            {orphans.map((obj, index) => (
              <div 
                key={index}
                onClick={() => setSelectedObject(obj)}
                style={{
                  padding: '8px 10px',
                  margin: '2px 0',
                  background: selectedObject === obj ? '#667eea' : '#f0f0f0',
                  color: selectedObject === obj ? 'white' : 'black',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                <div>{obj.name}</div>
                <div style={{fontSize: '0.8em', opacity: 0.8}}>{obj.typename}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleFileUpload = (file: File) => {
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          setData(jsonData);
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const renderObject = (obj: AIObject, index: number) => {
    const scale = 2.0;
    const offsetX = 50; 
    const offsetY = 50;
    
    const baseX = offsetX + (obj.x * scale);
    const baseY = offsetY + (obj.y * scale);
    const width = Math.max(obj.width * scale, 40);
    const height = Math.max(obj.height * scale, 30);
    
    const isSelected = selectedObject === obj;
    
    let strokeColor = '#333';
    let strokeWidth = '2';
    let strokeDasharray = 'none';
    
    if (obj.type?.includes('mother')) {
      strokeColor = '#d32f2f';
      strokeWidth = '3';
      strokeDasharray = 'none';
    } else if (obj.type?.includes('son')) {
      strokeColor = '#388e3c';
      strokeWidth = '2';
      strokeDasharray = '5,5';
    } else {
      strokeColor = '#666';
      strokeWidth = '1';
      strokeDasharray = '2,2';
    }
    
    if (isSelected) {
      strokeColor = '#667eea';
      strokeWidth = '4';
      strokeDasharray = 'none';
    }
    
    return (
      <g key={index}>
        <rect
          x={baseX} y={baseY} width={width} height={height}
          fill="transparent"
          stroke={strokeColor} 
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          onClick={() => setSelectedObject(obj)}
          style={{cursor: 'pointer'}}
        />
        <text
          x={baseX + 5} y={baseY + 15}
          fontSize="12" fill="#333" fontWeight="bold"
        >
          {obj.name}
        </text>
        <text
          x={baseX + 5} y={baseY + 28}
          fontSize="10" fill="#666"
        >
          {obj.type || obj.typename}
        </text>
      </g>
    );
  };

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr 300px',
        height: '100vh',
        background: '#f5f5f5'
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div style={{background: 'white', padding: '20px', borderRight: '1px solid #ddd', overflowY: 'auto'}}>
        <h3>📄 {data?.document || 'Drop JSON file'}</h3>
        <p>Objects: {data?.totalObjects || 0} | v0.3.0</p>
        
        {!data && (
          <div style={{
            border: isDragOver ? '3px solid #4CAF50' : '3px dashed #ccc',
            padding: '20px',
            textAlign: 'center',
            marginTop: '20px',
            borderRadius: '10px',
            background: isDragOver ? 'rgba(76,175,80,0.1)' : '#f9f9f9'
          }}>
            <div style={{fontSize: '2rem', marginBottom: '10px'}}>
              {isDragOver ? '📥' : '📁'}
            </div>
            <p>Drop JSON file here</p>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleInputChange}
              style={{marginTop: '10px'}}
            />
          </div>
        )}
        
        {data && renderHierarchicalList()}
      </div>

      <div style={{background: 'white', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {data ? (
          <svg width="1200" height="800" style={{border: '1px solid #ddd'}} viewBox="0 0 1200 800">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            <line x1="50" y1="0" x2="50" y2="800" stroke="#ccc" strokeWidth="2"/>
            <line x1="0" y1="50" x2="1200" y2="50" stroke="#ccc" strokeWidth="2"/>
            
            <text x="10" y="45" fontSize="12" fill="#666">0</text>
            <text x="10" y="150" fontSize="12" fill="#666">50mm</text>
            <text x="10" y="250" fontSize="12" fill="#666">100mm</text>
            
            {data.objects.map((obj, index) => renderObject(obj, index))}
          </svg>
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#999',
            fontSize: '1.5rem'
          }}>
            <div style={{fontSize: '4rem', marginBottom: '20px'}}>
              {isDragOver ? '📥' : '📁'}
            </div>
            <p>{isDragOver ? 'Drop your JSON file here!' : 'Drag & Drop JSON file to view'}</p>
          </div>
        )}
      </div>

      <div style={{background: 'white', padding: '20px', borderLeft: '1px solid #ddd'}}>
        {selectedObject ? (
          <div>
            <h4>📋 Object Details</h4>
            <p><strong>Name:</strong> {selectedObject.name}</p>
            <p><strong>Type:</strong> {selectedObject.typename}</p>
            <p><strong>X:</strong> {selectedObject.x}</p>
            <p><strong>Y:</strong> {selectedObject.y}</p>
            <p><strong>Width:</strong> {selectedObject.width}</p>
            <p><strong>Height:</strong> {selectedObject.height}</p>
          </div>
        ) : (
          <p>Click an object to see details</p>
        )}
        
        {data && (
          <button 
            onClick={() => setData(null)}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📁 New File
          </button>
        )}
      </div>
    </div>
  );
}

export default App;




