import React, { useState } from 'react';

interface AIObject {
  name: string;
  typename: string;
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

  if (!data) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{fontSize: '4rem', margin: '0'}}>🎯 AI Coordinate Viewer</h1>
        <p style={{fontSize: '1.5rem', margin: '20px 0'}}>
          Drop your AI JSON file, see coordinates instantly
        </p>
        
        <label style={{
          border: '3px dashed rgba(255,255,255,0.5)',
          padding: '60px',
          borderRadius: '20px',
          textAlign: 'center',
          marginTop: '40px',
          background: 'rgba(255,255,255,0.1)',
          cursor: 'pointer',
          display: 'block'
        }}>
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileUpload}
            style={{display: 'none'}}
          />
          <div style={{fontSize: '4rem', marginBottom: '20px'}}>📁</div>
          <h2>Click to select JSON file</h2>
          <p>Choose your AI export file</p>
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
        <p>Objects: {data.totalObjects}</p>
        
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
        <svg width="600" height="400" style={{border: '1px solid #ddd'}}>
          {data.objects.map((obj, index) => (
            <rect
              key={index}
              x={obj.x + 300}
              y={-obj.y + 200}
              width={Math.max(obj.width, 10)}
              height={Math.max(obj.height, 10)}
              fill={selectedObject === obj ? '#667eea' : '#4ecdc4'}
              stroke="#333"
              strokeWidth="1"
              onClick={() => setSelectedObject(obj)}
              style={{cursor: 'pointer'}}
            />
          ))}
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
          Load New File
        </button>
      </div>
    </div>
  );
}

export default App;