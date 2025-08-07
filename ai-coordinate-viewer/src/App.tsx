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

interface Region {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  borderColor: string;
  backgroundColor: string;
  allowOverflow: boolean;
  flowToNext?: string; // ID of next region for overflow
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

  // Get URL parameters to determine context and mode
  const urlParams = new URLSearchParams(location.search);
  const context = urlParams.get('context');
  const projectSlug = urlParams.get('projectSlug');
  const projectName = urlParams.get('projectName');
  const masterFileId = urlParams.get('masterFileId');

  // Mode Detection
  const isMasterFileMode = !context || context !== 'projects';
  const isProjectMode = context === 'projects';

  console.log('🎯 Mode Detection:', {
    isMasterFileMode,
    isProjectMode,
    context,
    masterFileId
  });
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
  const [isLoadingMasterFile, setIsLoadingMasterFile] = useState(false);

  // Canvas view state
  const [zoom, setZoom] = useState(1); // 1 = 1:1 scale (1mm = 1px at 96 DPI)
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [showDimensions, setShowDimensions] = useState(true);
  const [autoFitNotification, setAutoFitNotification] = useState(false);
  // Removed unused capture mode states

  // Web creation mode state - Check for canvas-only flag immediately
  const [isWebCreationMode, setIsWebCreationMode] = useState(() => {
    return sessionStorage.getItem('forceWebCreationMode') === 'true';
  });
  const [webCreationData, setWebCreationData] = useState<AIData | null>(() => {
    // Initialize empty data if in canvas-only mode
    if (sessionStorage.getItem('forceWebCreationMode') === 'true') {
      return {
        document: 'Web Creation Project',
        totalObjects: 0,
        objects: []
      };
    }
    return null;
  });



  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<string | null>(null);



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
    sewingOffset: 5,
    midFoldLine: {
      enabled: false,
      type: 'horizontal' as 'horizontal' | 'vertical',
      direction: 'top' as 'top' | 'bottom' | 'left' | 'right',
      position: {
        useDefault: true,
        customDistance: 0
      },
      padding: 3
    }
  });

  // Region management state
  const [showRegionDialog, setShowRegionDialog] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [showAddRegionDialog, setShowAddRegionDialog] = useState(false);
  const [selectedMotherForRegion, setSelectedMotherForRegion] = useState<AIObject | null>(null);

  // Dialog drag state
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Add region form state
  const [useWholeMother, setUseWholeMother] = useState(false);
  const [newRegionData, setNewRegionData] = useState({
    name: '',
    x: 5,
    y: 5,
    width: 50,
    height: 30
  });

  // Region overlap detection and space calculation
  const checkRegionOverlap = (newRegion: { x: number, y: number, width: number, height: number }, existingRegions: Region[]) => {
    return existingRegions.some(existing => {
      return !(newRegion.x + newRegion.width <= existing.x || // New is left of existing
               newRegion.x >= existing.x + existing.width ||   // New is right of existing
               newRegion.y + newRegion.height <= existing.y || // New is above existing
               newRegion.y >= existing.y + existing.height);   // New is below existing
    });
  };

  const getOverlappingRegions = (newRegion: { x: number, y: number, width: number, height: number }, existingRegions: Region[]) => {
    return existingRegions.filter(existing => {
      return !(newRegion.x + newRegion.width <= existing.x || // New is left of existing
               newRegion.x >= existing.x + existing.width ||   // New is right of existing
               newRegion.y + newRegion.height <= existing.y || // New is above existing
               newRegion.y >= existing.y + existing.height);   // New is below existing
    });
  };

  const suggestNextPosition = (motherWidth: number, motherHeight: number, existingRegions: Region[], desiredWidth: number, desiredHeight: number) => {
    // Try positions from top-left, moving right then down
    const step = 5; // 5mm steps
    for (let y = 5; y <= motherHeight - desiredHeight - 5; y += step) {
      for (let x = 5; x <= motherWidth - desiredWidth - 5; x += step) {
        const testRegion = { x, y, width: desiredWidth, height: desiredHeight };
        if (!checkRegionOverlap(testRegion, existingRegions)) {
          return { x, y };
        }
      }
    }
    return null; // No available space
  };

  const calculateRemainingSpace = (motherWidth: number, motherHeight: number, existingRegions: Region[]) => {
    const totalMotherArea = motherWidth * motherHeight;
    const usedArea = existingRegions.reduce((sum, region) => sum + (region.width * region.height), 0);
    return {
      totalArea: totalMotherArea,
      usedArea: usedArea,
      remainingArea: totalMotherArea - usedArea,
      usagePercentage: Math.round((usedArea / totalMotherArea) * 100)
    };
  };

  const findLargestAvailableRectangle = (motherWidth: number, motherHeight: number, existingRegions: Region[], margins: any) => {
    // Create a grid to mark occupied spaces
    const step = 1; // 1mm precision
    const gridWidth = Math.floor(motherWidth);
    const gridHeight = Math.floor(motherHeight);
    const occupied = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));

    // Mark existing regions as occupied
    existingRegions.forEach(region => {
      for (let y = Math.floor(region.y); y < Math.min(gridHeight, Math.floor(region.y + region.height)); y++) {
        for (let x = Math.floor(region.x); x < Math.min(gridWidth, Math.floor(region.x + region.width)); x++) {
          if (y >= 0 && x >= 0) occupied[y][x] = true;
        }
      }
    });

    // Mark margin areas as occupied
    const marginTop = margins.top || 5;
    const marginLeft = margins.left || 5;
    const marginRight = margins.right || 5;
    const marginBottom = margins.down || margins.bottom || 5;

    // Mark top margin
    for (let y = 0; y < Math.min(gridHeight, marginTop); y++) {
      for (let x = 0; x < gridWidth; x++) {
        occupied[y][x] = true;
      }
    }

    // Mark bottom margin
    for (let y = Math.max(0, gridHeight - marginBottom); y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        occupied[y][x] = true;
      }
    }

    // Mark left margin
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < Math.min(gridWidth, marginLeft); x++) {
        occupied[y][x] = true;
      }
    }

    // Mark right margin
    for (let y = 0; y < gridHeight; y++) {
      for (let x = Math.max(0, gridWidth - marginRight); x < gridWidth; x++) {
        occupied[y][x] = true;
      }
    }

    // Find the largest available rectangle using a simple approach
    let bestRect = { x: marginLeft, y: marginTop, width: 0, height: 0, area: 0 };

    // Try different starting positions
    for (let startY = marginTop; startY < gridHeight - marginBottom; startY++) {
      for (let startX = marginLeft; startX < gridWidth - marginRight; startX++) {
        if (occupied[startY][startX]) continue;

        // Find maximum width from this position
        let maxWidth = 0;
        for (let x = startX; x < gridWidth - marginRight; x++) {
          if (occupied[startY][x]) break;
          maxWidth = x - startX + 1;
        }

        if (maxWidth === 0) continue;

        // Find maximum height for this width
        let maxHeight = 0;
        for (let y = startY; y < gridHeight - marginBottom; y++) {
          let canExtend = true;
          for (let x = startX; x < startX + maxWidth; x++) {
            if (occupied[y][x]) {
              canExtend = false;
              break;
            }
          }
          if (!canExtend) break;
          maxHeight = y - startY + 1;
        }

        const area = maxWidth * maxHeight;
        if (area > bestRect.area && maxWidth >= 10 && maxHeight >= 10) { // Minimum 10mm
          bestRect = {
            x: startX,
            y: startY,
            width: maxWidth,
            height: maxHeight,
            area: area
          };
        }
      }
    }

    return bestRect.area > 0 ? bestRect : null;
  };

  // Enhanced function for mid-fold line aware region creation
  const findAvailableSpaceWithMidFold = (motherWidth: number, motherHeight: number, existingRegions: Region[], margins: any, midFoldLine: any) => {
    console.log('🔍 Analyzing space with mid-fold line:', midFoldLine);

    if (!midFoldLine || !midFoldLine.enabled) {
      // No mid-fold line, use original logic
      return {
        type: 'single',
        regions: [findLargestAvailableRectangle(motherWidth, motherHeight, existingRegions, margins)]
      };
    }

    const padding = midFoldLine.padding || 3;
    const marginTop = margins.top || 5;
    const marginLeft = margins.left || 5;
    const marginRight = margins.right || 5;
    const marginBottom = margins.down || margins.bottom || 5;

    if (midFoldLine.type === 'horizontal') {
      // Calculate Y position of mid-fold line
      let midFoldY;
      if (midFoldLine.position.useDefault) {
        midFoldY = motherHeight / 2;
      } else {
        if (midFoldLine.direction === 'top') {
          midFoldY = midFoldLine.position.customDistance;
        } else { // bottom
          midFoldY = motherHeight - midFoldLine.position.customDistance;
        }
      }

      // Create two separate areas: top and bottom
      const topAreaHeight = midFoldY - padding - marginTop;
      const bottomAreaHeight = motherHeight - midFoldY - padding - marginBottom;

      console.log('📏 Horizontal split:', { midFoldY, topAreaHeight, bottomAreaHeight, padding });

      const regions = [];

      // Top region
      if (topAreaHeight >= 10) { // Minimum 10mm height
        const topRect = findLargestAvailableRectangle(
          motherWidth,
          topAreaHeight + marginTop, // Temporary height for calculation
          existingRegions.filter(r => r.y + r.height <= midFoldY - padding), // Only regions above mid-fold
          { ...margins, down: padding } // Use padding as bottom margin
        );
        if (topRect && topRect.area > 0) {
          regions.push({
            ...topRect,
            name: 'Region_Top',
            id: `region_top_${Date.now()}`
          });
        }
      }

      // Bottom region
      if (bottomAreaHeight >= 10) { // Minimum 10mm height
        const bottomRect = findLargestAvailableRectangle(
          motherWidth,
          bottomAreaHeight + marginBottom, // Temporary height for calculation
          existingRegions
            .filter(r => r.y >= midFoldY + padding) // Only regions below mid-fold
            .map(r => ({ ...r, y: r.y - (midFoldY + padding) })), // Adjust Y coordinates
          { ...margins, top: 0 } // No top margin for bottom area
        );
        if (bottomRect && bottomRect.area > 0) {
          regions.push({
            ...bottomRect,
            y: bottomRect.y + midFoldY + padding, // Adjust Y back to mother coordinates
            name: 'Region_Bottom',
            id: `region_bottom_${Date.now()}`
          });
        }
      }

      return {
        type: 'horizontal_split',
        midFoldY,
        padding,
        regions
      };

    } else if (midFoldLine.type === 'vertical') {
      // Calculate X position of mid-fold line
      let midFoldX;
      if (midFoldLine.position.useDefault) {
        midFoldX = motherWidth / 2;
      } else {
        if (midFoldLine.direction === 'left') {
          midFoldX = midFoldLine.position.customDistance;
        } else { // right
          midFoldX = motherWidth - midFoldLine.position.customDistance;
        }
      }

      // Create two separate areas: left and right
      const leftAreaWidth = midFoldX - padding - marginLeft;
      const rightAreaWidth = motherWidth - midFoldX - padding - marginRight;

      console.log('📏 Vertical split:', { midFoldX, leftAreaWidth, rightAreaWidth, padding });

      const regions = [];

      // Left region
      if (leftAreaWidth >= 10) { // Minimum 10mm width
        const leftRect = findLargestAvailableRectangle(
          leftAreaWidth + marginLeft, // Temporary width for calculation
          motherHeight,
          existingRegions.filter(r => r.x + r.width <= midFoldX - padding), // Only regions left of mid-fold
          { ...margins, right: padding } // Use padding as right margin
        );
        if (leftRect && leftRect.area > 0) {
          regions.push({
            ...leftRect,
            name: 'Region_Left',
            id: `region_left_${Date.now()}`
          });
        }
      }

      // Right region
      if (rightAreaWidth >= 10) { // Minimum 10mm width
        const rightRect = findLargestAvailableRectangle(
          rightAreaWidth + marginRight, // Temporary width for calculation
          motherHeight,
          existingRegions
            .filter(r => r.x >= midFoldX + padding) // Only regions right of mid-fold
            .map(r => ({ ...r, x: r.x - (midFoldX + padding) })), // Adjust X coordinates
          { ...margins, left: 0 } // No left margin for right area
        );
        if (rightRect && rightRect.area > 0) {
          regions.push({
            ...rightRect,
            x: rightRect.x + midFoldX + padding, // Adjust X back to mother coordinates
            name: 'Region_Right',
            id: `region_right_${Date.now()}`
          });
        }
      }

      return {
        type: 'vertical_split',
        midFoldX,
        padding,
        regions
      };
    }

    return { type: 'none', regions: [] };
  };

  // Derived states - show sewing lines and mid-fold lines based on object properties
  const showMarginRectangles = true; // Show margin dotted lines
  const showSewingLines = true; // Always show sewing lines based on object properties

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

  // Check for canvas-only mode flag and force web creation mode
  useEffect(() => {
    const forceWebMode = sessionStorage.getItem('forceWebCreationMode');

    // Enable web creation mode if coming from projects or if explicitly forced
    if (forceWebMode === 'true' || context === 'projects') {
      console.log('🎨 Canvas mode detected - enabling web creation mode');
      setIsWebCreationMode(true);

      // Check if there's a master file ID to load for editing
      const editMasterFileId = sessionStorage.getItem('editMasterFileId');
      if (editMasterFileId) {
        console.log('🔍 Canvas-only mode: Master file ID detected for editing:', editMasterFileId);
        loadMasterFileForEditing(editMasterFileId);
        // Remove the ID from sessionStorage after loading
        sessionStorage.removeItem('editMasterFileId');
      } else {
        // Initialize empty web creation data if none exists and no master file to load
        if (!webCreationData) {
          const emptyData: AIData = {
            document: 'Web Creation Project',
            totalObjects: 0,
            objects: []
          };
          setWebCreationData(emptyData);
        }
      }
    }
  }, [webCreationData]);

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
      // Reset to default view if no objects
      setZoom(1);
      setPanX(0);
      setPanY(0);
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

    // Calculate bounds of all objects
    const bounds = data.objects.reduce((acc, obj) => ({
      minX: Math.min(acc.minX, obj.x),
      minY: Math.min(acc.minY, obj.y),
      maxX: Math.max(acc.maxX, obj.x + obj.width),
      maxY: Math.max(acc.maxY, obj.y + obj.height)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;

    // Ensure minimum content size to avoid division by zero
    const minContentWidth = Math.max(contentWidth, 10);
    const minContentHeight = Math.max(contentHeight, 10);

    const padding = 100; // Padding in pixels
    const mmToPx = 3.78; // Conversion factor

    const scaleX = (viewportWidth - padding) / (minContentWidth * mmToPx);
    const scaleY = (viewportHeight - padding) / (minContentHeight * mmToPx);
    const newZoom = Math.min(scaleX, scaleY, 3); // Max zoom 3x for better fit

    // Ensure minimum zoom level
    const finalZoom = Math.max(newZoom, 0.1);

    console.log('🎯 Fit to Screen:');
    console.log('  Content bounds:', bounds);
    console.log('  Content size:', contentWidth.toFixed(1), 'x', contentHeight.toFixed(1), 'mm');
    console.log('  Viewport size:', viewportWidth.toFixed(0), 'x', viewportHeight.toFixed(0), 'px');
    console.log('  Calculated zoom:', finalZoom.toFixed(2));

    setZoom(finalZoom);

    // Center the content in the viewport
    const centerX = bounds.minX + contentWidth / 2;
    const centerY = bounds.minY + contentHeight / 2;

    setPanX(-(centerX * finalZoom * mmToPx) + viewportWidth / 2);
    setPanY(-(centerY * finalZoom * mmToPx) + viewportHeight / 2);
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

  // Generate SMALL thumbnail SVG (simple - just layout + folder lines)
  const generateSmallThumbnailSVG = (thumbnailSize: { width: number; height: number }): string => {
    if (!data || data.objects.length === 0) {
      // Return empty thumbnail
      return `<svg width="${thumbnailSize.width}" height="${thumbnailSize.height}" viewBox="0 0 ${thumbnailSize.width} ${thumbnailSize.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f5f5f5"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#999" font-size="12">No Content</text>
      </svg>`;
    }

    // Calculate bounds from object coordinates
    const bounds = data.objects.reduce((acc, obj) => ({
      minX: Math.min(acc.minX, obj.x),
      minY: Math.min(acc.minY, obj.y),
      maxX: Math.max(acc.maxX, obj.x + obj.width),
      maxY: Math.max(acc.maxY, obj.y + obj.height)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    // Add padding
    const padding = 10;
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    const totalWidth = contentWidth + (padding * 2);
    const totalHeight = contentHeight + (padding * 2);

    // Calculate scale to fit thumbnail size while maintaining aspect ratio
    const scaleX = thumbnailSize.width / totalWidth;
    const scaleY = thumbnailSize.height / totalHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate final dimensions and centering offset
    const finalWidth = totalWidth * scale;
    const finalHeight = totalHeight * scale;
    const offsetX = (thumbnailSize.width - finalWidth) / 2;
    const offsetY = (thumbnailSize.height - finalHeight) / 2;

    // Generate SVG content with clean professional styling
    let svgContent = `<svg width="${thumbnailSize.width}" height="${thumbnailSize.height}" viewBox="0 0 ${thumbnailSize.width} ${thumbnailSize.height}" xmlns="http://www.w3.org/2000/svg">`;

    // Define subtle drop shadow only (remove grid)
    svgContent += `<defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.1"/>
      </filter>
    </defs>`;

    // Clean white background
    svgContent += `<rect width="100%" height="100%" fill="white"/>`;

    // Create group with transform for scaling and positioning
    svgContent += `<g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">`;
    svgContent += `<g transform="translate(${-bounds.minX + padding}, ${-bounds.minY + padding})">`;

    // Render each object with complete details
    data.objects.forEach(obj => {
      const x = obj.x;
      const y = obj.y;
      const width = obj.width;
      const height = obj.height;

      // Determine object style based on type
      let fillColor = 'none';
      let strokeColor = '#333';
      let strokeWidth = '1';
      let strokeDasharray = 'none';

      if (obj.type === 'mother') {
        fillColor = '#f8f9fa';
        strokeColor = '#2196F3';
        strokeWidth = '2';
      } else if (obj.type?.includes('son')) {
        fillColor = '#fff3e0';
        strokeColor = '#FF9800';
        strokeWidth = '1';
        strokeDasharray = '2,2';
      } else {
        fillColor = '#f5f5f5';
        strokeColor = '#666';
      }

      // Main object rectangle
      svgContent += `<rect x="${x}" y="${y}" width="${width}" height="${height}"
        fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"
        stroke-dasharray="${strokeDasharray}" filter="url(#shadow)"/>`;

      // Small thumbnails - NO folder line for simplicity
      // (Folder line only shown in large detailed view)

      // Small thumbnails: NO margins, keep it simple
    });

    svgContent += `</g></g>`;

    // Add subtle border around entire thumbnail
    svgContent += `<rect x="0.5" y="0.5" width="${thumbnailSize.width - 1}" height="${thumbnailSize.height - 1}"
      fill="none" stroke="#e0e0e0" stroke-width="1"/>`;

    svgContent += `</svg>`;

    console.log('🎨 Generated SMALL thumbnail SVG:', {
      originalBounds: bounds,
      contentSize: { width: contentWidth, height: contentHeight },
      thumbnailSize,
      scale: scale.toFixed(3),
      finalSize: { width: finalWidth.toFixed(1), height: finalHeight.toFixed(1) }
    });

    return svgContent;
  };

  // Generate LARGE thumbnail SVG (detailed - with dimensions, margins, etc.)
  const generateLargeThumbnailSVG = (thumbnailSize: { width: number; height: number }): string => {
    if (!data || data.objects.length === 0) {
      // Return empty thumbnail
      return `<svg width="${thumbnailSize.width}" height="${thumbnailSize.height}" viewBox="0 0 ${thumbnailSize.width} ${thumbnailSize.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f5f5f5"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#999" font-size="16">No Content</text>
      </svg>`;
    }

    // Calculate bounds from object coordinates
    const bounds = data.objects.reduce((acc, obj) => ({
      minX: Math.min(acc.minX, obj.x),
      minY: Math.min(acc.minY, obj.y),
      maxX: Math.max(acc.maxX, obj.x + obj.width),
      maxY: Math.max(acc.maxY, obj.y + obj.height)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    // Add padding
    const padding = 30; // More padding for large view
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    const totalWidth = contentWidth + (padding * 2);
    const totalHeight = contentHeight + (padding * 2);

    // Calculate scale to fit thumbnail size while maintaining aspect ratio
    const scaleX = thumbnailSize.width / totalWidth;
    const scaleY = thumbnailSize.height / totalHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate final dimensions and centering offset
    const finalWidth = totalWidth * scale;
    const finalHeight = totalHeight * scale;
    const offsetX = (thumbnailSize.width - finalWidth) / 2;
    const offsetY = (thumbnailSize.height - finalHeight) / 2;

    // Generate detailed SVG content
    let svgContent = `<svg width="${thumbnailSize.width}" height="${thumbnailSize.height}" viewBox="0 0 ${thumbnailSize.width} ${thumbnailSize.height}" xmlns="http://www.w3.org/2000/svg">`;

    // Define detailed filters and patterns
    svgContent += `<defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>
      </filter>
    </defs>`;

    // Clean white background
    svgContent += `<rect width="100%" height="100%" fill="white"/>`;

    // Create group with transform for scaling and positioning
    svgContent += `<g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">`;
    svgContent += `<g transform="translate(${-bounds.minX + padding}, ${-bounds.minY + padding})">`;

    // Render each object with full details
    data.objects.forEach(obj => {
      const x = obj.x;
      const y = obj.y;
      const width = obj.width;
      const height = obj.height;

      // Determine object style based on type
      let fillColor = 'none';
      let strokeColor = '#333';
      let strokeWidth = '2'; // Thicker for large view
      let strokeDasharray = 'none';

      if (obj.type === 'mother') {
        fillColor = '#f8f9fa';
        strokeColor = '#2196F3';
        strokeWidth = '3';
      } else if (obj.type?.includes('son')) {
        fillColor = '#fff3e0';
        strokeColor = '#FF9800';
        strokeWidth = '2';
        strokeDasharray = '4,4';
      } else {
        fillColor = '#f5f5f5';
        strokeColor = '#666';
      }

      // Main object rectangle with shadow
      svgContent += `<rect x="${x}" y="${y}" width="${width}" height="${height}"
        fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"
        stroke-dasharray="${strokeDasharray}" filter="url(#shadow)"/>`;

      // Add detailed folder line for mother objects
      if (obj.type === 'mother') {
        const folderHeight = Math.min(height * 0.12, 12);
        const folderWidth = Math.min(width * 0.3, 30);

        // Detailed folder tab
        svgContent += `<rect x="${x}" y="${y - folderHeight}" width="${folderWidth}" height="${folderHeight}"
          fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`;
      }

      // Add margins for mother objects (detailed view only)
      if (obj.type === 'mother' && motherConfig && motherConfig.margins) {
        const margins = motherConfig.margins;
        const mmToPx = 1;

        const marginTop = margins.top * mmToPx;
        const marginBottom = margins.down * mmToPx;
        const marginLeft = margins.left * mmToPx;
        const marginRight = margins.right * mmToPx;

        // Draw detailed margin lines
        if (marginTop > 0) {
          svgContent += `<line x1="${x}" y1="${y + marginTop}" x2="${x + width}" y2="${y + marginTop}"
            stroke="#4CAF50" stroke-width="1.0" stroke-dasharray="3,3" opacity="0.8"/>`;
        }
        if (marginBottom > 0) {
          svgContent += `<line x1="${x}" y1="${y + height - marginBottom}" x2="${x + width}" y2="${y + height - marginBottom}"
            stroke="#4CAF50" stroke-width="1.0" stroke-dasharray="3,3" opacity="0.8"/>`;
        }
        if (marginLeft > 0) {
          svgContent += `<line x1="${x + marginLeft}" y1="${y}" x2="${x + marginLeft}" y2="${y + height}"
            stroke="#4CAF50" stroke-width="1.0" stroke-dasharray="3,3" opacity="0.8"/>`;
        }
        if (marginRight > 0) {
          svgContent += `<line x1="${x + width - marginRight}" y1="${y}" x2="${x + width - marginRight}" y2="${y + height}"
            stroke="#4CAF50" stroke-width="1.0" stroke-dasharray="3,3" opacity="0.8"/>`;
        }
      }

      // Enhanced Mid-Fold Line Rendering for Canvas
      if (obj.type === 'mother' && (obj as any).midFoldLine && (obj as any).midFoldLine.enabled) {
        const midFold = (obj as any).midFoldLine;
        const padding = midFold.padding || 3;

        console.log('🎨 Rendering mid-fold line:', midFold);

        if (midFold.type === 'horizontal') {
          // Calculate Y position based on direction and position
          let lineY;
          if (midFold.position.useDefault) {
            lineY = y + height / 2; // Center position
          } else {
            if (midFold.direction === 'top') {
              lineY = y + midFold.position.customDistance;
            } else { // bottom
              lineY = y + height - midFold.position.customDistance;
            }
          }

          // Draw horizontal line with padding
          const lineStartX = x + padding;
          const lineEndX = x + width - padding;
          svgContent += `<line x1="${lineStartX}" y1="${lineY}" x2="${lineEndX}" y2="${lineY}"
            stroke="#d32f2f" stroke-width="2" stroke-dasharray="4,4" opacity="0.9"/>`;

          console.log('✅ Drew horizontal mid-fold line at Y:', lineY);

        } else if (midFold.type === 'vertical') {
          // Calculate X position based on direction and position
          let lineX;
          if (midFold.position.useDefault) {
            lineX = x + width / 2; // Center position
          } else {
            if (midFold.direction === 'left') {
              lineX = x + midFold.position.customDistance;
            } else { // right
              lineX = x + width - midFold.position.customDistance;
            }
          }

          // Draw vertical line with padding
          const lineStartY = y + padding;
          const lineEndY = y + height - padding;
          svgContent += `<line x1="${lineX}" y1="${lineStartY}" x2="${lineX}" y2="${lineEndY}"
            stroke="#d32f2f" stroke-width="2" stroke-dasharray="4,4" opacity="0.9"/>`;

          console.log('✅ Drew vertical mid-fold line at X:', lineX);
        }
      }

      // Add dimensions text for large view
      const fontSize = Math.max(8, Math.min(14, 12 * scale));
      svgContent += `<text x="${x + width/2}" y="${y + height + fontSize + 5}"
        text-anchor="middle" font-size="${fontSize}" fill="#666" font-weight="bold">
        ${width.toFixed(0)}×${height.toFixed(0)}mm
      </text>`;
    });

    svgContent += `</g></g>`;

    // Add border around entire large thumbnail
    svgContent += `<rect x="2" y="2" width="${thumbnailSize.width - 4}" height="${thumbnailSize.height - 4}"
      fill="none" stroke="#ddd" stroke-width="2"/>`;

    svgContent += `</svg>`;

    console.log('🎨 Generated LARGE thumbnail SVG:', {
      originalBounds: bounds,
      contentSize: { width: contentWidth, height: contentHeight },
      thumbnailSize,
      scale: scale.toFixed(3),
      finalSize: { width: finalWidth.toFixed(1), height: finalHeight.toFixed(1) }
    });

    return svgContent;
  };

  // Removed unused convertSVGToPNG function

  // Removed unused generatePerfectThumbnail function

  // Removed unused captureCanvasAsSVG function

  // Removed unused capture preview and mode functions

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

  // Save Master File functions - Prompt user for name
  const saveDirectly = async () => {
    console.log('🔍 Save button clicked - checking conditions...');
    console.log('isWebCreationMode:', isWebCreationMode);
    console.log('data exists:', !!data);
    console.log('objects count:', data?.objects?.length || 0);
    console.log('selectedCustomer:', !!selectedCustomer);
    console.log('isEditMode:', isEditMode);

    if (!isWebCreationMode || !data || data.objects.length === 0) {
      alert('Please create some objects before saving as master file.');
      return;
    }

    if (!selectedCustomer) {
      alert('No customer selected. Please select a customer first.');
      return;
    }

    // Check if we're in edit mode
    if (isEditMode && editingMasterFileId && originalMasterFile) {
      // Perform overwrite save directly without confirmation
      console.log(`🔄 Updating master file: ${originalMasterFile.name} (revision ${originalMasterFile.revisionNumber} → ${originalMasterFile.revisionNumber + 1})`);
      await performOverwriteSave();
    } else {
      console.log('💬 Prompting user for layout name...');

      // Use a more reliable prompt approach
      let layoutName = '';

      // Try multiple times if user enters empty name
      while (true) {
        layoutName = prompt('🏷️ Please enter a name for this layout:', '') || '';

        console.log('User entered name:', layoutName);

        if (layoutName === null || layoutName === '') {
          // User cancelled or entered empty
          const retry = window.confirm('Layout name is required to save. Would you like to try again?');
          if (!retry) {
            console.log('User cancelled save operation');
            return;
          }
          continue; // Ask again
        }

        if (layoutName.trim()) {
          break; // Valid name entered
        }

        alert('Please enter a valid layout name (not just spaces).');
      }

      console.log('Proceeding to save with name:', layoutName.trim());
      // Save with user-provided name
      await performSave(layoutName.trim());
    }
  };

  const performSave = async (fileName: string) => {
    if (!fileName.trim()) {
      console.error('Please enter a master file name.');
      return;
    }

    if (!selectedCustomer) {
      console.error('No customer selected.');
      return;
    }

    if (!data || data.objects.length === 0) {
      console.error('No data to save.');
      return;
    }

    // Show saving state
    setIsSaving(true);

    try {
      // Fit to screen before capturing to ensure optimal view
      console.log('📐 Auto-fitting canvas for optimal capture...');
      handleFitToScreen();

      // Wait a moment for the fit to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      // Generate small thumbnail SVG (simple layout + folder lines)
      const canvasImage = generateSmallThumbnailSVG({ width: 300, height: 200 });
      console.log('📸 Small thumbnail SVG generated');

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
        // Keep saving state visible for at least 1 second, then show success
        setTimeout(() => {
          setIsSaving(false);
          console.log(`✅ Master File Saved Successfully! Name: ${fileName}, Customer: ${selectedCustomer.customerName}, Objects: ${data.objects.length}`);

          // Navigate to master files management immediately
          window.location.href = '/master-files-management';
        }, 1000); // Show saving overlay for at least 1 second
      } else {
        // Hide saving state on error
        setIsSaving(false);
        console.error(`❌ Error saving master file: ${result.error}`);
      }
    } catch (error) {
      // Hide saving state on error
      setIsSaving(false);
      console.error('Error saving master file:', error);
    }
  };

  // Overwrite Save Function for Edit Mode
  const performOverwriteSave = async () => {
    if (!editingMasterFileId || !originalMasterFile || !data) {
      console.error('❌ Error: Missing edit mode data.');
      return;
    }

    // Show saving state
    setIsSaving(true);

    try {
      // Fit to screen before capturing to ensure optimal view
      console.log('📐 Auto-fitting canvas for optimal capture...');
      handleFitToScreen();

      // Wait a moment for the fit to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      // Generate small thumbnail SVG (simple layout + folder lines)
      const canvasImage = generateSmallThumbnailSVG({ width: 300, height: 200 });
      console.log('📸 Small thumbnail SVG generated');

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
        // Keep saving state visible for at least 1 second, then show success
        setTimeout(() => {
          setIsSaving(false);
          const newRevision = originalMasterFile.revisionNumber + 1;
          console.log(`✅ Master File Updated Successfully! Name: ${originalMasterFile.name}, Revision: ${newRevision}, Objects: ${data.objects.length}`);

          // Navigate back to Master Files Management immediately
          window.location.href = '/master-files-management';
        }, 1000); // Show saving overlay for at least 1 second
      } else {
        // Hide saving state on error
        setIsSaving(false);
        console.error(`❌ Error updating master file: ${result.error}`);
      }
    } catch (error) {
      // Hide saving state on error
      setIsSaving(false);
      console.error('Error updating master file:', error);
    }
  };

  // Master File Loading Functions
  const loadMasterFileForEditing = async (masterFileId: string) => {
    try {
      console.log('🔄 Loading master file for editing:', masterFileId);
      setIsLoadingMasterFile(true);

      // Fetch master file from database
      const result = await masterFileService.getMasterFileById(masterFileId);

      if (!result.success || !result.data) {
        console.error(`❌ Error loading master file: ${result.error || 'Master file not found'}`);
        return;
      }

      const masterFile = result.data;
      console.log('✅ Master file loaded:', masterFile);

      // Check if master file has design data
      if (!masterFile.designData || !masterFile.designData.objects) {
        console.error('❌ This master file has no design data to edit.');
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

      // Log success message instead of showing popup
      console.log(`✅ Master File Loaded Successfully! Name: ${masterFile.name}, Objects: ${masterFile.designData.objects.length}, Dimensions: ${masterFile.width} × ${masterFile.height} mm`);

    } catch (error) {
      console.error('❌ Error loading master file:', error);
    } finally {
      setIsLoadingMasterFile(false);
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
      sewingOffset: 5,
      midFoldLine: {
        enabled: false,
        type: 'horizontal',
        direction: 'top',
        position: {
          useDefault: true,
          customDistance: 0
        },
        padding: 3
      }
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
    const storedMidFoldLine = (mother as any).midFoldLine || {
      enabled: false,
      type: 'horizontal',
      direction: 'top',
      position: {
        useDefault: true,
        customDistance: 0
      },
      padding: 3
    };

    setMotherConfig({
      width: mother.width,
      height: mother.height,
      margins: storedMargins,
      sewingPosition: storedSewingPosition,
      sewingOffset: storedSewingOffset,
      midFoldLine: storedMidFoldLine
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
      console.error('❌ Invalid dimensions! Please enter valid width and height values greater than 0.');
      return;
    }

    if (motherConfig.width > 1000 || motherConfig.height > 1000) {
      console.error('❌ Dimensions too large! Please enter dimensions smaller than 1000mm for both width and height.');
      return;
    }

    if (isEditingMother && editingMotherId) {
      // Update existing mother
      console.log('🎯 Mid-fold line config being saved:', motherConfig.midFoldLine);

      const updatedObjects = currentData.objects.map(obj => {
        if (obj.name === editingMotherId && obj.type === 'mother') {
          const updatedObj = {
            ...obj,
            width: motherConfig.width,
            height: motherConfig.height,
            // Store additional properties (margins, sewing position, mid fold line) as metadata
            margins: motherConfig.margins,
            sewingPosition: motherConfig.sewingPosition,
            sewingOffset: motherConfig.sewingOffset,
            midFoldLine: motherConfig.midFoldLine
          } as any;

          console.log('✅ Updated mother object with mid-fold:', updatedObj);
          return updatedObj;
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
        sewingOffset: motherConfig.sewingOffset,
        midFoldLine: motherConfig.midFoldLine,
        regions: [] // Initialize with empty regions array
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
    }

    setShowMotherDialog(false); // Close dialog

    setIsEditingMother(false);
    setEditingMotherId(null);
  };

  // Sewing position functions
  const handleSewingPositionClick = (position: 'top' | 'left' | 'right' | 'bottom' | 'mid-fold') => {
    setSelectedSewingPosition(position);

    // Mid-fold is now handled separately - don't set sewingPosition to mid-fold
    if (position === 'mid-fold') {
      // Enable mid-fold line instead of setting sewing position
      setMotherConfig(prev => ({
        ...prev,
        midFoldLine: {
          ...prev.midFoldLine,
          enabled: true
        }
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
      // Extract mother number from name (e.g., "Mother_1" -> "1")
      const motherNum = mother.name?.match(/Mother_(\d+)/)?.[1];
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

  const handleAddSonObject = (motherObject: AIObject) => {
    console.log('🔥 ADD SON BUTTON CLICKED! Mother:', motherObject.name);
    console.log('🔍 Mother type:', motherObject.type);

    // Extract mother number from name (e.g., "Mother_1" -> "1")
    const motherNum = motherObject.name?.match(/Mother_(\d+)/)?.[1];
    console.log('🔢 Extracted mother number from name:', motherNum);
    if (!motherNum) {
      console.error('❌ Could not extract mother number from name:', motherObject.name);
      return;
    }

    const currentData = data || webCreationData;
    console.log('📊 Current data:', currentData);
    if (!currentData) {
      console.error('❌ No current data available');
      return;
    }

    // Find existing sons for this mother to determine next son number
    const existingSons = currentData.objects.filter(obj =>
      obj.type?.includes('son') && obj.type?.includes(`son ${motherNum}-`)
    );
    const nextSonNumber = existingSons.length + 1;

    // Create new son object directly
    const newSon: AIObject = {
      name: `son_${motherNum}_${nextSonNumber}`,
      typename: 'TextFrame',
      type: `son ${motherNum}-${nextSonNumber}`,
      x: motherObject.x + 5, // Offset from mother's position
      y: motherObject.y + 5,
      width: Math.max(20, motherObject.width - 10), // Smaller than mother
      height: Math.max(10, motherObject.height - 10)
    };

    // Create comprehensive son metadata with all text formatting attributes
    const sonMetadataObj: SonMetadata = {
      id: `${newSon.name}_${newSon.x}_${newSon.y}`,
      sonType: 'text',
      content: 'New Text Content',
      details: {
        fontFamily: 'Arial',
        fontSize: 12,
        textAlign: 'left' as const,
        fontWeight: 'normal' as const,
        textOverflow: 'resize' as const,
        lineBreakType: 'word' as const,
        characterConnector: ''
      },
      fontFamily: 'Arial',
      fontSize: 12,
      textAlign: 'left' as const,
      fontWeight: 'normal' as const,
      textOverflow: 'resize' as const,
      lineBreakType: 'word' as const,
      characterConnector: '',
      margins: {
        top: 2,
        bottom: 2,
        left: 2,
        right: 2
      },
      spaceAllocation: {
        region: 'content',
        rowHeight: 10,
        columns: 1,
        selectedColumn: 1,
        allocated: false
      }
    };

    // Add the new son to the current data
    const updatedObjects = [...currentData.objects, newSon];
    const updatedData = {
      ...currentData,
      objects: updatedObjects,
      totalObjects: updatedObjects.length
    };

    // Update the appropriate data state
    console.log('💾 Updating data state...');
    if (data) {
      console.log('📝 Updating data state');
      setData(updatedData);
    } else {
      console.log('🌐 Updating webCreationData state');
      setWebCreationData(updatedData);
    }

    // Add son metadata
    console.log('📋 Adding son metadata...');
    setSonMetadata(prev => {
      const newMap = new Map(prev);
      newMap.set(`${newSon.name}_${newSon.x}_${newSon.y}`, sonMetadataObj);
      console.log('📋 Son metadata added:', sonMetadataObj);
      return newMap;
    });

    // Select the new son object to show its properties
    console.log('🎯 Selecting new son object...');
    setSelectedObject(newSon);

    // Force re-render by updating expanded mothers
    console.log('📂 Expanding mother in hierarchy...');
    setExpandedMothers(prev => {
      const motherIndex = currentData.objects.findIndex(obj => obj.name === motherObject.name);
      console.log('👩 Mother index:', motherIndex);
      const newSet = new Set(prev);
      newSet.add(motherIndex);
      console.log('📂 Expanded mothers:', Array.from(newSet));
      return newSet;
    });

    console.log('✅ Created new son object directly:', newSon);

    // Show success notification
    console.log('🔔 Showing notification...');
    setNotification(`✅ Created ${newSon.name} in ${motherObject.name}`);
    setTimeout(() => setNotification(null), 3000); // Hide after 3 seconds
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
    const currentData = data || webCreationData;
    if (!currentData) return null;

    const { mothers, orphans } = buildHierarchy(currentData.objects);

    return (
      <div>
        <h4>📋 Objects Hierarchy:</h4>

        {/* Mothers with their sons */}
        {mothers.map((mother, index) => {
          const isExpanded = expandedMothers.has(index);

          return (
            <div key={index} style={{marginBottom: '15px'}}>
              {/* Add Son Button - Only show in project mode, not master file mode */}
              {isProjectMode && (
                <div style={{ marginBottom: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddSonObject(mother.object);
                    }}
                    style={{
                      background: '#4CAF50',
                      border: '2px solid #45a049',
                      color: 'white',
                      fontSize: '14px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      zIndex: 10,
                      position: 'relative'
                    }}
                    title="Add son object to this mother"
                  >
                    ➕ Add Son
                  </button>
                </div>
              )}

              {/* Mother Header */}
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
                    {/* Edit Button - Only show in web creation mode AND not in project context */}
                    {isWebCreationMode && context !== 'projects' && (
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

                    {/* Add Son Object Button - Only show in project mode */}
                    {isProjectMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObject(mother.object);
                          // Open son object creation dialog for this mother
                          handleAddSonObject(mother.object);
                        }}
                        style={{
                          background: '#4CAF50',
                          border: '1px solid #45a049',
                          color: 'white',
                          fontSize: '10px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                        title="Add son object to this mother"
                      >
                        ➕ Add Son
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

                    {/* Save Button - Only show in web creation mode when mother objects exist AND not in project context */}
                    {isWebCreationMode && hasMotherObjects() && context !== 'projects' && (
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

              {/* Regions (always visible in master file mode) */}
              {isMasterFileMode && (() => {
                const motherRegions = (mother.object as any).regions || [];
                return motherRegions.map((region: Region, regionIndex: number) => (
                  <div
                    key={region.id}
                    style={{
                      margin: '4px 0 4px 20px', // Always indented under mother
                      background: '#e3f2fd',
                      color: '#1976d2',
                      borderRadius: '6px',
                      borderLeft: '3px solid #2196f3',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedObject(mother.object);
                        setEditingRegion(region);
                        setDialogPosition({ x: 0, y: 0 }); // Reset dialog position
                        setShowRegionDialog(true);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>🏗️</span>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                            {region.name}
                          </div>
                          <div style={{ fontSize: '10px', opacity: 0.8 }}>
                            {region.width}×{region.height}mm at ({region.x},{region.y})
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRegion(region);
                            setDialogPosition({ x: 0, y: 0 }); // Reset dialog position
                            setShowRegionDialog(true);
                          }}
                          style={{
                            background: '#4caf50',
                            border: 'none',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                          title="Edit region"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Delete region
                            const currentData = data || webCreationData;
                            if (currentData) {
                              const updatedObjects = currentData.objects.map(obj => {
                                if (obj.name === mother.object.name) {
                                  const updatedRegions = motherRegions.filter((r: Region) => r.id !== region.id);
                                  return {
                                    ...obj,
                                    regions: updatedRegions
                                  };
                                }
                                return obj;
                              });

                              const updatedData = {
                                ...currentData,
                                objects: updatedObjects
                              };

                              setData(updatedData);
                              setWebCreationData(updatedData);
                            }
                          }}
                          style={{
                            background: '#f44336',
                            border: 'none',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                          title="Delete region"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ));
              })()}

              {/* Add Region Button - Only show if remaining space is available */}
              {isMasterFileMode && (() => {
                const motherRegions = (mother.object as any).regions || [];
                const motherMargins = (mother.object as any).margins || { top: 5, left: 5, right: 5, down: 5 };

                // Check if there's any significant remaining space (at least 100mm²)
                const spaceInfo = calculateRemainingSpace(mother.object.width, mother.object.height, motherRegions);
                const hasSignificantSpace = spaceInfo.remainingArea >= 100; // At least 10×10mm

                // Also check if we can find a rectangle of at least 10×10mm
                const largestRect = findLargestAvailableRectangle(
                  mother.object.width,
                  mother.object.height,
                  motherRegions,
                  motherMargins
                );

                return hasSignificantSpace && largestRect && largestRect.width >= 10 && largestRect.height >= 10;
              })() && (
                <div style={{ margin: '8px 0 8px 0' }}>
                  <button
                    onClick={() => {
                      setSelectedMotherForRegion(mother.object);
                      const motherRegions = (mother.object as any).regions || [];

                      // Smart default sizing and positioning
                      const defaultWidth = Math.max(10, Math.min(30, mother.object.width - 10));
                      const defaultHeight = Math.max(10, Math.min(20, mother.object.height - 10));

                      // Try to suggest a good starting position
                      const suggestedPos = suggestNextPosition(
                        mother.object.width,
                        mother.object.height,
                        motherRegions,
                        defaultWidth,
                        defaultHeight
                      );

                      setNewRegionData({
                        name: `Region ${motherRegions.length + 1}`,
                        x: suggestedPos?.x || 5,
                        y: suggestedPos?.y || 5,
                        width: defaultWidth,
                        height: defaultHeight
                      });
                      setUseWholeMother(false);
                      setDialogPosition({ x: 0, y: 0 });
                      setShowAddRegionDialog(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                      border: 'none',
                      color: 'white',
                      fontSize: '11px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(33, 150, 243, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 3px 8px rgba(33, 150, 243, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(33, 150, 243, 0.3)';
                    }}
                    title={`Add region to ${mother.object.name}`}
                  >
                    ➕ Add Region to {mother.object.name}
                  </button>
                </div>
              )}

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
          console.error('Invalid JSON file:', error);
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
                  strokeWidth="0.33"
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
                  strokeWidth="0.33"
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
                  strokeWidth="0.33"
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
              // Use the actual object's margins, not the global config
              const objectMargins = (obj as any).margins || motherConfig.margins;
              const mmToPx = 3.78;
              const scale = zoom * mmToPx;
              const topMarginPx = objectMargins.top * scale;
              const bottomMarginPx = (objectMargins.down || objectMargins.bottom) * scale;
              const leftMarginPx = objectMargins.left * scale;
              const rightMarginPx = objectMargins.right * scale;

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
                    strokeWidth="1.0"
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
                    {objectMargins.top}mm
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
                    {objectMargins.down || objectMargins.bottom}mm
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
                    {objectMargins.left}mm
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
                    {objectMargins.right}mm
                  </text>
                </>
              );
            })()}

            {/* Region Visualization */}
            {(() => {
              const objectRegions = (obj as any).regions || [];
              if (objectRegions.length === 0) return null;

              const mmToPx = 3.78;
              const scale = zoom * mmToPx;

              return objectRegions.map((region: Region) => (
                <g key={region.id}>
                  {/* Region Rectangle */}
                  <rect
                    x={baseX + (region.x * scale)}
                    y={baseY + (region.y * scale)}
                    width={region.width * scale}
                    height={region.height * scale}
                    fill={region.backgroundColor}
                    stroke={region.borderColor}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.7"
                  />

                  {/* Region Label */}
                  <text
                    x={baseX + (region.x * scale) + (region.width * scale) / 2}
                    y={baseY + (region.y * scale) + 15}
                    fill={region.borderColor}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.9"
                  >
                    {region.name}
                  </text>

                  {/* Region Dimensions */}
                  <text
                    x={baseX + (region.x * scale) + (region.width * scale) / 2}
                    y={baseY + (region.y * scale) + (region.height * scale) - 5}
                    fill={region.borderColor}
                    fontSize="8"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.7"
                  >
                    {region.width}×{region.height}mm
                  </text>
                </g>
              ));
            })()}

            {/* Sewing Lines with Dimensions */}
            {showSewingLines && (() => {
              // Check if mid-fold line is enabled - if so, don't show sewing lines
              const objectMidFoldLine = (obj as any).midFoldLine;
              if (objectMidFoldLine && objectMidFoldLine.enabled) {
                console.log('🚫 Skipping sewing lines - mid-fold line is enabled');
                return null;
              }

              // Use the actual object's sewing position, not the global config
              const objectSewingPosition = (obj as any).sewingPosition || motherConfig.sewingPosition;
              const objectSewingOffset = (obj as any).sewingOffset || motherConfig.sewingOffset;

              if (!objectSewingPosition) return null;

              console.log('🧵 Rendering sewing lines for position:', objectSewingPosition);

              // Always show sewing lines based on object's sewing position
              // No filtering needed - each object shows its own sewing type

              // Use the same scale as the object rendering
              const mmToPx = 3.78;
              const scale = zoom * mmToPx;
              const offset = objectSewingOffset * scale;
              const sewingFontSize = Math.max(8, Math.min(12, 10 * zoom));

              switch (objectSewingPosition) {
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
                          {objectSewingOffset}mm
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
                          {objectSewingOffset}mm
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
                          {objectSewingOffset}mm
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
                          {objectSewingOffset}mm
                        </text>
                      </>
                    );
                  // 'mid-fold' case removed - now handled by enhanced mid-fold line system below
                  default:
                    return null;
                }
              })()
            }

            {/* Mid-Fold Line Rendering (New Enhanced System) */}
            {obj.type?.includes('mother') && (() => {
              const objectMidFoldLine = (obj as any).midFoldLine;
              if (!objectMidFoldLine || !objectMidFoldLine.enabled) {
                return null;
              }

              console.log('🎨 Rendering mid-fold line on canvas:', objectMidFoldLine);

              const midFold = objectMidFoldLine;
              const padding = midFold.padding || 3;
              const mmToPx = 3.78;
              const scale = zoom * mmToPx;
              const paddingPx = padding * scale;

              if (midFold.type === 'horizontal') {
                // Calculate Y position based on direction and position
                let lineY;
                if (midFold.position.useDefault) {
                  lineY = baseY + height / 2; // Center position
                } else {
                  if (midFold.direction === 'top') {
                    lineY = baseY + (midFold.position.customDistance * scale);
                  } else { // bottom
                    lineY = baseY + height - (midFold.position.customDistance * scale);
                  }
                }

                // Draw horizontal line with padding
                const lineStartX = baseX + paddingPx;
                const lineEndX = baseX + width - paddingPx;

                return (
                  <>
                    <line
                      x1={lineStartX}
                      y1={lineY}
                      x2={lineEndX}
                      y2={lineY}
                      stroke="#d32f2f"
                      strokeWidth="3"
                      strokeDasharray="4,4"
                      opacity="0.9"
                    />
                    <text
                      x={lineEndX + 5}
                      y={lineY}
                      fill="#d32f2f"
                      fontSize={Math.max(8, Math.min(12, 10 * zoom))}
                      fontWeight="bold"
                      textAnchor="start"
                      dominantBaseline="middle"
                      opacity="0.9"
                    >
                      Mid-Fold H
                    </text>
                  </>
                );

              } else if (midFold.type === 'vertical') {
                // Calculate X position based on direction and position
                let lineX;
                if (midFold.position.useDefault) {
                  lineX = baseX + width / 2; // Center position
                } else {
                  if (midFold.direction === 'left') {
                    lineX = baseX + (midFold.position.customDistance * scale);
                  } else { // right
                    lineX = baseX + width - (midFold.position.customDistance * scale);
                  }
                }

                // Draw vertical line with padding
                const lineStartY = baseY + paddingPx;
                const lineEndY = baseY + height - paddingPx;

                return (
                  <>
                    <line
                      x1={lineX}
                      y1={lineStartY}
                      x2={lineX}
                      y2={lineEndY}
                      stroke="#d32f2f"
                      strokeWidth="3"
                      strokeDasharray="4,4"
                      opacity="0.9"
                    />
                    <text
                      x={lineX}
                      y={baseY - 5}
                      fill="#d32f2f"
                      fontSize={Math.max(8, Math.min(12, 10 * zoom))}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="bottom"
                      opacity="0.9"
                    >
                      Mid-Fold V
                    </text>
                  </>
                );
              }

              return null;
            })()}
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
                    strokeWidth="0.67"
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
      background: '#f5f5f5',
      pointerEvents: isLoadingMasterFile ? 'none' : 'auto',
      opacity: isLoadingMasterFile ? 0.6 : 1,
      transition: 'opacity 0.3s ease'
    }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Master File Loading Overlay */}
      {isLoadingMasterFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10002,
          pointerEvents: 'all'
        }}>
          {/* Loading Spinner */}
          <div style={{
            width: '80px',
            height: '80px',
            border: '7px solid #f3f3f3',
            borderTop: '7px solid #2196F3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '35px'
          }}></div>

          {/* Loading Text */}
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '18px'
          }}>
            Loading Canvas...
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: '20px',
            color: '#666'
          }}>
            Preparing your care label design for editing
          </div>

          {/* CSS Animation */}
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
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
            previousPagePath={
              context === 'projects' && projectSlug
                ? `/projects/${projectSlug}`
                : isEditMode
                  ? "/master-files-management"
                  : "/coordinate-viewer"
            }
            previousPageLabel={
              context === 'projects' && projectName
                ? `Project: ${decodeURIComponent(projectName)}`
                : isEditMode
                  ? "Master Files Management"
                  : "Create Method"
            }
            showMasterFilesButton={context !== 'projects'}
            showPreviousButton={true}
          />

          {/* Customer Info Header */}
          <div style={{
            background: '#2d3748',
            color: 'white',
            padding: '12px 20px',
            borderBottom: '1px solid #4a5568'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                🏷️ Care Label Designer - {selectedCustomer.customerName}
                {originalMasterFile && (
                  <span style={{ color: '#81c784', marginLeft: '10px' }}>
                    • Editing: {originalMasterFile.name}
                  </span>
                )}
              </h3>
              <span style={{
                fontSize: '12px',
                color: '#a0aec0',
                background: 'rgba(255,255,255,0.1)',
                padding: '3px 6px',
                borderRadius: '3px',
                border: '1px solid rgba(255,255,255,0.2)',
                fontFamily: 'monospace',
                fontWeight: '500'
              }}>
                v{packageJson.version}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#a0aec0' }}>
              Contact: {selectedCustomer.person} • {selectedCustomer.email}
              {originalMasterFile && (
                <span style={{ marginLeft: '10px', color: '#90caf9' }}>
                  • Master File ID: {originalMasterFile.id}
                </span>
              )}
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
        {/* Canvas Area - Dynamic width based on web creation mode */}
        <div style={{
          width: isWebCreationMode ? '70%' : '100%',
          background: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: isWebCreationMode ? '1px solid #ddd' : 'none'
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
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '5px'
                }}>
                  <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
                  <span style={{
                    fontSize: '10px',
                    color: '#666',
                    fontFamily: 'monospace',
                    fontWeight: 'normal'
                  }}>
                    v{packageJson.version}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={handleZoomIn} style={buttonStyle}>+</button>
                  <button onClick={handleZoomOut} style={buttonStyle}>-</button>
                  <button onClick={handleZoomReset} style={buttonStyle}>1:1</button>
                  <button onClick={handleFitToScreen} style={buttonStyle}>Fit</button>
                </div>
                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                  <button
                    onClick={handleFitToScreen}
                    style={{
                      ...buttonStyle,
                      background: '#4CAF50',
                      color: 'white',
                      fontSize: '10px',
                      padding: '6px 8px',
                      fontWeight: 'bold'
                    }}
                    title="Fit content to screen for optimal capture"
                  >
                    📐 Fit for Save
                  </button>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#2d3748',
                    margin: 0
                  }}>
                    🏷️ Care Label Layout System
                  </h2>
                  <span style={{
                    fontSize: '14px',
                    color: '#a0aec0',
                    background: '#f7fafc',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                    fontFamily: 'monospace',
                    fontWeight: '500'
                  }}>
                    v{packageJson.version}
                  </span>
                </div>
                <p style={{
                  fontSize: '16px',
                  color: '#718096',
                  margin: '12px 0 0 0'
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

        {/* Hierarchy Panel - 30% - Show in web creation mode or project context */}
        {(isWebCreationMode || context === 'projects') && (
          <div style={{
            width: '30%',
            background: 'white',
            padding: '20px',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {/* Disabled Overlay when dialogs are open */}
            {(showRegionDialog || showAddRegionDialog) && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{
                  fontSize: '24px',
                  opacity: 0.6
                }}>
                  🔒
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  Hierarchy Locked
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  textAlign: 'center'
                }}>
                  Close region dialog to continue
                </div>
              </div>
            )}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
            <h3 style={{margin: 0}}>
              {isMasterFileMode ? '📋 Master File Template' : isProjectMode ? '🏗️ Project Mode' : '📋 Layer Objects'} {(data || webCreationData) ? (() => {
                const currentData = data || webCreationData;
                if (currentData) {
                  const { mothers } = buildHierarchy(currentData.objects);
                  return `(${mothers.length} Mothers, ${currentData.totalObjects} Objects)`;
                }
                return '';
              })() : ''}
            </h3>

            {/* DEBUG: Test Add Son Button */}
            {isProjectMode && (data || webCreationData) && (
              <button
                onClick={() => {
                  console.log('🧪 TEST BUTTON CLICKED');
                  const currentData = data || webCreationData;
                  const mothers = currentData?.objects.filter(obj => obj.type?.includes('mother'));
                  if (mothers && mothers.length > 0) {
                    handleAddSonObject(mothers[0]);
                  } else {
                    console.log('❌ No mothers found for test');
                  }
                }}
                style={{
                  background: '#FF5722',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginLeft: '10px'
                }}
              >
                🧪 TEST Add Son
              </button>
            )}
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
                <div style={{fontSize: '2rem', marginBottom: '10px'}}>
                  {isMasterFileMode ? '📋' : '🏗️'}
                </div>
                <h4 style={{margin: '0 0 10px 0', color: '#2e7d32'}}>
                  {originalMasterFile ? 'Editing Master File' :
                   isMasterFileMode ? 'Master File Template Creation' :
                   isProjectMode ? 'Project Creation Mode' : 'Web Creation Mode'}
                </h4>
                {originalMasterFile && (
                  <div style={{
                    background: '#e3f2fd',
                    border: '1px solid #2196f3',
                    borderRadius: '6px',
                    padding: '12px',
                    margin: '0 0 15px 0',
                    textAlign: 'left'
                  }}>
                    <div style={{fontSize: '14px', fontWeight: 'bold', color: '#1976d2', marginBottom: '4px'}}>
                      📄 {originalMasterFile.name}
                    </div>
                    <div style={{fontSize: '12px', color: '#666'}}>
                      ID: {originalMasterFile.id}
                    </div>
                    {originalMasterFile.description && (
                      <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                        {originalMasterFile.description}
                      </div>
                    )}
                  </div>
                )}
                <p style={{color: '#666', fontSize: '14px', margin: '0 0 20px 0'}}>
                  {originalMasterFile ? 'Modify the existing design and save changes' :
                   isMasterFileMode
                    ? 'Create a mother template that can be reused in multiple projects'
                    : 'Start by creating your first mother object'
                  }
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
                  {isMasterFileMode ? '📋 Create Mother Template' : '👩 Create Mother'}
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
        )}

      </div>

      {/* Mother Creation Dialog */}
      {showMotherDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)', // More transparent to allow canvas interaction
          zIndex: 10000,
          pointerEvents: 'none' // Allow clicks to pass through to canvas
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            e.preventDefault(); // Prevent text selection during drag
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            setDialogPosition({ x: newX, y: newY });
          }
        }}
        onMouseUp={() => {
          setIsDragging(false);
        }}
        >
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            minWidth: '500px',
            maxWidth: '600px',
            position: 'absolute',
            left: `calc(50% + ${dialogPosition.x}px)`,
            top: `calc(50% + ${dialogPosition.y}px)`,
            transform: 'translate(-50%, -50%)',
            cursor: isDragging ? 'grabbing' : 'default',
            pointerEvents: 'auto' // Re-enable pointer events for the dialog itself
          }}>
            {/* Draggable Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '12px 12px 0 0',
                cursor: 'grab',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseDown={(e) => {
                setIsDragging(true);
                setDragStart({
                  x: e.clientX - dialogPosition.x,
                  y: e.clientY - dialogPosition.y
                });
              }}
            >
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {isEditingMother ? '✏️ Edit Mother Object' : isMasterFileMode ? '📋 Create Mother Template' : '👩 Create Mother Object'}
              </h2>
              <div style={{
                fontSize: '12px',
                opacity: 0.8,
                fontStyle: 'italic'
              }}>
                Drag to move
              </div>
            </div>

            {/* Dialog Content */}
            <div style={{ padding: '30px' }}>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>
                📏 Dimensions (mm)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'end' }}>
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

                {/* Exchange Icon */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'end', height: '100%' }}>
                  <button
                    onClick={() => {
                      const currentWidth = motherConfig.width;
                      const currentHeight = motherConfig.height;
                      setMotherConfig(prev => ({
                        ...prev,
                        width: currentHeight,
                        height: currentWidth
                      }));
                    }}
                    style={{
                      background: '#f0f0f0',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e0e0e0';
                      e.currentTarget.style.borderColor = '#4CAF50';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f0f0f0';
                      e.currentTarget.style.borderColor = '#ddd';
                    }}
                    title="Exchange width and height values"
                  >
                    🔄
                  </button>
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

              {/* Top and Down margins */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '20px' }}>
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
              </div>

              {/* Left and Right margins */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
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

            {/* Sewing Type Selection */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>
                🧵 Sewing Type
              </h3>

              {/* Toggle Switch */}
              <div style={{
                display: 'flex',
                background: '#f5f5f5',
                borderRadius: '20px',
                padding: '4px',
                marginBottom: '20px'
              }}>
                {/* Sewing Position Button */}
                <button
                  onClick={() => {
                    // Reset to default sewing position when switching to sewing mode
                    setMotherConfig(prev => ({
                      ...prev,
                      sewingPosition: 'top',
                      sewingOffset: 5,
                      midFoldLine: {
                        ...prev.midFoldLine,
                        enabled: false
                      }
                    }));
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 15px',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    background: !motherConfig.midFoldLine.enabled ? '#4CAF50' : 'transparent',
                    color: !motherConfig.midFoldLine.enabled ? 'white' : '#666'
                  }}
                >
                  🧵 Sewing Position
                </button>

                {/* Mid Fold Line Button */}
                <button
                  onClick={() => {
                    setMotherConfig(prev => ({
                      ...prev,
                      midFoldLine: {
                        ...prev.midFoldLine,
                        enabled: true
                      }
                    }));
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 15px',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    background: motherConfig.midFoldLine.enabled ? '#FF5722' : 'transparent',
                    color: motherConfig.midFoldLine.enabled ? 'white' : '#666'
                  }}
                >
                  📏 Mid Fold Line
                </button>
              </div>

              {/* Conditional Content Based on Selection */}
              {motherConfig.midFoldLine.enabled ? (
                /* Enhanced Mid-Fold Line Configuration */
                <div style={{
                  padding: '20px',
                  background: '#fff3e0',
                  border: '2px solid #FF5722',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FF5722', marginBottom: '15px', textAlign: 'center' }}>
                    📏 Mid-Fold Line Configuration
                  </div>

                  {/* Step 1: Fold Type Selection */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px', display: 'block' }}>
                      1. Fold Type:
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setMotherConfig(prev => ({
                          ...prev,
                          midFoldLine: {
                            ...prev.midFoldLine,
                            type: 'horizontal',
                            direction: 'top'
                          }
                        }))}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: `2px solid ${motherConfig.midFoldLine.type === 'horizontal' ? '#FF5722' : '#ddd'}`,
                          borderRadius: '6px',
                          background: motherConfig.midFoldLine.type === 'horizontal' ? '#fff3e0' : 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        ↕️ Horizontal
                      </button>
                      <button
                        onClick={() => setMotherConfig(prev => ({
                          ...prev,
                          midFoldLine: {
                            ...prev.midFoldLine,
                            type: 'vertical',
                            direction: 'left'
                          }
                        }))}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: `2px solid ${motherConfig.midFoldLine.type === 'vertical' ? '#FF5722' : '#ddd'}`,
                          borderRadius: '6px',
                          background: motherConfig.midFoldLine.type === 'vertical' ? '#fff3e0' : 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        ↔️ Vertical
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Position Method (Default: Checked) */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px', display: 'block' }}>
                      2. Position:
                    </label>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={motherConfig.midFoldLine.position.useDefault}
                          onChange={(e) => setMotherConfig(prev => ({
                            ...prev,
                            midFoldLine: {
                              ...prev.midFoldLine,
                              position: {
                                ...prev.midFoldLine.position,
                                useDefault: e.target.checked
                              }
                            }
                          }))}
                        />
                        ✅ Use center (50/50 split)
                      </label>
                    </div>
                  </div>

                  {/* Step 3: Direction & Distance (Only when 50/50 is unchecked) */}
                  {!motherConfig.midFoldLine.position.useDefault && (
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px', display: 'block' }}>
                        3. Distance from:
                      </label>

                      {motherConfig.midFoldLine.type === 'horizontal' ? (
                        /* Horizontal: Distance from Top or Bottom */
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            onClick={() => setMotherConfig(prev => ({
                              ...prev,
                              midFoldLine: {
                                ...prev.midFoldLine,
                                direction: 'top'
                              }
                            }))}
                            style={{
                              padding: '6px 12px',
                              border: `2px solid ${motherConfig.midFoldLine.direction === 'top' ? '#FF5722' : '#ddd'}`,
                              borderRadius: '4px',
                              background: motherConfig.midFoldLine.direction === 'top' ? '#fff3e0' : 'white',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Top
                          </button>
                          <button
                            onClick={() => setMotherConfig(prev => ({
                              ...prev,
                              midFoldLine: {
                                ...prev.midFoldLine,
                                direction: 'bottom'
                              }
                            }))}
                            style={{
                              padding: '6px 12px',
                              border: `2px solid ${motherConfig.midFoldLine.direction === 'bottom' ? '#FF5722' : '#ddd'}`,
                              borderRadius: '4px',
                              background: motherConfig.midFoldLine.direction === 'bottom' ? '#fff3e0' : 'white',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Bottom
                          </button>
                          <input
                            type="number"
                            value={motherConfig.midFoldLine.position.customDistance}
                            onChange={(e) => setMotherConfig(prev => ({
                              ...prev,
                              midFoldLine: {
                                ...prev.midFoldLine,
                                position: {
                                  ...prev.midFoldLine.position,
                                  customDistance: parseFloat(e.target.value) || 0
                                }
                              }
                            }))}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          />
                          <span style={{ fontSize: '12px', color: '#666' }}>mm</span>
                        </div>
                      ) : (
                        /* Vertical: Distance from Left or Right */
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            onClick={() => setMotherConfig(prev => ({
                              ...prev,
                              midFoldLine: {
                                ...prev.midFoldLine,
                                direction: 'left'
                              }
                            }))}
                            style={{
                              padding: '6px 12px',
                              border: `2px solid ${motherConfig.midFoldLine.direction === 'left' ? '#FF5722' : '#ddd'}`,
                              borderRadius: '4px',
                              background: motherConfig.midFoldLine.direction === 'left' ? '#fff3e0' : 'white',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Left
                          </button>
                          <button
                            onClick={() => setMotherConfig(prev => ({
                              ...prev,
                              midFoldLine: {
                                ...prev.midFoldLine,
                                direction: 'right'
                              }
                            }))}
                            style={{
                              padding: '6px 12px',
                              border: `2px solid ${motherConfig.midFoldLine.direction === 'right' ? '#FF5722' : '#ddd'}`,
                              borderRadius: '4px',
                              background: motherConfig.midFoldLine.direction === 'right' ? '#fff3e0' : 'white',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Right
                          </button>
                          <input
                            type="number"
                            value={motherConfig.midFoldLine.position.customDistance}
                            onChange={(e) => setMotherConfig(prev => ({
                              ...prev,
                              midFoldLine: {
                                ...prev.midFoldLine,
                                position: {
                                  ...prev.midFoldLine.position,
                                  customDistance: parseFloat(e.target.value) || 0
                                }
                              }
                            }))}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          />
                          <span style={{ fontSize: '12px', color: '#666' }}>mm</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: Padding Configuration (Always Visible) */}
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginBottom: '8px', display: 'block' }}>
                      4. Padding from edges:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        value={motherConfig.midFoldLine.padding}
                        onChange={(e) => setMotherConfig(prev => ({
                          ...prev,
                          midFoldLine: {
                            ...prev.midFoldLine,
                            padding: parseFloat(e.target.value) || 3
                          }
                        }))}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                      <span style={{ fontSize: '12px', color: '#666' }}>mm (default: 3mm)</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Sewing Position Selection */
                <div>
                  <h4 style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
                    📍 Select Edge Position (Click to set offset):
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
                          border: `2px solid ${motherConfig.sewingPosition === option.value ? '#4caf50' : '#ddd'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: motherConfig.sewingPosition === option.value ? '#e8f5e9' : 'white',
                          transition: 'all 0.3s',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          color: motherConfig.sewingPosition === option.value ? '#2e7d32' : '#666'
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
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowMotherDialog(false);

                  setIsEditingMother(false);
                  setEditingMotherId(null);
                }}
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
        </div>
      )}

      {/* Region Edit Dialog */}
      {showRegionDialog && editingRegion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)', // More transparent to allow canvas interaction
          zIndex: 10001,
          pointerEvents: 'none' // Allow clicks to pass through to canvas
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            e.preventDefault(); // Prevent text selection during drag
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            setDialogPosition({ x: newX, y: newY });
          }
        }}
        onMouseUp={() => {
          setIsDragging(false);
        }}
        >
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            minWidth: '400px',
            maxWidth: '500px',
            position: 'absolute',
            left: `calc(50% + ${dialogPosition.x}px)`,
            top: `calc(50% + ${dialogPosition.y}px)`,
            transform: 'translate(-50%, -50%)',
            cursor: isDragging ? 'grabbing' : 'default',
            pointerEvents: 'auto' // Re-enable pointer events for the dialog itself
          }}>
            {/* Draggable Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '12px 12px 0 0',
                cursor: 'grab',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseDown={(e) => {
                setIsDragging(true);
                setDragStart({
                  x: e.clientX - dialogPosition.x,
                  y: e.clientY - dialogPosition.y
                });
              }}
            >
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                ✏️ Edit Region
              </h2>
              <div style={{
                fontSize: '12px',
                opacity: 0.8,
                fontStyle: 'italic'
              }}>
                Drag to move
              </div>
            </div>

            {/* Dialog Content */}
            <div style={{ padding: '30px' }}>

            {/* Region Name */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                Region Name:
              </label>
              <input
                type="text"
                value={editingRegion.name}
                onChange={(e) => setEditingRegion(prev => prev ? { ...prev, name: e.target.value } : null)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2196f3'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            {/* Position and Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                  X Position (mm):
                </label>
                <input
                  type="number"
                  min="0"
                  max={motherConfig.width - 10}
                  value={editingRegion.x}
                  onChange={(e) => setEditingRegion(prev => prev ? { ...prev, x: parseInt(e.target.value) || 0 } : null)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196f3'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                  Y Position (mm):
                </label>
                <input
                  type="number"
                  min="0"
                  max={motherConfig.height - 10}
                  value={editingRegion.y}
                  onChange={(e) => setEditingRegion(prev => prev ? { ...prev, y: parseInt(e.target.value) || 0 } : null)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196f3'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                  Width (mm):
                </label>
                <input
                  type="number"
                  min="10"
                  max={motherConfig.width - editingRegion.x}
                  value={editingRegion.width}
                  onChange={(e) => setEditingRegion(prev => prev ? { ...prev, width: parseInt(e.target.value) || 10 } : null)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196f3'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                  Height (mm):
                </label>
                <input
                  type="number"
                  min="10"
                  max={motherConfig.height - editingRegion.y}
                  value={editingRegion.height}
                  onChange={(e) => setEditingRegion(prev => prev ? { ...prev, height: parseInt(e.target.value) || 10 } : null)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196f3'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowRegionDialog(false);
                  setEditingRegion(null);
                }}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancel
              </button>
              <button
                onClick={() => {
                  if (editingRegion && selectedObject) {
                    // Update the region in the actual mother object
                    const currentData = data || webCreationData;
                    if (currentData) {
                      const updatedObjects = currentData.objects.map(obj => {
                        if (obj.name === selectedObject.name && obj.type === 'mother') {
                          const currentRegions = (obj as any).regions || [];
                          const updatedRegions = currentRegions.map((r: Region) =>
                            r.id === editingRegion.id ? editingRegion : r
                          );
                          return {
                            ...obj,
                            regions: updatedRegions
                          };
                        }
                        return obj;
                      });

                      const updatedData = {
                        ...currentData,
                        objects: updatedObjects
                      };

                      setData(updatedData);
                      setWebCreationData(updatedData);
                    }

                    setShowRegionDialog(false);
                    setEditingRegion(null);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✅ Save
              </button>
            </div>
            </div> {/* Close Dialog Content */}
          </div>
        </div>
      )}

      {/* Add Region Dialog */}
      {showAddRegionDialog && selectedMotherForRegion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)', // More transparent to allow canvas interaction
          zIndex: 10001,
          pointerEvents: 'none' // Allow clicks to pass through to canvas
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            e.preventDefault();
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            setDialogPosition({ x: newX, y: newY });
          }
        }}
        onMouseUp={() => {
          setIsDragging(false);
        }}
        >
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            minWidth: '400px',
            maxWidth: '500px',
            position: 'absolute',
            left: `calc(50% + ${dialogPosition.x}px)`,
            top: `calc(50% + ${dialogPosition.y}px)`,
            transform: 'translate(-50%, -50%)',
            cursor: isDragging ? 'grabbing' : 'default',
            pointerEvents: 'auto' // Re-enable pointer events for the dialog itself
          }}>
            {/* Draggable Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '12px 12px 0 0',
                cursor: 'grab',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseDown={(e) => {
                setIsDragging(true);
                setDragStart({
                  x: e.clientX - dialogPosition.x,
                  y: e.clientY - dialogPosition.y
                });
              }}
            >
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                ➕ Add Region to {selectedMotherForRegion.name}
              </h2>
              <div style={{
                fontSize: '12px',
                opacity: 0.8,
                fontStyle: 'italic'
              }}>
                Drag to move
              </div>
            </div>

            {/* Dialog Content */}
            <div style={{ padding: '30px' }}>
              {/* Use Whole Mother Checkbox */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  <input
                    type="checkbox"
                    checked={useWholeMother}
                    onChange={(e) => {
                      setUseWholeMother(e.target.checked);
                      if (e.target.checked) {
                        // Enhanced logic with mid-fold line support
                        const motherMargins = (selectedMotherForRegion as any).margins || { top: 5, left: 5, right: 5, down: 5 };
                        const existingRegions = (selectedMotherForRegion as any).regions || [];
                        const midFoldLine = (selectedMotherForRegion as any).midFoldLine;

                        console.log('🔍 Checking for mid-fold line:', midFoldLine);

                        const spaceAnalysis = findAvailableSpaceWithMidFold(
                          selectedMotherForRegion.width,
                          selectedMotherForRegion.height,
                          existingRegions,
                          motherMargins,
                          midFoldLine
                        );

                        console.log('📊 Space analysis result:', spaceAnalysis);

                        if (spaceAnalysis.type === 'single' && spaceAnalysis.regions[0]) {
                          // No mid-fold line, use single region
                          const largestRect = spaceAnalysis.regions[0];
                          setNewRegionData({
                            ...newRegionData,
                            x: largestRect.x,
                            y: largestRect.y,
                            width: largestRect.width,
                            height: largestRect.height
                          });
                        } else if ((spaceAnalysis.type === 'horizontal_split' || spaceAnalysis.type === 'vertical_split') && spaceAnalysis.regions.length > 0) {
                          // Mid-fold line detected - show confirmation dialog for multiple regions
                          const regionNames = spaceAnalysis.regions
                            .map(r => (r as any).name || 'Region')
                            .join(' and ');

                          if (window.confirm(
                            `🔄 Mid-fold line detected!\n\n` +
                            `The available space will be automatically split into ${spaceAnalysis.regions.length} regions:\n` +
                            `${regionNames}\n\n` +
                            `This ensures regions don't cross the mid-fold line.\n\n` +
                            `Continue with automatic split?`
                          )) {
                            // User confirmed - store analysis for later use
                            (window as any).pendingMidFoldAnalysis = spaceAnalysis;

                            // Set first region data for display
                            const firstRegion = spaceAnalysis.regions[0];
                            if (firstRegion) {
                              setNewRegionData({
                                ...newRegionData,
                                x: firstRegion.x,
                                y: firstRegion.y,
                                width: firstRegion.width,
                                height: firstRegion.height,
                                name: (firstRegion as any).name || 'Region_1'
                              });
                            }
                          } else {
                            // User cancelled - uncheck the checkbox
                            setUseWholeMother(false);
                          }
                        } else {
                          // No available space
                          alert('❌ No sufficient space available for regions.\n\nTry adjusting margins or removing existing regions.');
                          setUseWholeMother(false);
                        }
                      }
                    }}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span>🧩 Use remaining available space</span>
                </label>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', marginLeft: '30px' }}>
                  Automatically fills the largest available area (avoiding existing regions and margins)
                  <br/>
                  <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    🔄 Mid-fold aware: Will create separate regions if mid-fold line is present
                  </span>
                </div>
              </div>

              {/* Region Name */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                  Region Name:
                </label>
                <input
                  type="text"
                  value={newRegionData.name}
                  onChange={(e) => setNewRegionData({ ...newRegionData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              {/* Position and Size - Only show if not using whole mother */}
              {!useWholeMother && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                        X Position (mm):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={selectedMotherForRegion.width - 10}
                        value={newRegionData.x}
                        onChange={(e) => setNewRegionData({ ...newRegionData, x: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                        Y Position (mm):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={selectedMotherForRegion.height - 10}
                        value={newRegionData.y}
                        onChange={(e) => setNewRegionData({ ...newRegionData, y: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                        Width (mm):
                      </label>
                      <input
                        type="number"
                        min="10"
                        max={selectedMotherForRegion.width - newRegionData.x}
                        value={newRegionData.width}
                        onChange={(e) => setNewRegionData({ ...newRegionData, width: parseInt(e.target.value) || 10 })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                        Height (mm):
                      </label>
                      <input
                        type="number"
                        min="10"
                        max={selectedMotherForRegion.height - newRegionData.y}
                        value={newRegionData.height}
                        onChange={(e) => setNewRegionData({ ...newRegionData, height: parseInt(e.target.value) || 10 })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      />
                    </div>
                  </div>

                  {/* Validation and Suggestions */}
                  {(() => {
                    const motherRegions = (selectedMotherForRegion as any).regions || [];
                    const exceedsBoundaries = newRegionData.x + newRegionData.width > selectedMotherForRegion.width ||
                                            newRegionData.y + newRegionData.height > selectedMotherForRegion.height;
                    const hasOverlap = checkRegionOverlap(newRegionData, motherRegions);
                    const overlappingRegions = getOverlappingRegions(newRegionData, motherRegions);
                    const suggestedPosition = suggestNextPosition(
                      selectedMotherForRegion.width,
                      selectedMotherForRegion.height,
                      motherRegions,
                      newRegionData.width,
                      newRegionData.height
                    );
                    const spaceInfo = calculateRemainingSpace(selectedMotherForRegion.width, selectedMotherForRegion.height, motherRegions);

                    return (
                      <>
                        {/* Remaining Space Info */}
                        <div style={{
                          background: '#e8f5e9',
                          border: '1px solid #4caf50',
                          borderRadius: '6px',
                          padding: '10px',
                          marginBottom: '15px',
                          fontSize: '12px'
                        }}>
                          📊 <strong>Space Usage:</strong> {spaceInfo.usagePercentage}% used<br/>
                          📏 <strong>Remaining:</strong> {spaceInfo.remainingArea}mm² of {spaceInfo.totalArea}mm²
                        </div>

                        {/* Boundary Validation */}
                        {exceedsBoundaries && (
                          <div style={{
                            background: '#ffebee',
                            border: '1px solid #f44336',
                            borderRadius: '6px',
                            padding: '10px',
                            marginBottom: '15px',
                            color: '#c62828',
                            fontSize: '13px'
                          }}>
                            🚫 <strong>Exceeds Mother Boundaries!</strong><br/>
                            Mother size: {selectedMotherForRegion.width}×{selectedMotherForRegion.height}mm<br/>
                            Region needs: ({newRegionData.x}+{newRegionData.width})×({newRegionData.y}+{newRegionData.height}) = {newRegionData.x + newRegionData.width}×{newRegionData.y + newRegionData.height}mm
                          </div>
                        )}

                        {/* Overlap Validation */}
                        {!exceedsBoundaries && hasOverlap && (
                          <div style={{
                            background: '#fff3e0',
                            border: '1px solid #ff9800',
                            borderRadius: '6px',
                            padding: '10px',
                            marginBottom: '15px',
                            color: '#e65100',
                            fontSize: '13px'
                          }}>
                            ⚠️ <strong>Overlaps with existing region(s)!</strong><br/>
                            Conflicts with: {overlappingRegions.map(r => r.name).join(', ')}<br/>
                            {suggestedPosition && (
                              <>
                                💡 <strong>Suggested position:</strong> ({suggestedPosition.x}, {suggestedPosition.y})<br/>
                                <button
                                  onClick={() => setNewRegionData({
                                    ...newRegionData,
                                    x: suggestedPosition.x,
                                    y: suggestedPosition.y
                                  })}
                                  style={{
                                    background: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    marginTop: '5px'
                                  }}
                                >
                                  ✨ Use Suggested Position
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Success State */}
                        {!exceedsBoundaries && !hasOverlap && (
                          <div style={{
                            background: '#e8f5e9',
                            border: '1px solid #4caf50',
                            borderRadius: '6px',
                            padding: '10px',
                            marginBottom: '15px',
                            color: '#2e7d32',
                            fontSize: '13px'
                          }}>
                            ✅ <strong>Valid Position!</strong><br/>
                            Region fits perfectly at ({newRegionData.x}, {newRegionData.y})
                          </div>
                        )}

                        {/* No Space Available */}
                        {!exceedsBoundaries && hasOverlap && !suggestedPosition && (
                          <div style={{
                            background: '#ffebee',
                            border: '1px solid #f44336',
                            borderRadius: '6px',
                            padding: '10px',
                            marginBottom: '15px',
                            color: '#c62828',
                            fontSize: '13px'
                          }}>
                            🚫 <strong>No Available Space!</strong><br/>
                            Cannot fit {newRegionData.width}×{newRegionData.height}mm region anywhere.<br/>
                            Try smaller dimensions or remove existing regions.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAddRegionDialog(false);
                    setSelectedMotherForRegion(null);
                    setUseWholeMother(false);
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('🎯 Creating region(s)...');

                    // Check if we have pending mid-fold analysis
                    const pendingAnalysis = (window as any).pendingMidFoldAnalysis;
                    const motherRegions = (selectedMotherForRegion as any).regions || [];

                    if (pendingAnalysis && (pendingAnalysis.type === 'horizontal_split' || pendingAnalysis.type === 'vertical_split')) {
                      console.log('🔄 Creating multiple regions from mid-fold analysis:', pendingAnalysis);

                      // Create multiple regions from the analysis
                      const newRegions: Region[] = pendingAnalysis.regions.map((regionData: any, index: number) => ({
                        id: regionData.id || `region_${Date.now()}_${index}`,
                        name: regionData.name || `Region_${index + 1}`,
                        x: regionData.x,
                        y: regionData.y,
                        width: regionData.width,
                        height: regionData.height,
                        margins: { top: 2, bottom: 2, left: 2, right: 2 },
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        allowOverflow: false
                      }));

                      console.log('✅ Created regions:', newRegions);

                      // Update the mother object with all new regions
                      const currentData = data || webCreationData;
                      if (currentData) {
                        const updatedObjects = currentData.objects.map(obj => {
                          if (obj.name === selectedMotherForRegion!.name) {
                            return {
                              ...obj,
                              regions: [...motherRegions, ...newRegions]
                            };
                          }
                          return obj;
                        });

                        const updatedData = {
                          ...currentData,
                          objects: updatedObjects
                        };

                        setData(updatedData);
                        setWebCreationData(updatedData);
                      }

                      // Clear pending analysis
                      delete (window as any).pendingMidFoldAnalysis;

                      // Show success message
                      alert(`✅ Successfully created ${newRegions.length} regions:\n${newRegions.map(r => r.name).join(', ')}\n\nRegions are positioned to respect the mid-fold line.`);

                    } else {
                      // Single region creation (original logic)
                      console.log('📦 Creating single region');

                      const newRegion: Region = {
                        id: `region_${Date.now()}`,
                        name: newRegionData.name,
                        x: newRegionData.x,
                        y: newRegionData.y,
                        width: newRegionData.width,
                        height: newRegionData.height,
                        margins: { top: 2, bottom: 2, left: 2, right: 2 },
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        allowOverflow: false
                      };

                      // Update the mother object with the new region
                      const currentData = data || webCreationData;
                      if (currentData) {
                        const updatedObjects = currentData.objects.map(obj => {
                          if (obj.name === selectedMotherForRegion!.name) {
                            return {
                              ...obj,
                              regions: [...motherRegions, newRegion]
                            };
                          }
                          return obj;
                        });

                        const updatedData = {
                          ...currentData,
                          objects: updatedObjects
                        };

                        setData(updatedData);
                        setWebCreationData(updatedData);
                      }
                    }

                    // Close dialog
                    setShowAddRegionDialog(false);
                    setSelectedMotherForRegion(null);
                    setUseWholeMother(false);

                    // Reset region data
                    setNewRegionData({
                      name: '',
                      x: 5,
                      y: 5,
                      width: 20,
                      height: 20
                    });
                  }}
                  disabled={(() => {
                    const motherRegions = (selectedMotherForRegion as any).regions || [];
                    const exceedsBoundaries = newRegionData.x + newRegionData.width > selectedMotherForRegion.width ||
                                            newRegionData.y + newRegionData.height > selectedMotherForRegion.height;
                    const hasOverlap = checkRegionOverlap(newRegionData, motherRegions);
                    return !newRegionData.name.trim() || exceedsBoundaries || hasOverlap;
                  })()}
                  style={(() => {
                    const motherRegions = (selectedMotherForRegion as any).regions || [];
                    const exceedsBoundaries = newRegionData.x + newRegionData.width > selectedMotherForRegion.width ||
                                            newRegionData.y + newRegionData.height > selectedMotherForRegion.height;
                    const hasOverlap = checkRegionOverlap(newRegionData, motherRegions);
                    const isDisabled = !newRegionData.name.trim() || exceedsBoundaries || hasOverlap;

                    return {
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      background: isDisabled ? '#ccc' : 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.6 : 1
                    };
                  })()}
                >
                  ✅ Create Region
                </button>
              </div>
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





      {/* Space Allocation Dialog - REMOVED (now handled directly in son regions) */}

      {/* Saving Overlay */}
      {isSaving && (
        <>
          <style>
            {`
              @keyframes savingPulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes slideInRight {
                0% { transform: translateX(100%); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
              }
            `}
          </style>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backdropFilter: 'blur(2px)'
          }}>
            <div style={{
              background: 'white',
              padding: '50px 70px',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              border: '2px solid #e2e8f0',
              minWidth: '300px'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '25px',
                animation: 'savingPulse 1.5s infinite',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
              }}>
                💾
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '15px',
                letterSpacing: '0.5px'
              }}>
                Saving...
              </div>
              <div style={{
                fontSize: '18px',
                color: '#666',
                lineHeight: '1.4'
              }}>
                Please wait while we save your master file
              </div>
            </div>
          </div>
        </>
      )}




      {/* Success Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
          zIndex: 10000,
          animation: 'slideInRight 0.3s ease-out'
        }}>
          {notification}
        </div>
      )}

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






