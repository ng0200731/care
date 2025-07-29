import React, { useState, useCallback } from 'react';
import SonDetailsPanel from './SonDetailsPanel';

interface AIObject {
  name: string;
  typename: string;
  type?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SonMetadata {
  id: string;
  sonType: 'text' | 'image' | 'barcode' | 'translation' | 'washing-symbol' | 'size-breakdown' | 'composition' | 'special-wording';
  content: string;
  details: any; // Type-specific details
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
  const [expandedMothers, setExpandedMothers] = useState<Set<number>>(new Set());
  const [sonMetadata, setSonMetadata] = useState<Map<string, SonMetadata>>(new Map());

  // Canvas view state
  const [zoom, setZoom] = useState(1); // 1 = 1:1 scale (1mm = 1px at 96 DPI)
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [showDimensions, setShowDimensions] = useState(true);
  const [autoFitNotification, setAutoFitNotification] = useState(false);

  // Space allocation dialog state
  const [spaceDialogOpen, setSpaceDialogOpen] = useState(false);
  const [spaceDialogObject, setSpaceDialogObject] = useState<AIObject | null>(null);
  const [spaceDialogStep, setSpaceDialogStep] = useState(1);
  const [spaceAllocation, setSpaceAllocation] = useState({
    region: '',
    rowHeight: 10,
    columnLayout: 1,
    selectedColumn: 1
  });

  // Canvas control functions
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleZoomReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };
  const handleFitToScreen = () => {
    if (!data || data.objects.length === 0) {
      console.log('No data or objects to fit');
      return;
    }

    // Get actual SVG dimensions
    const svgElement = document.querySelector('svg');
    if (!svgElement) {
      console.log('SVG element not found');
      return;
    }

    const svgRect = svgElement.getBoundingClientRect();
    const viewportWidth = svgRect.width;
    const viewportHeight = svgRect.height;
    console.log('SVG dimensions:', viewportWidth, 'x', viewportHeight);

    // Calculate bounds of all objects
    const bounds = data.objects.reduce((acc, obj) => ({
      minX: Math.min(acc.minX, obj.x),
      minY: Math.min(acc.minY, obj.y),
      maxX: Math.max(acc.maxX, obj.x + obj.width),
      maxY: Math.max(acc.maxY, obj.y + obj.height)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    const padding = 100; // Padding in pixels

    const scaleX = (viewportWidth - padding) / (contentWidth * 3.78); // 3.78 = mmToPx conversion
    const scaleY = (viewportHeight - padding) / (contentHeight * 3.78);
    const newZoom = Math.min(scaleX, scaleY, 2); // Max zoom 2x for fit

    console.log('Content bounds:', bounds);
    console.log('Content size:', contentWidth, 'x', contentHeight, 'mm');
    console.log('Calculated zoom:', newZoom);

    setZoom(newZoom);
    setPanX(-(bounds.minX + contentWidth / 2) * newZoom * 3.78 + viewportWidth / 2);
    setPanY(-(bounds.minY + contentHeight / 2) * newZoom * 3.78 + viewportHeight / 2);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update mouse coordinates for display
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert screen coordinates to real coordinates (mm)
    const mmToPx = 3.78;
    const realX = (mouseX - panX) / (zoom * mmToPx);
    const realY = (mouseY - panY) / (zoom * mmToPx);
    setMouseCoords({ x: realX, y: realY });

    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPanX(prev => prev + deltaX);
      setPanY(prev => prev + deltaY);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

    // Zoom towards mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomRatio = newZoom / zoom;
    setPanX(prev => mouseX - (mouseX - prev) * zoomRatio);
    setPanY(prev => mouseY - (mouseY - prev) * zoomRatio);
    setZoom(newZoom);
  };

  const panToObject = (obj: AIObject) => {
    console.log('🎯 === SIMPLE PAN TO OBJECT (v6.0 - BASIC) ===');
    console.log('📊 Object to pan to:', obj.name, `at (${obj.x}, ${obj.y}) size ${obj.width}x${obj.height}mm`);

    // Get SVG element and its dimensions
    const svgElement = document.querySelector('svg');
    if (!svgElement) {
      console.error('❌ SVG element not found');
      return;
    }

    const svgRect = svgElement.getBoundingClientRect();
    console.log('📐 SVG viewport:', `${svgRect.width}x${svgRect.height}px`);

    // Constants
    const mmToPx = 3.78;

    // Calculate object center in mm
    const objCenterX = obj.x + (obj.width / 2);
    const objCenterY = obj.y + (obj.height / 2);
    console.log('🎯 Object center:', `(${objCenterX.toFixed(1)}, ${objCenterY.toFixed(1)}) mm`);

    // Calculate screen center (with some margin from edges)
    const screenCenterX = svgRect.width / 2;
    const screenCenterY = svgRect.height / 2;
    console.log('📺 Screen center:', `(${screenCenterX.toFixed(1)}, ${screenCenterY.toFixed(1)}) px`);

    // Current scale factor
    const scale = zoom * mmToPx;
    console.log('⚖️ Current scale:', scale.toFixed(3), `(zoom: ${(zoom * 100).toFixed(0)}%)`);

    // Calculate where object currently appears on screen
    const currentScreenX = (objCenterX * scale) + panX;
    const currentScreenY = (objCenterY * scale) + panY;
    console.log('📍 Object current screen pos:', `(${currentScreenX.toFixed(1)}, ${currentScreenY.toFixed(1)}) px`);

    // Calculate how much to adjust pan to center the object
    const panAdjustX = screenCenterX - currentScreenX;
    const panAdjustY = screenCenterY - currentScreenY;
    console.log('🔧 Pan adjustment needed:', `(${panAdjustX.toFixed(1)}, ${panAdjustY.toFixed(1)}) px`);

    // Apply the pan adjustment
    const newPanX = panX + panAdjustX;
    const newPanY = panY + panAdjustY;
    console.log('🎯 Setting new pan:', `(${newPanX.toFixed(1)}, ${newPanY.toFixed(1)}) px`);

    setPanX(newPanX);
    setPanY(newPanY);

    console.log('✅ Basic pan applied - object should now be centered!');
    console.log('🎯 === END SIMPLE PAN v6.0 ===');
  };

  // Space allocation dialog functions
  const openSpaceDialog = (obj: AIObject) => {
    console.log('🏗️ Opening space allocation dialog for:', obj.name);
    setSpaceDialogObject(obj);
    setSpaceDialogOpen(true);
    setSpaceDialogStep(1);
    setSpaceAllocation({
      region: '',
      rowHeight: 10,
      columnLayout: 1,
      selectedColumn: 1
    });
  };

  const closeSpaceDialog = () => {
    console.log('❌ Closing space allocation dialog');
    setSpaceDialogOpen(false);
    setSpaceDialogObject(null);
    setSpaceDialogStep(1);
  };

  const nextDialogStep = () => {
    if (spaceDialogStep < 5) {
      setSpaceDialogStep(spaceDialogStep + 1);
      console.log('➡️ Moving to step:', spaceDialogStep + 1);
    }
  };

  const prevDialogStep = () => {
    if (spaceDialogStep > 1) {
      setSpaceDialogStep(spaceDialogStep - 1);
      console.log('⬅️ Moving to step:', spaceDialogStep - 1);
    }
  };

  const confirmSpaceAllocation = () => {
    console.log('✅ Confirming space allocation:', spaceAllocation);
    // TODO: Apply the space allocation to the object
    alert(`Space allocated for ${spaceDialogObject?.name}!\nRegion: ${spaceAllocation.region}\nRow Height: ${spaceAllocation.rowHeight}mm\nColumns: ${spaceAllocation.columnLayout}\nColumn: ${spaceAllocation.selectedColumn}`);
    closeSpaceDialog();
  };

  const fitObjectToView = (obj: AIObject) => {
    // Get actual SVG dimensions
    const svgElement = document.querySelector('svg');
    if (!svgElement) {
      console.log('SVG element not found for fit object');
      return;
    }

    const svgRect = svgElement.getBoundingClientRect();
    const viewportWidth = svgRect.width;
    const viewportHeight = svgRect.height;

    const mmToPx = 3.78;
    const padding = 50; // Padding around the object

    // Calculate object center in real coordinates
    const objCenterX = obj.x + obj.width / 2;
    const objCenterY = obj.y + obj.height / 2;

    // Calculate zoom to fit object with padding
    const scaleX = (viewportWidth - padding * 2) / (obj.width * mmToPx);
    const scaleY = (viewportHeight - padding * 2) / (obj.height * mmToPx);
    const fitZoom = Math.min(scaleX, scaleY, 1); // Don't zoom in more than 100%

    console.log('Fitting object to view:', obj.name, 'zoom:', fitZoom);

    // Calculate pan values to center the object at the new zoom
    const newPanX = viewportWidth / 2 - (objCenterX * fitZoom * mmToPx);
    const newPanY = viewportHeight / 2 - (objCenterY * fitZoom * mmToPx);

    // Apply zoom and pan
    setZoom(fitZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  };

  // Build hierarchy from objects
  const buildHierarchy = (objects: AIObject[]) => {
    const mothers: HierarchyNode[] = [];
    const orphans: AIObject[] = [];
    
    // Find all mothers
    const motherObjects = objects.filter(obj => obj.type?.includes('mother'));
    
    motherObjects.forEach(mother => {
      const motherNum = mother.type?.match(/mother (\d+)/)?.[1];
      let sons = objects.filter(obj => 
        obj.type?.includes('son') && obj.type?.includes(`son ${motherNum}-`)
      );
      
      // Sort sons by reading order: top-to-bottom, then left-to-right
      sons.sort((a, b) => {
        const yDiff = a.y - b.y; // Top to bottom
        if (Math.abs(yDiff) > 1) { // 1mm tolerance for same row
          return yDiff;
        }
        return a.x - b.x; // Same row: left to right
      });
      
      mothers.push({
        object: mother,
        children: sons,
        isExpanded: false // Will be set correctly in render
      });
    });
    
    // Sort mothers by position: left to right
    mothers.sort((a, b) => a.object.x - b.object.x);
    
    // Find orphan objects (not mothers or sons)
    objects.forEach(obj => {
      const isMother = obj.type?.includes('mother');
      const isSon = obj.type?.includes('son');
      if (!isMother && !isSon) {
        orphans.push(obj);
      }
    });
    
    // Sort orphans left to right
    orphans.sort((a, b) => a.x - b.x);
    
    return { mothers, orphans };
  };

  const toggleMother = (motherId: number) => {
    // Simple logic: if clicking the same mother, collapse it. Otherwise, expand only this one.
    if (expandedMothers.has(motherId)) {
      // Collapse the clicked mother
      setExpandedMothers(new Set());
    } else {
      // Expand only the clicked mother, collapse all others
      setExpandedMothers(new Set([motherId]));
    }
  };

  const handleUpdateSonMetadata = (objectName: string, metadata: SonMetadata) => {
    setSonMetadata(prev => {
      const newMap = new Map(prev);
      newMap.set(objectName, metadata);
      return newMap;
    });
  };

  const exportSonMetadata = () => {
    const metadataArray = Array.from(sonMetadata.entries()).map(([key, value]) => ({
      objectId: key, // Format: "name_x_y" to handle duplicate names
      ...value
    }));

    const exportData = {
      exportDate: new Date().toISOString(),
      documentName: data?.document || 'unknown',
      sonMetadata: metadataArray
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `son-metadata-${data?.document || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderHierarchicalList = () => {
    if (!data) return null;

    const { mothers, orphans } = buildHierarchy(data.objects);

    return (
      <div>
        <h4>📋 Objects Hierarchy:</h4>

        {/* Mothers with their sons */}
        {mothers.map((mother, index) => {
          const isExpanded = expandedMothers.has(index);

          return (
            <div key={index} style={{marginBottom: '15px'}}>
              {/* Mother Header - Enhanced with Fit View button (v1.3.0) */}
              <div style={{
                background: selectedObject === mother.object ? '#d32f2f' : '#ffebee',
                color: selectedObject === mother.object ? 'white' : '#d32f2f',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* Mother Info Row */}
                <div
                  onClick={() => {
                    setSelectedObject(mother.object);
                  }}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMother(index);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          fontSize: '1.2em',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                      <span>👑 {mother.object.name} ({mother.children.length} objects)</span>
                    </div>
                    <div style={{fontSize: '0.8em', opacity: 0.8, marginLeft: '24px'}}>
                      {mother.object.typename}
                    </div>
                  </div>

                  {/* Fit View Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedObject(mother.object);
                      fitObjectToView(mother.object);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'inherit',
                      fontSize: '10px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginLeft: '8px'
                    }}
                    title="Fit to view (100% zoom, centered)"
                  >
                    👑 Fit View
                  </button>
                </div>
              </div>

              {/* Sons (collapsible) - Enhanced with Pan To and Allocate Space buttons (v1.3.0) */}
              {isExpanded && mother.children.map((son, sonIndex) => (
                <div
                  key={sonIndex}
                  style={{
                    margin: '4px 0 4px 20px',
                    background: selectedObject === son ? '#388e3c' : '#e8f5e8',
                    color: selectedObject === son ? 'white' : '#388e3c',
                    borderRadius: '6px',
                    borderLeft: '3px solid #388e3c',
                    overflow: 'hidden'
                  }}
                >
                  {/* Son Info Row */}
                  <div
                    onClick={() => {
                      setSelectedObject(son);
                      panToObject(son); // Auto-pan when clicking son button
                    }}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{flex: 1}}>
                      <div>👶 {son.name}</div>
                      <div style={{fontSize: '0.8em', opacity: 0.8}}>{son.typename}</div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{display: 'flex', gap: '4px'}}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObject(son);
                          panToObject(son);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'inherit',
                          fontSize: '9px',
                          padding: '3px 6px',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                        title="Pan to center (keep current zoom)"
                      >
                        🎯 Pan To
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObject(son);
                          openSpaceDialog(son);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'inherit',
                          fontSize: '9px',
                          padding: '3px 6px',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                        title="Allocate space in region/row/column"
                      >
                        📐 Allocate Space
                      </button>
                    </div>
                  </div>
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
                onClick={() => {
                  setSelectedObject(obj);
                }}
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

          // Auto-fit to screen after loading data
          // Use setTimeout to ensure state is updated and DOM is ready
          setTimeout(() => {
            if (jsonData && jsonData.objects && jsonData.objects.length > 0) {
              // Get actual SVG dimensions
              const svgElement = document.querySelector('svg');
              if (svgElement) {
                const svgRect = svgElement.getBoundingClientRect();
                const viewportWidth = svgRect.width;
                const viewportHeight = svgRect.height;

                // Calculate bounds of all objects
                const bounds = jsonData.objects.reduce((acc: any, obj: AIObject) => ({
                  minX: Math.min(acc.minX, obj.x),
                  minY: Math.min(acc.minY, obj.y),
                  maxX: Math.max(acc.maxX, obj.x + obj.width),
                  maxY: Math.max(acc.maxY, obj.y + obj.height)
                }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

                const contentWidth = bounds.maxX - bounds.minX;
                const contentHeight = bounds.maxY - bounds.minY;
                const padding = 100; // Padding in pixels

                const scaleX = (viewportWidth - padding) / (contentWidth * 3.78); // 3.78 = mmToPx conversion
                const scaleY = (viewportHeight - padding) / (contentHeight * 3.78);
                const newZoom = Math.min(scaleX, scaleY, 2); // Max zoom 2x for fit

                setZoom(newZoom);
                setPanX(-(bounds.minX + contentWidth / 2) * newZoom * 3.78 + viewportWidth / 2);
                setPanY(-(bounds.minY + contentHeight / 2) * newZoom * 3.78 + viewportHeight / 2);

                // Show auto-fit notification
                setAutoFitNotification(true);
                setTimeout(() => setAutoFitNotification(false), 3000);
              }
            }
          }, 200); // Increased timeout to ensure DOM is ready
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

  // Button style for canvas controls
  const buttonStyle = {
    padding: '5px 8px',
    margin: '0',
    border: '1px solid #ccc',
    borderRadius: '3px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    minWidth: '30px'
  };

  const renderObject = (obj: AIObject, index: number) => {
    // 1:1 scale: 1mm = 1px (at 96 DPI, 1mm ≈ 3.78px, but we'll use 1:1 for simplicity)
    // Apply zoom and pan transformations
    const mmToPx = 3.78; // Conversion factor for true 1:1 at 96 DPI
    const scale = zoom * mmToPx;

    const baseX = (obj.x * scale) + panX;
    const baseY = (obj.y * scale) + panY;
    const width = Math.max(obj.width * scale, 2);
    const height = Math.max(obj.height * scale, 2);

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

    // Calculate font size based on zoom level
    const fontSize = Math.max(8, Math.min(14, 10 * zoom));
    const smallFontSize = Math.max(6, Math.min(10, 8 * zoom));
    const dimensionFontSize = Math.max(7, Math.min(12, 9 * zoom));

    // Calculate positions for dimension labels
    const centerX = baseX + width / 2;
    const centerY = baseY + height / 2;
    const topY = baseY - 5;
    const leftX = baseX - 5;

    // Format dimensions to appropriate precision
    const widthMm = obj.width.toFixed(1);
    const heightMm = obj.height.toFixed(1);

    return (
      <g key={index}>
        {/* Main rectangle */}
        <rect
          x={baseX} y={baseY} width={width} height={height}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          onClick={() => {
            setSelectedObject(obj);
          }}
          style={{cursor: 'pointer'}}
        />

        {/* Object name and type */}
        <text
          x={baseX + 5} y={baseY + 15}
          fontSize={fontSize} fill="#333" fontWeight="bold"
        >
          {obj.name}
        </text>
        <text
          x={baseX + 5} y={baseY + 28}
          fontSize={smallFontSize} fill="#666"
        >
          {obj.type || obj.typename}
        </text>

        {/* Display actual content for son objects */}
        {obj.type?.includes('son') && (() => {
          const objectId = `${obj.name}_${obj.x}_${obj.y}`;
          const metadata = sonMetadata.get(objectId);
          const content = metadata?.content;

          if (content && content.trim()) {
            // Calculate content area (below name and type)
            const contentY = baseY + 45;
            const contentHeight = height - 50; // Leave space for name/type
            const contentWidth = width - 10; // Leave margins

            if (contentHeight > 10 && contentWidth > 20) {
              // Split content into lines that fit the width
              const maxCharsPerLine = Math.floor(contentWidth / (fontSize * 0.6));
              const words = content.split(' ');
              const lines = [];
              let currentLine = '';

              for (const word of words) {
                if ((currentLine + word).length <= maxCharsPerLine) {
                  currentLine += (currentLine ? ' ' : '') + word;
                } else {
                  if (currentLine) lines.push(currentLine);
                  currentLine = word;
                }
              }
              if (currentLine) lines.push(currentLine);

              // Limit lines to fit in available height
              const lineHeight = fontSize + 2;
              const maxLines = Math.floor(contentHeight / lineHeight);
              const displayLines = lines.slice(0, maxLines);

              return displayLines.map((line, lineIndex) => (
                <text
                  key={`content-${lineIndex}`}
                  x={baseX + 5}
                  y={contentY + (lineIndex * lineHeight)}
                  fontSize={Math.max(6, fontSize - 1)}
                  fill="#2e7d32"
                  fontWeight="normal"
                >
                  {line}
                </text>
              ));
            }
          }
          return null;
        })()}

        {/* Dimension labels (only when enabled) */}
        {showDimensions && (
          <>
            {/* Width label (top center) */}
            <text
              x={centerX} y={topY}
              fontSize={dimensionFontSize}
              fill="#0066cc"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="bottom"
            >
              {widthMm}mm
            </text>

            {/* Height label (left center, rotated) */}
            <text
              x={leftX} y={centerY}
              fontSize={dimensionFontSize}
              fill="#cc6600"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(-90, ${leftX}, ${centerY})`}
            >
              {heightMm}mm
            </text>

            {/* Dimension lines for better visibility (only when zoomed in enough) */}
            {zoom > 0.5 && (
              <>
                {/* Top width line */}
                <line
                  x1={baseX} y1={topY + 3}
                  x2={baseX + width} y2={topY + 3}
                  stroke="#0066cc"
                  strokeWidth="1"
                  opacity="0.7"
                />
                {/* Left height line */}
                <line
                  x1={leftX + 3} y1={baseY}
                  x2={leftX + 3} y2={baseY + height}
                  stroke="#cc6600"
                  strokeWidth="1"
                  opacity="0.7"
                />
              </>
            )}
          </>
        )}
      </g>
    );
  };

  // Space Allocation Dialog Component
  const renderSpaceAllocationDialog = () => {
    if (!spaceDialogOpen || !spaceDialogObject) return null;

    const regions = [
      { id: 'header', name: '📋 Header', description: 'Top section for titles and logos' },
      { id: 'content', name: '📝 Content', description: 'Main content area' },
      { id: 'care', name: '🧺 Care', description: 'Care instructions section' },
      { id: 'legal', name: '⚖️ Legal', description: 'Legal text and compliance' }
    ];

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Dialog Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '16px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>
              📐 Allocate Space for "{spaceDialogObject.name}"
            </h3>
            <button
              onClick={closeSpaceDialog}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕
            </button>
          </div>

          {/* Step Progress Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            {[1, 2, 3, 4, 5].map(step => (
              <div
                key={step}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: step <= spaceDialogStep ? '#4CAF50' : '#e0e0e0',
                  color: step <= spaceDialogStep ? 'white' : '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 8px',
                  fontWeight: 'bold'
                }}
              >
                {step}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div style={{ minHeight: '200px', marginBottom: '24px' }}>
            {/* Step 1: Region Selection */}
            {spaceDialogStep === 1 && (
              <div>
                <h4>Step 1: Choose Region</h4>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  Select which region of the label this object should be placed in:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {regions.map(region => (
                    <button
                      key={region.id}
                      onClick={() => setSpaceAllocation({...spaceAllocation, region: region.id})}
                      style={{
                        padding: '16px',
                        border: spaceAllocation.region === region.id ? '3px solid #4CAF50' : '2px solid #ddd',
                        borderRadius: '8px',
                        background: spaceAllocation.region === region.id ? '#f8fff8' : 'white',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{region.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{region.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Row Height */}
            {spaceDialogStep === 2 && (
              <div>
                <h4>Step 2: Define Row Height</h4>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  Set the height of the row where this object will be placed:
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label>Row Height:</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={spaceAllocation.rowHeight}
                    onChange={(e) => setSpaceAllocation({...spaceAllocation, rowHeight: parseInt(e.target.value)})}
                    style={{
                      padding: '8px',
                      border: '2px solid #ddd',
                      borderRadius: '4px',
                      width: '80px'
                    }}
                  />
                  <span>mm</span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                  Recommended: 8-15mm for text, 20-50mm for images
                </div>
              </div>
            )}

            {/* Step 3: Column Layout */}
            {spaceDialogStep === 3 && (
              <div>
                <h4>Step 3: Choose Column Layout</h4>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  Select how many columns this row should have:
                </p>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {[1, 2, 3].map(cols => (
                    <button
                      key={cols}
                      onClick={() => setSpaceAllocation({...spaceAllocation, columnLayout: cols, selectedColumn: 1})}
                      style={{
                        padding: '16px',
                        border: spaceAllocation.columnLayout === cols ? '3px solid #4CAF50' : '2px solid #ddd',
                        borderRadius: '8px',
                        background: spaceAllocation.columnLayout === cols ? '#f8fff8' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        minWidth: '100px'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{cols} Column{cols > 1 ? 's' : ''}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {cols === 1 ? 'Full width' : cols === 2 ? 'Side by side' : 'Three columns'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Column Assignment */}
            {spaceDialogStep === 4 && (
              <div>
                <h4>Step 4: Select Column</h4>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  Choose which column to place this object in:
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {Array.from({length: spaceAllocation.columnLayout}, (_, i) => i + 1).map(col => (
                    <button
                      key={col}
                      onClick={() => setSpaceAllocation({...spaceAllocation, selectedColumn: col})}
                      style={{
                        padding: '16px',
                        border: spaceAllocation.selectedColumn === col ? '3px solid #4CAF50' : '2px solid #ddd',
                        borderRadius: '8px',
                        background: spaceAllocation.selectedColumn === col ? '#f8fff8' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        flex: 1
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>Column {col}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {col === 1 ? 'Left' : col === spaceAllocation.columnLayout ? 'Right' : 'Center'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {spaceDialogStep === 5 && (
              <div>
                <h4>Step 5: Confirm Allocation</h4>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  Review your space allocation settings:
                </p>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Object:</strong> {spaceDialogObject.name}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Region:</strong> {regions.find(r => r.id === spaceAllocation.region)?.name || 'Not selected'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Row Height:</strong> {spaceAllocation.rowHeight}mm
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Column Layout:</strong> {spaceAllocation.columnLayout} column{spaceAllocation.columnLayout > 1 ? 's' : ''}
                  </div>
                  <div>
                    <strong>Selected Column:</strong> Column {spaceAllocation.selectedColumn}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dialog Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #f0f0f0',
            paddingTop: '16px'
          }}>
            <button
              onClick={prevDialogStep}
              disabled={spaceDialogStep === 1}
              style={{
                padding: '10px 20px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                background: spaceDialogStep === 1 ? '#f5f5f5' : 'white',
                color: spaceDialogStep === 1 ? '#999' : '#333',
                cursor: spaceDialogStep === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ⬅️ Previous
            </button>

            <div style={{ color: '#666' }}>
              Step {spaceDialogStep} of 5
            </div>

            {spaceDialogStep < 5 ? (
              <button
                onClick={nextDialogStep}
                disabled={
                  (spaceDialogStep === 1 && !spaceAllocation.region) ||
                  (spaceDialogStep === 2 && spaceAllocation.rowHeight < 5)
                }
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#4CAF50',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Next ➡️
              </button>
            ) : (
              <button
                onClick={confirmSpaceAllocation}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#2196F3',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ✅ Confirm
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f5f5f5'
    }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Main Content - 70% Canvas / 30% Hierarchy Panel (v1.1.0) */}
      <div style={{
        flex: 1,
        display: 'flex',
        height: '100vh'
      }}>
        {/* Canvas Area - 70% */}
        <div style={{
          width: '70%',
          background: 'white',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid #ddd'
        }}>
          {data ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Canvas Controls - FIXED: Moved to top-right corner (v1.2.0) */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                background: 'rgba(255,255,255,0.9)',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                minWidth: '160px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Zoom: {(zoom * 100).toFixed(0)}%
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={handleZoomIn} style={buttonStyle}>+</button>
                  <button onClick={handleZoomOut} style={buttonStyle}>-</button>
                  <button onClick={handleZoomReset} style={buttonStyle}>1:1</button>
                  <button onClick={handleFitToScreen} style={buttonStyle}>Fit</button>
                </div>
                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                  <button
                    onClick={() => setShowDimensions(!showDimensions)}
                    style={{
                      ...buttonStyle,
                      background: showDimensions ? '#e3f2fd' : 'white',
                      color: showDimensions ? '#1976d2' : '#666',
                      fontSize: '10px',
                      padding: '4px 6px'
                    }}
                  >
                    📏 Dimensions
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                  Pan: Click & drag<br/>
                  Zoom: Mouse wheel
                </div>
                <div style={{ fontSize: '10px', color: '#333', marginTop: '5px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                  <strong>Coordinates (mm):</strong><br/>
                  X: {mouseCoords.x.toFixed(2)}<br/>
                  Y: {mouseCoords.y.toFixed(2)}
                </div>
              </div>

              {/* Auto-fit notification */}
              {autoFitNotification && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(76, 175, 80, 0.9)',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  zIndex: 2000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                  ✅ Auto-fitted to view - All objects are now visible!
                </div>
              )}

              <svg
                width="100%"
                height="100%"
                style={{
                  border: '1px solid #ddd',
                  cursor: isPanning ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
              >
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {data.objects.map((obj, index) => renderObject(obj, index))}
              </svg>
            </div>
          ) : (
            <div style={{
              border: isDragOver ? '3px solid #4CAF50' : '3px dashed #ccc',
              padding: '60px',
              textAlign: 'center',
              borderRadius: '10px',
              background: isDragOver ? 'rgba(76,175,80,0.1)' : '#f9f9f9'
            }}>
              <div style={{fontSize: '4rem', marginBottom: '20px'}}>
                {isDragOver ? '📥' : '📁'}
              </div>
              <p>Drop JSON file here</p>
              <p style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                ✨ Objects will be automatically fitted to view
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleInputChange}
                style={{marginTop: '10px'}}
              />
            </div>
          )}
        </div>

        {/* Hierarchy Panel - 30% */}
        <div style={{
          width: '30%',
          background: 'white',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
            <h3 style={{margin: 0}}>
              📋 {data ? (() => {
                const { mothers } = buildHierarchy(data.objects);
                return `${mothers.length} Pages (${data.totalObjects} Objects)`;
              })() : 'Layer Objects'}
            </h3>
            {data && sonMetadata.size > 0 && (
              <button
                onClick={exportSonMetadata}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
                title="Export son metadata"
              >
                💾 Export
              </button>
            )}
          </div>

          {data ? (
            <div>
              {renderHierarchicalList()}
            </div>
          ) : (
            <div style={{color: '#999', textAlign: 'center', marginTop: '50px'}}>
              <p>No objects to display</p>
              <p>Upload a JSON file to see layer objects</p>
            </div>
          )}

          {/* Son Details Panel - Integrated into Hierarchy Panel */}
          <div style={{marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px'}}>
            <SonDetailsPanel
              selectedObject={selectedObject}
              sonMetadata={sonMetadata}
              onUpdateMetadata={handleUpdateSonMetadata}
            />
          </div>
        </div>

      </div>

      {/* Space Allocation Dialog */}
      {renderSpaceAllocationDialog()}
    </div>
  );
}

export default App;





