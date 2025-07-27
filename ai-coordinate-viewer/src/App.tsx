import React, { useState } from 'react';

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

  const renderObject = (obj: AIObject, index: number) => {
    // Map coordinates to match Illustrator layout exactly
    const scale = 0.8; // Larger scale to show proper proportions
    const offsetX = 100; 
    const offsetY = 50;
    
    // Direct coordinate mapping - AI Y is negative, flip it
    const baseX = offsetX + (obj.x * scale);
    const baseY = offsetY + ((-obj.y) * scale); // Flip Y axis
    const width = Math.max(obj.width * scale, 30);
    const height = Math.max(obj.height * scale, 20);
    
    const isSelected = selectedObject === obj;
    const fillColor = isSelected ? '#667eea' : getObjectColor(obj, index);
    
    // Add type label to show mother/son relationships
    const typeLabel = obj.type || obj.typename;
    
    switch (obj.typename) {
      case 'TextFrame':
        return (
          <g key={index}>
            <rect
              x={baseX} y={baseY} width={width} height={height}
              fill={fillColor} stroke="#333" strokeWidth="1"
              onClick={() => setSelectedObject(obj)}
              style={{cursor: 'pointer'}}
            />
            <text
              x={baseX + width/2} y={baseY + height/2}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fill="white"
            >
              T
            </text>
          </g>
        );
        
      case 'PathItem':
        return (
          <ellipse
            key={index}
            cx={baseX + width/2} cy={baseY + height/2}
            rx={width/2} ry={height/2}
            fill={fillColor} stroke="#333" strokeWidth="1"
            onClick={() => setSelectedObject(obj)}
            style={{cursor: 'pointer'}}
          />
        );
        
      case 'GroupItem':
        return (
          <g key={index}>
            <rect
              x={baseX} y={baseY} width={width} height={height}
              fill="none" stroke={fillColor} strokeWidth="2" strokeDasharray="5,5"
              onClick={() => setSelectedObject(obj)}
              style={{cursor: 'pointer'}}
            />
            <text
              x={baseX + 2} y={baseY + 12}
              fontSize="10" fill={fillColor}
            >
              GROUP
            </text>
          </g>
        );
        
      default:
        return (
          <rect
            key={index}
            x={baseX} y={baseY} width={width} height={height}
            fill={fillColor} stroke="#333" strokeWidth="1"
            onClick={() => setSelectedObject(obj)}
            style={{cursor: 'pointer'}}
          />
        );
    }
  };

  const getObjectColor = (obj: AIObject, index: number) => {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
      '#10ac84', '#ee5253', '#0abde3', '#3742fa', '#2f3542'
    ];
    
    // Always use unique colors for each object
    return colors[index % colors.length];
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
        <p style={{fontSize: '1rem', opacity: 0.9, margin: '10px 0', background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '15px'}}>v0.1.0</p>
        
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
        <svg width="800" height="600" style={{border: '1px solid #ddd'}} viewBox="0 0 800 600">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <line x1="400" y1="0" x2="400" y2="600" stroke="#ddd" strokeWidth="1"/>
          <line x1="0" y1="300" x2="800" y2="300" stroke="#ddd" strokeWidth="1"/>
          
          {data.objects.map((obj, index) => {
            console.log(`Rendering object ${index}: ${obj.name}, type: ${obj.type}`);
            return renderObject(obj, index);
          })}
          
          <g transform="translate(10, 10)">
            <rect width="120" height="80" fill="white" stroke="#ddd" strokeWidth="1"/>
            <text x="5" y="15" fontSize="10" fontWeight="bold">Object Types:</text>
            <circle cx="15" cy="25" r="3" fill="#4ecdc4"/>
            <text x="25" y="29" fontSize="8">TextFrame</text>
            <circle cx="15" cy="35" r="3" fill="#45b7d1"/>
            <text x="25" y="39" fontSize="8">PathItem</text>
            <rect x="12" y="42" width="6" height="6" fill="none" stroke="#96ceb4" strokeWidth="1" strokeDasharray="2,2"/>
            <text x="25" y="49" fontSize="8">GroupItem</text>
            <rect x="12" y="52" width="6" height="6" fill="#feca57"/>
            <text x="25" y="59" fontSize="8">RasterItem</text>
          </g>
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


























