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

interface AIData {
  document: string;
  totalObjects: number;
  objects: AIObject[];
}

function App() {
  const [data, setData] = useState<AIData | null>(null);
  const [selectedObject, setSelectedObject] = useState<AIObject | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
    // Better scaling and positioning
    const scale = 2.0; // Increased scale
    const offsetX = 50; 
    const offsetY = 50;
    
    const baseX = offsetX + (obj.x * scale);
    const baseY = offsetY + (obj.y * scale);
    const width = Math.max(obj.width * scale, 40); // Minimum 40px width
    const height = Math.max(obj.height * scale, 30); // Minimum 30px height
    
    const isSelected = selectedObject === obj;
    
    // Different border styles for mother/son relationships
    let strokeColor = '#333';
    let strokeWidth = '2';
    let strokeDasharray = 'none';
    
    if (obj.type?.includes('mother')) {
      strokeColor = '#d32f2f';
      strokeWidth = '3';
      strokeDasharray = 'none'; // Solid thick line for mothers
    } else if (obj.type?.includes('son')) {
      strokeColor = '#388e3c';
      strokeWidth = '2';
      strokeDasharray = '5,5'; // Dashed line for sons
    } else {
      strokeColor = '#666';
      strokeWidth = '1';
      strokeDasharray = '2,2'; // Dotted line for regular objects
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

  if (!data) {
    return (
      <div 
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <h1 style={{fontSize: '4rem', margin: '0'}}>🎯 AI Coordinate Viewer</h1>
        <p style={{fontSize: '1.5rem', margin: '20px 0'}}>
          Drop your AI JSON file, see coordinates instantly
        </p>
        <p style={{fontSize: '1rem', opacity: 0.9, margin: '10px 0', background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '15px'}}>v0.1.0</p>
        
        <label style={{
          border: isDragOver ? '3px solid #4CAF50' : '3px dashed rgba(255,255,255,0.5)',
          padding: '60px',
          borderRadius: '20px',
          textAlign: 'center',
          marginTop: '40px',
          background: isDragOver ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)',
          cursor: 'pointer',
          display: 'block',
          transition: 'all 0.3s ease'
        }}>
          <input 
            type="file" 
            accept=".json" 
            onChange={handleInputChange}
            style={{display: 'none'}}
          />
          <div style={{fontSize: '4rem', marginBottom: '20px'}}>
            {isDragOver ? '📥' : '📁'}
          </div>
          <h2>{isDragOver ? 'Drop file here!' : 'Drag & Drop JSON file'}</h2>
          <p>{isDragOver ? 'Release to upload' : 'or click to browse'}</p>
        </label>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr 300px',
      height: '100vh',
      background: '#f5f5f5'
    }}>
      <div style={{background: 'white', padding: '20px', borderRight: '1px solid #ddd', overflowY: 'auto'}}>
        <h3>📄 {data.document}</h3>
        <p>Objects: {data.totalObjects} | v0.2.0</p>
        
        <h4>Objects List:</h4>
        {data.objects.map((obj, index) => (
          <div 
            key={index}
            onClick={() => setSelectedObject(obj)}
            style={{
              padding: '10px',
              margin: '5px 0',
              background: selectedObject === obj ? '#667eea' : '#f0f0f0',
              color: selectedObject === obj ? 'white' : 'black',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            <div><strong>{obj.name}</strong></div>
            <div style={{fontSize: '0.8em'}}>{obj.typename}</div>
          </div>
        ))}
      </div>

      <div style={{background: 'white', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <svg width="1200" height="800" style={{border: '1px solid #ddd'}} viewBox="0 0 1200 800">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Coordinate axes */}
          <line x1="50" y1="0" x2="50" y2="800" stroke="#ccc" strokeWidth="2"/>
          <line x1="0" y1="50" x2="1200" y2="50" stroke="#ccc" strokeWidth="2"/>
          
          {/* Scale markers */}
          <text x="10" y="45" fontSize="12" fill="#666">0</text>
          <text x="10" y="150" fontSize="12" fill="#666">50mm</text>
          <text x="10" y="250" fontSize="12" fill="#666">100mm</text>
          
          {data.objects.map((obj, index) => renderObject(obj, index))}
        </svg>
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
      </div>
    </div>
  );
}

export default App;




