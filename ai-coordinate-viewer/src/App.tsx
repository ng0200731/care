import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SonDetailsPanel from './SonDetailsPanel';
import NavigationButtons from './components/NavigationButtons';
import SonObjectManager, { SonObject } from './components/content-editors/SonObjectManager';
import { masterFileService } from './services/masterFileService';

// Import version from package.json
const packageJson = require('../package.json');

interface Customer {
  id: string;
  customerName: string;
  person: string;
  email: string;
  phone: string;
  address: string;
  createdAt?: string;
}

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
  fontFamily?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  textOverflow?: 'resize' | 'linebreak';
  lineBreakType?: 'word' | 'character';
  characterConnector?: string;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  spaceAllocation?: {
    region: string;
    rowHeight: number;
    columns: number;
    selectedColumn: number;
    allocated: boolean;
  };
}

interface MotherMetadata {
  id: string;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  sewingPosition?: {
    x: number;
    y: number;
    isSet: boolean;
  };
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
  const location = useLocation();
  const [data, setData] = useState<AIData | null>(null);
  const [selectedObject, setSelectedObject] = useState<AIObject | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedMothers, setExpandedMothers] = useState<Set<number>>(new Set());
  const [sonMetadata, setSonMetadata] = useState<Map<string, SonMetadata>>(new Map());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [motherMetadata, setMotherMetadata] = useState<Map<string, MotherMetadata>>(new Map());

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMasterFileId, setEditingMasterFileId] = useState<string | null>(null);
  const [originalMasterFile, setOriginalMasterFile] = useState<any>(null);

  // Canvas view state
  const [zoom, setZoom] = useState(1); // 1 = 1:1 scale (1mm = 1px at 96 DPI)
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [showDimensions, setShowDimensions] = useState(true);
  const [autoFitNotification, setAutoFitNotification] = useState(false);

  // Web creation mode state
  const [isWebCreationMode, setIsWebCreationMode] = useState(false);
  const [webCreationData, setWebCreationData] = useState<AIData | null>(null);

  // Son Object Manager state
  const [sonObjects, setSonObjects] = useState<SonObject[]>([]);
  const [showSonObjectManager, setShowSonObjectManager] = useState(false);



  // Mother creation dialog state
  const [showMotherDialog, setShowMotherDialog] = useState(false);
  const [isEditingMother, setIsEditingMother] = useState(false);
  const [editingMotherId, setEditingMotherId] = useState<string | null>(null);
  const [motherConfig, setMotherConfig] = useState({
    width: 0,
    height: 0,
    margins: {
      top: 5,
      left: 5,
      down: 5,
      right: 5
    },
    sewingPosition: 'top' as 'top' | 'left' | 'right' | 'bottom' | 'mid-fold',
    sewingOffset: 5
  });

  // Visual toggle states
  const [showMarginRectangles, setShowMarginRectangles] = useState(true);
  const [showSewingLines, setShowSewingLines] = useState(true);

  // Sewing offset dialog state
  const [showSewingOffsetDialog, setShowSewingOffsetDialog] = useState(false);
  const [selectedSewingPosition, setSelectedSewingPosition] = useState<'top' | 'left' | 'right' | 'bottom' | 'mid-fold'>('top');

  // Margin controls state
  const [applyToAllSides, setApplyToAllSides] = useState(false);

  // Load selected customer from sessionStorage
  useEffect(() => {
    const storedCustomer = sessionStorage.getItem('selectedCustomer');
    if (storedCustomer) {
      try {
        const customer = JSON.parse(storedCustomer);
        setSelectedCustomer(customer);
      } catch (error) {
        console.error('Error parsing stored customer:', error);
      }
    }
  }, []);

  // Check for master file ID in URL parameters and load for editing
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const masterFileId = urlParams.get('masterFileId');

    if (masterFileId) {
      console.log('🔍 Master file ID detected in URL:', masterFileId);
      loadMasterFileForEditing(masterFileId);
    }
  }, [location.search]);

  // Removed space allocation dialog - now handled directly in son regions

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
  const handleSpaceAllocation = (obj: AIObject) => {
    console.log('🏗️ Allocating space directly for:', obj.name);
    const objectId = `${obj.name}_${obj.x}_${obj.y}`;
    const currentMetadata = sonMetadata.get(objectId) || {
      id: objectId,
      sonType: 'text',
      content: '',
      details: {},
      fontFamily: 'Arial',
      fontSize: 12,
      textAlign: 'left',
      fontWeight: 'normal',
      textOverflow: 'linebreak',
      lineBreakType: 'word',
      characterConnector: '-',
      margins: {
        top: 2,
        bottom: 2,
        left: 2,
        right: 2
      }
    };

    // Add space allocation info directly to metadata
    const updatedMetadata = {
      ...currentMetadata,
      spaceAllocation: {
        region: 'content',
        rowHeight: 10,
        columns: 1,
        selectedColumn: 1,
        allocated: true
      }
    };

    handleUpdateSonMetadata(objectId, updatedMetadata);
    setSelectedObject(obj); // Select the object to show details
  };

  // Dialog functions removed - space allocation now handled directly

  // Canvas capture function
  const captureCanvasAsSVG = (): string => {
    try {
      const svgElement = document.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG canvas not found');
      }

      // Clone the SVG to avoid modifying the original
      const svgClone = svgElement.cloneNode(true) as SVGElement;

      // Calculate bounds of all objects for cropping
      if (data && data.objects.length > 0) {
        const bounds = data.objects.reduce((acc, obj) => ({
          minX: Math.min(acc.minX, obj.x),
          minY: Math.min(acc.minY, obj.y),
          maxX: Math.max(acc.maxX, obj.x + obj.width),
          maxY: Math.max(acc.maxY, obj.y + obj.height)
        }), {
          minX: Infinity, minY: Infinity,
          maxX: -Infinity, maxY: -Infinity
        });

        // Add padding around the design
        const padding = 20;
        const viewBoxX = bounds.minX - padding;
        const viewBoxY = bounds.minY - padding;
        const viewBoxWidth = (bounds.maxX - bounds.minX) + (padding * 2);
        const viewBoxHeight = (bounds.maxY - bounds.minY) + (padding * 2);

        // Set viewBox to crop to content
        svgClone.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
        svgClone.setAttribute('width', viewBoxWidth.toString());
        svgClone.setAttribute('height', viewBoxHeight.toString());
      }

      // Convert to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgClone);

      return svgString;
    } catch (error) {
      console.error('Error capturing canvas as SVG:', error);
      throw error;
    }
  };

  // Helper function to check if mother objects exist
  const hasMotherObjects = (): boolean => {
    const hasMother = data?.objects.some(obj => obj.type === 'mother') || false;
    console.log('🔍 hasMotherObjects check:', {
      hasData: !!data,
      objectCount: data?.objects?.length || 0,
      objects: data?.objects?.map(obj => ({ name: obj.name, type: obj.type })) || [],
      hasMother
    });
    return hasMother;
  };

  // Generate smart default name with incremental numbering
  const generateDefaultMasterFileName = async (): Promise<string> => {
    if (!selectedCustomer) return 'Design_1';

    const customerName = selectedCustomer.customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const basePattern = `${customerName}_Design_`;

    try {
      // Get existing master files to find next available number
      const response = await masterFileService.getAllMasterFiles();
      if (response.success && response.data) {
        const existingNumbers = response.data
          .filter((file: any) => file.name.startsWith(basePattern))
          .map((file: any) => {
            const match = file.name.match(new RegExp(`${basePattern}(\\d+)`));
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((num: number) => !isNaN(num));

        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        return `${basePattern}${nextNumber}`;
      }
    } catch (error) {
      console.error('Error getting existing files:', error);
    }

    // Fallback to _1 if there's an error
    return `${basePattern}1`;
  };

  // Save Master File functions - Direct save without dialog
  const saveDirectly = async () => {
    if (!isWebCreationMode || !data || data.objects.length === 0) {
      alert('Please create some objects before saving as master file.');
      return;
    }

    if (!selectedCustomer) {
      alert('No customer selected.');
      return;
    }

    // Check if we're in edit mode
    if (isEditMode && editingMasterFileId && originalMasterFile) {
      // Show overwrite confirmation
      const confirmOverwrite = window.confirm(
        `⚠️ This will overwrite the existing master file:\n\n` +
        `"${originalMasterFile.name}"\n\n` +
        `Current revision: ${originalMasterFile.revisionNumber}\n` +
        `New revision will be: ${originalMasterFile.revisionNumber + 1}\n\n` +
        `Do you want to continue?`
      );

      if (!confirmOverwrite) {
        return; // User cancelled
      }

      // Perform overwrite save
      await performOverwriteSave();
    } else {
      // Generate default name automatically for new files
      const defaultName = await generateDefaultMasterFileName();

      // Save directly without showing dialog
      await performSave(defaultName);
    }
  };

  const performSave = async (fileName: string) => {
    if (!fileName.trim()) {
      alert('Please enter a master file name.');
      return;
    }

    if (!selectedCustomer) {
      alert('No customer selected.');
      return;
    }

    if (!data || data.objects.length === 0) {
      alert('No data to save.');
      return;
    }

    try {
      // Capture canvas as SVG
      const canvasImage = captureCanvasAsSVG();

      // Calculate canvas dimensions from objects or use defaults
      let widthInMm = 200; // Default width
      let heightInMm = 150; // Default height

      if (data.objects.length > 0) {
        // Calculate bounds from all objects
        const bounds = data.objects.reduce((acc, obj) => ({
          minX: Math.min(acc.minX, obj.x),
          minY: Math.min(acc.minY, obj.y),
          maxX: Math.max(acc.maxX, obj.x + obj.width),
          maxY: Math.max(acc.maxY, obj.y + obj.height)
        }), {
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity
        });

        // Add some padding around the objects
        const padding = 20; // 20mm padding
        widthInMm = Math.max(200, Math.ceil(bounds.maxX - bounds.minX + padding));
        heightInMm = Math.max(150, Math.ceil(bounds.maxY - bounds.minY + padding));
      }

      const result = await masterFileService.createMasterFile({
        name: fileName.trim(),
        width: widthInMm,
        height: heightInMm,
        customerId: selectedCustomer.id,
        description: `Web created master file with ${data.objects.length} objects`,
        canvasImage: canvasImage,
        designData: {
          objects: data.objects,
          metadata: {
            createdInWebMode: true,
            objectCount: data.objects.length,
            customerName: selectedCustomer.customerName,
            createdAt: new Date().toISOString(),
            canvasDimensions: {
              width: widthInMm,
              height: heightInMm
            }
          }
        }
      });

      if (result.success) {
        alert(`✅ Master File Saved Successfully!\n\nName: ${fileName}\nCustomer: ${selectedCustomer.customerName}\nDimensions: ${widthInMm} × ${heightInMm} mm\nObjects: ${data.objects.length}\nRevision: 1\n\nThe master file has been saved and is now available in Master File Management.\n\n🔄 Redirecting to Master Files...`);

        // Navigate back to master files management after 2 seconds
        setTimeout(() => {
          window.location.href = '/master-files';
        }, 2000);
      } else {
        alert(`❌ Error saving master file: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving master file:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        alert(`❌ ${error.message}`);
      } else {
        alert('❌ Failed to save master file. Please try again.');
      }
    }
  };

  // Overwrite Save Function for Edit Mode
  const performOverwriteSave = async () => {
    if (!editingMasterFileId || !originalMasterFile || !data) {
      alert('❌ Error: Missing edit mode data.');
      return;
    }

    try {
      // Capture canvas as SVG
      const canvasImage = captureCanvasAsSVG();

      // Calculate canvas dimensions from objects or use original dimensions
      let widthInMm = originalMasterFile.width;
      let heightInMm = originalMasterFile.height;

      if (data.objects.length > 0) {
        // Calculate bounds from all objects
        const bounds = data.objects.reduce((acc, obj) => ({
          minX: Math.min(acc.minX, obj.x),
          minY: Math.min(acc.minY, obj.y),
          maxX: Math.max(acc.maxX, obj.x + obj.width),
          maxY: Math.max(acc.maxY, obj.y + obj.height)
        }), {
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity
        });

        // Add some padding around the objects
        const padding = 20; // 20mm padding
        widthInMm = Math.max(200, Math.ceil(bounds.maxX - bounds.minX + padding));
        heightInMm = Math.max(150, Math.ceil(bounds.maxY - bounds.minY + padding));
      }

      // Update the master file (overwrite)
      const result = await masterFileService.updateMasterFile({
        id: editingMasterFileId,
        name: originalMasterFile.name, // Keep original name
        width: widthInMm,
        height: heightInMm,
        description: `Updated: ${data.objects.length} objects`,
        designData: {
          objects: data.objects,
          metadata: {
            createdInWebMode: true,
            objectCount: data.objects.length,
            customerName: selectedCustomer?.customerName,
            updatedAt: new Date().toISOString(),
            canvasDimensions: {
              width: widthInMm,
              height: heightInMm
            }
          }
        },
        canvasImage: canvasImage
      });

      if (result.success) {
        const newRevision = originalMasterFile.revisionNumber + 1;
        alert(`✅ Master File Updated Successfully!\n\nName: ${originalMasterFile.name}\nCustomer: ${selectedCustomer?.customerName}\nDimensions: ${widthInMm} × ${heightInMm} mm\nObjects: ${data.objects.length}\nRevision: ${newRevision}\n\nChanges have been saved.\n\n🔄 Returning to Master Files Management...`);

        // Navigate back to Master Files Management
        setTimeout(() => {
          window.location.href = '/master-files-management';
        }, 2000);
      } else {
        alert(`❌ Error updating master file: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating master file:', error);
      alert('❌ Failed to update master file. Please try again.');
    }
  };

  // Master File Loading Functions
  const loadMasterFileForEditing = async (masterFileId: string) => {
    try {
      console.log('🔄 Loading master file for editing:', masterFileId);

      // Fetch master file from database
      const result = await masterFileService.getMasterFileById(masterFileId);

      if (!result.success || !result.data) {
        alert(`❌ Error loading master file: ${result.error || 'Master file not found'}`);
        return;
      }

      const masterFile = result.data;
      console.log('✅ Master file loaded:', masterFile);

      // Check if master file has design data
      if (!masterFile.designData || !masterFile.designData.objects) {
        alert('❌ This master file has no design data to edit.');
        return;
      }

      // Enter web creation mode and edit mode
      setIsWebCreationMode(true);
      setIsEditMode(true);
      setEditingMasterFileId(masterFileId);
      setOriginalMasterFile(masterFile);

      // Restore canvas data from master file
      const restoredData: AIData = {
        document: `Editing: ${masterFile.name}`,
        totalObjects: masterFile.designData.objects.length,
        objects: masterFile.designData.objects
      };

      setData(restoredData);
      setWebCreationData(restoredData);

      // Restore customer context from master file
      if (masterFile.customerId) {
        // Set the customer from the master file
        const customer: Customer = {
          id: masterFile.customerId,
          customerName: masterFile.designData.metadata?.customerName || 'Unknown Customer',
          person: '',
          email: '',
          phone: '',
          address: ''
        };
        setSelectedCustomer(customer);
        console.log('📋 Customer restored from master file:', customer.customerName);
      }

      // Reset view state to show the loaded design
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setSelectedObject(null);
      setSonMetadata(new Map());
      setExpandedMothers(new Set());

      // Show success message
      alert(`✅ Master File Loaded Successfully!\n\nName: ${masterFile.name}\nObjects: ${masterFile.designData.objects.length}\nDimensions: ${masterFile.width} × ${masterFile.height} mm\n\nYou can now edit the design and save changes.`);

    } catch (error) {
      console.error('❌ Error loading master file:', error);
      alert('❌ Failed to load master file. Please try again.');
    }
  };

  // Web creation mode functions
  const startWebCreationMode = () => {
    console.log('🌐 Starting web creation mode');
    setIsWebCreationMode(true);
    // Initialize with empty data structure
    const emptyData: AIData = {
      document: 'Web Created Project',
      totalObjects: 0,
      objects: []
    };
    setWebCreationData(emptyData);
    setData(emptyData); // Use the same data state for consistency

    // Reset view state
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setSelectedObject(null);
    setSonMetadata(new Map());
    setExpandedMothers(new Set());
  };

  const openMotherDialog = () => {
    console.log('👩 Opening mother creation dialog');
    if (!isWebCreationMode) return;
    setIsEditingMother(false);
    setEditingMotherId(null);
    // Reset to default values for new mother
    setMotherConfig({
      width: 0,
      height: 0,
      margins: { top: 5, left: 5, down: 5, right: 5 },
      sewingPosition: 'top',
      sewingOffset: 5
    });
    setShowMotherDialog(true);
  };

  const openEditMotherDialog = (mother: AIObject) => {
    console.log('✏️ Opening mother edit dialog for:', mother.name);
    setIsEditingMother(true);
    setEditingMotherId(mother.name);

    // Load current mother properties (with stored metadata if available)
    const storedMargins = (mother as any).margins || { top: 5, left: 5, down: 5, right: 5 };
    const storedSewingPosition = (mother as any).sewingPosition || 'top';
    const storedSewingOffset = (mother as any).sewingOffset || 5;

    setMotherConfig({
      width: mother.width,
      height: mother.height,
      margins: storedMargins,
      sewingPosition: storedSewingPosition,
      sewingOffset: storedSewingOffset
    });
    setShowMotherDialog(true);
  };

  const createOrUpdateMotherObject = () => {
    console.log(isEditingMother ? '✏️ Updating mother object' : '👩 Creating new mother object', 'with config:', motherConfig);
    if (!isWebCreationMode) return;

    const currentData = data || webCreationData;
    if (!currentData) return;

    // Validate dimensions
    if (motherConfig.width <= 0 || motherConfig.height <= 0) {
      alert('❌ Invalid dimensions!\n\nPlease enter valid width and height values greater than 0.');
      return;
    }

    if (motherConfig.width > 1000 || motherConfig.height > 1000) {
      alert('❌ Dimensions too large!\n\nPlease enter dimensions smaller than 1000mm for both width and height.');
      return;
    }

    if (isEditingMother && editingMotherId) {
      // Update existing mother
      const updatedObjects = currentData.objects.map(obj => {
        if (obj.name === editingMotherId && obj.type === 'mother') {
          return {
            ...obj,
            width: motherConfig.width,
            height: motherConfig.height,
            // Store additional properties (margins, sewing position) as metadata
            margins: motherConfig.margins,
            sewingPosition: motherConfig.sewingPosition,
            sewingOffset: motherConfig.sewingOffset
          } as any;
        }
        return obj;
      });

      const updatedData: AIData = {
        ...currentData,
        objects: updatedObjects
      };

      setData(updatedData);
      setWebCreationData(updatedData);

      // Keep the edited object selected
      const editedObject = updatedObjects.find(obj => obj.name === editingMotherId);
      if (editedObject) setSelectedObject(editedObject);

      console.log('✅ Mother object updated:', editingMotherId);

      // Show success feedback for update
      alert(`✅ Mother Container Updated!\n\n"${editingMotherId}" has been updated successfully.\n\n📐 Size: ${motherConfig.width} × ${motherConfig.height} mm\n📏 Margins: ${motherConfig.margins.top}mm (top), ${motherConfig.margins.left}mm (left), ${motherConfig.margins.down}mm (bottom), ${motherConfig.margins.right}mm (right)`);
    } else {
      // Create new mother at default position
      const xPosition = 50;
      const yPosition = 50;

      // Create a new mother object with user-specified dimensions
      const newMother: AIObject = {
        name: `Mother_${currentData.objects.length + 1}`,
        type: 'mother',
        x: xPosition,
        y: yPosition,
        width: motherConfig.width,
        height: motherConfig.height,
        typename: 'mother',
        // Store additional properties as metadata
        margins: motherConfig.margins,
        sewingPosition: motherConfig.sewingPosition,
        sewingOffset: motherConfig.sewingOffset
      } as any;

      const updatedData: AIData = {
        ...currentData,
        totalObjects: currentData.totalObjects + 1,
        objects: [...currentData.objects, newMother]
      };

      setData(updatedData);
      setWebCreationData(updatedData);
      setSelectedObject(newMother);

      console.log('✅ Mother object created:', newMother);

      // Show success feedback for creation
      alert(`🎉 Mother Container Created!\n\n"${newMother.name}" has been created successfully and is ready for son objects.\n\n📐 Size: ${motherConfig.width} × ${motherConfig.height} mm\n📍 Position: ${xPosition}, ${yPosition} mm\n📏 Margins: ${motherConfig.margins.top}mm (top), ${motherConfig.margins.left}mm (left), ${motherConfig.margins.down}mm (bottom), ${motherConfig.margins.right}mm (right)\n\n💡 Next: Click "🎯 Manage Son Objects" to add content!`);
    }

    setShowMotherDialog(false); // Close dialog
  };

  // Sewing position functions
  const handleSewingPositionClick = (position: 'top' | 'left' | 'right' | 'bottom' | 'mid-fold') => {
    setSelectedSewingPosition(position);

    // Mid-fold doesn't need offset dialog - set directly
    if (position === 'mid-fold') {
      setMotherConfig(prev => ({
        ...prev,
        sewingPosition: 'mid-fold',
        sewingOffset: 0 // No offset needed for mid-fold
      }));
    } else {
      setShowSewingOffsetDialog(true);
    }
  };

  const confirmSewingOffset = (offset: number) => {
    setMotherConfig(prev => ({
      ...prev,
      sewingPosition: selectedSewingPosition,
      sewingOffset: offset
    }));
    setShowSewingOffsetDialog(false);
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

  const handleUpdateMotherMetadata = (objectName: string, metadata: MotherMetadata) => {
    setMotherMetadata(prev => {
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
                background: selectedObject === mother.object ? '#1976d2' : '#e3f2fd',
                color: selectedObject === mother.object ? 'white' : '#1976d2',
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
                      <span>{mother.object.name} ({mother.children.length} objects)</span>
                    </div>
                    <div style={{fontSize: '0.8em', opacity: 0.8, marginLeft: '24px'}}>
                      {mother.object.typename}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {/* Edit Button - Only show in web creation mode */}
                    {isWebCreationMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditMotherDialog(mother.object);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'inherit',
                          fontSize: '10px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        title="Edit mother object"
                      >
                        ✏️ Edit
                      </button>
                    )}

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
                        cursor: 'pointer'
                      }}
                    title="Fit to view (100% zoom, centered)"
                    >
                      👑 Fit View
                    </button>

                    {/* Save Button - Only show in web creation mode when mother objects exist */}
                    {isWebCreationMode && hasMotherObjects() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveDirectly();
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                          border: '1px solid #4CAF50',
                          color: 'white',
                          fontSize: '10px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                        title="Save canvas design to Master Files"
                      >
                        💾 Save
                      </button>
                    )}
                  </div>
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
                      <div>{son.name}</div>
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
                          fontSize: '14px',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          minWidth: '32px',
                          minHeight: '28px'
                        }}
                        title="Pan to center (keep current zoom)"
                      >
                        ✋
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObject(son);
                          handleSpaceAllocation(son);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'inherit',
                          fontSize: '14px',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          minWidth: '32px',
                          minHeight: '28px'
                        }}
                        title="Allocate space in region/row/column"
                      >
                        📐
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
            // Calculate content area (below name and type) with user-defined margins
            const margins = metadata?.margins || { top: 2, bottom: 2, left: 2, right: 2 };
            const mmToPx = 3.78; // Conversion factor from mm to pixels

            const marginTopPx = margins.top * mmToPx;
            const marginBottomPx = margins.bottom * mmToPx;
            const marginLeftPx = margins.left * mmToPx;
            const marginRightPx = margins.right * mmToPx;

            const contentY = baseY + 45 + marginTopPx;
            const contentHeight = height - 50 - marginTopPx - marginBottomPx; // Leave space for name/type and margins
            const contentWidth = width - marginLeftPx - marginRightPx; // Apply left and right margins

            if (contentHeight > 10 && contentWidth > 20) {
              // Get text overflow settings
              const textOverflow = metadata?.textOverflow || 'linebreak';
              const lineBreakType = metadata?.lineBreakType || 'word';
              const characterConnector = metadata?.characterConnector || '-';

              let displayLines = [];
              let actualFontSize = Math.max(6, (metadata?.fontSize || 12) * zoom);

              // Create a more accurate text measurement function
              const measureTextWidth = (text: string, fontSize: number, fontFamily: string) => {
                // Create a temporary canvas for text measurement
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.font = `${fontSize}px ${fontFamily}`;
                  return ctx.measureText(text).width;
                }
                // Fallback to estimation if canvas not available
                return text.length * fontSize * 0.5;
              };

              const fontFamily = metadata?.fontFamily || 'Arial';

              if (textOverflow === 'resize') {
                // Option 1: Resize text to fit in one line using actual text measurement
                const textWidth = measureTextWidth(content, actualFontSize, fontFamily);
                if (textWidth > contentWidth) {
                  // Calculate smaller font size to fit all text in one line
                  actualFontSize = Math.max(6, (contentWidth / textWidth) * actualFontSize);
                }
                displayLines = [content]; // Single line
              } else {
                // Option 2: Accept line breaks using accurate text measurement

                if (lineBreakType === 'word') {
                  // Word break: break at word boundaries using accurate text measurement
                  const words = content.split(' ');
                  let currentLine = '';

                  for (const word of words) {
                    const testLine = currentLine ? currentLine + ' ' + word : word;
                    const testLineWidth = measureTextWidth(testLine, actualFontSize, fontFamily);

                    if (testLineWidth <= contentWidth) {
                      currentLine = testLine;
                    } else {
                      // If current line has content, push it and start new line
                      if (currentLine) {
                        displayLines.push(currentLine);
                        currentLine = word;
                      } else {
                        // Single word is too long, force it on the line anyway
                        displayLines.push(word);
                        currentLine = '';
                      }
                    }
                  }
                  if (currentLine) displayLines.push(currentLine);
                } else {
                  // Character break: break at character boundaries with connector using accurate measurement
                  let remainingText = content;
                  while (remainingText.length > 0) {
                    // Try to fit as many characters as possible
                    let lineText = '';
                    let testLength = Math.min(remainingText.length, Math.floor(contentWidth / (actualFontSize * 0.5)));

                    // Binary search to find maximum characters that fit
                    let low = 1;
                    let high = Math.min(remainingText.length, testLength);
                    let bestFit = 1;

                    while (low <= high) {
                      const mid = Math.floor((low + high) / 2);
                      const testText = remainingText.substring(0, mid);
                      const testWidth = measureTextWidth(testText + characterConnector, actualFontSize, fontFamily);

                      if (testWidth <= contentWidth) {
                        bestFit = mid;
                        low = mid + 1;
                      } else {
                        high = mid - 1;
                      }
                    }

                    if (bestFit >= remainingText.length) {
                      // Remaining text fits without connector
                      displayLines.push(remainingText);
                      break;
                    } else {
                      // Add connector and continue
                      lineText = remainingText.substring(0, bestFit) + characterConnector;
                      displayLines.push(lineText);
                      remainingText = remainingText.substring(bestFit);
                    }
                  }
                }
              }

              // Limit lines to fit in available height
              const lineHeight = actualFontSize + 2;
              const maxLines = Math.floor(contentHeight / lineHeight);
              displayLines = displayLines.slice(0, maxLines);

              // Apply font formatting from metadata (fontFamily already declared above)
              const textAlign = metadata?.textAlign || 'left';
              const fontWeight = metadata?.fontWeight || 'normal';

              // Calculate text anchor based on alignment with user-defined margins
              let textAnchor: 'start' | 'middle' | 'end' = 'start';
              let textX = baseX + marginLeftPx; // Apply left margin

              if (textAlign === 'center') {
                textAnchor = 'middle';
                textX = baseX + marginLeftPx + (contentWidth / 2);
              } else if (textAlign === 'right') {
                textAnchor = 'end';
                textX = baseX + width - marginRightPx;
              }

              const textElements = displayLines.map((line, lineIndex) => (
                <text
                  key={`content-${lineIndex}`}
                  x={textX}
                  y={contentY + (lineIndex * lineHeight)}
                  fontSize={actualFontSize}
                  fill="#2e7d32"
                  fontWeight={fontWeight}
                  fontFamily={fontFamily}
                  textAnchor={textAnchor}
                >
                  {line}
                </text>
              ));

              // Add margin guide lines if this object is selected
              const marginGuides = selectedObject === obj ? [
                // Top margin line
                <line
                  key="margin-top"
                  x1={baseX}
                  y1={baseY + 45 + marginTopPx}
                  x2={baseX + width}
                  y2={baseY + 45 + marginTopPx}
                  stroke="#ff9800"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.7"
                />,
                // Bottom margin line
                <line
                  key="margin-bottom"
                  x1={baseX}
                  y1={baseY + height - marginBottomPx}
                  x2={baseX + width}
                  y2={baseY + height - marginBottomPx}
                  stroke="#ff9800"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.7"
                />,
                // Left margin line
                <line
                  key="margin-left"
                  x1={baseX + marginLeftPx}
                  y1={baseY + 45}
                  x2={baseX + marginLeftPx}
                  y2={baseY + height}
                  stroke="#ff9800"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.7"
                />,
                // Right margin line
                <line
                  key="margin-right"
                  x1={baseX + width - marginRightPx}
                  y1={baseY + 45}
                  x2={baseX + width - marginRightPx}
                  y2={baseY + height}
                  stroke="#ff9800"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.7"
                />
              ] : [];

              return [...textElements, ...marginGuides];
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

        {/* Visual Indicators for Mother Objects in Web Creation Mode */}
        {isWebCreationMode && obj.type?.includes('mother') && (
          <>
            {/* Margin Rectangle */}
            {showMarginRectangles && (() => {
              // Use the same scale as the object rendering
              const mmToPx = 3.78;
              const scale = zoom * mmToPx;
              const topMarginPx = motherConfig.margins.top * scale;
              const bottomMarginPx = motherConfig.margins.down * scale;
              const leftMarginPx = motherConfig.margins.left * scale;
              const rightMarginPx = motherConfig.margins.right * scale;

              const marginFontSize = Math.max(8, Math.min(12, 10 * zoom));

              return (
                <>
                  {/* Margin Rectangle */}
                  <rect
                    x={baseX + leftMarginPx}
                    y={baseY + topMarginPx}
                    width={width - leftMarginPx - rightMarginPx}
                    height={height - topMarginPx - bottomMarginPx}
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.6"
                  />

                  {/* Margin Dimension Labels */}
                  {/* Top margin label */}
                  <text
                    x={baseX + width / 2}
                    y={baseY + topMarginPx / 2}
                    fill="#4CAF50"
                    fontSize={marginFontSize}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.8"
                  >
                    {motherConfig.margins.top}mm
                  </text>

                  {/* Bottom margin label */}
                  <text
                    x={baseX + width / 2}
                    y={baseY + height - bottomMarginPx / 2}
                    fill="#4CAF50"
                    fontSize={marginFontSize}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.8"
                  >
                    {motherConfig.margins.down}mm
                  </text>

                  {/* Left margin label */}
                  <text
                    x={baseX + leftMarginPx / 2}
                    y={baseY + height / 2}
                    fill="#4CAF50"
                    fontSize={marginFontSize}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.8"
                    transform={`rotate(-90, ${baseX + leftMarginPx / 2}, ${baseY + height / 2})`}
                  >
                    {motherConfig.margins.left}mm
                  </text>

                  {/* Right margin label */}
                  <text
                    x={baseX + width - rightMarginPx / 2}
                    y={baseY + height / 2}
                    fill="#4CAF50"
                    fontSize={marginFontSize}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.8"
                    transform={`rotate(90, ${baseX + width - rightMarginPx / 2}, ${baseY + height / 2})`}
                  >
                    {motherConfig.margins.right}mm
                  </text>
                </>
              );
            })()}



            {/* Sewing Lines with Dimensions */}
            {showSewingLines && motherConfig.sewingPosition && (
              (() => {
                // Use the same scale as the object rendering
                const mmToPx = 3.78;
                const scale = zoom * mmToPx;
                const offset = motherConfig.sewingOffset * scale;
                const sewingFontSize = Math.max(8, Math.min(12, 10 * zoom));

                switch (motherConfig.sewingPosition) {
                  case 'top':
                    return (
                      <>
                        <line
                          x1={baseX}
                          y1={baseY + offset}
                          x2={baseX + width}
                          y2={baseY + offset}
                          stroke="#d32f2f"
                          strokeWidth="3"
                          strokeDasharray="4,4"
                          opacity="0.9"
                        />
                        <text
                          x={baseX + width + 5}
                          y={baseY + offset}
                          fill="#d32f2f"
                          fontSize={sewingFontSize}
                          fontWeight="bold"
                          textAnchor="start"
                          dominantBaseline="middle"
                          opacity="0.9"
                        >
                          {motherConfig.sewingOffset}mm
                        </text>
                      </>
                    );
                  case 'left':
                    return (
                      <>
                        <line
                          x1={baseX + offset}
                          y1={baseY}
                          x2={baseX + offset}
                          y2={baseY + height}
                          stroke="#d32f2f"
                          strokeWidth="3"
                          strokeDasharray="4,4"
                          opacity="0.9"
                        />
                        <text
                          x={baseX + offset}
                          y={baseY - 5}
                          fill="#d32f2f"
                          fontSize={sewingFontSize}
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="bottom"
                          opacity="0.9"
                        >
                          {motherConfig.sewingOffset}mm
                        </text>
                      </>
                    );
                  case 'right':
                    return (
                      <>
                        <line
                          x1={baseX + width - offset}
                          y1={baseY}
                          x2={baseX + width - offset}
                          y2={baseY + height}
                          stroke="#d32f2f"
                          strokeWidth="3"
                          strokeDasharray="4,4"
                          opacity="0.9"
                        />
                        <text
                          x={baseX + width - offset}
                          y={baseY - 5}
                          fill="#d32f2f"
                          fontSize={sewingFontSize}
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="bottom"
                          opacity="0.9"
                        >
                          {motherConfig.sewingOffset}mm
                        </text>
                      </>
                    );
                  case 'bottom':
                    return (
                      <>
                        <line
                          x1={baseX}
                          y1={baseY + height - offset}
                          x2={baseX + width}
                          y2={baseY + height - offset}
                          stroke="#d32f2f"
                          strokeWidth="3"
                          strokeDasharray="4,4"
                          opacity="0.9"
                        />
                        <text
                          x={baseX + width + 5}
                          y={baseY + height - offset}
                          fill="#d32f2f"
                          fontSize={sewingFontSize}
                          fontWeight="bold"
                          textAnchor="start"
                          dominantBaseline="middle"
                          opacity="0.9"
                        >
                          {motherConfig.sewingOffset}mm
                        </text>
                      </>
                    );
                  case 'mid-fold':
                    return (
                      <>
                        <line
                          x1={baseX}
                          y1={baseY + height / 2}
                          x2={baseX + width}
                          y2={baseY + height / 2}
                          stroke="#d32f2f"
                          strokeWidth="3"
                          strokeDasharray="4,4"
                          opacity="0.9"
                        />
                        <text
                          x={baseX + width + 5}
                          y={baseY + height / 2}
                          fill="#d32f2f"
                          fontSize={sewingFontSize}
                          fontWeight="bold"
                          textAnchor="start"
                          dominantBaseline="middle"
                          opacity="0.9"
                        >
                          Mid-Fold
                        </text>
                      </>
                    );
                  default:
                    return null;
                }
              })()
            )}
          </>
        )}

        {/* Mother Object Margin and Sewing Position Visualization */}
        {obj.type?.includes('mother') && (() => {
          const objectId = `${obj.name}_${obj.x}_${obj.y}`;
          const motherMeta = motherMetadata.get(objectId);

          if (!motherMeta) return null;

          const mmToPx = 3.78;
          const scale = zoom * mmToPx;

          return (
            <>
              {/* Margin Rectangle */}
              {motherMeta.margins && selectedObject === obj && (
                <>
                  <rect
                    x={baseX + (motherMeta.margins.left * scale)}
                    y={baseY + (motherMeta.margins.top * scale)}
                    width={width - ((motherMeta.margins.left + motherMeta.margins.right) * scale)}
                    height={height - ((motherMeta.margins.top + motherMeta.margins.bottom) * scale)}
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.8"
                  />

                  {/* Margin Labels */}
                  <text
                    x={baseX + width / 2}
                    y={baseY - 5}
                    fill="#4CAF50"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Margins: {motherMeta.margins.top}mm
                  </text>
                </>
              )}

              {/* Sewing Position Indicator */}
              {motherMeta.sewingPosition?.isSet && (
                <>
                  <circle
                    cx={baseX + ((motherMeta.sewingPosition.x - obj.x) * scale)}
                    cy={baseY + ((motherMeta.sewingPosition.y - obj.y) * scale)}
                    r="4"
                    fill="#ff5722"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    x={baseX + ((motherMeta.sewingPosition.x - obj.x) * scale) + 8}
                    y={baseY + ((motherMeta.sewingPosition.y - obj.y) * scale) - 8}
                    fill="#ff5722"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    🧵
                  </text>
                </>
              )}
            </>
          );
        })()}
      </g>
    );
  };

  // Space Allocation Dialog Component - REMOVED (now handled directly in son regions)

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
      {/* Add CSS animation for pulse effect */}
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
            100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
          }
        `}
      </style>
      {/* Customer Header and Navigation */}
      {selectedCustomer && (
        <>
          {/* Navigation Buttons */}
          <NavigationButtons
            previousPagePath="/master-files/select-customer"
            previousPageLabel="Select Customer"
            showMasterFilesButton={true}
            showPreviousButton={true}
          />

          {/* Customer Info Header */}
          <div style={{
            background: '#2d3748',
            color: 'white',
            padding: '12px 20px',
            borderBottom: '1px solid #4a5568'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              🏷️ Care Label Designer - {selectedCustomer.customerName}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#a0aec0' }}>
              Contact: {selectedCustomer.person} • {selectedCustomer.email}
            </p>
          </div>
        </>
      )}

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
          {data || isWebCreationMode ? (
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

                {/* Visual Indicators Toggle - Only show in web creation mode */}
                {isWebCreationMode && (
                  <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>
                      Visual Indicators:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <button
                        onClick={() => setShowMarginRectangles(!showMarginRectangles)}
                        style={{
                          ...buttonStyle,
                          background: showMarginRectangles ? '#f1f8e9' : 'white',
                          color: showMarginRectangles ? '#4CAF50' : '#666',
                          fontSize: '9px',
                          padding: '3px 5px',
                          width: '100%'
                        }}
                      >
                        📦 Margins
                      </button>

                      <button
                        onClick={() => setShowSewingLines(!showSewingLines)}
                        style={{
                          ...buttonStyle,
                          background: showSewingLines ? '#f1f8e9' : 'white',
                          color: showSewingLines ? '#4CAF50' : '#666',
                          fontSize: '9px',
                          padding: '3px 5px',
                          width: '100%'
                        }}
                      >
                        🧵 Sewing
                      </button>
                    </div>
                  </div>
                )}
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

                {/* Web Creation Mode Indicator */}
                {isWebCreationMode && (!data || data.objects.length === 0) && (
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="24"
                    fill="#ccc"
                    fontWeight="bold"
                  >
                    🌐 Web Creation Canvas - Create your first mother object
                  </text>
                )}

                {(data || webCreationData)?.objects.map((obj, index) => renderObject(obj, index))}
              </svg>
            </div>
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center'
            }}>
              {/* Header */}
              <div style={{
                marginBottom: '40px'
              }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#2d3748',
                  margin: '0 0 12px 0'
                }}>
                  🏷️ Care Label Layout System
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#718096',
                  margin: 0
                }}>
                  Choose how to start designing your care labels
                </p>
              </div>

              {/* Two Button Layout */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '30px',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                {/* Start Everything From Web Button */}
                <div style={{
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '40px 30px',
                  background: 'white',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                  onClick={startWebCreationMode}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = '#f7fafc';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '20px'
                  }}>
                    🌐
                  </div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#2d3748',
                    margin: '0 0 12px 0'
                  }}>
                    Start Everything From Web
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#718096',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    Create layers and objects directly in the visual designer with drag-and-drop tools
                  </p>
                </div>

                {/* Import JSON File Button */}
                <div style={{
                  border: isDragOver ? '2px solid #4CAF50' : '2px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '40px 30px',
                  background: isDragOver ? 'rgba(76,175,80,0.05)' : 'white',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                  onMouseEnter={(e) => {
                    if (!isDragOver) {
                      e.currentTarget.style.borderColor = '#4CAF50';
                      e.currentTarget.style.background = '#f0f9f0';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDragOver) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '20px'
                  }}>
                    {isDragOver ? '📥' : '📁'}
                  </div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#2d3748',
                    margin: '0 0 12px 0'
                  }}>
                    Import JSON File
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#718096',
                    margin: '0 0 15px 0',
                    lineHeight: '1.5'
                  }}>
                    Drop JSON file here or click to browse and import existing label data
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleInputChange}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>
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
              📋 {(data || webCreationData) ? (() => {
                const currentData = data || webCreationData;
                if (currentData) {
                  const { mothers } = buildHierarchy(currentData.objects);
                  return isWebCreationMode
                    ? `🌐 Web Project (${mothers.length} Pages, ${currentData.totalObjects} Objects)`
                    : `${mothers.length} Pages (${currentData.totalObjects} Objects)`;
                }
                return 'Layer Objects';
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

          {data && data.objects.length > 0 ? (
            <div>
              {renderHierarchicalList()}
            </div>
          ) : isWebCreationMode ? (
            <div style={{textAlign: 'center', marginTop: '30px'}}>
              <div style={{
                background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
                padding: '20px',
                borderRadius: '10px',
                border: '2px dashed #4CAF50',
                marginBottom: '20px'
              }}>
                <div style={{fontSize: '2rem', marginBottom: '10px'}}>🏗️</div>
                <h4 style={{margin: '0 0 10px 0', color: '#2e7d32'}}>Web Creation Mode</h4>
                <p style={{color: '#666', fontSize: '14px', margin: '0 0 20px 0'}}>
                  Start by creating your first mother object
                </p>

                <button
                  onClick={openMotherDialog}
                  style={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(76, 175, 80, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(76, 175, 80, 0.3)';
                  }}
                >
                  👩 Create Mother
                </button>


              </div>

              {/* Debug Panel - Remove this after testing */}
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: '#f0f0f0',
                borderRadius: '5px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <strong>🔍 Debug Info:</strong><br/>
                Objects: {data?.objects?.length || 0}<br/>
                Has Mother: {hasMotherObjects() ? 'YES' : 'NO'}<br/>
                Types: {data?.objects?.map(obj => obj.type).join(', ') || 'none'}
              </div>



              {/* Save and Close Button - Show when there are objects, green when mother exists */}
              {data && data.objects.length > 0 && (
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: hasMotherObjects()
                    ? 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)'
                    : 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                  borderRadius: '10px',
                  border: hasMotherObjects()
                    ? '2px solid #4CAF50'
                    : '2px solid #f39c12',
                  textAlign: 'center',
                  animation: hasMotherObjects() ? 'pulse 2s infinite' : 'none'
                }}>
                  <div style={{fontSize: '1.5rem', marginBottom: '10px'}}>💾</div>
                  <h4 style={{
                    margin: '0 0 10px 0',
                    color: hasMotherObjects() ? '#2e7d32' : '#d68910'
                  }}>
                    {hasMotherObjects() ? 'Ready to Save & Close!' : 'Ready to Save?'}
                  </h4>
                  <p style={{color: '#666', fontSize: '14px', margin: '0 0 15px 0'}}>
                    {hasMotherObjects()
                      ? 'Your mother container is ready - save and close to finish'
                      : 'Save your current design as a master file'
                    }
                  </p>
                  <button
                    onClick={saveDirectly}
                    style={{
                      background: hasMotherObjects()
                        ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                        : 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: hasMotherObjects()
                        ? '0 3px 10px rgba(76, 175, 80, 0.3)'
                        : '0 3px 10px rgba(243, 156, 18, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = hasMotherObjects()
                        ? '0 4px 15px rgba(76, 175, 80, 0.4)'
                        : '0 4px 15px rgba(243, 156, 18, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = hasMotherObjects()
                        ? '0 3px 10px rgba(76, 175, 80, 0.3)'
                        : '0 3px 10px rgba(243, 156, 18, 0.3)';
                    }}
                  >
                    {hasMotherObjects() ? '💾 Save and Close' : '💾 Save as Master File'}
                  </button>
                </div>
              )}

              <div style={{fontSize: '12px', color: '#999', textAlign: 'left'}}>
                <p><strong>Next Steps:</strong></p>
                <p>1. Create a mother object (container)</p>
                <p>2. Add son objects (text, images, etc.)</p>
                <p>3. Configure properties and layout</p>
              </div>
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
              motherMetadata={motherMetadata}
              onUpdateMotherMetadata={handleUpdateMotherMetadata}
            />
          </div>
        </div>

      </div>

      {/* Mother Creation Dialog */}
      {showMotherDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              color: '#2e7d32',
              textAlign: 'center',
              fontSize: '24px'
            }}>
              {isEditingMother ? '✏️ Edit Mother Object' : '👩 Create Mother Object'}
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>
                📏 Dimensions (mm)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                    Width (mm):
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    step="10"
                    value={motherConfig.width}
                    onChange={(e) => setMotherConfig(prev => ({
                      ...prev,
                      width: parseInt(e.target.value) || 200
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                    Height (mm):
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    step="10"
                    value={motherConfig.height}
                    onChange={(e) => setMotherConfig(prev => ({
                      ...prev,
                      height: parseInt(e.target.value) || 150
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>
              </div>
            </div>

            {/* Margin Controls */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 style={{ margin: '0', color: '#333', fontSize: '16px' }}>
                  📏 Margins (mm)
                </h3>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#666',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={applyToAllSides}
                    onChange={(e) => setApplyToAllSides(e.target.checked)}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  Apply to 4 sides
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                    ⬆️ Top:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={motherConfig.margins.top}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setMotherConfig(prev => ({
                        ...prev,
                        margins: applyToAllSides
                          ? { top: value, left: value, down: value, right: value }
                          : { ...prev.margins, top: value }
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                    ⬇️ Down:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={motherConfig.margins.down}
                    disabled={applyToAllSides}
                    onChange={(e) => setMotherConfig(prev => ({
                      ...prev,
                      margins: { ...prev.margins, down: parseInt(e.target.value) || 0 }
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s',
                      backgroundColor: applyToAllSides ? '#f5f5f5' : 'white',
                      color: applyToAllSides ? '#999' : '#333'
                    }}
                    onFocus={(e) => !applyToAllSides && (e.target.style.borderColor = '#4CAF50')}
                    onBlur={(e) => !applyToAllSides && (e.target.style.borderColor = '#ddd')}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                    ⬅️ Left:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={motherConfig.margins.left}
                    disabled={applyToAllSides}
                    onChange={(e) => setMotherConfig(prev => ({
                      ...prev,
                      margins: { ...prev.margins, left: parseInt(e.target.value) || 0 }
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s',
                      backgroundColor: applyToAllSides ? '#f5f5f5' : 'white',
                      color: applyToAllSides ? '#999' : '#333'
                    }}
                    onFocus={(e) => !applyToAllSides && (e.target.style.borderColor = '#4CAF50')}
                    onBlur={(e) => !applyToAllSides && (e.target.style.borderColor = '#ddd')}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                    ➡️ Right:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={motherConfig.margins.right}
                    disabled={applyToAllSides}
                    onChange={(e) => setMotherConfig(prev => ({
                      ...prev,
                      margins: { ...prev.margins, right: parseInt(e.target.value) || 0 }
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s',
                      backgroundColor: applyToAllSides ? '#f5f5f5' : 'white',
                      color: applyToAllSides ? '#999' : '#333'
                    }}
                    onFocus={(e) => !applyToAllSides && (e.target.style.borderColor = '#4CAF50')}
                    onBlur={(e) => !applyToAllSides && (e.target.style.borderColor = '#ddd')}
                  />
                </div>
              </div>
            </div>

            {/* Sewing Position Controls */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>
                🧵 Sewing Position (Click to set offset)
              </h3>

              {/* Group 1: Edge Positions */}
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                  📍 Edge Positions:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { value: 'top', label: '🔝 Top' },
                    { value: 'left', label: '⬅️ Left' },
                    { value: 'right', label: '➡️ Right' },
                    { value: 'bottom', label: '⬇️ Bottom' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSewingPositionClick(option.value as 'top' | 'left' | 'right' | 'bottom' | 'mid-fold')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px 16px',
                        border: `2px solid ${motherConfig.sewingPosition === option.value ? '#d32f2f' : '#ddd'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: motherConfig.sewingPosition === option.value ? '#ffebee' : 'white',
                        transition: 'all 0.3s',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}
                      onMouseOver={(e) => {
                        if (motherConfig.sewingPosition !== option.value) {
                          e.currentTarget.style.borderColor = '#d32f2f';
                          e.currentTarget.style.background = '#f9f9f9';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (motherConfig.sewingPosition !== option.value) {
                          e.currentTarget.style.borderColor = '#ddd';
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      {option.label}
                      {motherConfig.sewingPosition === option.value && (
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          ({motherConfig.sewingOffset}mm)
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group 2: Mid-Fold Position */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                  📐 Mid-Fold Position:
                </h4>
                <button
                  onClick={() => handleSewingPositionClick('mid-fold')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px 16px',
                    border: `2px solid ${motherConfig.sewingPosition === 'mid-fold' ? '#d32f2f' : '#ddd'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: motherConfig.sewingPosition === 'mid-fold' ? '#ffebee' : 'white',
                    transition: 'all 0.3s',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#333',
                    width: '100%'
                  }}
                  onMouseOver={(e) => {
                    if (motherConfig.sewingPosition !== 'mid-fold') {
                      e.currentTarget.style.borderColor = '#d32f2f';
                      e.currentTarget.style.background = '#f9f9f9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (motherConfig.sewingPosition !== 'mid-fold') {
                      e.currentTarget.style.borderColor = '#ddd';
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  🎯 Mid-Fold (Horizontal)
                  {motherConfig.sewingPosition === 'mid-fold' && (
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      (Center)
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowMotherDialog(false)}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#999';
                  e.currentTarget.style.color = '#333';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#ddd';
                  e.currentTarget.style.color = '#666';
                }}
              >
                ❌ Cancel
              </button>

              <button
                onClick={createOrUpdateMotherObject}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(76, 175, 80, 0.3)',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(76, 175, 80, 0.3)';
                }}
              >
                {isEditingMother ? '✅ Update' : '✅ Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sewing Offset Dialog */}
      {showSewingOffsetDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }}>
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            minWidth: '300px',
            textAlign: 'center'
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              color: '#2e7d32',
              fontSize: '18px'
            }}>
              🧵 Set Sewing Offset
            </h3>

            <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
              Distance from <strong>{selectedSewingPosition}</strong> edge in mm:
            </p>

            <input
              type="number"
              min="1"
              max="50"
              step="1"
              defaultValue={motherConfig.sewingOffset}
              autoFocus
              id="sewing-offset-input"
              style={{
                width: '100px',
                padding: '8px 12px',
                border: '2px solid #4CAF50',
                borderRadius: '6px',
                fontSize: '16px',
                textAlign: 'center',
                outline: 'none',
                marginBottom: '20px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseInt((e.target as HTMLInputElement).value) || 5;
                  confirmSewingOffset(value);
                }
              }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowSewingOffsetDialog(false)}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#666',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  const input = document.getElementById('sewing-offset-input') as HTMLInputElement;
                  const value = parseInt(input.value) || 5;
                  confirmSewingOffset(value);
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#4CAF50',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                ✅ Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Son Object Manager */}
      {showSonObjectManager && (
        <SonObjectManager
          sonObjects={sonObjects}
          onSonObjectsChange={setSonObjects}
        />
      )}



      {/* Space Allocation Dialog - REMOVED (now handled directly in son regions) */}

      {/* Version Footer */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 1000
      }}>
        v{packageJson.version} | Port: {window.location.port || '80'} | {new Date().toLocaleString()}
      </div>
    </div>
  );
}

export default App;






