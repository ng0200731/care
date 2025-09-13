import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SonDetailsPanel from './SonDetailsPanel';
import NavigationButtons from './components/NavigationButtons';
import SonObjectManager, { SonObject } from './components/content-editors/SonObjectManager';
import { masterFileService } from './services/masterFileService';
import { customerService, Customer } from './services/customerService';
import ContentMenu, { ContentType } from './components/ContentMenu';
import NewCtMenu from './components/NewCtMenu';
import UniversalContentDialog, { UniversalContentData } from './components/dialogs/UniversalContentDialog';
import NewLineTextDialog, { NewLineTextConfig } from './components/NewLineTextDialog';
import NewMultiLineDialog, { NewMultiLineConfig } from './components/NewMultiLineDialog';
import NewWashingCareSymbolDialog from './components/NewWashingCareSymbolDialog';
import jsPDF from 'jspdf';
// import RegionOccupationDialog, { RegionOccupationData } from './components/dialogs/RegionOccupationDialog';
// import PreviewControlPanel, { PreviewSettings } from './components/PreviewControlPanel';

// Import version from package.json
const packageJson = require('../package.json');



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
  children?: Region[]; // Child regions for sliced regions
  parentId?: string; // ID of parent region if this is a slice
  isSliced?: boolean; // Whether this region has been sliced
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
  layoutName?: string; // Optional layout name for project mode
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Child region text wrapping function - returns lines and overflow info
  const processChildRegionTextWrapping = (
    text: string,
    availableWidthPx: number,
    availableHeightPx: number,
    fontSizePx: number,
    fontFamily: string,
    lineBreakSymbol: string,
    lineSpacing: number
  ): { lines: string[]; hasOverflow: boolean } => {
    // Convert pixels to mm for text measurement (96 DPI: 1mm = 3.779527559px)
    const availableWidthMm = availableWidthPx / 3.779527559;
    const fontSizeMm = fontSizePx / 3.779527559;

    // Accurate text width estimation with special character detection
    const estimateTextWidth = (text: string): number => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return text.length * 2; // Fallback

      // Set exact font properties to match SVG rendering
      context.font = `${fontSizePx}px ${fontFamily}`;
      context.textAlign = 'start'; // Match SVG textAnchor="start"
      context.textBaseline = 'alphabetic'; // Match SVG dominantBaseline="alphabetic"

      const textWidthPx = context.measureText(text).width;
      const textWidthMm = textWidthPx / 3.779527559; // Convert to mm

      // Check for wide characters that need extra space
      const wideCharacters = /[AVMW]/g;
      const wideCharCount = (text.match(wideCharacters) || []).length;

      // Add extra space for wide characters (0.2mm per wide character)
      const wideCharacterBuffer = wideCharCount * 0.2;

      // Use ACTUAL measured width + buffer for wide characters
      // NO reduction - we want the real width to ensure no boundary crossing
      const actualWidth = textWidthMm + wideCharacterBuffer;

      console.log(`📐 Text measurement: "${text.substring(0, 20)}..." | Canvas: ${textWidthMm.toFixed(2)}mm | Wide chars: ${wideCharCount} | Final: ${actualWidth.toFixed(2)}mm`);

      return actualWidth;
    };

    // Word wrapping logic (SAME AS PREVIEW DIALOG)
    const wrapTextToLines = (text: string): string[] => {
      // Handle both actual newlines and the configured symbol (SAME AS PREVIEW)
      let manualLines: string[];
      if (lineBreakSymbol === '\\n' || lineBreakSymbol === '\n') {
        // For newline symbols, split by actual newlines
        manualLines = text.split('\n');
      } else {
        // For other symbols, split by the symbol
        manualLines = text.split(lineBreakSymbol);
      }
      const wrappedLines: string[] = [];

      manualLines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          wrappedLines.push(''); // Preserve empty lines
          return;
        }

        // Check if the entire line fits within HARD BOUNDARIES
        const lineWidth = estimateTextWidth(trimmedLine);

        // User-controlled safety buffer (default 1.5mm, user can adjust 1-2mm)
        // This buffer is WITHIN the available space, not added to text width
        const userSafetyBuffer = 1.5; // TODO: Make this user-configurable in popup
        const effectiveAvailableWidth = Math.max(0, availableWidthMm - userSafetyBuffer);

        // Check for wide characters and warn user
        const wideCharacters = /[AVMW]/g;
        const wideCharCount = (trimmedLine.match(wideCharacters) || []).length;
        if (wideCharCount > 0) {
          console.warn(`⚠️ Wide characters detected: ${wideCharCount} characters (${trimmedLine.match(wideCharacters)?.join(', ')}) in "${trimmedLine.substring(0, 30)}..."`);
        }

        console.log(`🎯 Boundary check: "${trimmedLine.substring(0, 30)}..." | Text: ${lineWidth.toFixed(2)}mm | Available: ${effectiveAvailableWidth.toFixed(2)}mm | Buffer: ${userSafetyBuffer}mm | ${lineWidth <= effectiveAvailableWidth ? '✅ FITS' : '❌ EXCEEDS'}`);

        if (lineWidth <= effectiveAvailableWidth) {
          // Line fits within boundaries - SAFE to use
          wrappedLines.push(trimmedLine);
          return;
        }

        // Line exceeds boundaries - MUST break to respect hard limits
        const words = trimmedLine.split(' ');
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = estimateTextWidth(testLine);

          if (testWidth <= effectiveAvailableWidth) {
            // Word fits within boundaries
            currentLine = testLine;
          } else {
            // Word would exceed boundaries - MUST break line
            if (currentLine) {
              // Push current line and start new line with the word that didn't fit
              wrappedLines.push(currentLine);
              console.log(`✅ Line within boundaries: "${currentLine}" | Width: ${estimateTextWidth(currentLine).toFixed(2)}mm`);
              currentLine = word;
            } else {
              // Single word exceeds boundaries - CRITICAL ERROR
              console.error(`🚨 BOUNDARY VIOLATION: Single word "${word}" exceeds available width: ${testWidth.toFixed(2)}mm > ${effectiveAvailableWidth.toFixed(2)}mm`);
              console.error(`🚨 USER MUST: 1) Increase buffer space, 2) Use smaller font, or 3) Shorten text`);
              wrappedLines.push(word); // Push anyway but flag as violation
            }
          }
        }

        if (currentLine) {
          wrappedLines.push(currentLine);
        }
      });

      return wrappedLines;
    };

    const wrappedLines = wrapTextToLines(text);

    // Check for overflow based on available height (with conservative calculation)
    const lineHeight = fontSizePx * lineSpacing;
    // Account for baseline offset and add safety margin for text positioning
    const textBaselineOffset = fontSizePx * 0.8; // Account for text baseline positioning
    const safeAvailableHeight = availableHeightPx - textBaselineOffset;
    const maxLines = Math.floor(safeAvailableHeight / lineHeight);
    const hasOverflow = wrappedLines.length > maxLines;

    // Trim lines if overflow
    const finalLines = hasOverflow ? wrappedLines.slice(0, maxLines) : wrappedLines;

    console.log('🎯 Child region text wrapping:', {
      availableWidthMm: availableWidthMm.toFixed(2),
      availableHeightPx: availableHeightPx.toFixed(2),
      safeAvailableHeight: safeAvailableHeight.toFixed(2),
      fontSizePx,
      lineHeight,
      textBaselineOffset: textBaselineOffset.toFixed(2),
      maxLines,
      totalLines: wrappedLines.length,
      finalLines: finalLines.length,
      hasOverflow
    });

    return { lines: finalLines, hasOverflow };
  };

  // Word wrapping function for multi-line text (EXACT COPY from dialog preview)
  const wrapMultiLineText = (text: string, fontSize: number, fontSizeUnit: string, fontFamily: string, availableWidthMm: number, lineBreakSymbol: string): string => {
    // EXACT COPY: Text width estimation using canvas measurement (same as dialog)
    const estimateTextWidth = (text: string): number => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return text.length * 2; // Fallback

      // Convert font size to pixels for canvas measurement
      let fontSizeInPixels = fontSize;
      if (fontSizeUnit === 'pt') {
        fontSizeInPixels = fontSize * 4/3; // 1 point = 4/3 pixels
      } else if (fontSizeUnit === 'mm') {
        fontSizeInPixels = fontSize * 3.779527559; // 1 mm = ~3.78 pixels at 96 DPI
      }

      // Set font for measurement
      context.font = `${fontSizeInPixels}px ${fontFamily}`;

      // Measure text width in pixels
      const textWidthPx = context.measureText(text).width;

      // Convert pixels to mm (96 DPI standard)
      const textWidthMm = textWidthPx / 3.779527559;

      return textWidthMm;
    };

    // EXACT COPY: Intelligent word wrapping from dialog (whole words move to next line)
    const wrapTextToLines = (text: string): string[] => {
      // First split by manual line break symbols
      const manualLines = text.split(lineBreakSymbol);
      const wrappedLines: string[] = [];

      manualLines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          wrappedLines.push(''); // Preserve empty lines
          return;
        }

        // Check if the entire line fits
        const lineWidth = estimateTextWidth(trimmedLine);

        if (lineWidth <= availableWidthMm) {
          // Line fits completely
          wrappedLines.push(trimmedLine);
          return;
        }

        // Line is too long, need to wrap words
        const words = trimmedLine.split(' ');
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine ? `${currentLine} ${word}` : word;

          const testWidth = estimateTextWidth(testLine);

          if (testWidth <= availableWidthMm) {
            // Word fits on current line
            currentLine = testLine;
          } else {
            // Word doesn't fit, start new line
            if (currentLine) {
              // Push current line and start new line with the word that didn't fit
              wrappedLines.push(currentLine);
              currentLine = word;
              console.log(`📄 Canvas word wrap: "${word}" moved to new line (would exceed ${availableWidthMm.toFixed(1)}mm)`);
            } else {
              // Single word is too long for available width, but we never break words
              // Add it anyway to preserve word integrity
              wrappedLines.push(word);
              console.log(`⚠️ Canvas long word: "${word}" exceeds available width but kept whole`);
            }
          }
        }

        // Add the last line if it has content
        if (currentLine) {
          wrappedLines.push(currentLine);
        }
      });

      return wrappedLines;
    };

    const wrappedLines = wrapTextToLines(text);

    // Enhanced debug logging to compare with preview
    console.log('📄 Canvas: Multi-line word wrapping (should match preview):', {
      originalText: `"${text}"`,
      availableWidth: availableWidthMm.toFixed(2) + 'mm',
      fontSize: `${fontSize}${fontSizeUnit}`,
      fontFamily: fontFamily,
      lineBreakSymbol: lineBreakSymbol,
      wrappedLines: wrappedLines,
      totalLines: wrappedLines.length,
      joinedResult: wrappedLines.join('\\n')
    });

    // Join lines with newline characters for rendering
    return wrappedLines.join('\n');
  };

  // Get URL parameters to determine context and mode
  const urlParams = new URLSearchParams(location.search);
  const context = urlParams.get('context');
  const projectSlug = urlParams.get('projectSlug');
  const projectName = urlParams.get('projectName');
  const masterFileId = urlParams.get('masterFileId');

  // Mode Detection
  const isMasterFileMode = !context || context !== 'projects';
  const isProjectMode = context === 'projects';

  // Mode Detection (removed noisy logging)
  const [data, setData] = useState<AIData | null>(null);
  const [selectedObject, setSelectedObject] = useState<AIObject | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedMothers, setExpandedMothers] = useState<Set<number>>(new Set([0])); // Expand first mother by default
  const [sonMetadata, setSonMetadata] = useState<Map<string, SonMetadata>>(new Map());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [motherMetadata, setMotherMetadata] = useState<Map<string, MotherMetadata>>(new Map());

  // Backend availability indicator - DISABLED
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('offline');
  // useEffect(() => {
  //   let cancelled = false;
  //   const ping = async () => {
  //     try {
  //       const res = await fetch('http://localhost:3001/api/health');
  //       if (!cancelled) setApiStatus(res.ok ? 'online' : 'offline');
  //     } catch {
  //       if (!cancelled) setApiStatus('offline');
  //     }
  //   };
  //   ping();
  //   const t = setInterval(ping, 10000);
  //   return () => { cancelled = true; clearInterval(t); };
  // }, []);

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
  const [showPreview, setShowPreview] = useState(true); // Toggle to show/hide input values in regions
  const [showPartitionLines, setShowPartitionLines] = useState(true); // Toggle to show/hide region and slice solid lines
  const [showContentTypeNames, setShowContentTypeNames] = useState(true); // Toggle to show/hide content type names like "new-multiline-line", "new-washing-care-symbol"
  const [showSupportingLines, setShowSupportingLines] = useState(true); // Toggle to show/hide dotted lines (margin, padding, mid-fold)
  const [showSewingLines, setShowSewingLines] = useState(true); // Toggle to show/hide sewing lines (top, left, bottom, right) and mid-fold lines
  const [showPartitionNames, setShowPartitionNames] = useState(true); // Toggle to show/hide region and slice labels (R1, R2, S1, S2)
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

  // Custom warning dialog state for content replacement
  const [contentWarningDialog, setContentWarningDialog] = useState<{
    isOpen: boolean;
    areaType: string;
    existingContent: string;
    newContent: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Drag and drop state - Auto-hide content menu in project mode
  const [showContentMenu, setShowContentMenu] = useState(false);
  const [menuHideTimeout, setMenuHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pinnedContentMenu, setPinnedContentMenu] = useState(false);

  // Auto-hide hierarchy menu state - Project mode only
  const [showHierarchyMenu, setShowHierarchyMenu] = useState(true); // Default visible in non-project mode
  const [hierarchyHideTimeout, setHierarchyHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pinnedHierarchyMenu, setPinnedHierarchyMenu] = useState(false);

  // Auto-hide new CT menu state - Project mode only
  const [showNewCtMenu, setShowNewCtMenu] = useState(false);
  const [newCtHideTimeout, setNewCtHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pinnedNewCtMenu, setPinnedNewCtMenu] = useState(false);

  // New Line Text Dialog state
  const [newLineTextDialog, setNewLineTextDialog] = useState<{
    isOpen: boolean;
    regionId: string;
    regionWidth: number;
    regionHeight: number;
    editingContent?: any;
  } | null>(null);

  // New Multi-line Dialog state
  const [newMultiLineDialog, setNewMultiLineDialog] = useState<{
    isOpen: boolean;
    regionId: string;
    regionWidth: number;
    regionHeight: number;
    editingContent?: any;
  } | null>(null);

  // New Washing Care Symbol Dialog state
  const [newWashingCareSymbolDialog, setNewWashingCareSymbolDialog] = useState<{
    isOpen: boolean;
    regionId: string;
    regionWidth: number;
    regionHeight: number;
    editingContent?: any;
  } | null>(null);

  // Canvas-based symbol rendering utility for PDF
  const renderSymbolToCanvas = (symbol: string, size: number = 24): string | null => {
    try {
      // Create a temporary canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Set canvas size with padding
      const padding = size * 0.2;
      canvas.width = size + padding * 2;
      canvas.height = size + padding * 2;

      // Set font and styling
      ctx.font = `${size}px "Wash Care Symbols M54", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000000';

      // Clear canvas with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';

      // Draw the symbol
      ctx.fillText(symbol, canvas.width / 2, canvas.height / 2);

      // Convert to base64 data URL
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('❌ Failed to render symbol to canvas:', error);
      return null;
    }
  };

  // Font loading and embedding utility for Wash Care Symbols M54
  const embedWashCareFont = async (pdf: any): Promise<boolean> => {
    try {
      console.log('🔄 Loading Wash Care Symbols M54 font...');

      // Fetch the font file from public directory
      const fontResponse = await fetch('/fonts/Wash_Care_Symbols_M54.ttf');
      if (!fontResponse.ok) {
        console.error('❌ Failed to fetch font file:', fontResponse.status);
        return false;
      }

      // Convert to ArrayBuffer
      const fontArrayBuffer = await fontResponse.arrayBuffer();

      // Convert ArrayBuffer to base64
      const fontBytes = new Uint8Array(fontArrayBuffer);
      let binaryString = '';
      for (let i = 0; i < fontBytes.length; i++) {
        binaryString += String.fromCharCode(fontBytes[i]);
      }
      const fontBase64 = btoa(binaryString);

      console.log('✅ Font file loaded, size:', fontBytes.length, 'bytes');

      // Add font to PDF virtual file system
      pdf.addFileToVFS('WashCareSymbolsM54.ttf', fontBase64);

      // Register the font with jsPDF
      pdf.addFont('WashCareSymbolsM54.ttf', 'WashCareSymbolsM54', 'normal');

      console.log('✅ Wash Care Symbols M54 font embedded successfully in PDF');
      return true;
    } catch (error) {
      console.error('❌ Font embedding failed:', error);
      return false;
    }
  };

  // Handle New Line Text Dialog Save
  const handleNewLineTextSave = (config: NewLineTextConfig) => {
    if (!newLineTextDialog) return;

    const { regionId, editingContent } = newLineTextDialog;

    if (editingContent) {
      // Update existing content
      console.log('🔄 Updating existing content:', editingContent.id, 'with config:', config);
      setRegionContents(prevContents => {
        const newContents = new Map(prevContents);
        const currentContents = newContents.get(regionId) || [];
        const updatedContents = currentContents.map((content: any) => {
          if (content.id === editingContent.id) {
            const updatedContent = {
              ...content,
              layout: {
                ...content.layout,
                horizontalAlign: config.alignment.horizontal,
                verticalAlign: config.alignment.vertical,
                padding: {
                  top: config.padding.top,
                  right: config.padding.right,
                  bottom: config.padding.bottom,
                  left: config.padding.left
                }
              },
              typography: {
                ...content.typography,
                fontFamily: config.typography.fontFamily,
                fontSize: config.typography.fontSize,
                fontSizeUnit: config.typography.fontSizeUnit,
                fontColor: content.typography?.fontColor || '#000000'
              },
              content: {
                ...content.content,
                text: config.textContent
              },
              newLineTextConfig: config // Store the full config for future editing
            };
            console.log('✅ Updated content object:', updatedContent);
            return updatedContent;
          }
          return content;
        });
        console.log('🔄 Setting updated contents for region:', regionId, 'with updatedContents:', updatedContents);
        newContents.set(regionId, updatedContents);
        return newContents;
      });

      // Find region name for notification
      const regionName = (() => {
        // Find region name from data
        const currentData = data || webCreationData;
        if (currentData) {
          for (const obj of currentData.objects) {
            if (obj.type?.includes('mother')) {
              const regions = (obj as any).regions || [];
              const region = regions.find((r: any) => r.id === regionId);
              if (region) return region.name;
            }
          }
        }
        return regionId;
      })();

      setNotification(`✅ Updated line text in ${regionName}`);
      setTimeout(() => setNotification(null), 3000);
    } else {
      // Create new content
      const newContent = {
        id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'new-line-text',
        regionId: regionId,
        layout: {
          occupyLeftoverSpace: true,
          fullWidth: true,
          fullHeight: true,
          width: { value: 100, unit: '%' as const },
          height: { value: 100, unit: '%' as const },
          horizontalAlign: config.alignment.horizontal,
          verticalAlign: config.alignment.vertical,
          padding: {
            top: config.padding.top,
            right: config.padding.right,
            bottom: config.padding.bottom,
            left: config.padding.left
          }
        },
        typography: {
          fontFamily: config.typography.fontFamily,
          fontSize: config.typography.fontSize,
          fontSizeUnit: config.typography.fontSizeUnit,
          fontColor: '#000000'
        },
        content: {
          text: config.textContent
        },
        newLineTextConfig: config // Store the full config for future editing
      };

      // Add content to region
      setRegionContents(prevContents => {
        const newContents = new Map(prevContents);
        const currentContents = newContents.get(regionId) || [];
        newContents.set(regionId, [...currentContents, newContent]);
        return newContents;
      });

      // Find region name for notification
      const regionName = (() => {
        // Find region name from data
        const currentData = data || webCreationData;
        if (currentData) {
          for (const obj of currentData.objects) {
            if (obj.type?.includes('mother')) {
              const regions = (obj as any).regions || [];
              const region = regions.find((r: any) => r.id === regionId);
              if (region) return region.name;
            }
          }
        }
        return regionId;
      })();

      setNotification(`✅ Added configured line text to ${regionName}`);
      setTimeout(() => setNotification(null), 3000);
    }

    // Close dialog
    setNewLineTextDialog(null);
  };

  // Handle New Line Text Dialog Cancel
  const handleNewLineTextCancel = () => {
    setNewLineTextDialog(null);
  };

  // Handle New Multi-line Dialog Save
  const handleNewMultiLineSave = (config: NewMultiLineConfig) => {
    if (!newMultiLineDialog) return;

    const { regionId, editingContent } = newMultiLineDialog;

    if (editingContent) {
      // Update existing content
      console.log('🔄 Updating existing multi-line content:', editingContent.id, 'with config:', config);
      setRegionContents(prevContents => {
        const newContents = new Map(prevContents);
        const currentContents = newContents.get(regionId) || [];
        const updatedContents = currentContents.map((content: any) => {
          if (content.id === editingContent.id) {
            const updatedContent = {
              ...content,
              layout: {
                ...content.layout,
                horizontalAlign: config.alignment.horizontal,
                verticalAlign: config.alignment.vertical,
                padding: {
                  top: config.padding.top,
                  right: config.padding.right,
                  bottom: config.padding.bottom,
                  left: config.padding.left
                }
              },
              typography: {
                ...content.typography,
                fontFamily: config.typography.fontFamily,
                fontSize: config.typography.fontSize,
                fontSizeUnit: config.typography.fontSizeUnit,
                fontColor: content.typography?.fontColor || '#000000'
              },
              content: {
                ...content.content,
                text: config.textContent
              },
              newMultiLineConfig: config // Store the full config for future editing
            };
            console.log('✅ Updated multi-line content object:', updatedContent);
            return updatedContent;
          }
          return content;
        });
        newContents.set(regionId, updatedContents);
        return newContents;
      });

      // Find region name for notification
      const regionName = (() => {
        const currentData = data || webCreationData;
        if (currentData) {
          for (const obj of currentData.objects) {
            if (obj.type?.includes('mother')) {
              const regions = (obj as any).regions || [];
              const region = regions.find((r: any) => r.id === regionId);
              if (region) return region.name;
            }
          }
        }
        return regionId;
      })();

      setNotification(`✅ Updated multi-line text in ${regionName}`);
      setTimeout(() => setNotification(null), 3000);
    } else {
      // Create new content
      const newContent = {
        id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'new-multi-line',
        regionId: regionId,
        layout: {
          occupyLeftoverSpace: true,
          fullWidth: true,
          fullHeight: true,
          width: { value: 100, unit: '%' as const },
          height: { value: 100, unit: '%' as const },
          horizontalAlign: config.alignment.horizontal,
          verticalAlign: config.alignment.vertical,
          padding: {
            top: config.padding.top,
            right: config.padding.right,
            bottom: config.padding.bottom,
            left: config.padding.left
          }
        },
        typography: {
          fontFamily: config.typography.fontFamily,
          fontSize: config.typography.fontSize,
          fontSizeUnit: config.typography.fontSizeUnit,
          fontColor: '#000000'
        },
        content: {
          text: config.textContent
        },
        newMultiLineConfig: config // Store the full config for future editing
      };

      // Add content to region
      setRegionContents(prevContents => {
        const newContents = new Map(prevContents);
        const currentContents = newContents.get(regionId) || [];
        const updatedContents = [...currentContents, newContent];
        newContents.set(regionId, updatedContents);

        console.log('💾 SAVING NEW MULTI-LINE CONTENT:', {
          regionId: regionId,
          isSlice: regionId.includes('_slice_'),
          newContentId: newContent.id,
          contentType: newContent.type,
          textContent: config.textContent.substring(0, 50) + '...',
          processedLines: config.processedLines?.length || 0,
          currentContentsCount: currentContents.length,
          updatedContentsCount: updatedContents.length,
          allRegionIds: Array.from(newContents.keys())
        });

        return newContents;
      });

      // Find region name for notification
      const regionName = (() => {
        const currentData = data || webCreationData;
        if (currentData) {
          for (const obj of currentData.objects) {
            if (obj.type?.includes('mother')) {
              const regions = (obj as any).regions || [];
              const region = regions.find((r: any) => r.id === regionId);
              if (region) return region.name;
            }
          }
        }
        return regionId;
      })();

      setNotification(`✅ Added configured multi-line text to ${regionName}`);
      setTimeout(() => setNotification(null), 3000);
    }

    // Close dialog
    setNewMultiLineDialog(null);
  };

  // Handle New Multi-line Dialog Cancel
  const handleNewMultiLineCancel = () => {
    setNewMultiLineDialog(null);
  };

  // Handle New Washing Care Symbol Dialog Save
  const handleNewWashingCareSymbolSave = (selectedSymbols: string[]) => {
    if (!newWashingCareSymbolDialog) return;

    const { regionId, editingContent } = newWashingCareSymbolDialog;

    if (editingContent) {
      // Update existing content with all 5 selected symbols
      console.log('🔄 Updating existing washing care symbol content:', editingContent.id, 'with symbols:', selectedSymbols);
      setRegionContents(prevContents => {
        const newContents = new Map(prevContents);
        const existingContents = newContents.get(regionId) || [];
        const updatedContents = existingContents.map(content =>
          content.id === editingContent.id
            ? {
                ...content,
                type: 'new-washing-care-symbol' as const,
                content: {
                  ...content.content,
                  text: selectedSymbols.join(' '), // Display all 5 symbols
                  symbols: selectedSymbols // Store individual symbols
                }
              }
            : content
        );
        newContents.set(regionId, updatedContents);
        return newContents;
      });

      setNotification(`✅ Updated washing care symbols`);
      setTimeout(() => setNotification(null), 3000);
    } else {
      // Add new washing care symbol content with all 5 selected symbols
      const newContent = {
        id: `washing-care-symbol-${Date.now()}`,
        type: 'new-washing-care-symbol' as const,
        content: {
          text: selectedSymbols.join(' '), // Display all 5 symbols
          symbols: selectedSymbols // Store individual symbols
        }
      };

      console.log('💾 Adding new washing care symbol content to region:', regionId, newContent);

      setRegionContents(prevContents => {
        const newContents = new Map(prevContents);
        const existingContents = newContents.get(regionId) || [];
        newContents.set(regionId, [...existingContents, newContent]);
        return newContents;
      });

      // Get region name for notification
      let regionForNotification: any = null;
      const currentData = data || webCreationData;
      if (currentData) {
        for (const obj of currentData.objects) {
          if (obj.type?.includes('mother')) {
            const regions = (obj as any).regions || [];
            regionForNotification = regions.find((r: any) => r.id === regionId);
            if (regionForNotification) break;

            // Check child regions (slices) if not found in main regions
            for (const parentRegion of regions) {
              if (parentRegion.children && parentRegion.children.length > 0) {
                const childRegion = parentRegion.children.find((child: any) => child.id === regionId);
                if (childRegion) {
                  regionForNotification = childRegion;
                  break;
                }
              }
            }
            if (regionForNotification) break;
          }
        }
      }
      const regionName = regionForNotification ? `${regionForNotification.id} (${regionForNotification.width}×${regionForNotification.height}mm)` : regionId;

      setNotification(`✅ Added 5 washing care symbols to ${regionName}`);
      setTimeout(() => setNotification(null), 3000);
    }

    // Close dialog
    setNewWashingCareSymbolDialog(null);
  };

  // Handle New Washing Care Symbol Dialog Cancel
  const handleNewWashingCareSymbolCancel = () => {
    setNewWashingCareSymbolDialog(null);
  };

  // Auto-hide menu handlers
  const handleMenuTriggerEnter = () => {
    if (isProjectMode) {
      if (menuHideTimeout) {
        clearTimeout(menuHideTimeout);
        setMenuHideTimeout(null);
      }
      setShowContentMenu(true);
    }
  };

  const handleMenuLeave = () => {
    if (isProjectMode && !pinnedContentMenu) {
      const timeout = setTimeout(() => {
        setShowContentMenu(false);
      }, 500); // 500ms delay before hiding
      setMenuHideTimeout(timeout);
    }
  };

  // Auto-hide hierarchy menu handlers - following same pattern as content menu
  const handleHierarchyTriggerEnter = () => {
    if (isProjectMode) {
      if (hierarchyHideTimeout) {
        clearTimeout(hierarchyHideTimeout);
        setHierarchyHideTimeout(null);
      }
      setShowHierarchyMenu(true);
    }
  };

  const handleHierarchyLeave = () => {
    if (isProjectMode && !pinnedHierarchyMenu) {
      const timeout = setTimeout(() => {
        setShowHierarchyMenu(false);
      }, 500); // 500ms delay before hiding
      setHierarchyHideTimeout(timeout);
    }
  };

  // Auto-hide new CT menu handlers
  const handleNewCtTriggerEnter = () => {
    if (isProjectMode) {
      if (newCtHideTimeout) {
        clearTimeout(newCtHideTimeout);
        setNewCtHideTimeout(null);
      }
      setShowNewCtMenu(true);
    }
  };

  const handleNewCtLeave = () => {
    if (isProjectMode && !pinnedNewCtMenu) {
      const timeout = setTimeout(() => {
        setShowNewCtMenu(false);
      }, 500); // 500ms delay before hiding
      setNewCtHideTimeout(timeout);
    }
  };

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (menuHideTimeout) {
        clearTimeout(menuHideTimeout);
      }
      if (hierarchyHideTimeout) {
        clearTimeout(hierarchyHideTimeout);
      }
    };
  }, [menuHideTimeout, hierarchyHideTimeout]);

  // Set hierarchy menu visibility based on project mode
  React.useEffect(() => {
    if (isProjectMode) {
      setShowHierarchyMenu(false); // Start hidden in project mode, but can be toggled via tab
    } else {
      setShowHierarchyMenu(true); // Always visible in non-project mode
    }
  }, [isProjectMode]);
  const [dragOverRegion, setDragOverRegion] = useState<string | null>(null);
  const [universalDialog, setUniversalDialog] = useState<{
    isOpen: boolean;
    regionId: string;
    contentType: ContentType | null;
    editingContent?: any; // Add editing content to state
  }>({
    isOpen: false,
    regionId: '',
    contentType: null,
    editingContent: null
  });
  const [regionContents, setRegionContents] = useState<Map<string, any[]>>(new Map());

  // Master properties version to trigger connector updates
  const [masterPropertiesVersion, setMasterPropertiesVersion] = useState(0);

  // Line-text overflow connection functions
  const handleOverflowToggle = (contentId: string, regionId: string, enabled: boolean) => {
    // Update overflow settings
    const newOverflowSettings = new Map(overflowSettings);
    newOverflowSettings.set(contentId, enabled);
    setOverflowSettings(newOverflowSettings);

    if (enabled) {
      // Add to chain and auto-connect
      addToOverflowChain(contentId, regionId);
    } else {
      // Remove from chain
      removeFromOverflowChain(contentId);
    }
  };

  const addToOverflowChain = (contentId: string, regionId: string) => {
    const contentType = getContentTypeFromId(contentId);

    setOverflowChains(prevChains => {
      const newChains = new Map(prevChains);
      const currentChain = newChains.get(contentType) || [];

      // Only add if not already in chain
      if (!currentChain.includes(contentId)) {
        // Add to end of chain to maintain sequential order
        const newChain = [...currentChain, contentId];
        newChains.set(contentType, newChain);

        // Show notification
        const role = newChain.length === 1 ? 'Initiator' : `Connector ${newChain.length}`;
        const contentTypeName = contentType === 'line-text' ? 'Line Text' :
                               contentType === 'pure-english-paragraph' ? 'Pure English Paragraph' :
                               contentType === 'translation-paragraph' ? 'Translation Paragraph' : contentType;
        setNotification(`✅ ${contentTypeName} overflow ${role} created`);
        setTimeout(() => setNotification(null), 3000);
      }

      return newChains;
    });
  };

  const removeFromOverflowChain = (contentId: string) => {
    const contentType = getContentTypeFromId(contentId);

    // First, clear the text content immediately
    setRegionContents(prevContents => {
      const newContents = new Map(prevContents);

      // Find the region containing this content and clear its text
      for (const [regionId, contents] of Array.from(newContents.entries())) {
        const contentIndex = contents.findIndex((c: any) => c.id === contentId);
        if (contentIndex >= 0) {
          const updatedContents = [...contents];
          updatedContents[contentIndex] = {
            ...updatedContents[contentIndex],
            content: { ...updatedContents[contentIndex].content, text: '' }
          };
          newContents.set(regionId, updatedContents);
          break;
        }
      }

      return newContents;
    });

    // Then remove from overflow chain
    setOverflowChains(prevChains => {
      const newChains = new Map(prevChains);
      const currentChain = newChains.get(contentType) || [];

      // Remove the content from chain
      const newChain = currentChain.filter(id => id !== contentId);

      if (newChain.length === 0) {
        // Delete the entire chain if empty
        newChains.delete(contentType);
      } else {
        // Update chain - remaining items will be renumbered automatically
        newChains.set(contentType, newChain);

        // Trigger recalculation for the remaining chain
        if (newChain.length > 0) {
          // Find the initiator (first in chain) and recalculate
          const initiatorId = newChain[0];
          setTimeout(() => {
            recalculateOverflowChain(initiatorId);
          }, 0);
        }
      }

      setNotification(`❌ Removed from overflow chain and text cleared`);
      setTimeout(() => setNotification(null), 3000);

      return newChains;
    });
  };

  // Helper function to handle content deletion with overflow renumbering
  const deleteContentWithOverflowCleanup = (contentId: string, regionId: string) => {
    // Check if this content is part of an overflow chain
    const isInOverflow = isOverflowEnabled(contentId);

    if (isInOverflow) {
      // Remove from overflow chain (this will automatically renumber remaining items)
      removeFromOverflowChain(contentId);
    }

    // Remove from region contents
    const currentContents = regionContents.get(regionId) || [];
    const newContents = currentContents.filter(c => c.id !== contentId);
    const updatedContents = new Map(regionContents);

    if (newContents.length === 0) {
      updatedContents.delete(regionId);
    } else {
      updatedContents.set(regionId, newContents);
    }

    setRegionContents(updatedContents);

    // Show notification
    const regionName = (() => {
      // Find region name from data
      for (const mother of data?.objects || []) {
        const regions = (mother as any).regions || [];
        const region = regions.find((r: any) => r.id === regionId);
        if (region) return region.name;
      }
      return regionId;
    })();

    setNotification(`Content deleted from ${regionName}${isInOverflow ? ' (overflow renumbered)' : ''}`);
    setTimeout(() => setNotification(null), 3000);
  };

  const getOverflowRole = (contentId: string): 'initiator' | 'connector' | 'none' => {
    const contentType = getContentTypeFromId(contentId);
    const chain = overflowChains.get(contentType) || [];
    const chainIndex = chain.indexOf(contentId);

    if (chainIndex === -1) return 'none';
    if (chainIndex === 0) return 'initiator';
    return 'connector';
  };

  // Get master properties for overflow chain connectors
  const getMasterProperties = (contentId: string): { layout: any; typography: any } | null => {
    const contentType = getContentTypeFromId(contentId);
    const chain = overflowChains.get(contentType) || [];
    const chainIndex = chain.indexOf(contentId);

    if (chainIndex > 0) { // This is a connector
      const masterContentId = chain[0]; // First in chain is master

      // Find the master content object
      const regionEntries = Array.from(regionContents.entries());
      for (const [regionId, contents] of regionEntries) {
        const masterContent = contents.find((c: any) => c.id === masterContentId);
        if (masterContent) {
          return {
            layout: masterContent.layout,
            typography: masterContent.typography
          };
        }
      }
    }
    return null;
  };

  // PHASE 1: Precise text measurement utilities
  const createTextMeasurementCanvas = (): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Set high DPI for accurate measurements
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 1000 * dpr;
      canvas.height = 1000 * dpr;
      ctx.scale(dpr, dpr);

      return { canvas, ctx };
    } catch (error) {
      console.warn('Failed to create measurement canvas:', error);
      return null;
    }
  };

  const measureTextPrecisely = (
    text: string,
    fontSize: number,
    fontFamily: string = 'Arial'
  ): { width: number; height: number } => {
    const measurement = createTextMeasurementCanvas();
    if (!measurement) {
      // Fallback to approximation if canvas fails
      console.warn('⚠️ Canvas measurement failed, using fallback approximation for:', text);
      return {
        width: text.length * fontSize * 0.6,
        height: fontSize * 1.2
      };
    }

    const { ctx } = measurement;
    ctx.font = `${fontSize}px ${fontFamily}`;

    const metrics = ctx.measureText(text);
    const width = metrics.width;

    // Calculate actual text height using font metrics
    const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    // DEBUG: Log measurement results for debugging
    if (text.includes('The quick brown fox')) {
      console.log('🔍 measureTextPrecisely DEBUG:', {
        text: text.substring(0, 30) + '...',
        fontSize: fontSize + 'px',
        fontFamily,
        measuredWidth: width + 'px',
        textLength: text.length,
        widthPerChar: (width / text.length).toFixed(2) + 'px'
      });
    }

    return {
      width: width,
      height: height || fontSize // Fallback if actualBoundingBox not supported
    };
  };

  const getZoomInvariantMeasurements = (
    regionWidth: number,
    regionHeight: number,
    padding: { top: number; right: number; bottom: number; left: number }
  ): { effectiveWidth: number; effectiveHeight: number } => {
    // Always work in mm units - zoom should not affect these calculations
    const effectiveWidth = Math.max(0, regionWidth - padding.left - padding.right);
    const effectiveHeight = Math.max(0, regionHeight - padding.top - padding.bottom);

    return { effectiveWidth, effectiveHeight };
  };

  // ENHANCED: Calculate precise text capacity with actual measurements
  const calculatePreciseTextCapacity = (
    regionWidth: number,
    regionHeight: number,
    fontSize: number = 12,
    fontFamily: string = 'Arial',
    padding: { top: number; right: number; bottom: number; left: number } = { top: 2, right: 2, bottom: 2, left: 2 },
    maxUtilization: boolean = false // New parameter for aggressive fitting
  ): { maxLines: number; avgCharsPerLine: number; totalCapacity: number; utilizationTarget: number } => {

    const { effectiveWidth, effectiveHeight } = getZoomInvariantMeasurements(regionWidth, regionHeight, padding);

    // Convert mm to pixels for text measurement (3.78 px/mm at 96 DPI)
    const mmToPx = 3.78;
    const effectiveWidthPx = effectiveWidth * mmToPx;
    const effectiveHeightPx = effectiveHeight * mmToPx;

    // Measure actual line height with the specific font
    const sampleText = "Ag"; // Contains ascenders and descenders
    const lineMetrics = measureTextPrecisely(sampleText, fontSize, fontFamily);
    const actualLineHeight = Math.max(lineMetrics.height * 1.2, fontSize * 1.2); // 1.2 line spacing

    // Calculate maximum lines that can fit
    const maxLines = Math.floor(effectiveHeightPx / actualLineHeight);

    // Measure average character width using common text sample
    const charSample = "The quick brown fox jumps over the lazy dog 1234567890";
    const charMetrics = measureTextPrecisely(charSample, fontSize, fontFamily);
    const avgCharWidth = charMetrics.width / charSample.length;

    // Calculate average characters per line
    const avgCharsPerLine = Math.floor(effectiveWidthPx / avgCharWidth);

    // DEBUG: Log all measurements
    console.log('🔍 calculatePreciseTextCapacity DEBUG:', {
      regionWidth: regionWidth + 'mm',
      effectiveWidth: effectiveWidth + 'mm', 
      effectiveWidthPx: effectiveWidthPx + 'px',
      fontSize: fontSize + 'px',
      fontFamily,
      charSample: charSample.substring(0, 20) + '...',
      charSampleLength: charSample.length,
      charMetricsWidth: charMetrics.width + 'px',
      avgCharWidth: avgCharWidth + 'px',
      avgCharsPerLine,
      maxLines
    });

    // Total capacity with safety margin
    const totalCapacity = maxLines * avgCharsPerLine;

    // Set utilization target based on mode
    const utilizationTarget = maxUtilization 
      ? totalCapacity // Use 100% for aggressive fitting (new-line-text)
      : Math.floor(totalCapacity * 0.95); // Use 95% for conservative fitting (legacy)

    return {
      maxLines,
      avgCharsPerLine,
      totalCapacity,
      utilizationTarget
    };
  };

  // LEGACY: Keep old function for backward compatibility during transition
  const calculateTextCapacity = (regionWidth: number, regionHeight: number, fontSize: number = 12): number => {
    // Use new precise calculation but return only total capacity for compatibility
    const precise = calculatePreciseTextCapacity(regionWidth, regionHeight, fontSize);
    return precise.utilizationTarget; // Return the 95% target instead of full capacity
  };

  // PHASE 1: Enhanced text fitting with precise measurements
  const findOptimalTextFit = (
    text: string,
    regionWidth: number,
    regionHeight: number,
    fontSize: number,
    fontFamily: string = 'Arial',
    padding: { top: number; right: number; bottom: number; left: number } = { top: 2, right: 2, bottom: 2, left: 2 },
    maxUtilization: boolean = false // New parameter for aggressive fitting
  ): { fitting: string; overflow: string; utilizationPercent: number; linesUsed: number; fittingLines: string[] } => {

    if (!text || text.length === 0) {
      return { fitting: '', overflow: '', utilizationPercent: 0, linesUsed: 0, fittingLines: [] };
    }

    const { effectiveWidth, effectiveHeight } = getZoomInvariantMeasurements(regionWidth, regionHeight, padding);
    const mmToPx = 3.78;
    const effectiveWidthPx = effectiveWidth * mmToPx;
    const effectiveHeightPx = effectiveHeight * mmToPx;

    // Get precise capacity metrics with max utilization setting
    const capacity = calculatePreciseTextCapacity(regionWidth, regionHeight, fontSize, fontFamily, padding, maxUtilization);

    // Create measurement context
    const measurement = createTextMeasurementCanvas();
    if (!measurement) {
      console.warn('❌ Canvas measurement not available, using legacy fallback');
      // Fallback to simple word-based splitting
      const legacyResult = splitTextByWordsLegacy(text, capacity.utilizationTarget);
      const legacyLines = legacyResult.fitting.split(' ').reduce((lines: string[], word: string, index: number) => {
        if (index === 0) {
          lines.push(word);
        } else {
          const lastLine = lines[lines.length - 1];
          if (lastLine.length + word.length + 1 <= capacity.avgCharsPerLine) {
            lines[lines.length - 1] = lastLine + ' ' + word;
          } else {
            lines.push(word);
          }
        }
        return lines;
      }, []);

      return {
        fitting: legacyResult.fitting,
        overflow: legacyResult.overflow,
        utilizationPercent: legacyResult.fitting.length > 0 ? (legacyResult.fitting.length / capacity.totalCapacity) * 100 : 0,
        linesUsed: legacyLines.length,
        fittingLines: legacyLines
      };
    }

    const { ctx } = measurement;
    ctx.font = `${fontSize}px ${fontFamily}`;

    const lineHeight = Math.max(fontSize * 1.2, measureTextPrecisely("Ag", fontSize, fontFamily).height * 1.2);
    const maxLines = Math.floor(effectiveHeightPx / lineHeight);

    // Split text into words for processing
    const words = text.split(' ');
    const fittingLines: string[] = [];
    let currentLine = '';
    let wordIndex = 0;

    // Build lines word by word, measuring actual width
    while (wordIndex < words.length && fittingLines.length < maxLines) {
      const word = words[wordIndex];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const lineWidth = ctx.measureText(testLine).width;

      if (lineWidth <= effectiveWidthPx) {
        // Word fits on current line
        currentLine = testLine;
        wordIndex++;
      } else {
        // Word doesn't fit, start new line
        if (currentLine) {
          fittingLines.push(currentLine);
          currentLine = word;
          wordIndex++;
        } else {
          // Single word is too long for line - force it and move on
          fittingLines.push(word);
          currentLine = '';
          wordIndex++;
        }
      }
    }

    // Add the last line if it has content
    if (currentLine && fittingLines.length < maxLines) {
      fittingLines.push(currentLine);
    }

    // Calculate results
    const fitting = fittingLines.join(' ');
    const remainingWords = words.slice(wordIndex);
    const overflow = remainingWords.join(' ');

    // Calculate utilization percentage
    const totalPossibleChars = capacity.totalCapacity;
    const utilizationPercent = totalPossibleChars > 0 ? (fitting.length / totalPossibleChars) * 100 : 0;

    return {
      fitting,
      overflow,
      utilizationPercent,
      linesUsed: fittingLines.length,
      fittingLines
    };
  };

  // LEGACY: Keep old function for backward compatibility
  const splitTextByWords = (text: string, capacity: number): { fitting: string; overflow: string } => {
    return splitTextByWordsLegacy(text, capacity);
  };

  const splitTextByWordsLegacy = (text: string, capacity: number): { fitting: string; overflow: string } => {
    if (text.length <= capacity) {
      return { fitting: text, overflow: '' };
    }

    const words = text.split(' ');
    let fitting = '';
    let overflow = '';
    let currentLength = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordWithSpace = i === 0 ? word : ' ' + word;

      if (currentLength + wordWithSpace.length <= capacity) {
        fitting += wordWithSpace;
        currentLength += wordWithSpace.length;
      } else {
        // Start overflow with remaining words
        overflow = words.slice(i).join(' ');
        break;
      }
    }

    return { fitting, overflow };
  };

  // Check if connector can fit more text (is it completely full?)
  const isConnectorFull = (currentText: string, capacity: number, remainingText: string): boolean => {
    if (!remainingText || remainingText.length === 0) {
      return true; // No more text to add, so it's "full" in context
    }

    // Try to add the next word from remaining text
    const nextWords = remainingText.split(' ');
    if (nextWords.length === 0) return true;

    const nextWord = ' ' + nextWords[0]; // Add space before next word
    const wouldFitWithNextWord = currentText.length + nextWord.length <= capacity;

    // Connector is full if it cannot fit the next word
    return !wouldFitWithNextWord;
  };

  // SIMPLE: Clear ALL (initiator + connectors) and get original text
  const clearAllAndGetOriginalText = (contentType: string, initiatorRegionId: string, initiatorContentId: string): string => {
    console.log(`🧹 CLEAR ALL: Clearing initiator + all connectors for ${contentType}`);

    // Get the chain for this content type (array of content IDs)
    const chain = overflowChains.get(contentType) || [];

    // Get original text from initiator BEFORE clearing
    const initiatorContents = regionContents.get(initiatorRegionId) || [];
    const initiatorContent = initiatorContents.find((c: any) => c.id === initiatorContentId);
    const originalText = initiatorContent?.content?.text || '';



    // Clear ALL in the chain (including initiator at position 0)
    const newContents = new Map(regionContents);

    chain.forEach((contentId, index) => {
      // Find which region contains this content
      let regionId = '';
      let contentIndex = -1;

      for (const [rId, contents] of Array.from(newContents.entries())) {
        const foundIndex = contents.findIndex((c: any) => c.id === contentId);
        if (foundIndex !== -1) {
          regionId = rId;
          contentIndex = foundIndex;
          break;
        }
      }

      if (contentIndex !== -1) {
        const contents = newContents.get(regionId) || [];
        const updatedContents = [...contents];
        updatedContents[contentIndex] = {
          ...updatedContents[contentIndex],
          content: { ...updatedContents[contentIndex].content, text: '' }
        };
        newContents.set(regionId, updatedContents);
        console.log(`🗑️ Cleared position ${index}: ${regionId}/${contentId}`);
      }
    });

    // Update state with ALL cleared
    setRegionContents(newContents);

    return originalText;
  };

  // Helper function to get all regions including slices (children)
  const getAllRegionsIncludingSlices = (): any[] => {
    const allRegions: any[] = [];
    data?.objects.forEach((obj: any) => {
      if ((obj as any).regions) {
        (obj as any).regions.forEach((region: any) => {
          // Add the parent region
          allRegions.push(region);
          // Add any child regions (slices)
          if (region.children && region.children.length > 0) {
            allRegions.push(...region.children);
          }
        });
      }
    });
    return allRegions;
  };

  // Helper function to find a region by ID (including slices)
  const findRegionById = (regionId: string): any => {
    for (const obj of data?.objects || []) {
      if ((obj as any).regions) {
        for (const region of (obj as any).regions) {
          // Check parent region
          if (region.id === regionId) {
            return region;
          }
          // Check child regions (slices)
          if (region.children && region.children.length > 0) {
            const childRegion = region.children.find((child: any) => child.id === regionId);
            if (childRegion) {
              return childRegion;
            }
          }
        }
      }
    }
    return null;
  };

  // CLEAR AND REDISTRIBUTE: When initiator changes, clear all connectors and redistribute from scratch
  const recalculateOverflowChainWithText = (contentId: string, newText: string) => {
    const contentType = getContentTypeFromId(contentId);
    const chain = overflowChains.get(contentType) || [];

    if (chain.length === 0) return;

    // Find the initiator (first in chain) regardless of which content ID was passed
    const masterContentId = chain[0];

    // If this content is not in the chain, ignore
    if (!chain.includes(contentId)) return;

    console.log(`🔄 FONT SIZE REDISTRIBUTION WITH TEXT: Starting for ${contentType} (triggered by ${contentId}, initiator: ${masterContentId})`);

    // Use the provided text directly instead of reading from state
    const originalText = newText || '';

    console.log(`📝 Starting redistribution with provided text (${originalText.length} chars)`);
    console.log(`🔍 PROVIDED TEXT DEBUG:`);
    console.log('   - Master Content ID:', masterContentId);
    console.log('   - Provided Text:', originalText);
    console.log('   - Text Length:', originalText.length);

    // STEP 2: Clear ALL positions in the chain
    const newContents = new Map(regionContents);

    chain.forEach((contentId, index) => {
      const regionEntry = Array.from(regionContents.entries()).find(([regionId, contents]) =>
        contents.some((c: any) => c.id === contentId)
      );

      if (regionEntry) {
        const [regionId, contents] = regionEntry;
        const updatedContents = [...contents];
        const contentIndex = updatedContents.findIndex((c: any) => c.id === contentId);

        if (contentIndex !== -1) {
          updatedContents[contentIndex] = {
            ...updatedContents[contentIndex],
            content: { ...updatedContents[contentIndex].content, text: '' }
          };
          newContents.set(regionId, updatedContents);
          console.log(`🗑️ Cleared position ${index}: ${regionId}/${contentId}`);
        }
      }
    });

    // STEP 3: Get master region for capacity calculation
    const masterRegionEntry = Array.from(regionContents.entries()).find(([regionId, contents]) =>
      contents.some((c: any) => c.id === masterContentId)
    );

    if (!masterRegionEntry) return;

    const [masterRegionId] = masterRegionEntry;
    const masterContents = regionContents.get(masterRegionId) || [];
    const masterContent = masterContents.find((c: any) => c.id === masterContentId);
    if (!masterContent) return;

    const masterRegion = (data?.objects.find((obj: any) =>
      (obj as any).regions?.some((r: any) => r.id === masterRegionId)
    ) as any)?.regions?.find((r: any) => r.id === masterRegionId);

    if (!masterRegion) return;

    // Get master properties that will be applied to ALL positions in the chain
    const masterTypography = masterContent.typography || {};
    const masterLayout = masterContent.layout || {};
    const masterFontSize = masterTypography.fontSize || 12;
    const masterPadding = masterLayout.padding || { top: 2, right: 2, bottom: 2, left: 2 };

    console.log('🔄 CLEAR AND REDISTRIBUTE:', {
      masterContentId,
      originalTextLength: originalText.length,
      masterFontSize,
      chainLength: chain.length,
      usingMasterProperties: true
    });

    // Continue with redistribution using the provided text...
    let currentText = originalText;

    console.log(`\n🔗 ===== OVERFLOW CHAIN DEBUG =====`);
    console.log(`📋 Chain:`, chain.map((id, pos) => `#${pos + 1}: ${id}`).join(' → '));
    console.log(`📏 Original text length: ${originalText.length} chars`);
    console.log(`🎯 Master content: ${masterContentId}`);

    // Process each position in chain sequentially
    for (let position = 0; position < chain.length; position++) {
      const contentId = chain[position];
      const isInitiator = position === 0;

      console.log(`\n📍 Processing #${position + 1} (${isInitiator ? 'INITIATOR' : 'CONNECTOR'}): ${contentId}`);

      if (!currentText || currentText.length === 0) {
        console.log(`🛑 No more text to distribute, stopping at #${position + 1}`);
        break;
      }

      // Find region containing this content
      let targetRegionId = '';
      let targetContentIndex = -1;

      for (const [regionId, contents] of Array.from(newContents.entries())) {
        const foundIndex = contents.findIndex((c: any) => c.id === contentId);
        if (foundIndex !== -1) {
          targetRegionId = regionId;
          targetContentIndex = foundIndex;
          break;
        }
      }

      if (targetContentIndex === -1) {
        console.log(`❌ Could not find content ${contentId}, skipping`);
        continue;
      }

      // Get region for capacity calculation
      const targetRegion = (data?.objects.find((obj: any) =>
        (obj as any).regions?.some((r: any) => r.id === targetRegionId)
      ) as any)?.regions?.find((r: any) => r.id === targetRegionId);

      if (!targetRegion) {
        console.log(`❌ Could not find region ${targetRegionId}, skipping`);
        continue;
      }

      // Get content for updating
      const targetContents = newContents.get(targetRegionId) || [];
      const targetContent = targetContents[targetContentIndex];

      // Use master properties for entire chain
      const fontSize = masterFontSize;
      const padding = masterPadding;
      const fontFamily = masterTypography.fontFamily || 'Arial';

      // Use optimal text fitting
      const optimalFit = findOptimalTextFit(
        currentText,
        targetRegion.width,
        targetRegion.height,
        fontSize,
        fontFamily,
        padding
      );

      const fitting = optimalFit.fitting;
      const overflow = optimalFit.overflow;

      console.log(`📊 OPTIMAL FIT #${position + 1}:`);
      console.log(`   - Fitting: "${fitting.substring(0, 50)}${fitting.length > 50 ? '...' : ''}" (${fitting.length} chars)`);
      console.log(`   - Overflow: "${overflow.substring(0, 50)}${overflow.length > 50 ? '...' : ''}" (${overflow.length} chars)`);

      // Update content with fitted text
      const updatedContents = [...targetContents];
      const isInitiatorPosition = position === 0;

      updatedContents[targetContentIndex] = {
        ...updatedContents[targetContentIndex],
        content: {
          ...updatedContents[targetContentIndex].content,
          text: fitting,
          // Store original text only in the initiator (#1)
          ...(isInitiatorPosition && { originalText: originalText })
        },
        typography: { ...masterTypography },
        layout: { ...masterLayout }
      };
      newContents.set(targetRegionId, updatedContents);

      console.log(`✅ Updated #${position + 1} (${targetRegionId}) with ${fitting.length} chars`);

      // Move overflow to next position
      currentText = overflow;
      console.log(`➡️ Remaining for next: ${overflow.length} chars`);
    }

    console.log(`🏁 ===== OVERFLOW COMPLETE =====\n`);

    // Update state with final result
    setRegionContents(newContents);
  };

  const recalculateOverflowChain = (contentId: string) => {
    const contentType = getContentTypeFromId(contentId);
    const chain = overflowChains.get(contentType) || [];

    if (chain.length === 0) return;

    // Find the initiator (first in chain) regardless of which content ID was passed
    const masterContentId = chain[0];

    // If this content is not in the chain, ignore
    if (!chain.includes(contentId)) return;

    console.log(`🔄 FONT SIZE REDISTRIBUTION: Starting for ${contentType} (triggered by ${contentId}, initiator: ${masterContentId})`);

    // STEP 1: Get original text from Position #1 only (the initiator)
    const masterRegionEntry = Array.from(regionContents.entries()).find(([regionId, contents]) =>
      contents.some((c: any) => c.id === masterContentId)
    );

    if (!masterRegionEntry) return;

    const [masterRegionId] = masterRegionEntry;
    const masterContents = regionContents.get(masterRegionId) || [];
    const masterContent = masterContents.find((c: any) => c.id === masterContentId);
    if (!masterContent) return;

    // Original text = Position #1 text only
    const originalText = masterContent.content.text || '';

    console.log(`📝 Starting redistribution with original text (${originalText.length} chars)`);
    console.log(`🔍 MASTER CONTENT DEBUG:`);
    console.log('   - Master Content ID:', masterContentId);
    console.log('   - Original Text Full:', originalText);
    console.log('   - Original Text Length:', originalText.length);
    console.log('   - Master Content Object:', masterContent);
    console.log('   - Content.text:', masterContent.content.text);

    // STEP 2: Clear ALL positions in the chain
    const newContents = new Map(regionContents);

    chain.forEach((contentId, index) => {
      const regionEntry = Array.from(regionContents.entries()).find(([regionId, contents]) =>
        contents.some((c: any) => c.id === contentId)
      );

      if (regionEntry) {
        const [regionId, contents] = regionEntry;
        const updatedContents = [...contents];
        const contentIndex = updatedContents.findIndex((c: any) => c.id === contentId);

        if (contentIndex !== -1) {
          updatedContents[contentIndex] = {
            ...updatedContents[contentIndex],
            content: { ...updatedContents[contentIndex].content, text: '' }
          };
          newContents.set(regionId, updatedContents);
          console.log(`🗑️ Cleared position ${index}: ${regionId}/${contentId}`);
        }
      }
    });

    // STEP 3: Get master region for capacity calculation
    const masterRegion = (data?.objects.find((obj: any) =>
      (obj as any).regions?.some((r: any) => r.id === masterRegionId)
    ) as any)?.regions?.find((r: any) => r.id === masterRegionId);

    if (!masterRegion) return;

    // Get master properties that will be applied to ALL positions in the chain
    const masterTypography = masterContent.typography || {};
    const masterLayout = masterContent.layout || {};
    const masterFontSize = masterTypography.fontSize || 12;
    const masterPadding = masterLayout.padding || { top: 2, right: 2, bottom: 2, left: 2 };

    console.log('🔄 CLEAR AND REDISTRIBUTE:', {
      masterContentId,
      originalTextLength: originalText.length,
      masterFontSize,
      chainLength: chain.length,
      usingMasterProperties: true
    });

    // STEP 4: SIMPLE SEQUENTIAL REDISTRIBUTION - Follow the rule exactly
    console.log(`🔄 Starting sequential redistribution...`);
    let currentText = originalText;

    // LOG THE ACTUAL CHAIN DATA
    console.log(`🔗 CHAIN DATA for content type: ${contentType}`);

    // Get all regions from data (including slices)
    const allRegions: any[] = getAllRegionsIncludingSlices();

    console.log(`📋 Chain positions:`, chain.map((contentId, index) => {
      // Find which region contains this content ID
      const regionEntry = Array.from(regionContents.entries()).find(([regionId, contents]) =>
        contents.some((c: any) => c.id === contentId)
      );
      const regionId = regionEntry ? regionEntry[0] : 'unknown';

      // DEBUG: Show which physical region this maps to
      const regionObj = allRegions.find(r => r.id === regionId);
      const regionName = regionObj?.name || 'Unknown';
      console.log(`   Position ${index}: ${regionName} (${regionId}) → Content: ${contentId}`);

      const contents = regionContents.get(regionId) || [];
      const targetContent = contents.find(c => c.id === contentId);
      return `${index}: ${regionObj?.name || regionId} (content: ${contentId}) - hasText: ${!!targetContent?.content.text}`;
    }));

    // Process each position in chain sequentially
    for (let position = 0; position < chain.length; position++) {
      const contentId = chain[position];
      const isInitiator = position === 0;

      console.log(`📍 Processing position ${position} (${isInitiator ? 'INITIATOR' : 'CONNECTOR'}): ${contentId}`);

      if (!currentText || currentText.length === 0) {
        console.log(`🛑 No more text to distribute, stopping at position ${position}`);
        break;
      }

      // Find region containing this content
      let targetRegionId = '';
      let targetContentIndex = -1;

      for (const [regionId, contents] of Array.from(newContents.entries())) {
        const foundIndex = contents.findIndex((c: any) => c.id === contentId);
        if (foundIndex !== -1) {
          targetRegionId = regionId;
          targetContentIndex = foundIndex;
          break;
        }
      }

      if (targetContentIndex === -1) {
        console.log(`❌ Could not find content ${contentId}, skipping`);
        continue;
      }

      // Get region for capacity calculation using helper function
      const targetRegion = findRegionById(targetRegionId);

      if (!targetRegion) {
        console.log(`❌ Could not find region ${targetRegionId}, skipping`);
        continue;
      }

      // Get content for updating - but use ONLY master properties for capacity and updating
      const targetContents = newContents.get(targetRegionId) || [];
      const targetContent = targetContents[targetContentIndex];

      // USE ONLY MASTER PROPERTIES for entire chain - no individual content properties
      const fontSize = masterFontSize;
      const padding = masterPadding;
      const fontFamily = masterTypography.fontFamily || 'Arial';

      // PHASE 1: Use precise capacity calculation
      const preciseCapacity = calculatePreciseTextCapacity(
        targetRegion.width,
        targetRegion.height,
        fontSize,
        fontFamily,
        padding
      );

      const capacity = preciseCapacity.utilizationTarget; // Use 95% target for overflow trigger

      console.log(`📊 PRECISE CAPACITY DEBUG: Position ${position}:`);
      console.log(`   - Region: ${targetRegion.width}×${targetRegion.height}mm`);
      console.log(`   - Font: ${fontSize}px ${fontFamily}`);
      console.log(`   - Lines: ${preciseCapacity.maxLines}, Chars/line: ${preciseCapacity.avgCharsPerLine}`);
      console.log(`   - Total capacity: ${preciseCapacity.totalCapacity}, Target: ${capacity}`);
      console.log(`   - Current text: ${currentText.length} chars`);

      // PHASE 1: Use optimal text fitting with precise measurements
      const optimalFit = findOptimalTextFit(
        currentText,
        targetRegion.width,
        targetRegion.height,
        fontSize,
        fontFamily,
        padding
      );

      const fitting = optimalFit.fitting;
      const overflow = optimalFit.overflow;

      console.log(`📊 OPTIMAL FIT Position ${position}:`);
      console.log(`   - Lines used: ${optimalFit.linesUsed}/${preciseCapacity.maxLines}`);
      console.log(`   - Utilization: ${optimalFit.utilizationPercent.toFixed(1)}%`);
      console.log(`   - Fitting: ${fitting.length} chars`);
      console.log(`   - Overflow: ${overflow.length} chars`);

      // Update content with fitted text AND inherit ALL master properties
      const updatedContents = [...targetContents];
      updatedContents[targetContentIndex] = {
        ...updatedContents[targetContentIndex],
        content: { ...updatedContents[targetContentIndex].content, text: fitting },
        typography: { ...masterTypography }, // Inherit ALL master typography
        layout: { ...masterLayout } // Inherit ALL master layout
      };
      newContents.set(targetRegionId, updatedContents);

      console.log(`✅ Position ${position} filled; overflow length: ${overflow.length}`);

      // Move precise overflow to next position
      currentText = overflow;
      console.log(`➡️ Moving ${overflow.length} chars to next position`);
    }

    console.log(`🏁 Sequential redistribution complete`);

    // Update state with final result
    setRegionContents(newContents);
  };

  // Get overflow number for display - count existing same content type
  const getOverflowNumber = (contentId: string): number => {
    // If overflow not enabled, return 0 (will show nothing)
    if (!isOverflowEnabled(contentId)) {
      return 0;
    }

    const contentType = getContentTypeFromId(contentId);
    const chain = overflowChains.get(contentType) || [];

    // Find position in the overflow chain (1-based)
    const position = chain.indexOf(contentId);

    // If found in chain, return position + 1
    // If not found but overflow enabled, it means it will be added next, so count existing + 1
    if (position >= 0) {
      return position + 1;
    } else {
      // Not in chain yet but overflow enabled - will be next number
      return chain.length + 1;
    }
  };

  const isOverflowEnabled = (contentId: string): boolean => {
    return overflowSettings.get(contentId) || false;
  };

  // Clear all overflow chains (useful for debugging/reset)
  const clearAllOverflowChains = () => {
    setOverflowChains(new Map());
    setOverflowSettings(new Map());
    setNotification('🔄 All overflow chains cleared');
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper function to get content type from content ID
  const getContentTypeFromId = (contentId: string): string => {
    // Find the content in regionContents to get its type
    for (const [regionId, contents] of Array.from(regionContents.entries())) {
      const content = contents.find((c: any) => c.id === contentId);
      if (content) {
        return content.type;
      }
    }
    return 'unknown';
  };

  const handleContentDoubleClick = (content: any, regionId: string) => {
    console.log('🖱️ Double-clicked content:', content.type, content.id);

    // Handle new-line-text content type specially
    if (content.type === 'new-line-text') {
      // Find the region from current data (check both main regions and child regions/slices)
      const currentData = data || webCreationData;
      let region: any = null;

      if (currentData) {
        for (const obj of currentData.objects) {
          if (obj.type?.includes('mother')) {
            const regions = (obj as any).regions || [];

            // First check main regions
            region = regions.find((r: any) => r.id === regionId);
            if (region) break;

            // If not found in main regions, check child regions (slices)
            for (const parentRegion of regions) {
              if (parentRegion.children && parentRegion.children.length > 0) {
                const childRegion = parentRegion.children.find((child: any) => child.id === regionId);
                if (childRegion) {
                  region = childRegion;
                  break;
                }
              }
            }
            if (region) break;
          }
        }
      }
      
      if (!region) {
        setNotification(`❌ Region ${regionId} not found`);
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // Open NewLineTextDialog for editing with existing content
      setNewLineTextDialog({
        isOpen: true,
        regionId: regionId,
        regionWidth: region.width,
        regionHeight: region.height,
        editingContent: content
      });
      return;
    }

    // Handle new-multi-line content type specially
    if (content.type === 'new-multi-line') {
      console.log('🆕 NEW CT Multi-line double-clicked - Opening configuration dialog');

      // Find the region from current data (check both main regions and child regions/slices)
      const currentData = data || webCreationData;
      let region: any = null;

      if (currentData) {
        for (const obj of currentData.objects) {
          if (obj.type?.includes('mother')) {
            const regions = (obj as any).regions || [];

            // First check main regions
            region = regions.find((r: any) => r.id === regionId);
            if (region) break;

            // If not found in main regions, check child regions (slices)
            for (const parentRegion of regions) {
              if (parentRegion.children && parentRegion.children.length > 0) {
                const childRegion = parentRegion.children.find((child: any) => child.id === regionId);
                if (childRegion) {
                  region = childRegion;
                  break;
                }
              }
            }
            if (region) break;
          }
        }
      }

      if (!region) {
        setNotification(`❌ Region ${regionId} not found`);
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // Debug: Check actual region data
      console.log('🔍 REGION DEBUG - Opening NewMultiLineDialog for editing:', {
        regionId: regionId,
        regionData: region,
        actualWidth: region.width,
        actualHeight: region.height,
        expectedWidth: '35mm (if this shows 33mm, the region data is wrong)'
      });

      // Open NewMultiLineDialog for editing with existing content
      setNewMultiLineDialog({
        isOpen: true,
        regionId: regionId,
        regionWidth: region.width,
        regionHeight: region.height,
        editingContent: content
      });
      return;
    }

    // Handle new-washing-care-symbol content type - open blank dialog
    if (content.type === 'new-washing-care-symbol') {
      console.log('🧺 NEW CT Washing Care Symbol double-clicked - Opening blank dialog');

      // Find the region from current data (check both main regions and child regions/slices)
      const currentData = data || webCreationData;
      let region: any = null;

      if (currentData) {
        for (const obj of currentData.objects) {
          if (obj.type?.includes('mother')) {
            const regions = (obj as any).regions || [];

            // First check main regions
            region = regions.find((r: any) => r.id === regionId);
            if (region) break;

            // If not found in main regions, check child regions (slices)
            for (const parentRegion of regions) {
              if (parentRegion.children && parentRegion.children.length > 0) {
                const childRegion = parentRegion.children.find((child: any) => child.id === regionId);
                if (childRegion) {
                  region = childRegion;
                  break;
                }
              }
            }
            if (region) break;
          }
        }
      }

      if (!region) {
        setNotification(`❌ Region ${regionId} not found`);
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // Open blank dialog for editing existing content
      setNewWashingCareSymbolDialog({
        isOpen: true,
        regionId: regionId,
        regionWidth: region.width,
        regionHeight: region.height,
        editingContent: content
      });
      return;
    }

    // Find the content type from available content types
    const contentTypes = [
      { id: 'line-text', name: 'Line Text', icon: '📝', description: 'Single line text content' },
      { id: 'translation-paragraph', name: 'Translation Paragraph', icon: '🌐', description: 'Multi-language paragraph content' },
      { id: 'pure-english-paragraph', name: 'Pure English Paragraph', icon: '📄', description: 'English-only paragraph content' },
      { id: 'washing-symbol', name: 'Washing Symbol', icon: '🧺', description: 'Care instruction symbols' },
      { id: 'image', name: 'Image', icon: '🖼️', description: 'Image content' },
      { id: 'coo', name: 'COO', icon: '🏷️', description: 'Country of origin information' }
    ];

    const contentType = contentTypes.find(ct => ct.id === content.type);
    if (contentType) {
      // Open the universal content dialog for editing
      setUniversalDialog({
        isOpen: true,
        regionId: regionId,
        contentType: contentType,
        editingContent: content
      });
    }
  };

  const handleLineTextOverflow = (regionId: string, newContent: any) => {
    // Check if region is getting full and if there are overflow connections
    const contentType = newContent.type;
    const chain = overflowChains.get(contentType) || [];
    if (chain.length < 2) {
      // No overflow chain exists for this content type, nothing to do
      return;
    }

    // Find if any content in this region is part of any overflow chain
    const regionContentsArray = regionContents.get(regionId) || [];
    const chainContentInRegion = regionContentsArray.find((content: any) =>
      isOverflowEnabled(content.id)
    );

    if (!chainContentInRegion) {
      // This region doesn't have overflow-enabled content
      return;
    }

    // Get the content type and check for overflow
    const chainContentType = chainContentInRegion.type;
    const contentTypeCount = regionContentsArray.filter((content: any) => content.type === chainContentType).length;

    if (contentTypeCount > 1) {
      console.log(`🌊 ${chainContentType} overflow detected in region:`, regionId);

      // Find the next region in the overflow chain for this content type
      const chain = overflowChains.get(chainContentType) || [];
      const currentIndex = chain.indexOf(chainContentInRegion.id);
      if (currentIndex >= 0 && currentIndex < chain.length - 1) {
        const nextContentId = chain[currentIndex + 1];

        // Find the region containing the next content
        let targetRegionId: string | null = null;
        regionContents.forEach((contents, rId) => {
          if (contents.some((content: any) => content.id === nextContentId)) {
            targetRegionId = rId;
          }
        });

        if (targetRegionId) {
          // Move the new content to the target region
          setRegionContents(prevContents => {
            const updatedContents = new Map(prevContents);

            // Remove from source region
            const sourceContents = updatedContents.get(regionId) || [];
            const filteredSource = sourceContents.filter((content: any) => content.id !== newContent.id);
            updatedContents.set(regionId, filteredSource);

            // Add to target region
            const targetContents = updatedContents.get(targetRegionId!) || [];
            updatedContents.set(targetRegionId!, [...targetContents, newContent]);

            return updatedContents;
          });

          console.log('✅ Content flowed from', regionId, 'to', targetRegionId);
          setNotification(`🌊 Content overflowed to next region`);
          setTimeout(() => setNotification(null), 3000);
        }
      }
    }
  };

  // Simple region occupation calculation
  // Generate colors for content objects
  const getContentObjectColor = (contentType: string, index: number) => {
    // Content type specific colors for easy identification
    const contentTypeColors: { [key: string]: string } = {
      'line-text': '#3B82F6',                    // Blue - Clean, professional for simple text
      'pure-english-paragraph': '#10B981',       // Green - Fresh, natural for English content
      'translation-paragraph': '#F59E0B',        // Amber/Orange - Warm, attention-grabbing for translations
      'washing-symbol': '#8B5CF6',               // Purple - Distinctive for care symbols
      'image': '#EF4444',                        // Red - Bold, visual for image content
      'coo': '#06B6D4'                          // Cyan - Cool, official for origin information
    };

    // Return specific color for content type, or fallback to gray
    return contentTypeColors[contentType] || '#6B7280'; // Gray fallback for unknown types
  };

  // Get region background color based on content type
  const getRegionBackgroundColor = (regionId: string) => {
    const contents = regionContents.get(regionId) || [];

    if (contents.length === 0) {
      // Empty region - light gray background
      return 'rgba(243, 244, 246, 0.3)'; // Very light gray
    }

    // Get the primary content type (first content or most common)
    const primaryContent = contents[0];
    const contentType = primaryContent.type;

    // Content type specific background colors (lighter versions of overlay colors)
    const backgroundColors: { [key: string]: string } = {
      'line-text': 'rgba(59, 130, 246, 0.15)',           // Light blue background
      'pure-english-paragraph': 'rgba(16, 185, 129, 0.15)',  // Light green background
      'translation-paragraph': 'rgba(245, 158, 11, 0.15)',   // Light amber/orange background
      'washing-symbol': 'rgba(139, 92, 246, 0.15)',          // Light purple background
      'image': 'rgba(239, 68, 68, 0.15)',                    // Light red background
      'coo': 'rgba(6, 182, 212, 0.15)'                       // Light cyan background
    };

    const resultColor = backgroundColors[contentType] || 'rgba(107, 114, 128, 0.15)'; // Light gray fallback

    return resultColor;
  };

  const calculateRegionOccupation = (regionId: string) => {
    // Find the region
    let region: any = null;
    const currentData = data || webCreationData;
    if (currentData) {
      for (const obj of currentData.objects) {
        if (obj.type?.includes('mother')) {
          const regions = (obj as any).regions || [];
          region = regions.find((r: any) => r.id === regionId);
          if (region) break;
        }
      }
    }

    if (!region) {
      return { usedPercentage: 0, isFull: false, leftoverArea: 0, regionName: 'Unknown' };
    }

    const contents = regionContents.get(regionId) || [];
    const regionArea = region.width * region.height;

    const contentArea = contents.reduce((sum, content) => {
      // Calculate content area based on layout settings
      let contentWidth = region.width;
      let contentHeight = 0;

      if (content.layout.fullWidth || content.layout.width.value === 100) {
        contentWidth = region.width;
      } else if (content.layout.width.unit === 'mm') {
        contentWidth = content.layout.width.value;
      } else {
        contentWidth = (content.layout.width.value / 100) * region.width;
      }

      if (content.layout.fullHeight || content.layout.height.value === 100) {
        contentHeight = region.height;
      } else if (content.layout.height.unit === 'mm') {
        contentHeight = content.layout.height.value;
      } else {
        contentHeight = (content.layout.height.value / 100) * region.height;
      }

      return sum + (contentWidth * contentHeight);
    }, 0);

    const usedPercentage = regionArea > 0 ? (contentArea / regionArea) * 100 : 0;
    const isFull = usedPercentage >= 100;
    const leftoverArea = Math.max(0, regionArea - contentArea);

    return {
      usedPercentage,
      isFull,
      leftoverArea,
      regionName: region.name,
      regionArea,
      contentArea
    };
  };

  // Region occupation dialog state - COMMENTED OUT FOR NOW
  // const [regionOccupationDialog, setRegionOccupationDialog] = useState<{
  //   isOpen: boolean;
  //   contentType: string;
  //   contentIcon: string;
  //   regionId: string;
  //   regionHeight: number;
  // }>({
  //   isOpen: false,
  //   contentType: '',
  //   contentIcon: '',
  //   regionId: '',
  //   regionHeight: 0
  // });

  // Preview system state
  // const [previewSettings, setPreviewSettings] = useState<PreviewSettings>({
  //   globalPreviewMode: false,
  //   perRegionPreview: new Map(),
  //   editModeInPreview: true,
  //   dragDropInPreview: false
  // });


  // Pending content data (after region occupation is confirmed)
  // const [pendingContentData, setPendingContentData] = useState<{
  //   contentType: ContentType;
  //   occupationData: RegionOccupationData;
  // } | null>(null);



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

  // Overflow connection state - separate chains per content type
  const [overflowChains, setOverflowChains] = useState<Map<string, string[]>>(new Map()); // contentType -> Array of content IDs in chain order
  const [overflowSettings, setOverflowSettings] = useState<Map<string, boolean>>(new Map()); // contentId -> overflow enabled

  // Chain connection rendering state - calculated once, rendered many times
  const [chainConnections, setChainConnections] = useState<React.ReactElement[]>([]);

  // Overflow sequence numbers toggle
  const [showOverflowNumbers, setShowOverflowNumbers] = useState(false);

  // Hierarchy hover state - track which region/slice is being hovered
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);

  // Region slicing state
  const [showSliceDialog, setShowSliceDialog] = useState(false);
  const [slicingRegion, setSlicingRegion] = useState<Region | null>(null);
  const [sliceMode, setSliceMode] = useState<'visual' | 'mm'>('visual');
  const [sliceLines, setSliceLines] = useState<{horizontal: number[], vertical: number[]}>({
    horizontal: [],
    vertical: []
  });

  // State for draggable slice popup
  const [slicePopupPosition, setSlicePopupPosition] = useState({ x: 100, y: 100 });
  const [isSliceDragging, setIsSliceDragging] = useState(false);
  const [sliceDragOffset, setSliceDragOffset] = useState({ x: 0, y: 0 });
  const [sliceMinSize, setSliceMinSize] = useState(2); // Dynamic minimum size for slicing

  // ============================================================================
  // CHAIN CONNECTIONS - SIMPLIFIED APPROACH
  // ============================================================================
  // Note: Complex useEffect approach had scope issues with obj, baseX, baseY, scale
  // These variables are only available inside the renderObject function
  // For now, keeping the chain connections disabled until we can restructure properly

  // Function to trash all regions completely (Master File Management only)
  const trashAllRegions = (motherObject: AIObject) => {
    const regions = (motherObject as any).regions || [];
    if (regions.length === 0) {
      alert('No regions to delete.');
      return;
    }

    // Red background, yellow text confirmation
    const confirmed = window.confirm(`🗑️ DELETE ALL REGIONS?\n\nThis will permanently delete all ${regions.length} regions from "${motherObject.name}".\n\nThis action cannot be undone!`);

    if (confirmed) {
      if (!data) return;

      const updatedObjects = data.objects.map(obj => {
        if (obj.name === motherObject.name) {
          return { ...obj, regions: [] };
        }
        return obj;
      });

      const updatedData = { ...data, objects: updatedObjects };
      setData(updatedData);

      // Clear all region contents
      const updatedContents = new Map(regionContents);
      regions.forEach((region: Region) => {
        updatedContents.delete(region.id);
        // Also clear child region contents if they exist
        if (region.children && region.children.length > 0) {
          region.children.forEach((childRegion: Region) => {
            updatedContents.delete(childRegion.id);
          });
        }
      });
      setRegionContents(updatedContents);

      console.log(`🗑️ Deleted all ${regions.length} regions from mother: ${motherObject.name}`);
      setNotification(`✅ Deleted all ${regions.length} regions`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Function to trash all slices (child regions) while keeping parent regions
  const trashAllSlices = (motherObject: AIObject) => {
    const regions = (motherObject as any).regions || [];
    if (regions.length === 0) {
      alert('No regions found.');
      return;
    }

    // Count total slices across all regions
    let totalSlices = 0;
    regions.forEach((region: Region) => {
      if (region.children && region.children.length > 0) {
        totalSlices += region.children.length;
      }
    });

    if (totalSlices === 0) {
      alert('No slices found to delete.');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(`🗑️ DELETE ALL SLICES?\n\nThis will permanently delete all ${totalSlices} slices from "${motherObject.name}".\n\nParent regions will be preserved.\n\nThis action cannot be undone!`);

    if (confirmed) {
      if (!data) return;

      const updatedObjects = data.objects.map(obj => {
        if (obj.name === motherObject.name) {
          // Remove children from all regions and reset slice state
          const updatedRegions = regions.map((region: Region) => ({
            ...region,
            children: undefined, // Remove children
            isSliced: false, // Reset slice state
            borderColor: '#2196f3', // Reset to default blue border
            backgroundColor: 'rgba(33, 150, 243, 0.1)' // Reset to default blue background
          }));

          return { ...obj, regions: updatedRegions };
        }
        return obj;
      });

      const updatedData = { ...data, objects: updatedObjects };
      setData(updatedData);

      // Clear region contents for all child regions (slices)
      const updatedContents = new Map(regionContents);
      regions.forEach((region: Region) => {
        if (region.children && region.children.length > 0) {
          region.children.forEach((childRegion: Region) => {
            updatedContents.delete(childRegion.id);
          });
        }
      });
      setRegionContents(updatedContents);

      console.log(`🗑️ Deleted all ${totalSlices} slices from mother: ${motherObject.name}, preserved ${regions.length} parent regions`);
      setNotification(`✅ Deleted ${totalSlices} slices, preserved ${regions.length} parent regions`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Function to delete individual slice
  const deleteIndividualSlice = (motherObject: AIObject, parentRegion: Region, sliceToDelete: Region) => {
    const confirmed = window.confirm(`Delete slice "${sliceToDelete.name}"?\n\nThis action cannot be undone.`);

    if (confirmed) {
      if (!data) return;

      const updatedObjects = data.objects.map(obj => {
        if (obj.name === motherObject.name) {
          const regions = (obj as any).regions || [];
          const updatedRegions = regions.map((region: Region) => {
            if (region.id === parentRegion.id && region.children) {
              // Remove the specific slice from children
              const updatedChildren = region.children.filter(child => child.id !== sliceToDelete.id);

              // If no children left, reset parent to unsliced state
              if (updatedChildren.length === 0) {
                return {
                  ...region,
                  children: undefined,
                  isSliced: false,
                  borderColor: '#2196f3', // Reset to default blue border
                  backgroundColor: 'rgba(33, 150, 243, 0.1)' // Reset to default blue background
                };
              }

              // Otherwise, keep remaining children
              return {
                ...region,
                children: updatedChildren
              };
            }
            return region;
          });

          return { ...obj, regions: updatedRegions };
        }
        return obj;
      });

      const updatedData = { ...data, objects: updatedObjects };
      setData(updatedData);

      // Clear content for the deleted slice
      const updatedContents = new Map(regionContents);
      updatedContents.delete(sliceToDelete.id);
      setRegionContents(updatedContents);

      console.log(`🗑️ Deleted individual slice: ${sliceToDelete.name}`);
      setNotification(`✅ Deleted slice "${sliceToDelete.name}"`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Function to trash single region with confirmation
  const trashSingleRegion = (motherObject: AIObject, region: Region) => {
    const confirmed = window.confirm(`Delete region "${region.name || 'Unnamed'}"?\n\nThis action cannot be undone.`);

    if (confirmed) {
      if (!data) return;

      const updatedObjects = data.objects.map(obj => {
        if (obj.name === motherObject.name) {
          const currentRegions = (obj as any).regions || [];
          const filteredRegions = currentRegions.filter((r: Region) => r.id !== region.id);
          return { ...obj, regions: filteredRegions };
        }
        return obj;
      });

      const updatedData = { ...data, objects: updatedObjects };
      setData(updatedData);

      // Clear region contents
      const updatedContents = new Map(regionContents);
      updatedContents.delete(region.id);
      setRegionContents(updatedContents);

      console.log(`🗑️ Deleted region: ${region.name || 'Unnamed'} from mother: ${motherObject.name}`);
    }
  };

  // Mouse event handlers for dragging slice popup
  const handleSliceMouseDown = (e: React.MouseEvent) => {
    setIsSliceDragging(true);
    setSliceDragOffset({
      x: e.clientX - slicePopupPosition.x,
      y: e.clientY - slicePopupPosition.y
    });
  };

  const handleSliceMouseMove = (e: MouseEvent) => {
    if (isSliceDragging) {
      setSlicePopupPosition({
        x: e.clientX - sliceDragOffset.x,
        y: e.clientY - sliceDragOffset.y
      });
    }
  };

  const handleSliceMouseUp = () => {
    setIsSliceDragging(false);
  };

  // Add global mouse event listeners for dragging slice popup
  React.useEffect(() => {
    if (isSliceDragging) {
      document.addEventListener('mousemove', handleSliceMouseMove);
      document.addEventListener('mouseup', handleSliceMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleSliceMouseMove);
        document.removeEventListener('mouseup', handleSliceMouseUp);
      };
    }
  }, [isSliceDragging, sliceDragOffset]);

  // Region highlighting states
  const [highlightedRegion, setHighlightedRegion] = useState<string | null>(null);

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

  // Helper function to find available spaces in a specific area with full-width priority
  const findAvailableSpacesInArea = (areaX: number, areaY: number, areaWidth: number, areaHeight: number, existingRegions: Region[]) => {
    console.log('🔍 Finding spaces in area:', { areaX, areaY, areaWidth, areaHeight, existingRegions: existingRegions.length });

    const availableSpaces = [];

    if (existingRegions.length === 0) {
      // No existing regions, entire area is available
      console.log('✅ No existing regions - entire area available');
      availableSpaces.push({
        x: areaX,
        y: areaY,
        width: areaWidth,
        height: areaHeight
      });
    } else {
      // Filter regions that actually overlap with this area
      const overlappingRegions = existingRegions.filter(region => {
        const regionRight = region.x + region.width;
        const regionBottom = region.y + region.height;
        const areaRight = areaX + areaWidth;
        const areaBottom = areaY + areaHeight;

        return !(region.x >= areaRight || regionRight <= areaX ||
                region.y >= areaBottom || regionBottom <= areaY);
      });

      console.log('🔍 Overlapping regions:', overlappingRegions.length, overlappingRegions);

      if (overlappingRegions.length === 0) {
        // No overlapping regions, entire area is available
        console.log('✅ No overlapping regions - entire area available');
        availableSpaces.push({
          x: areaX,
          y: areaY,
          width: areaWidth,
          height: areaHeight
        });
      } else {
        // Try to find full-width spaces first (for bottom/top areas)
        const fullWidthSpaces = findFullWidthSpaces(areaX, areaY, areaWidth, areaHeight, overlappingRegions);

        if (fullWidthSpaces.length > 0) {
          console.log('✅ Found full-width spaces:', fullWidthSpaces);
          availableSpaces.push(...fullWidthSpaces);
        } else {
          // Fallback to largest available rectangle
          const largestRect = findLargestAvailableRectangle(
            areaWidth,
            areaHeight,
            overlappingRegions.map(r => ({
              ...r,
              x: r.x - areaX, // Convert to area-relative coordinates
              y: r.y - areaY
            })),
            { top: 0, left: 0, right: 0, down: 0 } // No additional margins within area
          );

          console.log('🔍 Largest rect found:', largestRect);

          if (largestRect && largestRect.area > 0) {
            availableSpaces.push({
              x: largestRect.x + areaX, // Convert back to mother coordinates
              y: largestRect.y + areaY,
              width: largestRect.width,
              height: largestRect.height
            });
          }
        }
      }
    }

    console.log('📊 Available spaces found:', availableSpaces);
    return availableSpaces;
  };

  // Helper function to find full-width spaces in an area
  const findFullWidthSpaces = (areaX: number, areaY: number, areaWidth: number, areaHeight: number, overlappingRegions: Region[]) => {
    const fullWidthSpaces = [];

    // Sort regions by Y position to find gaps
    const sortedRegions = overlappingRegions
      .map(r => ({
        ...r,
        x: Math.max(r.x, areaX), // Clip to area bounds
        y: Math.max(r.y, areaY),
        width: Math.min(r.x + r.width, areaX + areaWidth) - Math.max(r.x, areaX),
        height: Math.min(r.y + r.height, areaY + areaHeight) - Math.max(r.y, areaY)
      }))
      .filter(r => r.width > 0 && r.height > 0)
      .sort((a, b) => a.y - b.y);

    console.log('🔍 Sorted regions for full-width search:', sortedRegions);

    let currentY = areaY;

    for (const region of sortedRegions) {
      // Check if there's a gap before this region
      if (region.y > currentY) {
        const gapHeight = region.y - currentY;
        if (gapHeight >= 10) { // Minimum 10mm height
          fullWidthSpaces.push({
            x: areaX,
            y: currentY,
            width: areaWidth,
            height: gapHeight
          });
          console.log('✅ Found full-width gap before region:', { x: areaX, y: currentY, width: areaWidth, height: gapHeight });
        }
      }
      currentY = Math.max(currentY, region.y + region.height);
    }

    // Check if there's space after the last region
    if (currentY < areaY + areaHeight) {
      const remainingHeight = (areaY + areaHeight) - currentY;
      if (remainingHeight >= 10) { // Minimum 10mm height
        fullWidthSpaces.push({
          x: areaX,
          y: currentY,
          width: areaWidth,
          height: remainingHeight
        });
        console.log('✅ Found full-width space after last region:', { x: areaX, y: currentY, width: areaWidth, height: remainingHeight });
      }
    }

    return fullWidthSpaces;
  };

  // Helper function to generate unique region names
  const generateUniqueRegionName = (existingRegions: Region[], newRegions: any[], baseName: string) => {
    const allRegions = [...existingRegions, ...newRegions];
    const existingNames = allRegions.map(r => r.name);

    let counter = 1;
    let proposedName = `Region_${baseName}`;

    while (existingNames.includes(proposedName)) {
      counter++;
      proposedName = `Region_${baseName}_${counter}`;
    }

    return proposedName;
  };

  // Helper function to calculate used height in an area
  const calculateUsedHeight = (regions: Region[], areaY: number, areaHeight: number) => {
    if (regions.length === 0) return 0;

    // Find the total height covered by regions
    let usedHeight = 0;
    const sortedRegions = regions.sort((a, b) => a.y - b.y);

    for (const region of sortedRegions) {
      // Only count regions within the area bounds
      if (region.y >= areaY && region.y + region.height <= areaY + areaHeight) {
        usedHeight += region.height;
      }
    }

    return usedHeight;
  };

  // Helper function to calculate used width in an area
  const calculateUsedWidth = (regions: Region[], areaX: number, areaWidth: number) => {
    if (regions.length === 0) return 0;

    // Find the total width covered by regions
    let usedWidth = 0;
    const sortedRegions = regions.sort((a, b) => a.x - b.x);

    for (const region of sortedRegions) {
      // Only count regions within the area bounds
      if (region.x >= areaX && region.x + region.width <= areaX + areaWidth) {
        usedWidth += region.width;
      }
    }

    return usedWidth;
  };

  // Helper function to check if an area is full (less than 10mm remaining)
  const isAreaFull = (totalSize: number, usedSize: number, minRemaining: number = 10) => {
    return (totalSize - usedSize) < minRemaining;
  };

  // Enhanced function for mid-fold line aware region creation with existing region support
  const findAvailableSpaceWithMidFold = (motherWidth: number, motherHeight: number, existingRegions: Region[], margins: any, midFoldLine: any) => {
    console.log('🔍 Analyzing space with mid-fold line:', midFoldLine);
    console.log('📦 Existing regions:', existingRegions);

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
      let midFoldY: number;
      if (midFoldLine.position.useDefault) {
        midFoldY = motherHeight / 2;
      } else {
        if (midFoldLine.direction === 'top') {
          midFoldY = midFoldLine.position.customDistance;
        } else { // bottom
          midFoldY = motherHeight - midFoldLine.position.customDistance;
        }
      }

      // Calculate boundaries
      const topBoundary = midFoldY - padding; // Where top region can extend to
      const bottomBoundary = midFoldY + padding; // Where bottom region starts from

      // Analyze existing regions
      const topRegions = existingRegions.filter(r => r.y + r.height <= topBoundary);
      const bottomRegions = existingRegions.filter(r => r.y >= bottomBoundary);
      const invalidRegions = existingRegions.filter(r =>
        !(r.y + r.height <= topBoundary) && !(r.y >= bottomBoundary)
      );

      console.log('📏 Horizontal split analysis:', {
        motherHeight, midFoldY, padding, topBoundary, bottomBoundary,
        topRegions: topRegions.length, bottomRegions: bottomRegions.length,
        invalidRegions: invalidRegions.length
      });

      if (invalidRegions.length > 0) {
        console.log('❌ Invalid regions crossing mid-fold line:', invalidRegions);
        return {
          type: 'error',
          message: 'Some regions cross the mid-fold line. Please remove or adjust them first.',
          regions: []
        };
      }

      const newRegions: any[] = [];

      // Find available space in top area
      const topAvailableSpaces = findAvailableSpacesInArea(
        marginLeft, marginTop,
        motherWidth - marginLeft - marginRight,
        topBoundary - marginTop,
        topRegions
      );

      // Find available space in bottom area
      const bottomAvailableSpaces = findAvailableSpacesInArea(
        marginLeft, bottomBoundary,
        motherWidth - marginLeft - marginRight,
        motherHeight - bottomBoundary - marginBottom,
        bottomRegions
      );

      console.log('📊 Available spaces:', {
        topAvailableSpaces: topAvailableSpaces.length,
        bottomAvailableSpaces: bottomAvailableSpaces.length,
        topSpaces: topAvailableSpaces,
        bottomSpaces: bottomAvailableSpaces
      });

      // Create regions for top area (only if space available and meets minimum)
      topAvailableSpaces.forEach((space: any, index: number) => {
        if (space.height >= 10) { // 10mm minimum height
          const regionName = generateUniqueRegionName(existingRegions, newRegions, 'Top');
          newRegions.push({
            x: space.x,
            y: space.y,
            width: space.width,
            height: space.height,
            name: regionName,
            id: `region_${Date.now()}_${index}`
          });
        }
      });

      // Create regions for bottom area (only if space available and meets minimum)
      bottomAvailableSpaces.forEach((space: any, index: number) => {
        if (space.height >= 10) { // 10mm minimum height
          const regionName = generateUniqueRegionName(existingRegions, newRegions, 'Bottom');
          newRegions.push({
            x: space.x,
            y: space.y,
            width: space.width,
            height: space.height,
            name: regionName,
            id: `region_${Date.now()}_${index + 100}`
          });
        }
      });

      console.log('✅ Created new regions:', newRegions);

      return {
        type: 'horizontal_split',
        midFoldY,
        padding,
        regions: newRegions,
        message: newRegions.length > 0 ?
          `Created ${newRegions.length} region(s): ${newRegions.map(r => r.name).join(', ')}` :
          'No viable spaces found (all areas < 10mm minimum height)'
      };

    } else if (midFoldLine.type === 'vertical') {
      // Calculate X position of mid-fold line
      let midFoldX: number;
      if (midFoldLine.position.useDefault) {
        midFoldX = motherWidth / 2;
      } else {
        if (midFoldLine.direction === 'left') {
          midFoldX = midFoldLine.position.customDistance;
        } else { // right
          midFoldX = motherWidth - midFoldLine.position.customDistance;
        }
      }

      // Calculate boundaries
      const leftBoundary = midFoldX - padding; // Where left region can extend to
      const rightBoundary = midFoldX + padding; // Where right region starts from

      // Analyze existing regions
      const leftRegions = existingRegions.filter(r => r.x + r.width <= leftBoundary);
      const rightRegions = existingRegions.filter(r => r.x >= rightBoundary);
      const invalidRegions = existingRegions.filter(r =>
        !(r.x + r.width <= leftBoundary) && !(r.x >= rightBoundary)
      );

      console.log('📏 Vertical split analysis:', {
        motherWidth, midFoldX, padding, leftBoundary, rightBoundary,
        leftRegions: leftRegions.length, rightRegions: rightRegions.length,
        invalidRegions: invalidRegions.length
      });

      if (invalidRegions.length > 0) {
        console.log('❌ Invalid regions crossing mid-fold line:', invalidRegions);
        return {
          type: 'error',
          message: 'Some regions cross the mid-fold line. Please remove or adjust them first.',
          regions: []
        };
      }

      const newRegions: any[] = [];

      // Find available space in left area
      const leftAvailableSpaces = findAvailableSpacesInArea(
        marginLeft, marginTop,
        leftBoundary - marginLeft,
        motherHeight - marginTop - marginBottom,
        leftRegions
      );

      // Find available space in right area
      const rightAvailableSpaces = findAvailableSpacesInArea(
        rightBoundary, marginTop,
        motherWidth - rightBoundary - marginRight,
        motherHeight - marginTop - marginBottom,
        rightRegions
      );

      console.log('📊 Available spaces:', {
        leftAvailableSpaces: leftAvailableSpaces.length,
        rightAvailableSpaces: rightAvailableSpaces.length,
        leftSpaces: leftAvailableSpaces,
        rightSpaces: rightAvailableSpaces
      });

      // Create regions for left area (only if space available and meets minimum)
      leftAvailableSpaces.forEach((space: any, index: number) => {
        if (space.width >= 10) { // 10mm minimum width
          const regionName = generateUniqueRegionName(existingRegions, newRegions, 'Left');
          newRegions.push({
            x: space.x,
            y: space.y,
            width: space.width,
            height: space.height,
            name: regionName,
            id: `region_${Date.now()}_${index}`
          });
        }
      });

      // Create regions for right area (only if space available and meets minimum)
      rightAvailableSpaces.forEach((space: any, index: number) => {
        if (space.width >= 10) { // 10mm minimum width
          const regionName = generateUniqueRegionName(existingRegions, newRegions, 'Right');
          newRegions.push({
            x: space.x,
            y: space.y,
            width: space.width,
            height: space.height,
            name: regionName,
            id: `region_${Date.now()}_${index + 100}`
          });
        }
      });

      console.log('✅ Created new regions:', newRegions);

      return {
        type: 'vertical_split',
        midFoldX,
        padding,
        regions: newRegions,
        message: newRegions.length > 0 ?
          `Created ${newRegions.length} region(s): ${newRegions.map(r => r.name).join(', ')}` :
          'No viable spaces found (all areas < 10mm minimum width)'
      };
    }

    return { type: 'none', regions: [] };
  };

  // Function to automatically create regions when mother is created
  const createAutoRegionsForNewMother = (motherObject: any) => {
    console.log('🤖 Auto-creating regions for new mother:', motherObject.name);

    const motherMargins = motherObject.margins || { top: 5, left: 5, right: 5, down: 5 };
    const midFoldLine = motherObject.midFoldLine;

    // Use the existing space analysis function
    const spaceAnalysis = findAvailableSpaceWithMidFold(
      motherObject.width,
      motherObject.height,
      [], // No existing regions for new mother
      motherMargins,
      midFoldLine
    );

    console.log('🔍 Space analysis result:', spaceAnalysis);

    if (spaceAnalysis.type === 'horizontal_split' || spaceAnalysis.type === 'vertical_split') {
      // Mid-fold enabled: Create 2 regions
      const autoRegions = spaceAnalysis.regions.map((regionData: any, index: number) => ({
        id: `region_${Date.now()}_${index}`,
        name: '', // Empty name as requested
        x: regionData.x,
        y: regionData.y,
        width: regionData.width,
        height: regionData.height,
        margins: { top: 2, bottom: 2, left: 2, right: 2 },
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        allowOverflow: false
      }));

      console.log('✅ Auto-created 2 regions (mid-fold):', autoRegions);
      return autoRegions;

    } else if (spaceAnalysis.type === 'single' && spaceAnalysis.regions[0]) {
      // No mid-fold: Create 1 region
      const singleRegionData = spaceAnalysis.regions[0];
      const autoRegion = [{
        id: `region_${Date.now()}_0`,
        name: '', // Empty name as requested
        x: singleRegionData.x,
        y: singleRegionData.y,
        width: singleRegionData.width,
        height: singleRegionData.height,
        margins: { top: 2, bottom: 2, left: 2, right: 2 },
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        allowOverflow: false
      }];

      console.log('✅ Auto-created 1 region (no mid-fold):', autoRegion);
      return autoRegion;
    }

    console.log('❌ Could not auto-create regions - no viable space found');
    return [];
  };

  // Function to slice a region (either parent or child) with flat structure
  const sliceRegion = (regionToSlice: Region, horizontalCuts: number[], verticalCuts: number[], isChildSlice: boolean = false) => {
    console.log('🔪 Slicing region:', regionToSlice.name, 'with cuts:', { horizontalCuts, verticalCuts, isChildSlice });

    // Validate cuts are within region bounds
    const validHorizontalCuts = horizontalCuts.filter(cut => cut > 0 && cut < regionToSlice.height);
    const validVerticalCuts = verticalCuts.filter(cut => cut > 0 && cut < regionToSlice.width);

    console.log('✅ Valid cuts:', { validHorizontalCuts, validVerticalCuts });

    // Create sorted arrays with region boundaries
    const hCuts = [0, ...validHorizontalCuts.sort((a, b) => a - b), regionToSlice.height];
    const vCuts = [0, ...validVerticalCuts.sort((a, b) => a - b), regionToSlice.width];

    console.log('📏 Cut boundaries:', { hCuts, vCuts });

    // Generate new regions
    const newRegions: Region[] = [];
    let regionIndex = 0;

    for (let i = 0; i < hCuts.length - 1; i++) {
      for (let j = 0; j < vCuts.length - 1; j++) {
        const newRegion: Region = {
          id: `${regionToSlice.id}_slice_${Date.now()}_${regionIndex}`,
          name: isChildSlice ? `${regionToSlice.name}.${regionIndex + 1}` : `Slice ${regionIndex + 1}`,
          x: regionToSlice.x + vCuts[j],
          y: regionToSlice.y + hCuts[i],
          width: vCuts[j + 1] - vCuts[j],
          height: hCuts[i + 1] - hCuts[i],
          margins: { top: 2, bottom: 2, left: 2, right: 2 },
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          allowOverflow: false,
          parentId: isChildSlice ? regionToSlice.parentId : regionToSlice.id // Maintain parent relationship
        };

        // Validate minimum size (dynamic)
        if (newRegion.width >= sliceMinSize && newRegion.height >= sliceMinSize) {
          newRegions.push(newRegion);
          regionIndex++;
        } else {
          console.warn('⚠️ Skipping region too small:', newRegion.width, 'x', newRegion.height, 'minimum:', sliceMinSize);
        }
      }
    }

    if (isChildSlice) {
      // For child slicing, return the new regions to replace the child
      console.log('🎯 Generated replacement slices:', newRegions.length, 'for child:', regionToSlice.name);
      return { replacementRegions: newRegions };
    } else {
      // For parent slicing, create hierarchical structure
      const updatedParentRegion: Region = {
        ...regionToSlice,
        children: newRegions,
        isSliced: true,
        borderColor: '#ff9800', // Orange border to indicate it's sliced
        backgroundColor: 'rgba(255, 152, 0, 0.05)' // Light orange background
      };

      console.log('🎯 Generated hierarchy:', newRegions.length, 'child regions under parent:', updatedParentRegion.name);
      return { parentRegion: updatedParentRegion, childRegions: newRegions };
    }
  };

  // Function to automatically update existing regions when mid-fold line properties change
  const updateRegionsForMidFoldChange = (motherObject: any, newMidFoldLine: any, oldMidFoldLine: any) => {
    console.log('🔄 Updating regions for mid-fold change:', { newMidFoldLine, oldMidFoldLine });

    const existingRegions = motherObject.regions || [];
    if (existingRegions.length === 0) {
      console.log('📝 No existing regions to update');
      return existingRegions;
    }

    // Check if this is a mid-fold aware region set (has Region_Top/Bottom or Region_Left/Right)
    const hasMidFoldRegions = existingRegions.some((r: Region) =>
      r.name.includes('Region_Top') || r.name.includes('Region_Bottom') ||
      r.name.includes('Region_Left') || r.name.includes('Region_Right')
    );

    if (!hasMidFoldRegions) {
      console.log('📝 Regions are not mid-fold aware, no automatic update needed');
      return existingRegions;
    }

    // Check if mid-fold line is still enabled
    if (!newMidFoldLine || !newMidFoldLine.enabled) {
      console.log('⚠️ Mid-fold line disabled, keeping regions as-is');
      return existingRegions;
    }

    // Check if padding, position, or type changed
    const paddingChanged = (oldMidFoldLine?.padding || 3) !== (newMidFoldLine.padding || 3);
    const positionChanged = JSON.stringify(oldMidFoldLine?.position) !== JSON.stringify(newMidFoldLine.position);
    const typeChanged = oldMidFoldLine?.type !== newMidFoldLine.type;
    const directionChanged = oldMidFoldLine?.direction !== newMidFoldLine.direction;

    if (!paddingChanged && !positionChanged && !typeChanged && !directionChanged) {
      console.log('📝 No relevant mid-fold changes, keeping regions as-is');
      return existingRegions;
    }

    console.log('🎯 Mid-fold properties changed, recalculating regions:', {
      paddingChanged, positionChanged, typeChanged, directionChanged
    });

    // Recalculate regions using the new mid-fold line settings
    const motherMargins = motherObject.margins || { top: 5, left: 5, right: 5, down: 5 };
    const spaceAnalysis = findAvailableSpaceWithMidFold(
      motherObject.width,
      motherObject.height,
      [], // Don't consider existing regions for recalculation
      motherMargins,
      newMidFoldLine
    );

    if (spaceAnalysis.type === 'horizontal_split' || spaceAnalysis.type === 'vertical_split') {
      console.log('✅ Recalculated regions:', spaceAnalysis.regions);

      // Create updated regions with same IDs but new positions
      const updatedRegions = spaceAnalysis.regions.map((newRegion: any, index: number) => {
        const existingRegion = existingRegions[index];
        return {
          id: existingRegion?.id || `region_${Date.now()}_${index}`,
          name: newRegion.name,
          x: newRegion.x,
          y: newRegion.y,
          width: newRegion.width,
          height: newRegion.height,
          margins: existingRegion?.margins || { top: 2, bottom: 2, left: 2, right: 2 },
          borderColor: existingRegion?.borderColor || '#4caf50',
          backgroundColor: existingRegion?.backgroundColor || 'rgba(76, 175, 80, 0.1)',
          allowOverflow: existingRegion?.allowOverflow || false
        };
      });

      return updatedRegions;
    }

    console.log('⚠️ Could not recalculate regions, keeping existing ones');
    return existingRegions;
  };

  // Derived states - show sewing lines and mid-fold lines based on object properties
  const showMarginRectangles = true; // Show margin dotted lines
  // showSewingLines is now a state variable controlled by toggle button

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

      // Note: Canvas thumbnails show basic object shapes only
      // Detailed content like washing care symbols is shown in the main view

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

        // Rendering mid-fold line (removed noisy logging)

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

          // Draw horizontal line (full width - padding is for regions, not line display)
          const lineStartX = x;
          const lineEndX = x + width;
          svgContent += `<line x1="${lineStartX}" y1="${lineY}" x2="${lineEndX}" y2="${lineY}"
            stroke="#d32f2f" stroke-width="2" stroke-dasharray="4,4" opacity="0.9"/>`;

          console.log('✅ Drew horizontal mid-fold line at Y:', lineY, 'with padding:', padding);

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

          // Draw vertical line (full height - padding is for regions, not line display)
          const lineStartY = y;
          const lineEndY = y + height;
          svgContent += `<line x1="${lineX}" y1="${lineStartY}" x2="${lineX}" y2="${lineEndY}"
            stroke="#d32f2f" stroke-width="2" stroke-dasharray="4,4" opacity="0.9"/>`;

          console.log('✅ Drew vertical mid-fold line at X:', lineX, 'with padding:', padding);
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

  // Generate PDF with visual canvas at 1:1 scale on A4 paper - DIRECT DRAWING
  const generateMotherPDF = async (motherObject: AIObject) => {
    console.log('🖨️ Generating 1:1 scale PDF with visual layout for mother:', motherObject.name);

    try {
      // A4 dimensions in mm
      const A4_WIDTH = 210;
      const A4_HEIGHT = 297;

      // Create A4 PDF
      const pdf = new jsPDF('portrait', 'mm', 'a4');

      // Try to embed Wash Care Symbols M54 font
      const fontEmbedded = await embedWashCareFont(pdf);

      // Calculate canvas dimensions in mm (1:1 scale)
      const canvasWidthMM = motherObject.width;
      const canvasHeightMM = motherObject.height;

      // Calculate center position on A4
      const centerX = (A4_WIDTH - canvasWidthMM) / 2;
      const centerY = (A4_HEIGHT - canvasHeightMM) / 2;

      console.log('📍 Canvas will be centered at:', `${centerX.toFixed(1)}, ${centerY.toFixed(1)}mm`);
      console.log('📏 Canvas size on PDF:', `${canvasWidthMM}×${canvasHeightMM}mm (1:1 scale)`);

      // Add title
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${motherObject.name} - 1:1 Scale Template`, 20, 20);

      // Add created date in top right corner
      const currentDate = new Date();
      const dateString = currentDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timeString = currentDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100); // Gray color
      pdf.text(`Created: ${dateString} ${timeString}`, A4_WIDTH - 60, 15);

      // Add scale info
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Size: ${canvasWidthMM}×${canvasHeightMM}mm (TRUE 1:1 SCALE)`, 20, 30);
      pdf.text('Print at 100% scale - NO scaling/fitting', 20, 38);

      // Draw mother outline at center position
      pdf.setDrawColor(0, 0, 0); // Black
      pdf.setLineWidth(0.3); // Standard thickness
      pdf.rect(centerX, centerY, canvasWidthMM, canvasHeightMM);

      // Add mother name inside
      pdf.setFontSize(8); // Standard font size
      pdf.setTextColor(0, 0, 0); // Black text
      pdf.text(motherObject.name, centerX + 5, centerY + 10);

      // Draw mother margins if they exist
      const motherMargins = (motherObject as any).margins;
      if (motherMargins) {
        pdf.setDrawColor(100, 100, 100); // Gray for margins
        pdf.setLineWidth(0.2);
        pdf.setLineDashPattern([1, 1], 0); // Dotted line

        // Top margin
        if (motherMargins.top > 0) {
          pdf.line(centerX, centerY + motherMargins.top, centerX + canvasWidthMM, centerY + motherMargins.top);
        }
        // Bottom margin
        if (motherMargins.bottom > 0) {
          pdf.line(centerX, centerY + canvasHeightMM - motherMargins.bottom, centerX + canvasWidthMM, centerY + canvasHeightMM - motherMargins.bottom);
        }
        // Left margin
        if (motherMargins.left > 0) {
          pdf.line(centerX + motherMargins.left, centerY, centerX + motherMargins.left, centerY + canvasHeightMM);
        }
        // Right margin
        if (motherMargins.right > 0) {
          pdf.line(centerX + canvasWidthMM - motherMargins.right, centerY, centerX + canvasWidthMM - motherMargins.right, centerY + canvasHeightMM);
        }

        pdf.setLineDashPattern([], 0); // Reset to solid line
      }

      // Draw mid fold lines if they exist
      const midFoldLine = (motherObject as any).midFoldLine;
      if (midFoldLine && midFoldLine.enabled) {
        const padding = midFoldLine.padding || 3;

        if (midFoldLine.type === 'horizontal') {
          // Calculate Y position of mid-fold line
          let midFoldY: number;
          if (midFoldLine.position.useDefault) {
            midFoldY = canvasHeightMM / 2;
          } else {
            if (midFoldLine.direction === 'top') {
              midFoldY = midFoldLine.position.customDistance;
            } else { // bottom
              midFoldY = canvasHeightMM - midFoldLine.position.customDistance;
            }
          }

          // Draw horizontal fold line (red dotted)
          pdf.setDrawColor(255, 0, 0); // Red for fold lines
          pdf.setLineWidth(0.5);
          pdf.setLineDashPattern([2, 2], 0); // Dotted line
          pdf.line(centerX, centerY + midFoldY, centerX + canvasWidthMM, centerY + midFoldY);

          // Draw fold padding margin lines (dotted, no fill)
          pdf.setDrawColor(255, 0, 0); // Red for padding margins
          pdf.setLineWidth(0.3);
          pdf.setLineDashPattern([1, 1], 0); // Fine dotted line

          // Top padding line
          pdf.line(centerX, centerY + midFoldY - padding/2, centerX + canvasWidthMM, centerY + midFoldY - padding/2);
          // Bottom padding line
          pdf.line(centerX, centerY + midFoldY + padding/2, centerX + canvasWidthMM, centerY + midFoldY + padding/2);

          // Add padding dimension labels
          pdf.setFontSize(6);
          pdf.setTextColor(255, 0, 0);
          pdf.text(`${padding}mm`, centerX + canvasWidthMM + 2, centerY + midFoldY);

        } else if (midFoldLine.type === 'vertical') {
          // Calculate X position of mid-fold line
          let midFoldX: number;
          if (midFoldLine.position.useDefault) {
            midFoldX = canvasWidthMM / 2;
          } else {
            if (midFoldLine.direction === 'left') {
              midFoldX = midFoldLine.position.customDistance;
            } else { // right
              midFoldX = canvasWidthMM - midFoldLine.position.customDistance;
            }
          }

          // Draw vertical fold line (red dotted)
          pdf.setDrawColor(255, 0, 0); // Red for fold lines
          pdf.setLineWidth(0.5);
          pdf.setLineDashPattern([2, 2], 0); // Dotted line
          pdf.line(centerX + midFoldX, centerY, centerX + midFoldX, centerY + canvasHeightMM);

          // Draw fold padding margin lines (dotted, no fill)
          pdf.setDrawColor(255, 0, 0); // Red for padding margins
          pdf.setLineWidth(0.3);
          pdf.setLineDashPattern([1, 1], 0); // Fine dotted line

          // Left padding line
          pdf.line(centerX + midFoldX - padding/2, centerY, centerX + midFoldX - padding/2, centerY + canvasHeightMM);
          // Right padding line
          pdf.line(centerX + midFoldX + padding/2, centerY, centerX + midFoldX + padding/2, centerY + canvasHeightMM);

          // Add padding dimension labels
          pdf.setFontSize(6);
          pdf.setTextColor(255, 0, 0);
          pdf.text(`${padding}mm`, centerX + midFoldX - 5, centerY + canvasHeightMM + 8);
        }

        pdf.setLineDashPattern([], 0); // Reset to solid line
      }

      // Add mother margin dimension labels
      if (motherMargins) {
        pdf.setFontSize(6);
        pdf.setTextColor(100, 100, 100);

        // Top margin label
        if (motherMargins.top > 0) {
          pdf.text(`${motherMargins.top}mm`, centerX - 15, centerY + motherMargins.top);
        }
        // Bottom margin label
        if (motherMargins.bottom > 0) {
          pdf.text(`${motherMargins.bottom}mm`, centerX - 15, centerY + canvasHeightMM - motherMargins.bottom);
        }
        // Left margin label
        if (motherMargins.left > 0) {
          pdf.text(`${motherMargins.left}mm`, centerX + motherMargins.left - 5, centerY - 5);
        }
        // Right margin label
        if (motherMargins.right > 0) {
          pdf.text(`${motherMargins.right}mm`, centerX + canvasWidthMM - motherMargins.right - 5, centerY - 5);
        }
      }

      // Draw regions and slices with colors
      const motherRegions = (motherObject as any).regions || [];
      console.log('📊 Drawing', motherRegions.length, 'regions');

      motherRegions.forEach((region: any, index: number) => {
        console.log(`Region ${index + 1}:`, `${region.x},${region.y} ${region.width}×${region.height}mm`);

        const regionX = centerX + region.x;
        const regionY = centerY + region.y;

        // Check if region has slices
        const hasSlices = region.children && region.children.length > 0;

        if (hasSlices) {
          // Draw parent region outline (lighter)
          pdf.setDrawColor(200, 200, 200); // Light gray
          pdf.setLineWidth(0.2);
          pdf.rect(regionX, regionY, region.width, region.height);

          // Add parent region label
          pdf.setFontSize(5);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`P${index + 1}`, regionX + 1, regionY + 3);

          // Draw child slices (slices have absolute coordinates within mother, need to make relative to region)
          region.children.forEach((childRegion: any, childIndex: number) => {
            // childRegion.x/y are absolute within mother, region.x/y are also absolute within mother
            // So slice position relative to region is: childRegion.x - region.x
            const relativeX = childRegion.x - region.x;
            const relativeY = childRegion.y - region.y;
            const childX = regionX + relativeX;
            const childY = regionY + relativeY;

            // Draw slice rectangle
            pdf.setDrawColor(255, 0, 0); // Red for slices
            pdf.setLineWidth(0.3);
            pdf.rect(childX, childY, childRegion.width, childRegion.height);

            // Add slice label
            pdf.setFontSize(5);
            pdf.setTextColor(255, 0, 0);
            pdf.text(`S${childIndex + 1}`, childX + 1, childY + 3);
          });
        } else {
          // Draw regular region rectangle
          pdf.setDrawColor(255, 152, 0); // Orange
          pdf.setLineWidth(0.3);
          pdf.rect(regionX, regionY, region.width, region.height);

          // Add region label
          pdf.setFontSize(6);
          pdf.setTextColor(255, 152, 0);
          pdf.text(region.name, regionX + 1, regionY + 4);
        }
      });

      // Add 10mm reference line for scale verification
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      const refY = centerY + canvasHeightMM + 10;
      pdf.rect(centerX, refY, 10, 0.5); // 10mm reference line
      pdf.setFontSize(6);
      pdf.text('10mm reference', centerX, refY + 4);

      // Save PDF
      const fileName = `${motherObject.name}_${canvasWidthMM}x${canvasHeightMM}mm_1-1_LAYOUT.pdf`;
      pdf.save(fileName);

      console.log('✅ 1:1 scale layout PDF saved:', fileName);

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      console.error('❌ Error details:', error);
      alert('PDF generation failed. Check console for details.');
    }
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

  // Save Master File functions - Prompt user for name (or use provided name)
  const saveDirectly = async (providedFileName?: string) => {
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
    } else if (providedFileName) {
      // Use provided filename (from saveProject flow)
      console.log('Using provided filename:', providedFileName);
      await performSave(providedFileName);
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
      console.log('🔄 Loading for editing:', { masterFileId, isProjectMode });
      setIsLoadingMasterFile(true);

      // In Project Mode, try to load project state first (unless forceClean is specified)
      if (isProjectMode) {
        const urlParams = new URLSearchParams(window.location.search);
        const projectSlug = urlParams.get('projectSlug');
        const layoutId = urlParams.get('layoutId');
        const forceClean = urlParams.get('forceClean');

        // If forceClean is true, skip loading existing project state and go directly to clean master file
        if (forceClean === 'true') {
          console.log('🧹 Force clean mode: Skipping existing project state, loading clean master file');
        } else if (projectSlug) {
          console.log('🔄 Project Mode: Attempting to load project state:', { projectSlug, layoutId });

          try {
            // Try to load from project API
            const projectResponse = await fetch(`/api/projects/load?projectSlug=${projectSlug}`);

            if (projectResponse.ok) {
              const projectData = await projectResponse.json();
              if (projectData.success && projectData.projectState) {
                console.log('✅ Loaded project state from API:', projectData.projectState);
                await loadProjectState(projectData.projectState, masterFileId);
                return;
              }
            }
          } catch (apiError) {
            console.log('⚠️ API not available, trying localStorage fallback');
          }

          // Fallback: Try localStorage
          try {
            const storageKey = `project_${projectSlug}_layouts`;
            const savedLayouts = localStorage.getItem(storageKey);

            if (savedLayouts) {
              const parsedLayouts = JSON.parse(savedLayouts);

              // If layoutId is specified, load that specific layout
              if (layoutId) {
                const specificLayout = parsedLayouts.find((layout: any) => layout.id === layoutId);
                if (specificLayout) {
                  console.log('✅ Loading specific layout from localStorage:', specificLayout);
                  await loadProjectState(specificLayout, masterFileId);
                  return;
                }
              }

              // If no specific layout or layout not found, load the most recent one
              if (parsedLayouts.length > 0) {
                const mostRecentLayout = parsedLayouts[parsedLayouts.length - 1];
                console.log('✅ Loading most recent layout from localStorage:', mostRecentLayout);
                await loadProjectState(mostRecentLayout, masterFileId);
                return;
              }
            }
          } catch (storageError) {
            console.log('⚠️ No saved layouts found, loading empty template from master file');
          }
        }
      }

      // Default: Load from master file
      console.log('🔄 Loading from master file:', masterFileId, { isProjectMode });
      const result = await masterFileService.getMasterFileById(masterFileId);

      if (!result.success || !result.data) {
        console.error(`❌ Error loading master file: ${result.error || 'Master file not found'}`);
        return;
      }

      // In Project Mode, create empty mothers from master file template
      if (isProjectMode) {
        console.log('🎯 Project Mode: Creating empty mothers from master file template');
        await loadEmptyProjectFromMasterFile(result.data, masterFileId);
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
          tel: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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

  // Function to save as new master file (always prompts for name)
  const saveAsNewMasterFile = async () => {
    console.log('🔍 Save As button clicked - checking conditions...');

    if (!isWebCreationMode || !data || data.objects.length === 0) {
      alert('Please create some objects before saving as master file.');
      return;
    }

    if (!selectedCustomer) {
      alert('No customer selected. Please select a customer first.');
      return;
    }

    console.log('💬 Prompting user for new master file name...');

    // Prompt for new file name
    let layoutName = '';

    while (true) {
      layoutName = prompt('🏷️ Save As New Master File\n\nEnter a name for the new master file:', '') || '';

      console.log('User entered name:', layoutName);

      if (layoutName === null || layoutName === '') {
        // User cancelled or entered empty
        const retry = window.confirm('Master file name is required to save. Would you like to try again?');
        if (!retry) {
          console.log('User cancelled save as operation');
          return;
        }
        continue; // Ask again
      }

      if (layoutName.trim()) {
        // Check if name already exists for this customer
        try {
          const result = await masterFileService.getAllMasterFiles({ customerId: selectedCustomer.id });
          if (result.success && result.data) {
            const nameExists = result.data.some((file: any) =>
              file.name.toLowerCase() === layoutName.trim().toLowerCase()
            );

            if (nameExists) {
              alert(`❌ A master file named "${layoutName.trim()}" already exists for this customer. Please choose a different name.`);
              continue; // Ask again
            }
          }

          break; // Valid unique name entered
        } catch (error) {
          console.error('Error checking existing file names:', error);
          // Continue anyway if we can't check
          break;
        }
      }

      alert('Please enter a valid master file name (not just spaces).');
    }

    console.log('Proceeding to save as new file with name:', layoutName.trim());
    // Save with user-provided name as new file
    await performSave(layoutName.trim());
  };

  // Function to load project state (for Project Mode)
  const loadProjectState = async (projectState: any, masterFileId: string) => {
    try {
      console.log('🔄 Loading project state:', projectState);

      // Load customer information if we have canvas data with customerId
      if (projectState.canvasData?.customerId && !selectedCustomer) {
        console.log('🔄 Loading customer information for project state:', projectState.canvasData.customerId);
        try {
          const customer = await customerService.getCustomerById(projectState.canvasData.customerId);
          if (customer) {
            setSelectedCustomer(customer);
            console.log('✅ Customer loaded for project state:', customer.customerName);
          }
        } catch (customerError) {
          console.error('⚠️ Could not load customer for project state:', customerError);
        }
      }

      // Enter web creation mode and edit mode
      setIsWebCreationMode(true);
      setIsEditMode(true);
      setEditingMasterFileId(masterFileId);

      // Restore canvas data
      if (projectState.canvasData) {
        // Add layout name to canvas data for header display
        const canvasDataWithLayoutName = {
          ...projectState.canvasData,
          layoutName: projectState.name || 'Unnamed Layout'
        };
        setData(canvasDataWithLayoutName);
        setWebCreationData(canvasDataWithLayoutName);
        console.log('✅ Canvas data restored with layout name:', canvasDataWithLayoutName);
      }

      // Restore region contents (content objects)
      if (projectState.regionContents) {
        const restoredContents = new Map<string, any[]>();
        Object.entries(projectState.regionContents).forEach(([key, value]) => {
          restoredContents.set(key, Array.isArray(value) ? value : []);
        });
        setRegionContents(restoredContents);
        console.log('✅ Region contents restored:', restoredContents.size, 'regions with content');
      }

      // Restore view state
      if (projectState.viewState) {
        setZoom(projectState.viewState.zoom || 1);
        setPanX(projectState.viewState.panX || 0);
        setPanY(projectState.viewState.panY || 0);
        console.log('✅ View state restored:', projectState.viewState);
      } else {
        // Default view state
        setZoom(1);
        setPanX(0);
        setPanY(0);
      }

      // Restore canvas settings including overflow state
      if (projectState.showOverflowNumbers !== undefined) {
        setShowOverflowNumbers(projectState.showOverflowNumbers);
        console.log('✅ Overflow numbers state restored:', projectState.showOverflowNumbers);
      }

      if (projectState.showContentTypeNames !== undefined) {
        setShowContentTypeNames(projectState.showContentTypeNames);
        console.log('✅ Content type names state restored:', projectState.showContentTypeNames);
      }

      if (projectState.showSewingLines !== undefined) {
        setShowSewingLines(projectState.showSewingLines);
        console.log('✅ Sewing lines state restored:', projectState.showSewingLines);
      }

      // Restore overflow connection settings
      if (projectState.overflowSettings) {
        const restoredOverflowSettings = new Map<string, boolean>();
        Object.entries(projectState.overflowSettings).forEach(([key, value]) => {
          restoredOverflowSettings.set(key, Boolean(value));
        });
        setOverflowSettings(restoredOverflowSettings);
        console.log('✅ Overflow settings restored:', restoredOverflowSettings.size, 'content items');
      } else {
        setOverflowSettings(new Map());
      }

      // Restore overflow chains
      if (projectState.overflowChains) {
        const restoredOverflowChains = new Map<string, string[]>();
        Object.entries(projectState.overflowChains).forEach(([contentType, chain]) => {
          if (Array.isArray(chain)) {
            restoredOverflowChains.set(contentType, chain);
          }
        });
        setOverflowChains(restoredOverflowChains);
        console.log('✅ Overflow chains restored:', restoredOverflowChains.size, 'content types');
      } else if (projectState.lineTextOverflowChain && Array.isArray(projectState.lineTextOverflowChain)) {
        // Backward compatibility: convert old single chain to new format
        const legacyChains = new Map<string, string[]>();
        legacyChains.set('line-text', projectState.lineTextOverflowChain);
        setOverflowChains(legacyChains);
        console.log('✅ Legacy overflow chain converted:', projectState.lineTextOverflowChain);
      } else {
        setOverflowChains(new Map());
      }

      // Note: Overflow numbers are now calculated dynamically, no need to restore permanent storage

      // Restore expanded mothers state
      if (projectState.expandedMothers && Array.isArray(projectState.expandedMothers)) {
        setExpandedMothers(new Set(projectState.expandedMothers));
        console.log('✅ Expanded mothers restored:', projectState.expandedMothers);
      } else {
        setExpandedMothers(new Set());
      }

      // Restore selected object
      if (projectState.selectedObject) {
        setSelectedObject(projectState.selectedObject);
        console.log('✅ Selected object restored:', projectState.selectedObject);
      } else {
        setSelectedObject(null);
      }

      // Reset metadata (will be restored from saved data if available)
      setSonMetadata(new Map());

      // Get project info for display
      const urlParams = new URLSearchParams(window.location.search);
      const projectName = urlParams.get('projectName') || 'Project';

      console.log(`✅ Project Loaded Successfully! Name: ${projectName}, Saved: ${projectState.savedAt}`);

      setNotification(`✅ Project loaded: ${projectName}`);
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error('❌ Error loading project state:', error);
      throw error;
    } finally {
      setIsLoadingMasterFile(false);
    }
  };

  // Function to load project from master file template (Project Mode)
  const loadEmptyProjectFromMasterFile = async (masterFile: any, masterFileId: string) => {
    try {
      console.log('🔄 Creating project from master file template:', masterFile);

      // Load customer information for the master file
      if (masterFile.customerId && !selectedCustomer) {
        console.log('🔄 Loading customer information for project mode:', masterFile.customerId);
        try {
          const customer = await customerService.getCustomerById(masterFile.customerId);
          if (customer) {
            setSelectedCustomer(customer);
            console.log('✅ Customer loaded for project mode:', customer.customerName);
          }
        } catch (customerError) {
          console.error('⚠️ Could not load customer for project mode:', customerError);
        }
      }

      // Enter web creation mode and edit mode
      setIsWebCreationMode(true);
      setIsEditMode(true);
      setEditingMasterFileId(masterFileId);

      // Store the original master file for header display
      setOriginalMasterFile(masterFile);

      // Load the actual master file content (not empty template)
      const projectMothers = masterFile.designData.objects
        .filter((obj: any) => obj.type?.includes('mother'))
        .map((motherTemplate: any) => {
          // Create mother with actual master file content
          const projectMother = {
            ...motherTemplate,
            // Keep all regions with their actual structure and properties
            regions: (motherTemplate.regions || []).map((region: any) => ({
              ...region,
              // Preserve all region properties from master file
              id: region.id || `region_${Date.now()}_${Math.random()}`,
              name: region.name || 'Unnamed Region',
              x: region.x || 0,
              y: region.y || 0,
              width: region.width || 50,
              height: region.height || 20,
              margins: region.margins || { top: 2, bottom: 2, left: 2, right: 2 },
              borderColor: region.borderColor || '#2196f3',
              backgroundColor: region.backgroundColor || 'rgba(33, 150, 243, 0.1)',
              allowOverflow: region.allowOverflow || false,
              // Preserve slice structure if it exists
              children: region.children || undefined,
              parentId: region.parentId || undefined,
              isSliced: region.isSliced || false
            }))
          };

          console.log('👩 Created project mother from master file:', {
            name: projectMother.name,
            originalRegions: motherTemplate.regions?.length || 0,
            projectRegions: projectMother.regions?.length || 0,
            hasSlices: projectMother.regions?.some((r: any) => r.children?.length > 0) || false
          });

          return projectMother;
        });

      // Create project data structure with actual master file content
      const projectData = {
        document: `Project: ${masterFile.name}`,
        totalObjects: projectMothers.length,
        objects: projectMothers,
        // Copy master file metadata
        width: masterFile.width,
        height: masterFile.height,
        customerId: masterFile.customerId,
        description: `Project based on ${masterFile.name}`,
        // Project-specific metadata
        isProjectMode: true,
        masterFileId: masterFileId,
        createdAt: new Date().toISOString(),
        // Preserve master file design data
        originalMasterFile: {
          id: masterFileId,
          name: masterFile.name,
          loadedAt: new Date().toISOString()
        }
      };

      // Set the project data with master file content
      setData(projectData);
      setWebCreationData(projectData);

      // Initialize region contents from master file (if any exist)
      const initialRegionContents = new Map();

      // Check if master file has any existing content in regions
      projectMothers.forEach((mother: any) => {
        if (mother.regions) {
          mother.regions.forEach((region: any) => {
            // If region has content from master file, preserve it
            if (region.content && region.content.length > 0) {
              initialRegionContents.set(region.id, region.content);
            }

            // Also check child regions (slices) for content
            if (region.children) {
              region.children.forEach((childRegion: any) => {
                if (childRegion.content && childRegion.content.length > 0) {
                  initialRegionContents.set(childRegion.id, childRegion.content);
                }
              });
            }
          });
        }
      });

      setRegionContents(initialRegionContents);
      console.log('📋 Initialized region contents from master file:', initialRegionContents.size, 'regions with content');

      // Reset view state
      setZoom(1);
      setPanX(0);
      setPanY(0);

      // Reset other states
      setSelectedObject(null);
      setSonMetadata(new Map());
      setExpandedMothers(new Set());

      // Get project info for display
      const urlParams = new URLSearchParams(window.location.search);
      const projectName = urlParams.get('projectName') || 'Project';

      console.log(`✅ Project Created from Master File! Name: ${projectName}, Template: ${masterFile.name}, Mothers: ${projectMothers.length}, Regions with content: ${initialRegionContents.size}`);

      setNotification(`✅ Project created from ${masterFile.name} with ${projectMothers.length} mothers and ${initialRegionContents.size} content regions`);
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error('❌ Error creating project from master file:', error);
      throw error;
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
    if (!isWebCreationMode && !isMasterFileMode) return;

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
          // Get the old mid-fold line configuration for comparison
          const oldMidFoldLine = (obj as any).midFoldLine;

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

          // Check if mother currently has no regions - if so, auto-create them
          const currentRegions = (obj as any).regions || [];
          if (currentRegions.length === 0) {
            console.log('🤖 Mother has no regions - auto-creating regions for updated mother');
            const autoRegions = createAutoRegionsForNewMother(updatedObj);
            updatedObj.regions = autoRegions;
            console.log('✅ Auto-created regions for updated mother:', autoRegions);
          } else {
            // Automatically update regions if mid-fold line properties changed (existing regions)
            const updatedRegions = updateRegionsForMidFoldChange(
              updatedObj,
              motherConfig.midFoldLine,
              oldMidFoldLine
            );

            if (updatedRegions !== updatedObj.regions) {
              updatedObj.regions = updatedRegions;
              console.log('🔄 Automatically updated regions due to mid-fold changes:', updatedRegions);
            }
          }

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
        regions: [] // Initialize with empty regions array first
      } as any;

      // Automatically create regions based on mid-fold configuration
      const autoRegions = createAutoRegionsForNewMother(newMother);
      (newMother as any).regions = autoRegions;

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

  // Content Drag and Drop Handlers
  const handleContentDragOver = (e: React.DragEvent, regionId: string) => {
    e.preventDefault();
    setDragOverRegion(regionId);

    // Check if region already has content (1 content type per slice limit)
    const currentContents = regionContents.get(regionId) || [];
    const hasContent = currentContents.length > 0;

    if (hasContent) {
      // Region already has content - show warning visual feedback
      e.dataTransfer.dropEffect = 'copy'; // Still allow drop for replacement
      setDragOverRegion(regionId); // Use same visual state but will be styled differently
      return;
    }

    // Check region occupation for space-based validation
    const occupation = calculateRegionOccupation(regionId);

    if (occupation.isFull) {
      // Region is full - no visual feedback, set drop effect to none
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    // Region is empty and has space - allow drop and show positive visual feedback
    e.dataTransfer.dropEffect = 'copy';
    setDragOverRegion(regionId);
  };

  const handleContentDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverRegion(null);
  };

  // Helper function to proceed with content drop after confirmation
  const proceedWithContentDrop = (contentTypeData: ContentType, regionId: string) => {
    // Check region occupation before allowing drop
    const occupation = calculateRegionOccupation(regionId);

    if (occupation.isFull) {
      setNotification(`❌ ${occupation.regionName} is full - cannot add more content`);
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    console.log('🎯 Proceeding with content drop:', contentTypeData.name, 'on region:', regionId);

    // Check if this is the new CT line text
    if ((contentTypeData as any).isNewCt && contentTypeData.id === 'new-line-text') {
      console.log('🆕 NEW CT Line Text - Opening configuration dialog');

      // Find the region to get its dimensions
      let region: any = null;
      const currentData = data || webCreationData;
      if (currentData) {
        for (const obj of currentData.objects) {
          if (obj.type?.includes('mother')) {
            const regions = (obj as any).regions || [];
            region = regions.find((r: any) => r.id === regionId);
            if (region) break;
          }
        }
      }
      if (!region) {
        setNotification(`❌ Region ${regionId} not found`);
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // Open configuration dialog
      setNewLineTextDialog({
        isOpen: true,
        regionId: regionId,
        regionWidth: region.width,
        regionHeight: region.height
      });
      return;
    }

    // Check if this is the new CT multi-line
    if ((contentTypeData as any).isNewCt && contentTypeData.id === 'new-multi-line') {
      console.log('🆕 NEW CT Multi-line - Opening configuration dialog');

      // Find the region to get its dimensions (check both main regions and child regions/slices)
      let region: any = null;
      const currentData = data || webCreationData;
      if (currentData) {
        for (const obj of currentData.objects) {
          if (obj.type?.includes('mother')) {
            const regions = (obj as any).regions || [];

            // First check main regions
            region = regions.find((r: any) => r.id === regionId);
            if (region) break;

            // If not found in main regions, check child regions (slices)
            for (const parentRegion of regions) {
              if (parentRegion.children && parentRegion.children.length > 0) {
                const childRegion = parentRegion.children.find((child: any) => child.id === regionId);
                if (childRegion) {
                  region = childRegion;
                  break;
                }
              }
            }
            if (region) break;
          }
        }
      }
      if (!region) {
        setNotification(`❌ Region/Slice ${regionId} not found`);
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // Debug: Check actual region data for new content
      const isSliceRegion = regionId.includes('_slice_');
      console.log('🔍 REGION DEBUG - Opening NewMultiLineDialog for new content:', {
        regionId: regionId,
        regionType: isSliceRegion ? 'slice' : 'main region',
        regionData: region,
        actualWidth: region.width,
        actualHeight: region.height,
        expectedWidth: '35mm (if this shows 33mm, the region data is wrong)'
      });

      // Open configuration dialog
      setNewMultiLineDialog({
        isOpen: true,
        regionId: regionId,
        regionWidth: region.width,
        regionHeight: region.height
      });
      return;
    }

    // Check if this is the new CT washing care symbol
    if ((contentTypeData as any).isNewCt && contentTypeData.id === 'new-washing-care-symbol') {
      console.log('🆕 NEW CT Washing Care Symbol - Opening blank dialog');

      // Find the region to get its dimensions (check both main regions and child regions/slices)
      let region: any = null;
      const currentData = data || webCreationData;
      if (currentData) {
        for (const obj of currentData.objects) {
          if (obj.type?.includes('mother')) {
            const regions = (obj as any).regions || [];

            // First check main regions
            region = regions.find((r: any) => r.id === regionId);
            if (region) break;

            // If not found in main regions, check child regions (slices)
            for (const parentRegion of regions) {
              if (parentRegion.children && parentRegion.children.length > 0) {
                const childRegion = parentRegion.children.find((child: any) => child.id === regionId);
                if (childRegion) {
                  region = childRegion;
                  break;
                }
              }
            }
            if (region) break;
          }
        }
      }
      if (!region) {
        setNotification(`❌ Region/Slice ${regionId} not found`);
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // Open blank dialog
      setNewWashingCareSymbolDialog({
        isOpen: true,
        regionId: regionId,
        regionWidth: region.width,
        regionHeight: region.height
      });
      return;
    }

    // For all other content types, open universal content dialog
    setUniversalDialog({
      isOpen: true,
      regionId: regionId,
      contentType: contentTypeData,
      editingContent: null // Ensure we're creating new content, not editing
    });
  };

  const handleContentDrop = (e: React.DragEvent, regionId: string) => {
    e.preventDefault();
    setDragOverRegion(null);

    // Clear any drag over state
    setDragOverRegion(null);

    // Find the region to check if it has slices
    const currentData = data || webCreationData;
    let targetRegion: any = null;
    let isSlice = false;

    if (currentData) {
      // Find the region in the current data
      for (const obj of currentData.objects) {
        if (obj.type?.includes('mother')) {
          const regions = (obj as any).regions || [];

          // Check if it's a parent region
          targetRegion = regions.find((r: any) => r.id === regionId);
          if (targetRegion) {
            isSlice = false;
            break;
          }

          // Check if it's a slice (child region)
          for (const region of regions) {
            if (region.children && region.children.length > 0) {
              const childRegion = region.children.find((child: any) => child.id === regionId);
              if (childRegion) {
                targetRegion = childRegion;
                isSlice = true;
                break;
              }
            }
          }
          if (targetRegion) break;
        }
      }
    }

    // Rule 2: Region with slices - no action (ignore drop)
    if (targetRegion && !isSlice && targetRegion.children && targetRegion.children.length > 0) {
      console.log('🚫 Ignoring drop on region with slices');
      return; // No action, no notification
    }

    // Rule 1 & 3: Region without slices OR slice with content - check for existing content
    const currentContents = regionContents.get(regionId) || [];
    console.log('🔍 Content check for region:', regionId, 'Contents:', currentContents, 'Length:', currentContents.length);
    console.log('🔍 Target region detection:', { targetRegion: targetRegion?.name, isSlice, hasChildren: targetRegion?.children?.length || 0 });
    if (currentContents.length > 0) {
      const existingContentType = currentContents[0].type;
      const existingTypeName = existingContentType.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

      // Get the new content type being dropped
      let contentTypeData: ContentType;
      try {
        const jsonData = e.dataTransfer.getData('application/json');
        if (!jsonData || jsonData.trim() === '') {
          console.error('❌ No JSON data found in drag transfer');
          return;
        }
        contentTypeData = JSON.parse(jsonData) as ContentType;
      } catch (error) {
        console.error('❌ Failed to parse drag transfer data:', error);
        return;
      }

      const newTypeName = contentTypeData.name.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

      // Show custom warning dialog with red background and yellow text
      const areaType = isSlice ? 'slice' : 'region';

      console.log('🚨 Triggering warning dialog for:', areaType, 'Region ID:', regionId, 'Existing:', existingTypeName, 'New:', newTypeName);

      setContentWarningDialog({
        isOpen: true,
        areaType,
        existingContent: existingTypeName,
        newContent: newTypeName,
        onConfirm: () => {
          // User confirmed replacement - clear existing content immediately
          console.log(`🔄 Replacing ${existingTypeName} with ${newTypeName} in ${areaType} ${regionId}`);

          // Use functional update to ensure immediate clearing
          setRegionContents(prevContents => {
            const updatedContents = new Map(prevContents);
            updatedContents.delete(regionId);
            console.log(`✅ Cleared existing content from ${areaType} ${regionId}`);
            return updatedContents;
          });

          // Close dialog and continue with drop
          setContentWarningDialog(null);

          // Continue with the drop process
          proceedWithContentDrop(contentTypeData, regionId);
        },
        onCancel: () => {
          setNotification(`❌ Drop cancelled - ${areaType} keeps existing ${existingTypeName}`);
          setTimeout(() => setNotification(null), 3000);
          setContentWarningDialog(null);
        }
      });

      return; // Exit here, dialog will handle the rest
    }

    // If no existing content, proceed with drop directly
    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData || jsonData.trim() === '') {
        console.error('❌ No JSON data found in drag transfer');
        return;
      }
      const contentTypeData = JSON.parse(jsonData) as ContentType;
      console.log('✅ No existing content, proceeding with drop:', contentTypeData.name);
      proceedWithContentDrop(contentTypeData, regionId);
    } catch (error) {
      console.error('❌ Error parsing dropped data:', error);
      setNotification('❌ Invalid content data - drop failed');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleUniversalContentSave = (data: UniversalContentData) => {
    // DEBUG: Log what data is received from dialog
    console.log('🔍 APP SAVE RECEIVED:');
    console.log('   - Data Type:', data.type);
    console.log('   - Data Content:', data.content);
    console.log('   - Data Content Text:', data.content.text);
    console.log('   - Text Length:', data.content.text?.length || 0);

    // In Project Mode, ensure content occupies the whole region
    let contentData = data;
    if (isProjectMode) {
      contentData = {
        ...data,
        layout: {
          ...data.layout,
          fullWidth: true,
          fullHeight: true,
          width: { value: 100, unit: '%' },
          height: { value: 100, unit: '%' }
        }
      };
      console.log('🎯 Project Mode: Setting content to occupy full region', contentData);
    }

    // Use functional update to prevent race conditions and ensure proper content management
    setRegionContents(prevContents => {
      const currentContents = prevContents.get(data.regionId) || [];
      const updatedContents = new Map(prevContents);

      if (universalDialog.editingContent) {
        // Editing existing content - replace it
        // FIXED: Preserve original ID to maintain overflow chain integrity
        const preservedContentData = {
          ...contentData,
          id: universalDialog.editingContent.id
        };
        const newContents = currentContents.map(content =>
          content.id === universalDialog.editingContent.id ? preservedContentData : content
        );
        updatedContents.set(data.regionId, newContents);
        console.log(`✅ Updated existing content in region ${data.regionId}`);
      } else {
        // Adding new content - handle Project Mode vs Master File Mode differently
        if (isProjectMode) {
          // Project Mode: Only one content type per region, replace ALL existing content
          updatedContents.set(data.regionId, [contentData]);
          console.log(`✅ Project Mode: Replaced all content in region ${data.regionId} with single content type: ${contentData.type}`);
        } else {
          // Master File Mode: Check for duplicates of same type only
          const existingContentTypes = currentContents.map(c => c.type);
          const newContentType = contentData.type;

          if (existingContentTypes.includes(newContentType)) {
            console.warn(`⚠️ Content type ${newContentType} already exists in region ${data.regionId}, replacing...`);
            // Replace existing content of same type
            const newContents = currentContents.filter(c => c.type !== newContentType);
            newContents.push(contentData);
            updatedContents.set(data.regionId, newContents);
          } else {
            // Add new content
            const newContents = [...currentContents, contentData];
            updatedContents.set(data.regionId, newContents);
          }
          console.log(`✅ Master File Mode: Added content to region ${data.regionId}, total contents: ${(updatedContents.get(data.regionId) || []).length}`);
        }
      }

      return updatedContents;
    });

    // REMOVED: Auto-overflow logic that caused unwanted automatic numbering
    // and state timing issues. All content types now follow the same manual
    // overflow behavior like translation-paragraph.

    // Check if this is a master object being saved and increment version for connector updates
    if (universalDialog.editingContent && getOverflowRole) {
      const role = getOverflowRole(universalDialog.editingContent.id);
      if (role === 'initiator') {
        setMasterPropertiesVersion(prev => prev + 1);
        console.log('🔄 Master properties updated, incrementing version for connector sync');

        // CRITICAL: Trigger overflow redistribution when initiator content changes
        // Pass the new text directly to avoid state timing issues
        setTimeout(() => {
          recalculateOverflowChainWithText(universalDialog.editingContent.id, contentData.content.text);
        }, 100);
      }
    }

    // Show notification
    const contentTypeName = universalDialog.contentType?.name || 'Content';
    const action = universalDialog.editingContent ? 'updated' : (isProjectMode ? 'set as' : 'added');
    setNotification(`${contentTypeName} ${action} in region ${data.regionId}`);

    // Close dialog
    setUniversalDialog({ isOpen: false, regionId: '', contentType: null, editingContent: null });

    setTimeout(() => setNotification(null), 3000);
  };

  const handleUniversalContentCancel = () => {
    setUniversalDialog({ isOpen: false, regionId: '', contentType: null, editingContent: null });
  };

  // Function to duplicate a mother object - using the same approach as createMotherObject
  const duplicateMother = (originalMother: AIObject) => {
    console.log('🔄 DUPLICATE BUTTON CLICKED!');
    console.log('📊 Original mother to duplicate:', originalMother);

    const currentData = data || webCreationData;
    if (!currentData) {
      console.error('❌ No current data available');
      alert('❌ No data available for duplication');
      return;
    }

    console.log('📊 Current data before duplication:', currentData);
    console.log('📊 Current objects count:', currentData.objects.length);

    // Find next mother number
    const motherObjects = currentData.objects.filter(obj => obj.type?.includes('mother'));
    const nextMotherNumber = motherObjects.length + 1;
    console.log('🔢 Next mother number:', nextMotherNumber);
    console.log('📊 Existing mothers:', motherObjects.map(m => ({ name: m.name, x: m.x, y: m.y })));

    // Copy all regions from original mother
    const originalRegions = (originalMother as any).regions || [];
    const copiedRegions = originalRegions.map((region: any) => ({
      ...region,
      id: `${region.id}_copy_${nextMotherNumber}` // Unique ID for copied region
    }));

    console.log('📋 Copying regions from original mother:', originalRegions.length);
    console.log('📋 Copied regions:', copiedRegions);

    // Calculate position for new mother to avoid overlaps
    const spacing = 20; // Consistent spacing between mothers
    let newX = originalMother.x;
    let newY = originalMother.y;

    // Find the rightmost position of all existing mothers
    let maxRightX = 0;
    motherObjects.forEach(mother => {
      const rightEdge = mother.x + mother.width;
      if (rightEdge > maxRightX) {
        maxRightX = rightEdge;
      }
    });

    // Position new mother to the right of all existing mothers
    newX = maxRightX + spacing;
    newY = originalMother.y; // Same Y level as Mother_1

    console.log(`📍 Positioning Mother_${nextMotherNumber} at (${newX}, ${newY})`);
    console.log(`📏 Spacing from rightmost mother: ${spacing}mm`);

    // Create new mother using the same structure as the original createMotherObject function
    const newMother: AIObject = {
      name: `Mother_${nextMotherNumber}`,
      type: 'mother',
      x: newX,
      y: newY,
      width: originalMother.width,
      height: originalMother.height,
      typename: 'mother',
      // Copy all the additional properties
      margins: (originalMother as any).margins,
      sewingPosition: (originalMother as any).sewingPosition,
      sewingOffset: (originalMother as any).sewingOffset,
      midFoldLine: (originalMother as any).midFoldLine,
      regions: copiedRegions // Copy all regions from original mother
    } as any;

    console.log('👩 New mother created:', newMother);

    // Add to objects array
    const updatedObjects = [...currentData.objects, newMother];
    console.log('📊 Updated objects array:', updatedObjects);

    // Create new data structure
    const updatedData = {
      ...currentData,
      objects: updatedObjects,
      totalObjects: updatedObjects.length
    };

    console.log('💾 Updated data structure:', updatedData);

    // Update state - always update the main data since we're editing a master file
    console.log('💾 Setting data (master file mode)...');
    setData(updatedData);

    // Also update webCreationData if it exists to keep them in sync
    if (webCreationData) {
      console.log('💾 Also updating webCreationData for sync...');
      setWebCreationData(updatedData);
    }

    // Select the new mother
    setSelectedObject(newMother);
    console.log('🎯 Selected new mother');

    // Show notification
    setNotification(`✅ Created ${newMother.name} from ${originalMother.name}`);
    setTimeout(() => setNotification(null), 3000);

    console.log('✅ Duplication completed!');
  };

  // Function to trash/delete a mother (except Mother_1)
  const trashMother = (motherToDelete: AIObject) => {
    if (motherToDelete.name === 'Mother_1') {
      alert('❌ Cannot delete Mother_1 - it is protected');
      return;
    }

    const regionCount = (motherToDelete as any).regions?.length || 0;
    const confirmMessage = `🗑️ Delete ${motherToDelete.name} and all its ${regionCount} regions?\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const currentData = data || webCreationData;
    if (!currentData) return;

    console.log('🗑️ Deleting mother:', motherToDelete.name);

    // Remove the mother from objects array
    const updatedObjects = currentData.objects.filter(obj => obj.name !== motherToDelete.name);
    const updatedData = {
      ...currentData,
      objects: updatedObjects,
      totalObjects: updatedObjects.length
    };

    // Update state
    setData(updatedData);
    if (webCreationData) {
      setWebCreationData(updatedData);
    }

    // Clear selection if the deleted mother was selected
    if (selectedObject?.name === motherToDelete.name) {
      setSelectedObject(null);
    }

    console.log(`✅ Deleted ${motherToDelete.name} and ${regionCount} regions`);
    setNotification(`✅ Deleted ${motherToDelete.name} and ${regionCount} regions`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Function to save project with overwrite logic
  const saveProject = async () => {
    // Check if we're editing an existing layout
    const urlParams = new URLSearchParams(window.location.search);
    const layoutId = urlParams.get('layoutId');

    if (layoutId) {
      // Existing layout - overwrite (no name prompt needed)
      await saveProjectWithOption('overwrite', null);
    } else {
      // New layout - prompt for name
      const layoutName = window.prompt(
        '💾 Save Layout\n\nEnter a name for this layout:',
        `Layout ${new Date().toLocaleDateString()}`
      );

      if (layoutName === null) {
        // User cancelled
        console.log('❌ Save cancelled by user');
        return;
      }

      if (layoutName.trim() === '') {
        alert('❌ Layout name cannot be empty');
        return;
      }

      await saveProjectWithOption('new', layoutName.trim());
    }
  };

  // Function to save project as new (always prompts for name)
  const saveProjectAs = async () => {
    const layoutName = window.prompt(
      '💾 Save As New Layout\n\nEnter a name for the new layout:',
      `Layout ${new Date().toLocaleDateString()}`
    );

    if (layoutName === null) {
      // User cancelled
      console.log('❌ Save As cancelled by user');
      return;
    }

    if (layoutName.trim() === '') {
      alert('❌ Layout name cannot be empty');
      return;
    }

    await saveProjectWithOption('new', layoutName.trim());
  };

  // Core save function with save option parameter
  const saveProjectWithOption = async (saveOption: 'overwrite' | 'new', customName: string | null = null) => {
    if (!isProjectMode) {
      // For non-project mode, use original master file saving
      const currentData = data || webCreationData;
      if (!currentData) {
        alert('❌ No data to save');
        return;
      }

      const motherCount = currentData.objects.filter(obj => obj.type?.includes('mother')).length;
      console.log('💾 Saving all mothers to master file:', motherCount);

      try {
        await saveDirectly(customName || undefined);
        setNotification(`✅ Saved ${motherCount} mothers to master file`);
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error('❌ Error saving all mothers:', error);
        alert('❌ Error saving mothers to master file');
      }
      return;
    }

    // Project Mode: Save everything to project (not master file)
    const currentData = data || webCreationData;
    if (!currentData) {
      alert('❌ No data to save');
      return;
    }

    const motherCount = currentData.objects.filter(obj => obj.type?.includes('mother')).length;

    // Get layout information
    const urlParams = new URLSearchParams(window.location.search);
    const layoutId = urlParams.get('layoutId');
    const isEditingExisting = !!layoutId;

    console.log('💾 Project Mode: Saving to project with option:', {
      motherCount,
      regionContents: regionContents.size,
      projectMode: isProjectMode,
      saveOption,
      isEditingExisting,
      layoutId
    });

    try {
      // Create complete layout state for parent project
      const layoutState = {
        // Layout metadata - use existing ID if overwriting, new ID if saving as new
        id: saveOption === 'overwrite' && layoutId ? layoutId : `layout_${Date.now()}`,
        name: customName || (saveOption === 'overwrite' && layoutId
          ? `Layout ${layoutId.replace('layout_', '')} (Updated ${new Date().toLocaleString()})`
          : `Layout ${new Date().toLocaleString()}`),
        createdAt: saveOption === 'overwrite' && layoutId
          ? new Date().toISOString() // Keep original creation time if we had it
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // Canvas data
        canvasData: currentData,
        // Content objects in regions
        regionContents: Object.fromEntries(regionContents),
        // Canvas view state
        viewState: {
          zoom,
          panX,
          panY
        },
        // Metadata
        version: '2.1.91',
        motherCount: motherCount,
        contentObjectCount: regionContents.size,
        // Save metadata
        saveType: saveOption,
        originalLayoutId: layoutId
      };

      // Get project information from URL
      const urlParams = new URLSearchParams(window.location.search);
      const projectSlug = urlParams.get('projectSlug');
      const projectName = urlParams.get('projectName');

      if (!projectSlug) {
        alert('❌ Project information not found');
        return;
      }

      // Save layout to parent project
      const response = await fetch('/api/projects/save-layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentProjectSlug: projectSlug, // fall2025-ttt
          layoutData: layoutState
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save layout to project: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Layout saved to parent project:', result);

      // Show success notification
      const actionText = saveOption === 'overwrite' && layoutId ? 'overwritten' : 'saved as new';
      setNotification(`✅ Layout ${actionText} in project: ${motherCount} mothers, ${regionContents.size} content objects`);

      // Redirect to parent project page after short delay
      setTimeout(() => {
        const parentProjectUrl = `http://localhost:3002/projects/${projectSlug}`;
        console.log('🔄 Redirecting to parent project:', parentProjectUrl);
        window.location.href = parentProjectUrl;
      }, 2000); // 2 second delay to show notification

    } catch (error) {
      console.error('❌ Error saving project:', error);
      // Fallback: Save to localStorage for development
      try {
        // Create layouts array in localStorage if it doesn't exist
        const urlParams = new URLSearchParams(window.location.search);
        const projectSlug = urlParams.get('projectSlug');
        const projectStorageKey = `project_${projectSlug}_layouts`;

        // Get existing layouts or create empty array
        const existingLayouts = JSON.parse(localStorage.getItem(projectStorageKey) || '[]');

        // Create layout state for fallback (same structure as main save)
        const fallbackLayoutState = {
          // Layout metadata - use existing ID if overwriting, new ID if saving as new
          id: saveOption === 'overwrite' && layoutId ? layoutId : `layout_${Date.now()}`,
          name: customName || (saveOption === 'overwrite' && layoutId
            ? `Layout ${layoutId.replace('layout_', '')} (Updated ${new Date().toLocaleString()})`
            : `Layout ${new Date().toLocaleString()}`),
          createdAt: saveOption === 'overwrite' && layoutId
            ? new Date().toISOString() // Keep original creation time if we had it
            : new Date().toISOString(),
          updatedAt: new Date().toISOString(),

          // Canvas data
          canvasData: currentData,
          // Content objects in regions
          regionContents: Object.fromEntries(regionContents),
          // Canvas view state
          viewState: {
            zoom,
            panX,
            panY
          },
          // Canvas settings - including overflow state
          showOverflowNumbers: showOverflowNumbers,
          showContentTypeNames: showContentTypeNames,
          showSewingLines: showSewingLines,
          expandedMothers: Array.from(expandedMothers),
          selectedObject: selectedObject,

          // Overflow connection settings
          overflowSettings: Object.fromEntries(overflowSettings),
          overflowChains: Object.fromEntries(overflowChains),
          // Metadata
          version: '2.1.91',
          motherCount: motherCount,
          contentObjectCount: regionContents.size,
          // Save metadata
          saveType: saveOption,
          originalLayoutId: layoutId
        };

        // Handle overwrite vs new save
        if (saveOption === 'overwrite' && layoutId) {
          // Find and replace existing layout
          const existingIndex = existingLayouts.findIndex((layout: any) => layout.id === layoutId);
          if (existingIndex !== -1) {
            // Update existing layout
            existingLayouts[existingIndex] = fallbackLayoutState;
            console.log('🔄 Overwriting existing layout in localStorage:', layoutId);
          } else {
            // Layout not found, add as new
            existingLayouts.push(fallbackLayoutState);
            console.log('⚠️ Layout not found for overwrite, saving as new:', layoutId);
          }
        } else {
          // Add new layout
          existingLayouts.push(fallbackLayoutState);
          console.log('➕ Adding new layout to localStorage:', fallbackLayoutState.id);
        }

        // Save updated layouts array
        localStorage.setItem(projectStorageKey, JSON.stringify(existingLayouts));
        console.log('💾 Saved layout to localStorage as fallback:', projectStorageKey);
        console.log('📊 Layout data saved:', fallbackLayoutState);

        const actionText = saveOption === 'overwrite' && layoutId ? 'overwritten' : 'saved as new';
        setNotification(`✅ Layout ${actionText} in project (local): ${motherCount} mothers, ${regionContents.size} content objects`);

        // Redirect to parent project page after short delay
        setTimeout(() => {
          const parentProjectUrl = `http://localhost:3002/projects/${projectSlug}`;
          console.log('🔄 Redirecting to parent project (fallback):', parentProjectUrl);
          window.location.href = parentProjectUrl;
        }, 2000); // 2 second delay to show notification

      } catch (localError) {
        console.error('❌ Error saving to localStorage:', localError);
        alert('❌ Error saving project. Please try again.');
      }
    }
  };

  // Legacy function for backward compatibility - defaults to save as new
  const saveAllMothers = async () => {
    await saveProjectWithOption('new', null);
  };

  // Function to add master file - loads original clean master file from project as new mother
  const addMasterFile = async () => {
    console.log('🔍 Add Master File button clicked');

    if (!isProjectMode) {
      alert('❌ Add Master File is only available in Project Mode');
      return;
    }

    try {
      // Get current project data
      const currentData = data || webCreationData;
      if (!currentData) {
        alert('❌ No project data available');
        return;
      }

      // Use the current project's master file template (first mother as clean template)
      const currentMotherObjects = currentData.objects.filter(obj => obj.type?.includes('mother'));
      if (currentMotherObjects.length === 0) {
        alert('❌ No mother objects found in current project');
        return;
      }

      // Use the first mother as the master template (this is the original design)
      const masterTemplate = currentMotherObjects[0];
      console.log('🎯 Using current project master template:', masterTemplate.name);

      // Find next mother number for current canvas
      const nextMotherNumber = currentMotherObjects.length + 1;

      // Create clean regions from original master file (no slits, original design)
      const originalRegions = (masterTemplate as any).regions || [];
      const cleanRegions = originalRegions.map((region: any) => ({
        ...region,
        id: `${region.id}_master_${nextMotherNumber}`, // Unique ID for master file region
        content: region.content || [], // Keep original content structure but empty
        children: [] // No slits - clean master file
      }));

      console.log('🧹 Created clean master regions:', cleanRegions.length);

      // Calculate position for new mother next to latest mother
      const spacing = 20;
      let maxRightX = 0;
      currentMotherObjects.forEach(mother => {
        const rightEdge = mother.x + mother.width;
        if (rightEdge > maxRightX) {
          maxRightX = rightEdge;
        }
      });

      const newX = maxRightX + spacing;
      const newY = masterTemplate.y;

      // Create new mother from original master file template
      const masterFileMother: AIObject = {
        name: `Mother_${nextMotherNumber}`,
        type: 'mother',
        x: newX,
        y: newY,
        width: masterTemplate.width,
        height: masterTemplate.height,
        typename: 'mother',
        // Use original master file properties
        margins: (masterTemplate as any).margins,
        sewingPosition: (masterTemplate as any).sewingPosition,
        sewingOffset: (masterTemplate as any).sewingOffset,
        midFoldLine: (masterTemplate as any).midFoldLine,
        regions: cleanRegions // Original clean regions from master file
      } as any;

      console.log('📁 New master file mother created:', masterFileMother);

      // Add to current canvas objects (keep existing content)
      const updatedObjects = [...currentData.objects, masterFileMother];

      // Create new data structure
      const updatedData = {
        ...currentData,
        objects: updatedObjects,
        totalObjects: updatedObjects.length
      };

      // Update state
      setData(updatedData);
      if (webCreationData) {
        setWebCreationData(updatedData);
      }

      // Select the new master file mother
      setSelectedObject(masterFileMother);

      // Show success notification
      setNotification(`✅ Original master file added as ${masterFileMother.name} (${cleanRegions.length} clean regions)`);
      setTimeout(() => setNotification(null), 3000);

      console.log('✅ Original master file added successfully');

    } catch (error) {
      console.error('❌ Error adding master file:', error);
      alert('❌ Error adding master file. Please try again.');
    }
  };

  // Function to generate PDF with all mothers
  const generatePDFAllMothers = async () => {
    const currentData = data || webCreationData;
    if (!currentData) {
      alert('❌ No data to generate PDF');
      return;
    }

    const mothers = currentData.objects.filter(obj => obj.type?.includes('mother'));
    if (mothers.length === 0) {
      alert('❌ No mothers found to generate PDF');
      return;
    }

    // Simple confirmation dialog
    const confirmed = window.confirm(`🖨️ Generate PDF with layout and content information?\n\n📊 Mothers: ${mothers.length}\n📋 Mode: ${isProjectMode ? 'Project Mode' : 'Master File Mode'}\n\n📄 PDF will include:\n• Mother outlines and margins\n• Regions and slices\n• Content types\n• Mid fold lines and padding\n\nContinue?`);

    if (!confirmed) {
      return;
    }

    console.log('🖨️ Generating PDF for all mothers:', mothers.length);

    // Calculate total dimensions needed for all mothers
    let maxWidth = 0;
    let totalHeight = 0;

    mothers.forEach((mother, index) => {
      maxWidth = Math.max(maxWidth, mother.x + mother.width);
      totalHeight = Math.max(totalHeight, mother.y + mother.height);
    });

    // Add margins
    const margin = 20;
    const totalWidthMM = maxWidth + margin;
    const totalHeightMM = totalHeight + margin;

    // Determine paper size (A4: 210×297, A3: 297×420, A2: 420×594, A1: 594×841)
    let paperSize = 'A4';
    let paperWidthMM = 210;
    let paperHeightMM = 297;

    if (totalWidthMM > 210 || totalHeightMM > 297) {
      paperSize = 'A3';
      paperWidthMM = 297;
      paperHeightMM = 420;
    }
    if (totalWidthMM > 297 || totalHeightMM > 420) {
      paperSize = 'A2';
      paperWidthMM = 420;
      paperHeightMM = 594;
    }
    if (totalWidthMM > 420 || totalHeightMM > 594) {
      paperSize = 'A1';
      paperWidthMM = 594;
      paperHeightMM = 841;
    }

    console.log(`📄 Using paper size: ${paperSize} (${paperWidthMM}×${paperHeightMM}mm)`);

    // Generate PDF with paper size info
    const pdfData = {
      ...currentData,
      paperSize: paperSize,
      paperDimensions: `${paperWidthMM}cm × ${paperHeightMM/10}cm`,
      motherCount: mothers.length
    };

    // Generate single PDF with all mothers using jsPDF
    try {
      const { jsPDF } = require('jspdf');

      // Create PDF with calculated paper size
      const pdf = new jsPDF({
        orientation: paperWidthMM > paperHeightMM ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [paperWidthMM, paperHeightMM]
      });

      // Try to embed Wash Care Symbols M54 font for washing care symbols
      const fontEmbedded = await embedWashCareFont(pdf);
      if (fontEmbedded) {
        console.log('✅ Font embedded successfully for PDF generation');
      } else {
        console.log('⚠️ Font embedding failed, will use canvas rendering and fallback shapes');
      }

      // Add title and paper size info
      pdf.setFontSize(16);
      const titleText = isProjectMode ? `Project: All Content (${mothers.length} mothers)` : `Master File: All Mothers (${mothers.length})`;
      pdf.text(titleText, 10, 15);
      pdf.setFontSize(10);
      pdf.text(`Paper Size: ${paperSize} (${paperWidthMM/10}cm × ${paperHeightMM/10}cm)`, 10, 25);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 30);

      // Add Objects Hierarchy information if hierarchy panel is visible
      let currentY = 40; // Start position for content
      if (showHierarchyMenu || pinnedHierarchyMenu) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('📋 Objects Hierarchy:', 10, currentY);
        currentY += 8;

        // Build hierarchy for PDF
        const { mothers: hierarchyMothers, orphans } = buildHierarchy(currentData.objects);

        pdf.setFontSize(9);
        hierarchyMothers.forEach((mother, index) => {
          // Mother information - access properties through mother.object
          const motherName = mother.object?.name || 'Unknown';
          const motherWidth = mother.object?.width || 0;
          const motherHeight = mother.object?.height || 0;
          // Show dimensions only if dimensions toggle is enabled
          const dimensionText = showDimensions ? ` (${motherWidth}×${motherHeight}mm)` : '';
          pdf.text(`👑 ${motherName}${dimensionText}`, 15, currentY);
          currentY += 5;

          // Sons information - access through mother.children
          if (mother.children && mother.children.length > 0) {
            mother.children.forEach((son, sonIndex) => {
              const sonName = son?.name || 'Unknown';
              const sonWidth = son?.width || 0;
              const sonHeight = son?.height || 0;
              // Show dimensions only if dimensions toggle is enabled
              const dimensionText = showDimensions ? ` (${sonWidth}×${sonHeight}mm)` : '';
              pdf.text(`   └ ${sonName}${dimensionText}`, 20, currentY);
              currentY += 4;
            });
          } else {
            pdf.text(`   └ No sons`, 20, currentY);
            currentY += 4;
          }
          currentY += 2; // Extra space between mothers
        });

        // Orphans information
        if (orphans && orphans.length > 0) {
          pdf.text('🔸 Orphan Objects:', 15, currentY);
          currentY += 5;
          orphans.forEach((orphan) => {
            const orphanName = orphan?.name || 'Unknown';
            const orphanWidth = orphan?.width || 0;
            const orphanHeight = orphan?.height || 0;
            // Show dimensions only if dimensions toggle is enabled
            const dimensionText = showDimensions ? ` (${orphanWidth}×${orphanHeight}mm)` : '';
            pdf.text(`   └ ${orphanName}${dimensionText}`, 20, currentY);
            currentY += 4;
          });
        }

        currentY += 10; // Extra space before mothers drawing
      }

      // Draw each mother and its regions
      mothers.forEach((mother, motherIndex) => {
        const motherRegions = (mother as any).regions || [];

        // Draw mother outline
        pdf.setDrawColor(0, 0, 0); // Black
        pdf.setLineWidth(0.3); // Standard thickness
        pdf.rect(mother.x, mother.y + currentY, mother.width, mother.height); // Use dynamic Y position

        // Add mother label
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0); // Black text
        // Show dimensions only if dimensions toggle is enabled
        const motherDimensionText = showDimensions ? ` (${mother.width}×${mother.height}mm)` : '';
        pdf.text(`${mother.name}${motherDimensionText}`, mother.x, mother.y + currentY - 3);

        // Draw mother solid border (black) - matching your image
        const motherX = mother.x;
        const motherY = mother.y + currentY;
        pdf.setDrawColor(0, 0, 0); // Black solid border
        pdf.setLineWidth(0.5); // Standard line thickness
        pdf.setLineDashPattern([], 0); // Solid line
        pdf.rect(motherX, motherY, mother.width, mother.height);

        // Draw sewing position lines if sewing lines are enabled
        if (showSewingLines) {
          const objectSewingPosition = (mother as any).sewingPosition || 'top';
          const objectSewingOffset = (mother as any).sewingOffset || 5;
          const objectMidFoldLine = (mother as any).midFoldLine;

          // Only draw sewing lines if mid-fold is not enabled
          if (!objectMidFoldLine || !objectMidFoldLine.enabled) {
            // Set red color for sewing lines
            pdf.setDrawColor(211, 47, 47); // Red color (#d32f2f)
            pdf.setLineWidth(0.3);
            pdf.setLineDashPattern([2, 2], 0); // Dashed line

            switch (objectSewingPosition) {
              case 'top':
                // Draw horizontal line at offset from top
                pdf.line(motherX, motherY + objectSewingOffset, motherX + mother.width, motherY + objectSewingOffset);
                // Add dimension text
                pdf.setTextColor(211, 47, 47); // Red text
                pdf.setFontSize(8);
                pdf.text(`${objectSewingOffset}mm`, motherX + mother.width + 2, motherY + objectSewingOffset + 1);
                break;
              case 'left':
                // Draw vertical line at offset from left
                pdf.line(motherX + objectSewingOffset, motherY, motherX + objectSewingOffset, motherY + mother.height);
                // Add dimension text
                pdf.setTextColor(211, 47, 47); // Red text
                pdf.setFontSize(8);
                pdf.text(`${objectSewingOffset}mm`, motherX + objectSewingOffset + 2, motherY - 2);
                break;
              case 'right':
                // Draw vertical line at offset from right
                pdf.line(motherX + mother.width - objectSewingOffset, motherY, motherX + mother.width - objectSewingOffset, motherY + mother.height);
                // Add dimension text
                pdf.setTextColor(211, 47, 47); // Red text
                pdf.setFontSize(8);
                pdf.text(`${objectSewingOffset}mm`, motherX + mother.width - objectSewingOffset + 2, motherY - 2);
                break;
              case 'bottom':
                // Draw horizontal line at offset from bottom
                pdf.line(motherX, motherY + mother.height - objectSewingOffset, motherX + mother.width, motherY + mother.height - objectSewingOffset);
                // Add dimension text
                pdf.setTextColor(211, 47, 47); // Red text
                pdf.setFontSize(8);
                pdf.text(`${objectSewingOffset}mm`, motherX + mother.width + 2, motherY + mother.height - objectSewingOffset + 1);
                break;
            }

            // Reset to black for other elements
            pdf.setDrawColor(0, 0, 0);
            pdf.setTextColor(0, 0, 0);
            pdf.setLineDashPattern([], 0); // Reset to solid line
          }
        }

        // Draw mother margin lines (black dotted) if they exist and supporting lines are enabled
        const motherMargins = (mother as any).margins;
        if (motherMargins && showSupportingLines) {
          pdf.setDrawColor(0, 0, 0); // Black for all lines
          pdf.setLineWidth(0.2); // Fine style - very thin lines

          // Top margin line (7mm from top) - offset 0
          if (motherMargins.top > 0) {
            pdf.setLineDashPattern([1, 1], 0); // No offset for horizontal lines
            pdf.line(motherX, motherY + motherMargins.top, motherX + mother.width, motherY + motherMargins.top);
          }
          // Bottom margin line (7mm from bottom) - offset 0.5
          if (motherMargins.bottom > 0) {
            pdf.setLineDashPattern([1, 1], 0.5); // Different offset to prevent overlap
            pdf.line(motherX, motherY + mother.height - motherMargins.bottom, motherX + mother.width, motherY + mother.height - motherMargins.bottom);
          }
          // Left margin line (7mm from left) - offset 0.25
          if (motherMargins.left > 0) {
            pdf.setLineDashPattern([1, 1], 0.25); // Different offset for vertical lines
            pdf.line(motherX + motherMargins.left, motherY, motherX + motherMargins.left, motherY + mother.height);
          }
          // Right margin line (7mm from right) - offset 0.75
          if (motherMargins.right > 0) {
            pdf.setLineDashPattern([1, 1], 0.75); // Different offset to prevent overlap
            pdf.line(motherX + mother.width - motherMargins.right, motherY, motherX + mother.width - motherMargins.right, motherY + mother.height);
          }

          pdf.setLineDashPattern([], 0); // Reset to solid line
        }

        // Draw mid fold lines if they exist and sewing lines are enabled
        const midFoldLine = (mother as any).midFoldLine;
        if (midFoldLine && midFoldLine.enabled && showSewingLines) {
          const motherX = mother.x;
          const motherY = mother.y + currentY;
          const padding = midFoldLine.padding || 3;

          if (midFoldLine.type === 'horizontal') {
            // Calculate Y position of mid-fold line
            let midFoldY: number;
            if (midFoldLine.position.useDefault) {
              midFoldY = mother.height / 2;
            } else {
              if (midFoldLine.direction === 'top') {
                midFoldY = midFoldLine.position.customDistance;
              } else { // bottom
                midFoldY = mother.height - midFoldLine.position.customDistance;
              }
            }

            // Draw horizontal fold line (black dotted)
            pdf.setDrawColor(0, 0, 0); // Black for all lines
            pdf.setLineWidth(0.2); // Fine style - very thin lines
            pdf.setLineDashPattern([1, 1], 0.1); // Fine style with unique offset
            pdf.line(motherX, motherY + midFoldY, motherX + mother.width, motherY + midFoldY);

            // Draw fold padding margin lines (dotted, no fill)
            pdf.setDrawColor(0, 0, 0); // Black for all lines
            pdf.setLineWidth(0.2); // Fine style - very thin lines

            // Top padding line - different offset
            pdf.setLineDashPattern([1, 1], 0.3); // Different offset to prevent overlap
            pdf.line(motherX, motherY + midFoldY - padding/2, motherX + mother.width, motherY + midFoldY - padding/2);
            // Bottom padding line - different offset
            pdf.setLineDashPattern([1, 1], 0.7); // Different offset to prevent overlap
            pdf.line(motherX, motherY + midFoldY + padding/2, motherX + mother.width, motherY + midFoldY + padding/2);

            // Add padding dimension labels only if dimensions toggle is enabled
            if (showDimensions) {
              pdf.setFontSize(8); // Standard font size
              pdf.setTextColor(0, 0, 0); // Black text
              pdf.text(`${padding}mm`, motherX + mother.width + 2, motherY + midFoldY);
            }

          } else if (midFoldLine.type === 'vertical') {
            // Calculate X position of mid-fold line
            let midFoldX: number;
            if (midFoldLine.position.useDefault) {
              midFoldX = mother.width / 2;
            } else {
              if (midFoldLine.direction === 'left') {
                midFoldX = midFoldLine.position.customDistance;
              } else { // right
                midFoldX = mother.width - midFoldLine.position.customDistance;
              }
            }

            // Draw vertical fold line (black dotted)
            pdf.setDrawColor(0, 0, 0); // Black for all lines
            pdf.setLineWidth(0.2); // Fine style - very thin lines
            pdf.setLineDashPattern([1, 1], 0.2); // Fine style with unique offset
            pdf.line(motherX + midFoldX, motherY, motherX + midFoldX, motherY + mother.height);

            // Draw fold padding margin lines (dotted, no fill)
            pdf.setDrawColor(0, 0, 0); // Black for all lines
            pdf.setLineWidth(0.2); // Fine style - very thin lines

            // Left padding line - different offset
            pdf.setLineDashPattern([1, 1], 0.4); // Different offset to prevent overlap
            pdf.line(motherX + midFoldX - padding/2, motherY, motherX + midFoldX - padding/2, motherY + mother.height);
            // Right padding line - different offset
            pdf.setLineDashPattern([1, 1], 0.8); // Different offset to prevent overlap
            pdf.line(motherX + midFoldX + padding/2, motherY, motherX + midFoldX + padding/2, motherY + mother.height);

            // Add padding dimension labels only if dimensions toggle is enabled
            if (showDimensions) {
              pdf.setFontSize(8); // Standard font size
              pdf.setTextColor(0, 0, 0); // Black text
              pdf.text(`${padding}mm`, motherX + midFoldX - 5, motherY + mother.height + 8);
            }
          }

          pdf.setLineDashPattern([], 0); // Reset to solid line
        }

        // Add mother margin dimension labels only if dimensions toggle is enabled
        if (motherMargins && showDimensions) {
          pdf.setFontSize(8); // Standard font size
          pdf.setTextColor(0, 0, 0); // Black text

          const motherX = mother.x;
          const motherY = mother.y + currentY;

          // Top margin label
          if (motherMargins.top > 0) {
            pdf.text(`${motherMargins.top}mm`, motherX - 15, motherY + motherMargins.top);
          }
          // Bottom margin label
          if (motherMargins.bottom > 0) {
            pdf.text(`${motherMargins.bottom}mm`, motherX - 15, motherY + mother.height - motherMargins.bottom);
          }
          // Left margin label
          if (motherMargins.left > 0) {
            pdf.text(`${motherMargins.left}mm`, motherX + motherMargins.left - 5, motherY - 5);
          }
          // Right margin label
          if (motherMargins.right > 0) {
            pdf.text(`${motherMargins.right}mm`, motherX + mother.width - motherMargins.right - 5, motherY - 5);
          }
        }

        // Draw regions with content and slices
        motherRegions.forEach((region: any, regionIndex: number) => {
          const regionX = mother.x + region.x;
          const regionY = mother.y + region.y + currentY;

          // Check if region has child slices
          const hasSlices = region.children && region.children.length > 0;

          if (hasSlices) {
            // Draw parent region lines - avoid overlapping by choosing one style
            if (showPartitionLines) {
              // Solid black partition lines when partition lines are enabled
              pdf.setDrawColor(0, 0, 0); // Black for parent
              pdf.setLineWidth(0.3); // Standard thickness
              pdf.setLineDashPattern([], 0); // Solid line
              pdf.rect(regionX, regionY, region.width, region.height);
            } else if (showSewingLines) {
              // Dotted sewing lines only when partition lines are OFF (to avoid overlap)
              pdf.setDrawColor(0, 0, 0); // Black for all lines
              pdf.setLineWidth(0.2); // Fine style - very thin lines
              pdf.setLineDashPattern([1, 1], 0.5); // Fine style with offset to prevent alignment
              pdf.rect(regionX, regionY, region.width, region.height);
              pdf.setLineDashPattern([], 0); // Reset to solid line
            }

            // Add parent region label - top-left, bold (only if partition names are enabled)
            if (showPartitionNames) {
              pdf.setFontSize(8);
              pdf.setFont('helvetica', 'bold'); // Bold font for region labels
              pdf.setTextColor(0, 0, 0); // Black text
              pdf.text(`R${regionIndex + 1}`, regionX + 1, regionY + 4);
            }

            // Draw child slices (slices have absolute coordinates within mother, need to make relative to region)
            region.children.forEach((childRegion: any, childIndex: number) => {
              // childRegion.x/y are absolute within mother, region.x/y are also absolute within mother
              // So slice position relative to region is: childRegion.x - region.x
              const relativeX = childRegion.x - region.x;
              const relativeY = childRegion.y - region.y;
              const childX = regionX + relativeX;
              const childY = regionY + relativeY;

              // Draw slice outline only if partition lines are enabled
              if (showPartitionLines) {
                pdf.setDrawColor(0, 0, 0); // Black for slices
                pdf.setLineWidth(0.3); // Standard thickness
                pdf.rect(childX, childY, childRegion.width, childRegion.height);
              }

              // Draw slice sewing lines (black dotted) if sewing lines are enabled
              // Use different offset to prevent overlap with parent region lines
              if (showSewingLines) {
                pdf.setDrawColor(0, 0, 0); // Black for all lines
                pdf.setLineWidth(0.2); // Fine style - very thin lines
                pdf.setLineDashPattern([1, 1], 0.25); // Fine style with different offset
                pdf.rect(childX, childY, childRegion.width, childRegion.height);
                pdf.setLineDashPattern([], 0); // Reset to solid line
              }

              // Add slice label - top-right, regular font (only if partition names are enabled)
              if (showPartitionNames) {
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal'); // Regular font for slice labels
                pdf.setTextColor(0, 0, 0); // Black text
                // Position at top-right corner of slice
                const sliceLabelX = childX + childRegion.width - 1; // Right edge minus small margin
                pdf.text(`S${childIndex + 1}`, sliceLabelX, childY + 4, { align: 'right' });
              }

              // Add content type for slice - intelligent text sizing based on available space
              if (isProjectMode && childRegion.width > 3 && childRegion.height > 2) {
                const sliceContents = regionContents.get(childRegion.id) || [];
                console.log(`🔍 Slice ${childIndex + 1} (${childRegion.id}):`, {
                  width: childRegion.width,
                  height: childRegion.height,
                  hasContent: sliceContents.length > 0,
                  contentCount: sliceContents.length,
                  contents: sliceContents
                });
                if (sliceContents.length > 0) {
                  const content = sliceContents[0]; // Show only first content type

                  // Get actual text content for text-based content types
                  let fullText = content.type; // Default to content type
                  if (content.content && content.content.text) {
                    // For paragraph and line text, show the actual text content
                    fullText = content.content.text;
                  } else if (content.content && content.content.primaryContent) {
                    // For translation paragraphs, show primary content
                    fullText = content.content.primaryContent;
                  }

                  // Abbreviated labels for small spaces (fallback when text is too long)
                  const abbreviatedLabels: { [key: string]: string } = {
                    'line-text': 'text',
                    'pure-english-paragraph': 'eng',
                    'translation-paragraph': 'trans',
                    'washing-symbol': 'wash',
                    'image': 'img',
                    'coo': 'coo'
                  };

                  // Calculate available space for text (more conservative estimate)
                  const availableWidth = childRegion.width - 2; // 1mm margin on each side
                  const charWidth = 0.8; // More conservative character width in mm at 8pt
                  const maxChars = Math.floor(availableWidth / charWidth);

                  console.log(`🔍 Slice ${childIndex + 1} space calc:`, {
                    sliceWidth: childRegion.width,
                    availableWidth,
                    maxChars,
                    fullTextLength: fullText.length,
                    fullText,
                    contentType: content.type
                  });

                  // Choose display text based on available space - use same logic as web view
                  let displayText: string;
                  if (childRegion.width >= 5 && childRegion.height >= 3) {
                    // If slice has minimum dimensions, use full text (will be wrapped exactly like web)
                    displayText = fullText;
                  } else {
                    // Too small for any text (same as web view)
                    displayText = '';
                  }

                  // Only render text if we have something to show
                  if (displayText) {
                    // Get the actual content object to access typography and layout settings
                    const contentObj = sliceContents[0];

                    // Use the same typography and layout logic as web view
                    const effectiveTypography = contentObj.typography || {};
                    const effectiveLayout = contentObj.layout || {};

                    const fontSize = effectiveTypography.fontSize || 12;
                    const fontFamily = effectiveTypography.fontFamily || 'helvetica';
                    const fontColor = effectiveTypography.fontColor || '#000000';
                    const textAlign = effectiveLayout.horizontalAlign || 'left';
                    const verticalAlign = effectiveLayout.verticalAlign || 'top';
                    const padding = effectiveLayout.padding || { top: 2, right: 2, bottom: 2, left: 2 };

                    // EXACT WEB REPLICATION: Match web view pixel-perfect
                    // Web: scaledFontSize = Math.max(6, fontSize * zoom) where zoom = 1 for PDF
                    const scaledFontSize = Math.max(6, fontSize); // Exact web logic
                    // Web: lineHeight = scaledFontSize * 1.2 (in pixels)
                    const webLineHeightPx = scaledFontSize * 1.2; // Exact web logic

                    // Convert web pixels to PDF units (1px = 0.264583mm at 96 DPI)
                    const pdfFontSize = scaledFontSize * 0.75; // Convert px to pt for PDF
                    const lineHeightMM = webLineHeightPx * 0.264583; // Convert px to mm

                    pdf.setFontSize(pdfFontSize);
                    pdf.setFont(fontFamily === 'Arial' ? 'helvetica' : fontFamily, 'normal');

                    // Convert hex color to RGB exactly like web
                    const hexToRgb = (hex: string) => {
                      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                      return result ? {
                        r: parseInt(result[1], 16),
                        g: parseInt(result[2], 16),
                        b: parseInt(result[3], 16)
                      } : { r: 0, g: 0, b: 0 };
                    };
                    const color = hexToRgb(fontColor);
                    pdf.setTextColor(color.r, color.g, color.b);

                    // Calculate text area with exact padding like web view
                    const paddingTop = padding.top || 0;
                    const paddingRight = padding.right || 0;
                    const paddingBottom = padding.bottom || 0;
                    const paddingLeft = padding.left || 0;

                    const textAreaWidth = Math.max(0, childRegion.width - paddingLeft - paddingRight);
                    const textAreaHeight = Math.max(0, childRegion.height - paddingTop - paddingBottom);

                    // Use splitTextToSize to wrap text exactly like web view
                    const wrappedText = pdf.splitTextToSize(displayText, textAreaWidth);

                    // Calculate max lines exactly like web view
                    const maxLines = Math.max(0, Math.floor(textAreaHeight / lineHeightMM));

                    if (maxLines > 0) {
                      let displayLines = wrappedText;
                      if (displayLines.length > maxLines) {
                        displayLines = wrappedText.slice(0, maxLines);
                      }

                      // Calculate horizontal alignment exactly like web view
                      let textX = childX + paddingLeft;
                      if (textAlign === 'center') {
                        textX = childX + childRegion.width / 2;
                      } else if (textAlign === 'right') {
                        textX = childX + childRegion.width - paddingRight;
                      }

                      // Calculate vertical alignment exactly like web view
                      // Web: startY = baseY + (region.y * scale) + paddingTopPx;
                      let startY = childY + paddingTop;
                      if (verticalAlign === 'center') {
                        // Web: totalTextHeight = displayLines.length * lineHeight;
                        const totalTextHeight = displayLines.length * lineHeightMM;
                        // Web: startY = baseY + (region.y * scale) + (regionHeightPx - totalTextHeight) / 2;
                        startY = childY + (childRegion.height - totalTextHeight) / 2;
                      } else if (verticalAlign === 'bottom') {
                        const totalTextHeight = displayLines.length * lineHeightMM;
                        // Web: startY = baseY + (region.y * scale) + regionHeightPx - paddingBottomPx - totalTextHeight;
                        startY = childY + childRegion.height - paddingBottom - totalTextHeight;
                      }

                      // Handle washing care symbols or regular text in child regions
                      if (content.type === 'new-washing-care-symbol') {
                        // Render washing care symbols in PDF for child regions using Wash Care Symbols M54 font
                        const symbols = content.content?.symbols || ['b', 'G', '5', 'B', 'J'];
                        const symbolSize = Math.min(childRegion.width / symbols.length * 0.6, childRegion.height * 0.6, 6); // Scale to fit child region, cap at 6mm
                        const symbolSpacing = (childRegion.width * 0.8) / symbols.length; // Equal spacing within 80% of region width

                        // Center the container horizontally and vertically in the child region
                        const childRegionCenterX = childX + childRegion.width / 2;
                        const childRegionCenterY = childY + childRegion.height / 2;
                        const containerStartX = childRegionCenterX - (childRegion.width * 0.8) / 2;

                        // For PDF, use the same font as canvas - embed Wash Care Symbols M54 font (child regions)
                        symbols.forEach((symbol: string, symbolIndex: number) => {
                          const symbolX = containerStartX + symbolIndex * symbolSpacing + symbolSpacing / 2;
                          const symbolY = childRegionCenterY;

                          // Try to use embedded font first, then canvas rendering, then vector shapes (child regions)
                          let fontUsed = false;
                          let canvasUsed = false;

                          try {
                            // Try to use the embedded Wash Care Symbols M54 font
                            pdf.setFont('WashCareSymbolsM54', 'normal');
                            pdf.setFontSize(symbolSize * 2.83); // Convert mm to points
                            pdf.setTextColor(0, 0, 0);
                            pdf.text(symbol, symbolX, symbolY, { align: 'center', baseline: 'middle' });
                            fontUsed = true;
                          } catch (error) {
                            // Font not available, try canvas rendering
                            fontUsed = false;
                          }

                          if (!fontUsed) {
                            // Try canvas rendering to capture the actual font symbols
                            const canvasImage = renderSymbolToCanvas(symbol, symbolSize * 4); // Higher resolution
                            if (canvasImage) {
                              try {
                                // Calculate image size in mm (smaller for child regions)
                                const imageSize = symbolSize * 0.7;
                                const imageX = symbolX - imageSize / 2;
                                const imageY = symbolY - imageSize / 2;

                                // Add the canvas-rendered symbol as image
                                pdf.addImage(canvasImage, 'PNG', imageX, imageY, imageSize, imageSize);
                                canvasUsed = true;
                                console.log('✅ Used canvas rendering for child symbol:', symbol);
                              } catch (error) {
                                console.error('❌ Canvas image failed for child:', error);
                                canvasUsed = false;
                              }
                            }
                          }

                          if (!fontUsed && !canvasUsed) {
                            // Fallback: Create vector shapes that match the canvas symbols exactly (child regions)
                            pdf.setDrawColor(0, 0, 0);
                            pdf.setFillColor(255, 255, 255);
                            pdf.setLineWidth(0.3);

                          // Create shapes that exactly match the Wash Care Symbols M54 font appearance (smaller for child regions)
                          switch (symbolIndex) {
                            case 0: // Washing (b) - Basin shape exactly like canvas font
                              // Draw basin with curved bottom like the font symbol
                              const basinWidth = symbolSize * 0.6;
                              const basinHeight = symbolSize * 0.4;
                              // Top rim
                              pdf.line(symbolX - basinWidth/2, symbolY - basinHeight/2, symbolX + basinWidth/2, symbolY - basinHeight/2);
                              // Left side
                              pdf.line(symbolX - basinWidth/2, symbolY - basinHeight/2, symbolX - basinWidth/3, symbolY + basinHeight/2);
                              // Right side
                              pdf.line(symbolX + basinWidth/2, symbolY - basinHeight/2, symbolX + basinWidth/3, symbolY + basinHeight/2);
                              // Bottom curve (approximated with line)
                              pdf.line(symbolX - basinWidth/3, symbolY + basinHeight/2, symbolX + basinWidth/3, symbolY + basinHeight/2);
                              break;
                            case 1: // Drying (G) - Square exactly like canvas font
                              const squareSize = symbolSize * 0.5;
                              pdf.rect(symbolX - squareSize/2, symbolY - squareSize/2, squareSize, squareSize, 'S');
                              break;
                            case 2: // Ironing (5) - Iron shape exactly like canvas font
                              const ironWidth = symbolSize * 0.5;
                              const ironHeight = symbolSize * 0.4;
                              // Iron base (rounded rectangle approximation)
                              pdf.ellipse(symbolX, symbolY + ironHeight/4, ironWidth/2, ironHeight/4, 'S');
                              // Iron point
                              pdf.lines([
                                [0, -ironHeight/2],
                                [ironWidth/4, -ironHeight/4],
                                [ironWidth/4, ironHeight/4],
                                [-ironWidth/4, ironHeight/4],
                                [-ironWidth/4, -ironHeight/4],
                                [0, -ironHeight/2]
                              ], symbolX, symbolY, [1, 1], 'S');
                              break;
                            case 3: // Bleaching (B) - Triangle exactly like canvas font
                              const triSize = symbolSize * 0.4;
                              pdf.triangle(symbolX, symbolY - triSize/2, symbolX + triSize/2, symbolY + triSize/2, symbolX - triSize/2, symbolY + triSize/2, 'S');
                              break;
                            case 4: // Professional (J) - Circle exactly like canvas font
                              const circleRadius = symbolSize * 0.25;
                              pdf.circle(symbolX, symbolY, circleRadius, 'S');
                              break;
                          }
                          } // End of fallback vector shapes (child regions)
                        });
                      } else {
                        // Render regular text lines with EXACT positioning like web view
                        // Web: const textY = startY + (lineIndex + 1) * lineHeight;
                        displayLines.forEach((line: string, lineIndex: number) => {
                          const textY = startY + (lineIndex + 1) * lineHeightMM; // EXACT web formula
                          const align = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'right' : 'left';
                          pdf.text(line, textX, textY, { align: align });
                        });
                      }
                    }
                  }
                }
              }
            });
          } else {
            // Draw regular region lines - avoid overlapping by choosing one style
            if (showPartitionLines) {
              // Solid black partition lines when partition lines are enabled
              pdf.setDrawColor(0, 0, 0); // Black for regions
              pdf.setLineWidth(0.3); // Standard thickness
              pdf.setLineDashPattern([], 0); // Solid line
              pdf.rect(regionX, regionY, region.width, region.height);
            } else if (showSewingLines) {
              // Dotted sewing lines only when partition lines are OFF (to avoid overlap)
              pdf.setDrawColor(0, 0, 0); // Black for all lines
              pdf.setLineWidth(0.2); // Fine style - very thin lines
              pdf.setLineDashPattern([1, 1], 0.75); // Fine style with different offset
              pdf.rect(regionX, regionY, region.width, region.height);
              pdf.setLineDashPattern([], 0); // Reset to solid line
            }

            // Add region label - top-left, bold (only if partition names are enabled)
            if (showPartitionNames) {
              pdf.setFontSize(8);
              pdf.setFont('helvetica', 'bold'); // Bold font for region labels
              pdf.setTextColor(0, 0, 0); // Black text
              pdf.text(`R${regionIndex + 1}`, regionX + 1, regionY + 4);
            }

            // Add content type for region - use full text like slices
            if (isProjectMode && region.width > 10 && region.height > 5) {
              const regionContentsForRegion = regionContents.get(region.id) || [];
              console.log(`🔍 Region R${regionIndex + 1} (${region.id}):`, {
                width: region.width,
                height: region.height,
                hasContent: regionContentsForRegion.length > 0,
                contentCount: regionContentsForRegion.length,
                contents: regionContentsForRegion
              });
              if (regionContentsForRegion.length > 0) {
                const content = regionContentsForRegion[0]; // Show only first content type

                // Get actual text content for text-based content types
                let fullText = content.type; // Default to content type
                if (content.content && content.content.text) {
                  // For paragraph and line text, show the actual text content
                  fullText = content.content.text;
                } else if (content.content && content.content.primaryContent) {
                  // For translation paragraphs, show primary content
                  fullText = content.content.primaryContent;
                }

                // Calculate available space for text
                const availableWidth = region.width - 4; // 2mm margin on each side
                const charWidth = 0.8; // Character width in mm at 8pt
                const maxChars = Math.floor(availableWidth / charWidth);

                // Choose display text based on available space - use same logic as web view
                let displayText: string;
                if (region.width >= 8 && region.height >= 5) {
                  // If region has minimum dimensions, use full text (will be wrapped exactly like web)
                  displayText = fullText;
                } else {
                  // Too small for any text (same as web view)
                  displayText = '';
                }

                // Get the actual content object to access typography and layout settings
                const contentObj = regionContentsForRegion[0];

                // Use the same typography and layout logic as web view
                const effectiveTypography = contentObj.typography || {};
                const effectiveLayout = contentObj.layout || {};

                const fontSize = effectiveTypography.fontSize || 12;
                const fontFamily = effectiveTypography.fontFamily || 'helvetica';
                const fontColor = effectiveTypography.fontColor || '#000000';
                const textAlign = effectiveLayout.horizontalAlign || 'left';
                const verticalAlign = effectiveLayout.verticalAlign || 'top';
                const padding = effectiveLayout.padding || { top: 2, right: 2, bottom: 2, left: 2 };

                // EXACT WEB REPLICATION: Match web view pixel-perfect
                // Web: scaledFontSize = Math.max(6, fontSize * zoom) where zoom = 1 for PDF
                const scaledFontSize = Math.max(6, fontSize); // Exact web logic
                // Web: lineHeight = scaledFontSize * 1.2 (in pixels)
                const webLineHeightPx = scaledFontSize * 1.2; // Exact web logic

                // Convert web pixels to PDF units (1px = 0.264583mm at 96 DPI)
                const pdfFontSize = scaledFontSize * 0.75; // Convert px to pt for PDF
                const lineHeightMM = webLineHeightPx * 0.264583; // Convert px to mm

                pdf.setFontSize(pdfFontSize);
                pdf.setFont(fontFamily === 'Arial' ? 'helvetica' : fontFamily, 'normal');

                // Convert hex color to RGB exactly like web
                const hexToRgb = (hex: string) => {
                  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                  return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                  } : { r: 0, g: 0, b: 0 };
                };
                const color = hexToRgb(fontColor);
                pdf.setTextColor(color.r, color.g, color.b);

                // Calculate text area with exact padding like web view
                const paddingTop = (padding.top || 0) + 3; // Add space for region label
                const paddingRight = padding.right || 0;
                const paddingBottom = padding.bottom || 0;
                const paddingLeft = padding.left || 0;

                const textAreaWidth = Math.max(0, region.width - paddingLeft - paddingRight);
                const textAreaHeight = Math.max(0, region.height - paddingTop - paddingBottom);

                // Use splitTextToSize to wrap text exactly like web view
                const wrappedText = pdf.splitTextToSize(displayText, textAreaWidth);

                // Calculate max lines exactly like web view
                const maxLines = Math.max(0, Math.floor(textAreaHeight / lineHeightMM));

                if (maxLines > 0) {
                  let displayLines = wrappedText;
                  if (displayLines.length > maxLines) {
                    displayLines = wrappedText.slice(0, maxLines);
                  }

                  // Calculate horizontal alignment exactly like web view
                  let textX = regionX + paddingLeft;
                  if (textAlign === 'center') {
                    textX = regionX + region.width / 2;
                  } else if (textAlign === 'right') {
                    textX = regionX + region.width - paddingRight;
                  }

                  // Calculate vertical alignment exactly like web view
                  // Web: startY = baseY + (region.y * scale) + paddingTopPx;
                  let startY = regionY + paddingTop;
                  if (verticalAlign === 'center') {
                    // Web: totalTextHeight = displayLines.length * lineHeight;
                    const totalTextHeight = displayLines.length * lineHeightMM;
                    // Web: startY = baseY + (region.y * scale) + (regionHeightPx - totalTextHeight) / 2;
                    startY = regionY + (region.height - totalTextHeight) / 2;
                  } else if (verticalAlign === 'bottom') {
                    const totalTextHeight = displayLines.length * lineHeightMM;
                    // Web: startY = baseY + (region.y * scale) + regionHeightPx - paddingBottomPx - totalTextHeight;
                    startY = regionY + region.height - paddingBottom - totalTextHeight;
                  }

                  // Handle washing care symbols or regular text
                  if (content.type === 'new-washing-care-symbol') {
                    // Render washing care symbols in PDF using Wash Care Symbols M54 font
                    const symbols = content.content?.symbols || ['b', 'G', '5', 'B', 'J'];
                    const symbolSize = Math.min(region.width / symbols.length * 0.6, region.height * 0.6, 8); // Scale to fit region, cap at 8mm
                    const symbolSpacing = (region.width * 0.8) / symbols.length; // Equal spacing within 80% of region width

                    // Center the container horizontally and vertically in the region
                    const regionCenterX = regionX + region.width / 2;
                    const regionCenterY = regionY + region.height / 2;
                    const containerStartX = regionCenterX - (region.width * 0.8) / 2;

                    // For PDF, use the same font as canvas - embed Wash Care Symbols M54 font
                    symbols.forEach((symbol: string, symbolIndex: number) => {
                      const symbolX = containerStartX + symbolIndex * symbolSpacing + symbolSpacing / 2;
                      const symbolY = regionCenterY;

                      // Try to use embedded font first, then canvas rendering, then vector shapes
                      let fontUsed = false;
                      let canvasUsed = false;

                      try {
                        // Try to use the embedded Wash Care Symbols M54 font
                        pdf.setFont('WashCareSymbolsM54', 'normal');
                        pdf.setFontSize(symbolSize * 2.83); // Convert mm to points
                        pdf.setTextColor(0, 0, 0);
                        pdf.text(symbol, symbolX, symbolY, { align: 'center', baseline: 'middle' });
                        fontUsed = true;
                      } catch (error) {
                        // Font not available, try canvas rendering
                        fontUsed = false;
                      }

                      if (!fontUsed) {
                        // Try canvas rendering to capture the actual font symbols
                        const canvasImage = renderSymbolToCanvas(symbol, symbolSize * 4); // Higher resolution
                        if (canvasImage) {
                          try {
                            // Calculate image size in mm
                            const imageSize = symbolSize * 0.8;
                            const imageX = symbolX - imageSize / 2;
                            const imageY = symbolY - imageSize / 2;

                            // Add the canvas-rendered symbol as image
                            pdf.addImage(canvasImage, 'PNG', imageX, imageY, imageSize, imageSize);
                            canvasUsed = true;
                            console.log('✅ Used canvas rendering for symbol:', symbol);
                          } catch (error) {
                            console.error('❌ Canvas image failed:', error);
                            canvasUsed = false;
                          }
                        }
                      }

                      if (!fontUsed && !canvasUsed) {
                        // Fallback: Create vector shapes that match the canvas symbols exactly
                        pdf.setDrawColor(0, 0, 0);
                        pdf.setFillColor(255, 255, 255);
                        pdf.setLineWidth(0.4);

                      // Create shapes that exactly match the Wash Care Symbols M54 font appearance
                      switch (symbolIndex) {
                        case 0: // Washing (b) - Basin shape exactly like canvas font
                          // Draw basin with curved bottom like the font symbol
                          const basinWidth = symbolSize * 0.6;
                          const basinHeight = symbolSize * 0.4;
                          // Top rim
                          pdf.line(symbolX - basinWidth/2, symbolY - basinHeight/2, symbolX + basinWidth/2, symbolY - basinHeight/2);
                          // Left side
                          pdf.line(symbolX - basinWidth/2, symbolY - basinHeight/2, symbolX - basinWidth/3, symbolY + basinHeight/2);
                          // Right side
                          pdf.line(symbolX + basinWidth/2, symbolY - basinHeight/2, symbolX + basinWidth/3, symbolY + basinHeight/2);
                          // Bottom curve (approximated with line)
                          pdf.line(symbolX - basinWidth/3, symbolY + basinHeight/2, symbolX + basinWidth/3, symbolY + basinHeight/2);
                          break;
                        case 1: // Drying (G) - Square exactly like canvas font
                          const squareSize = symbolSize * 0.5;
                          pdf.rect(symbolX - squareSize/2, symbolY - squareSize/2, squareSize, squareSize, 'S');
                          break;
                        case 2: // Ironing (5) - Iron shape exactly like canvas font
                          const ironWidth = symbolSize * 0.5;
                          const ironHeight = symbolSize * 0.4;
                          // Iron base (rounded rectangle approximation)
                          pdf.ellipse(symbolX, symbolY + ironHeight/4, ironWidth/2, ironHeight/4, 'S');
                          // Iron point
                          pdf.lines([
                            [0, -ironHeight/2],
                            [ironWidth/4, -ironHeight/4],
                            [ironWidth/4, ironHeight/4],
                            [-ironWidth/4, ironHeight/4],
                            [-ironWidth/4, -ironHeight/4],
                            [0, -ironHeight/2]
                          ], symbolX, symbolY, [1, 1], 'S');
                          break;
                        case 3: // Bleaching (B) - Triangle exactly like canvas font
                          const triSize = symbolSize * 0.4;
                          pdf.triangle(symbolX, symbolY - triSize/2, symbolX + triSize/2, symbolY + triSize/2, symbolX - triSize/2, symbolY + triSize/2, 'S');
                          break;
                        case 4: // Professional (J) - Circle exactly like canvas font
                          const circleRadius = symbolSize * 0.25;
                          pdf.circle(symbolX, symbolY, circleRadius, 'S');
                          break;
                        }
                      } // End of fallback vector shapes
                    });
                  } else {
                    // Render regular text lines with EXACT positioning like web view
                    // Web: const textY = startY + (lineIndex + 1) * lineHeight;
                    displayLines.forEach((line: string, lineIndex: number) => {
                      const textY = startY + (lineIndex + 1) * lineHeightMM; // EXACT web formula
                      const align = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'right' : 'left';
                      pdf.text(line, textX, textY, { align: align });
                    });
                  }
                }
              }
            }
          }
        });
      });

      // Save the PDF
      const filePrefix = isProjectMode ? 'Project_Everything' : 'AllMothers';
      const fileName = `${filePrefix}_${paperSize}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      console.log(`✅ Generated PDF: ${fileName}`);

      const notificationText = isProjectMode
        ? `✅ Generated PDF with everything on canvas (${mothers.length} mothers) on ${paperSize}`
        : `✅ Generated single PDF with ${mothers.length} mothers on ${paperSize}`;
      setNotification(notificationText);
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('❌ Error generating PDF. Please try again.');
    }
  };

  // Content menu handlers
  const handleEditContent = (content: any, regionId: string) => {
    // Debug: Log the content being edited
    console.log('🔍 Edit content called with:', content);
    console.log('🔍 Content structure:', JSON.stringify(content, null, 2));

    // Find the content type from the available content types
    const contentType = [
      { id: 'translation-paragraph', name: 'Translation Paragraph', icon: '🌐', description: 'Multi-language paragraph text' },
      { id: 'pure-english-paragraph', name: 'Pure English Paragraph', icon: '📄', description: 'Single language paragraph text' },
      { id: 'line-text', name: 'Line Text', icon: '📝', description: 'Simple line of text' },
      { id: 'washing-symbol', name: 'Washing Symbol', icon: '🧺', description: 'Care instruction symbols' },
      { id: 'image', name: 'Image', icon: '🖼️', description: 'Image content' },
      { id: 'coo', name: 'COO', icon: '🏷️', description: 'Country of Origin' }
    ].find(ct => ct.id === content.type);

    if (contentType) {
      console.log('🔍 Setting universal dialog with editing content:', content);
      setUniversalDialog({
        isOpen: true,
        regionId: regionId,
        contentType: contentType,
        editingContent: content // Pass the existing content for editing
      });
    } else {
      console.log(`❌ Edit not implemented for ${content.type}`);
    }
  };

  const handleDeleteContent = (content: any, regionId: string) => {
    deleteContentWithOverflowCleanup(content.id, regionId);
  };

  // Region occupation handlers - COMMENTED OUT FOR NOW
  // const handleRegionOccupationConfirm = (occupationData: RegionOccupationData) => {
  //   console.log('📐 Region occupation confirmed:', occupationData);
  //   // ... handler code
  // };

  // const handleRegionOccupationCancel = () => {
  //   setRegionOccupationDialog({
  //     isOpen: false,
  //     contentType: '',
  //     contentIcon: '',
  //     regionId: '',
  //     regionHeight: 0
  //   });
  //   setPendingContentData(null);
  // };

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
  // Save project function - saves all canvas details including overflow and sequence numbers
  const handleSaveProject = async () => {
    if (!isProjectMode || !data) {
      alert('❌ Save is only available in Project Mode');
      return;
    }

    try {
      // Collect all project data including canvas state
      const projectData = {
        // Core project data
        data: data,
        regionContents: Object.fromEntries(regionContents),
        sonMetadata: Object.fromEntries(sonMetadata),
        motherMetadata: Object.fromEntries(motherMetadata),

        // Canvas state and settings
        showOverflowNumbers: showOverflowNumbers,
        showContentTypeNames: showContentTypeNames,
        showSewingLines: showSewingLines,
        expandedMothers: Array.from(expandedMothers),
        selectedObject: selectedObject,

        // Overflow connection settings
        overflowSettings: Object.fromEntries(overflowSettings),
        overflowChains: Object.fromEntries(overflowChains),

        // View settings
        zoom: zoom,
        panX: panX,
        panY: panY,

        // Project metadata
        projectName: data.layoutName || 'Untitled Project',
        savedAt: new Date().toISOString(),
        version: packageJson.version,

        // Customer context
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.customerName
      };

      // Use existing project name or prompt for new one
      const projectName = data.layoutName || prompt('Enter project name:');
      if (!projectName) return;

      // Save to localStorage (you can extend this to save to server)
      const projectKey = `project_${projectName}_${Date.now()}`;
      localStorage.setItem(projectKey, JSON.stringify(projectData));

      // Update the data with the project name
      setData(prev => prev ? { ...prev, layoutName: projectName } : null);

      setNotification(`✅ Project "${projectName}" saved successfully!`);
      setTimeout(() => setNotification(null), 3000);

      console.log('💾 Project saved:', projectName, projectData);

    } catch (error) {
      console.error('❌ Error saving project:', error);
      alert('❌ Failed to save project. Please try again.');
    }
  };

  // Save As project function - always prompts for new name
  const handleSaveAsProject = async () => {
    if (!isProjectMode || !data) {
      alert('❌ Save As is only available in Project Mode');
      return;
    }

    const newProjectName = prompt('Enter new project name:', data.layoutName || 'Copy of Project');
    if (!newProjectName) return;

    try {
      // Collect all project data including canvas state
      const projectData = {
        // Core project data
        data: { ...data, layoutName: newProjectName },
        regionContents: Object.fromEntries(regionContents),
        sonMetadata: Object.fromEntries(sonMetadata),
        motherMetadata: Object.fromEntries(motherMetadata),

        // Canvas state and settings
        showOverflowNumbers: showOverflowNumbers,
        showContentTypeNames: showContentTypeNames,
        showSewingLines: showSewingLines,
        expandedMothers: Array.from(expandedMothers),
        selectedObject: selectedObject,

        // Overflow connection settings
        overflowSettings: Object.fromEntries(overflowSettings),
        overflowChains: Object.fromEntries(overflowChains),

        // View settings
        zoom: zoom,
        panX: panX,
        panY: panY,

        // Project metadata
        projectName: newProjectName,
        savedAt: new Date().toISOString(),
        version: packageJson.version,

        // Customer context
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.customerName
      };

      // Save to localStorage with new name
      const projectKey = `project_${newProjectName}_${Date.now()}`;
      localStorage.setItem(projectKey, JSON.stringify(projectData));

      // Update current data with new name
      setData(prev => prev ? { ...prev, layoutName: newProjectName } : null);

      setNotification(`✅ Project saved as "${newProjectName}"!`);
      setTimeout(() => setNotification(null), 3000);

      console.log('📄 Project saved as:', newProjectName, projectData);

    } catch (error) {
      console.error('❌ Error saving project as:', error);
      alert('❌ Failed to save project. Please try again.');
    }
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

        {/* Centralized Control Buttons - Above All Mothers */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          padding: '10px',
          background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
          borderRadius: '8px',
          border: '2px solid #ddd'
        }}>
          {/* Save Button - Always visible */}
          <button
            onClick={saveProject}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #45a049 0%, #4CAF50 100%)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            style={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              border: '2px solid #4CAF50',
              color: 'white',
              fontSize: '12px',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              boxShadow: '0 3px 6px rgba(76, 175, 80, 0.3)'
            }}
            title={(() => {
              if (isMasterFileMode) {
                return isEditMode ? "Save master file (overwrite existing)" : "Save master file (enter name)";
              } else {
                const urlParams = new URLSearchParams(window.location.search);
                const layoutId = urlParams.get('layoutId');
                return layoutId ? "Save project (overwrite existing)" : "Save project (enter name)";
              }
            })()}
          >
            💾 SAVE
          </button>

          {/* Save As Button - Only show in Master File Mode when editing existing file */}
          {isMasterFileMode && isEditMode && (
            <button
              onClick={saveAsNewMasterFile}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              style={{
                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                border: '2px solid #2196f3',
                color: 'white',
                fontSize: '12px',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                boxShadow: '0 3px 6px rgba(33, 150, 243, 0.3)'
              }}
              title="Save as new master file (enter name)"
            >
              💾 SAVE AS
            </button>
          )}

          {/* Save As Button - Only show when editing existing layout */}
          {(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const layoutId = urlParams.get('layoutId');
            return layoutId ? (
              <button
                onClick={saveProjectAs}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                style={{
                  background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                  border: '2px solid #2196f3',
                  color: 'white',
                  fontSize: '12px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 3px 6px rgba(33, 150, 243, 0.3)'
                }}
                title="Save as new project layout (enter name)"
              >
                💾 SAVE AS
              </button>
            ) : null;
          })()}

          <button
            onClick={() => generatePDFAllMothers()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            style={{
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              border: '2px solid #f44336',
              color: 'white',
              fontSize: '12px',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              boxShadow: '0 3px 6px rgba(244, 67, 54, 0.3)'
            }}
            title="Print everything as PDF (auto paper size)"
          >
            🖨️ PRINT AS PDF
          </button>
        </div>

        {/* Add Master File Button - Below action buttons, above mothers */}
        {isProjectMode && (
          <div style={{
            marginBottom: '20px',
            padding: '10px',
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            borderRadius: '8px',
            border: '2px solid #ff9800'
          }}>
            <button
              onClick={addMasterFile}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              style={{
                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                border: '2px solid #ff9800',
                color: 'white',
                fontSize: '14px',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                boxShadow: '0 3px 6px rgba(255, 152, 0, 0.3)',
                width: '100%'
              }}
              title="Duplicate the selected master file from project and show clean version in canvas"
            >
              Add Master Layout
            </button>
          </div>
        )}

        {/* Mothers with their sons */}
        {mothers.map((mother, index) => {
          // Auto-expand all mothers so regions are always visible
          if (!expandedMothers.has(index)) {
            setExpandedMothers(prev => new Set([...Array.from(prev), index]));
          }
          const isExpanded = expandedMothers.has(index);


          return (
            <div key={index} style={{marginBottom: '15px'}}>


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
                    {/* Edit Button - Only enabled when no regions exist (mother dimension/margin changes affect regions) */}
                    {(isWebCreationMode || isMasterFileMode) && !isProjectMode && (() => {
                      const motherRegions = (mother.object as any).regions || [];
                      const hasRegions = motherRegions.length > 0;
                      const isDisabled = hasRegions;

                      return (
                        <button
                          disabled={isDisabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isDisabled) {
                              openEditMotherDialog(mother.object);
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (!isDisabled) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isDisabled) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }
                          }}
                          style={{
                            background: isDisabled
                              ? 'linear-gradient(135deg, #ccc 0%, #999 100%)'
                              : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                            border: isDisabled ? '1px solid #ccc' : '1px solid #2196F3',
                            color: isDisabled ? '#666' : 'white',
                            fontSize: '10px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.5 : 1,
                            pointerEvents: 'auto',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease',
                            zIndex: 1001
                          }}
                          title={isDisabled
                            ? "Cannot edit mother: dimension/margin will affect the region"
                            : "Edit mother object"}
                        >
                          ✏️ Edit
                        </button>
                      );
                    })()}



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

                    {/* Duplicate Mother Button - Mother_1 only in Master Mode, All mothers in Project Mode */}
                    {isWebCreationMode && (
                      (isProjectMode) ||
                      (!isProjectMode && mother.object.name === 'Mother_1')
                    ) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateMother(mother.object);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #BA68C8 0%, #9C27B0 100%)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #BA68C8 0%, #9C27B0 100%)',
                          border: '1px solid #9C27B0',
                          color: 'white',
                          fontSize: '10px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(156, 39, 176, 0.3)',
                          zIndex: 1001
                        }}
                        title="Duplicate this mother object"
                      >
                        ➕ Duplicate
                      </button>
                    )}

                    {/* Trash Mother Button - Only for non-Mother_1 */}
                    {mother.object.name !== 'Mother_1' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          trashMother(mother.object);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                          border: '2px solid #f44336',
                          color: 'white',
                          fontSize: '10px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(244, 67, 54, 0.3)',
                          zIndex: 1001
                        }}
                        title={`Delete ${mother.object.name} and all its regions`}
                      >
                        🗑️ Trash Mother
                      </button>
                    )}

                  </div>
                </div>
              </div>

              {/* Regions (visible in both master file mode and project mode) */}
              {(() => {
                const motherRegions = (mother.object as any).regions || [];


                if (motherRegions.length === 0) {
                  return (
                    <div
                      style={{
                        margin: '4px 0 4px 20px',
                        background: '#f5f5f5',
                        color: '#999',
                        borderRadius: '6px',
                        borderLeft: '3px solid #ccc',
                        padding: '8px 12px',
                        fontSize: '11px',
                        fontStyle: 'italic'
                      }}
                    >
                      No regions yet. {isMasterFileMode ? 'Click "Add Region" to create regions.' : 'Regions will appear here when added.'}
                    </div>
                  );
                }

                return (
                  <>
                    {/* Trash Buttons - different for Master File vs Project Mode */}
                    {motherRegions.length > 0 && (
                      <div style={{ margin: '4px 0 8px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>

                        {/* Trash All Regions Button - Master File Management only */}
                        {isMasterFileMode && (
                          <button
                            onClick={() => trashAllRegions(mother.object)}
                            style={{
                              padding: '4px 8px',
                              border: 'none',
                              borderRadius: '4px',
                              background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                              color: '#ffeb3b',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(211, 47, 47, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title="Delete all regions completely"
                          >
                            🗑️ Trash All Regions ({motherRegions.length})
                          </button>
                        )}

                        {/* Trash All Slices Button - Master File Mode only */}
                        {isMasterFileMode && (
                          <button
                          onClick={() => trashAllSlices(mother.object)}
                          style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(255, 152, 0, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="Delete all slices while preserving parent regions"
                        >
                          🗑️ Trash All Slices
                        </button>
                        )}
                      </div>
                    )}

                    {motherRegions.map((region: Region, regionIndex: number) => {
                  // Determine visual state for synchronized hover feedback
                  const isHighlighted = highlightedRegion === region.id;
                  const isDraggedOver = dragOverRegion === region.id;
                  const isBeingEdited = editingRegion && editingRegion.id === region.id;

                  // Enhanced styling based on state
                  let backgroundColor = '#e3f2fd'; // Default blue
                  let borderColor = '#2196f3'; // Default blue
                  let textColor = '#1976d2'; // Default dark blue

                  if (isDraggedOver) {
                    backgroundColor = '#c8e6c9'; // Green for drag over
                    borderColor = '#4caf50'; // Green border
                  } else if (isHighlighted) {
                    backgroundColor = '#fff3e0'; // Orange tint for hover
                    borderColor = '#ff6b35'; // Orange border
                    textColor = '#e65100'; // Darker orange text
                  } else if (isBeingEdited) {
                    backgroundColor = '#e3f2fd'; // Blue for editing
                    borderColor = '#007bff'; // Bright blue border
                  }

                  return (
                  <div
                    key={region.id}
                    style={{
                      margin: '4px 0 4px 20px', // Always indented under mother
                      background: backgroundColor,
                      color: textColor,
                      borderRadius: '6px',
                      borderLeft: `3px solid ${borderColor}`,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease', // Smooth transition for hover effects
                      cursor: 'pointer'
                    }}

                    onMouseEnter={() => setHoveredRegionId(region.id)}
                    onMouseLeave={() => setHoveredRegionId(null)}

                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      // Check if region or any of its slices have content
                      const regionContentItems = regionContents.get(region.id) || [];
                      const hasRegionContent = regionContentItems.length > 0;

                      let hasSliceContent = false;
                      if (region.children && region.children.length > 0) {
                        hasSliceContent = region.children.some((slice: any) => {
                          const sliceContentItems = regionContents.get(slice.id) || [];
                          return sliceContentItems.length > 0;
                        });
                      }

                      // Only open slice popup if no content exists
                      if (!hasRegionContent && !hasSliceContent) {
                        console.log('🖱️ Double-clicked region:', region.name);
                        setSlicingRegion(region);
                        setHighlightedRegion(region.id);
                        setSliceLines({ horizontal: [], vertical: [] });
                        setSliceMode('visual');
                        setShowSliceDialog(true);
                        setSlicePopupPosition({ x: 100, y: 100 }); // Reset to default position
                      }
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: isMasterFileMode ? 'pointer' : 'default'
                      }}
                      onClick={(e) => {
                        // Prevent double-click from triggering click
                        if (e.detail === 1) {
                          setTimeout(() => {
                            if (e.detail === 1) {
                              setSelectedObject(mother.object);
                              // Just highlight the region (no editing functionality)
                              setHighlightedRegion(region.id);
                            }
                          }, 200);
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Check if region or any of its slices have content
                        const regionContentItems = regionContents.get(region.id) || [];
                        const hasRegionContent = regionContentItems.length > 0;

                        let hasSliceContent = false;
                        if (region.children && region.children.length > 0) {
                          hasSliceContent = region.children.some((slice: any) => {
                            const sliceContentItems = regionContents.get(slice.id) || [];
                            return sliceContentItems.length > 0;
                          });
                        }

                        // Only open slice popup if no content exists
                        if (!hasRegionContent && !hasSliceContent) {
                          console.log('🖱️ Double-clicked region (inner):', region.name);
                          setSlicingRegion(region);
                          setHighlightedRegion(region.id);
                          setSliceLines({ horizontal: [], vertical: [] });
                          setSliceMode('visual');
                          setShowSliceDialog(true);
                          setSlicePopupPosition({ x: 100, y: 100 }); // Reset to default position
                        }
                      }}
                      onMouseEnter={() => {
                        // Only highlight on hover if not currently editing
                        if (!editingRegion || editingRegion.id !== region.id) {
                          setHighlightedRegion(region.id);
                        }
                      }}
                      onMouseLeave={() => {
                        // Only clear highlight if not currently editing this region
                        if (!editingRegion || editingRegion.id !== region.id) {
                          setHighlightedRegion(null);
                        }
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

                      {/* Dynamic buttons based on slice state */}
                      {(isMasterFileMode || isProjectMode) && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {/* If region has no slices - show slice button */}
                          {(!region.children || region.children.length === 0) && (() => {
                            const regionContentItems = regionContents.get(region.id) || [];
                            const hasRegionContent = regionContentItems.length > 0;

                            // Check if any slices have content (though this region has no slices currently)
                            let hasSliceContent = false;
                            if (region.children && region.children.length > 0) {
                              hasSliceContent = region.children.some((slice: any) => {
                                const sliceContentItems = regionContents.get(slice.id) || [];
                                return sliceContentItems.length > 0;
                              });
                            }

                            const isDisabled = hasRegionContent || hasSliceContent;

                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isDisabled) {
                                    setNotification('Cannot slice region with content. Remove content first.');
                                    setTimeout(() => setNotification(null), 3000);
                                    return;
                                  }
                                  setSlicingRegion(region);
                                  setHighlightedRegion(region.id);
                                  setSliceLines({ horizontal: [], vertical: [] });
                                  setSliceMode('visual');
                                  setShowSliceDialog(true);
                                  setSlicePopupPosition({ x: 100, y: 100 });
                                }}
                                style={{
                                  background: isDisabled ? '#ccc' : '#ff9800',
                                  border: 'none',
                                  color: isDisabled ? '#666' : 'white',
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: isDisabled ? 0.6 : 1
                                }}
                                title={isDisabled ? 'Cannot slice region with content' : 'Slice region into smaller regions'}
                                disabled={isDisabled}
                              >
                                ✂️
                              </button>
                            );
                          })()}

                          {/* If region has slices - show trash all slices button (Master File Mode only) */}
                          {isMasterFileMode && region.children && region.children.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const confirmed = window.confirm(`Delete all ${region.children?.length} slices from "${region.name}"?\n\nThis will remove all slices but keep the parent region.\n\nThis action cannot be undone.`);
                                if (confirmed) {
                                  // Reset region to unsliced state
                                  if (!data) return;
                                  const updatedObjects = data.objects.map(obj => {
                                    if (obj.name === mother.object.name) {
                                      const regions = (obj as any).regions || [];
                                      const updatedRegions = regions.map((r: Region) => {
                                        if (r.id === region.id) {
                                          return {
                                            ...r,
                                            children: undefined,
                                            isSliced: false,
                                            borderColor: '#2196f3',
                                            backgroundColor: 'rgba(33, 150, 243, 0.1)'
                                          };
                                        }
                                        return r;
                                      });
                                      return { ...obj, regions: updatedRegions };
                                    }
                                    return obj;
                                  });
                                  const updatedData = { ...data, objects: updatedObjects };
                                  setData(updatedData);

                                  // Clear slice contents
                                  const updatedContents = new Map(regionContents);
                                  region.children?.forEach((child: Region) => {
                                    updatedContents.delete(child.id);
                                  });
                                  setRegionContents(updatedContents);

                                  setNotification(`✅ Deleted all slices from "${region.name}"`);
                                  setTimeout(() => setNotification(null), 3000);
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
                              title={`Delete all ${region.children?.length} slices`}
                            >
                              🗑️
                            </button>
                          )}

                          {/* Delete button for entire region - Only in Master File Mode */}
                          {isMasterFileMode && (!region.children || region.children.length === 0) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                trashSingleRegion(mother.object, region);
                              }}
                              style={{
                                background: '#9e9e9e',
                                border: 'none',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                              title="Delete entire region"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Placed Content Items under this region */}
                    {(() => {
                      const regionContentItems = regionContents.get(region.id) || [];
                      return regionContentItems.map((contentItem: any, contentIndex: number) => (
                        <div
                          key={`${region.id}-content-${contentIndex}`}
                          style={{
                            margin: '2px 0 2px 40px', // Double indented under region
                            background: '#f5f5f5',
                            color: '#666',
                            borderRadius: '4px',
                            borderLeft: '2px solid #9e9e9e',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              padding: '6px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '11px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px' }}>
                                {contentItem.type === 'translation-paragraph' ? '🌐' :
                                 contentItem.type === 'pure-english-paragraph' ? '📄' :
                                 contentItem.type === 'line-text' ? '📝' :
                                 contentItem.type === 'washing-symbol' ? '🧺' :
                                 contentItem.type === 'image' ? '🖼️' :
                                 contentItem.type === 'coo' ? '🏷️' : '📄'}
                              </span>
                              <div>
                                <div style={{ fontWeight: 'bold' }}>
                                  {contentItem.type === 'translation-paragraph' ? 'Translation Paragraph' :
                                   contentItem.type === 'pure-english-paragraph' ? 'Pure English Paragraph' :
                                   contentItem.type === 'line-text' ? 'Line Text' :
                                   contentItem.type === 'washing-symbol' ? 'Washing Symbol' :
                                   contentItem.type === 'image' ? 'Image' :
                                   contentItem.type === 'coo' ? 'COO' : contentItem.type}
                                </div>
                                {contentItem.text && (
                                  <div style={{ fontSize: '9px', opacity: 0.7, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {contentItem.text}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '2px' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('🔍 Inline edit button clicked for content:', contentItem);
                                  // Use the centralized edit handler
                                  handleEditContent(contentItem, region.id);
                                }}
                                style={{
                                  background: '#4caf50',
                                  border: 'none',
                                  color: 'white',
                                  fontSize: '8px',
                                  padding: '2px 4px',
                                  borderRadius: '2px',
                                  cursor: 'pointer'
                                }}
                                title="Edit content"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Delete content with overflow cleanup
                                  deleteContentWithOverflowCleanup(contentItem.id, region.id);
                                }}
                                style={{
                                  background: '#f44336',
                                  border: 'none',
                                  color: 'white',
                                  fontSize: '8px',
                                  padding: '2px 4px',
                                  borderRadius: '2px',
                                  cursor: 'pointer'
                                }}
                                title="Delete content"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Child Regions (Slices) - Show if region has been sliced */}
                    {region.children && region.children.length > 0 && (
                      <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                        {region.children.map((childRegion: Region, childIndex: number) => {
                          const isChildHighlighted = highlightedRegion === childRegion.id;
                          const isChildDraggedOver = dragOverRegion === childRegion.id;

                          let childBackgroundColor = '#f0f8f0'; // Light green for child
                          let childBorderColor = '#4caf50'; // Green border
                          let childTextColor = '#2e7d32'; // Dark green text

                          if (isChildDraggedOver) {
                            childBackgroundColor = '#c8e6c9'; // Brighter green for drag over
                            childBorderColor = '#4caf50';
                          } else if (isChildHighlighted) {
                            childBackgroundColor = '#fff3e0'; // Orange tint for hover
                            childBorderColor = '#ff6b35';
                            childTextColor = '#e65100';
                          }

                          return (
                            <div
                              key={childRegion.id}
                              style={{
                                margin: '2px 0',
                                background: childBackgroundColor,
                                color: childTextColor,
                                borderRadius: '4px',
                                borderLeft: `2px solid ${childBorderColor}`,
                                overflow: 'hidden',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                              }}

                              onMouseEnter={() => setHoveredRegionId(childRegion.id)}
                              onMouseLeave={() => setHoveredRegionId(null)}

                              onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                // Check if this slice has content
                                const sliceContentItems = regionContents.get(childRegion.id) || [];
                                const hasContent = sliceContentItems.length > 0;

                                if (hasContent) {
                                  // Slice has content - open property dialog with pre-populated values
                                  const content = sliceContentItems[0]; // Get first content item
                                  handleContentDoubleClick(content, childRegion.id);
                                } else {
                                  // Slice has no content - open slice dialog
                                  setSlicingRegion(childRegion);
                                  setHighlightedRegion(childRegion.id);
                                  setSliceLines({ horizontal: [], vertical: [] });
                                  setSliceMode('visual');
                                  setShowSliceDialog(true);
                                  setSlicePopupPosition({ x: 100, y: 100 });
                                }
                              }}
                            >
                              <div
                                style={{
                                  padding: '6px 10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontSize: '11px'
                                }}
                                onClick={(e) => {
                                  if (e.detail === 1) {
                                    setTimeout(() => {
                                      if (e.detail === 1) {
                                        setHighlightedRegion(childRegion.id);
                                      }
                                    }, 200);
                                  }
                                }}
                                onMouseEnter={() => setHighlightedRegion(childRegion.id)}
                                onMouseLeave={() => setHighlightedRegion(null)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '10px' }}>↳</span>
                                  <div>
                                    <div style={{ fontWeight: 'bold' }}>
                                      {childRegion.name || `Slice ${childIndex + 1}`}
                                    </div>
                                    <div style={{ fontSize: '9px', opacity: 0.7 }}>
                                      {childRegion.width}×{childRegion.height}mm
                                    </div>
                                  </div>
                                </div>

                                {/* Slice and Delete buttons for child regions */}
                                {(isMasterFileMode || isProjectMode) && (
                                  <div style={{ display: 'flex', gap: '2px' }}>
                                    {/* Slice button - creates new slices at same level */}
                                    {(() => {
                                      const sliceContentItems = regionContents.get(childRegion.id) || [];
                                      const hasContent = sliceContentItems.length > 0;
                                      const isDisabled = hasContent;

                                      return (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isDisabled) {
                                              setNotification('Cannot slice region with content. Remove content first.');
                                              setTimeout(() => setNotification(null), 3000);
                                              return;
                                            }
                                            setSlicingRegion(childRegion);
                                            setHighlightedRegion(childRegion.id);
                                            setSliceLines({ horizontal: [], vertical: [] });
                                            setSliceMode('visual');
                                            setShowSliceDialog(true);
                                            setSlicePopupPosition({ x: 100, y: 100 });
                                          }}
                                          style={{
                                            background: isDisabled ? '#ccc' : '#ff9800',
                                            border: 'none',
                                            color: isDisabled ? '#666' : 'white',
                                            fontSize: '8px',
                                            padding: '1px 4px',
                                            borderRadius: '2px',
                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                            opacity: isDisabled ? 0.6 : 1
                                          }}
                                          title={isDisabled ? 'Cannot slice region with content' : 'Slice this region (replaces with multiple slices)'}
                                          disabled={isDisabled}
                                        >
                                          ✂️
                                        </button>
                                      );
                                    })()}

                                    {/* Delete button - Available in both Master File Mode and Project Mode */}
                                    {(isMasterFileMode || isProjectMode) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteIndividualSlice(mother.object, region, childRegion);
                                        }}
                                        style={{
                                          background: '#f44336',
                                          border: 'none',
                                          color: 'white',
                                          fontSize: '8px',
                                          padding: '1px 4px',
                                          borderRadius: '2px',
                                          cursor: 'pointer'
                                        }}
                                        title="Delete this slice"
                                      >
                                        🗑️
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Content items for child regions */}
                              {(() => {
                                const childContentItems = regionContents.get(childRegion.id) || [];
                                return childContentItems.map((contentItem: any, contentIndex: number) => (
                                  <div
                                    key={`${childRegion.id}-content-${contentIndex}`}
                                    style={{
                                      margin: '2px 0 2px 20px',
                                      background: '#f9f9f9',
                                      color: '#666',
                                      borderRadius: '3px',
                                      borderLeft: '1px solid #ccc',
                                      overflow: 'hidden',
                                      fontSize: '10px'
                                    }}
                                  >
                                    <div style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '10px' }}>
                                          {contentItem.type === 'translation-paragraph' ? '🌐' :
                                           contentItem.type === 'pure-english-paragraph' ? '📄' :
                                           contentItem.type === 'line-text' ? '📝' :
                                           contentItem.type === 'washing-symbol' ? '🧺' :
                                           contentItem.type === 'image' ? '🖼️' :
                                           contentItem.type === 'coo' ? '🏷️' : '📄'}
                                        </span>
                                        <div style={{ fontSize: '9px' }}>
                                          {contentItem.type === 'translation-paragraph' ? 'Translation' :
                                           contentItem.type === 'pure-english-paragraph' ? 'English' :
                                           contentItem.type === 'line-text' ? 'Text' :
                                           contentItem.type === 'washing-symbol' ? 'Symbol' :
                                           contentItem.type === 'image' ? 'Image' :
                                           contentItem.type === 'coo' ? 'COO' : contentItem.type}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          // Delete content with overflow cleanup
                                          deleteContentWithOverflowCleanup(contentItem.id, childRegion.id);
                                        }}
                                        style={{
                                          background: '#f44336',
                                          border: 'none',
                                          color: 'white',
                                          fontSize: '7px',
                                          padding: '1px 3px',
                                          borderRadius: '1px',
                                          cursor: 'pointer'
                                        }}
                                        title="Delete content"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
                    })}
                  </>
                );
              })()}

              {/* Add Region Button - Only show if remaining space is available and in master file mode */}
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
    // Only handle file drops, let content drops pass through to regions
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      e.preventDefault();
      setIsDragOver(false);
      handleFileUpload(files[0]);
    }
    // Don't preventDefault for content drops - let them bubble to region handlers
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Only prevent default for file drops, let content drops pass through
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      e.preventDefault();
      setIsDragOver(true);
    }
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

              // Add margin guide lines if this object is selected and supporting lines are enabled
              const marginGuides = selectedObject === obj && showSupportingLines ? [
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
            {showMarginRectangles && showSupportingLines && (() => {
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

              // Helper function to render a region and its children
              const renderRegionWithChildren = (region: Region, regionIndex: number): React.ReactElement[] => {
                const elements: React.ReactElement[] = [];

                // Determine highlighting style for parent region
                const isEditing = editingRegion && editingRegion.id === region.id;
                const isHighlighted = highlightedRegion === region.id;

                // Set stroke color and width based on state
                let strokeColor = region.borderColor;
                let strokeWidth = 2;

                if (isEditing) {
                  strokeColor = '#007bff'; // Blue for editing
                  strokeWidth = 4;
                } else if (isHighlighted) {
                  strokeColor = '#ff6b35'; // Orange for hover
                  strokeWidth = 3;
                }

                // Calculate coordinates
                const rectX = baseX + (region.x * scale);
                const rectY = baseY + (region.y * scale);
                const rectW = region.width * scale;
                const rectH = region.height * scale;

                // Render parent region
                elements.push(
                <g key={region.id}>
                  {/* Region Rectangle */}
                  <rect
                    x={rectX}
                    y={rectY}
                    width={rectW}
                    height={rectH}
                    fill={hoveredRegionId === region.id ? '#fff3e0' : // Orange highlight on hover
                          dragOverRegion === region.id ?
                          (() => {
                            const hasContent = (regionContents.get(region.id) || []).length > 0;
                            return hasContent ? '#ffebee' : getRegionBackgroundColor(region.id); // Red tint for occupied, content-type color for empty
                          })() : getRegionBackgroundColor(region.id)}
                    stroke={!showPartitionLines ? 'none' : // Hide partition lines when toggled off
                            hoveredRegionId === region.id ? '#ff6b35' : // Orange border on hover
                            dragOverRegion === region.id ?
                            (() => {
                              const hasContent = (regionContents.get(region.id) || []).length > 0;
                              return hasContent ? '#f44336' : '#2196f3'; // Red border for occupied, blue for empty
                            })() : strokeColor}
                    strokeWidth={!showPartitionLines ? 0 : // Hide partition lines when toggled off
                                hoveredRegionId === region.id ? 5 : // Thicker border on hover
                                dragOverRegion === region.id ? 4 : strokeWidth}
                    strokeDasharray="5,5"
                    opacity={hoveredRegionId === region.id ? 1.0 : // Full opacity on hover
                            dragOverRegion === region.id ? 0.9 : 0.7}
                    style={{ cursor: isProjectMode ? 'copy' : 'pointer' }}
                    onDragOver={isProjectMode ? (e) => handleContentDragOver(e, region.id) : undefined}
                    onDragLeave={isProjectMode ? handleContentDragLeave : undefined}
                    onDrop={isProjectMode ? (e) => handleContentDrop(e, region.id) : undefined}
                    onClick={() => {
                      if (isProjectMode) return; // No click action in project mode
                      // Handle region selection/editing in master file mode
                    }}
                    onMouseEnter={() => {
                      // Synchronized hover: highlight both SVG region and corresponding region in list
                      if (!editingRegion || editingRegion.id !== region.id) {
                        setHighlightedRegion(region.id);
                      }
                    }}
                    onMouseLeave={() => {
                      // Clear highlight when leaving SVG region (unless currently editing)
                      if (!editingRegion || editingRegion.id !== region.id) {
                        setHighlightedRegion(null);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      // Check if region or any of its slices have content
                      const regionContentItems = regionContents.get(region.id) || [];
                      const hasRegionContent = regionContentItems.length > 0;

                      let hasSliceContent = false;
                      if (region.children && region.children.length > 0) {
                        hasSliceContent = region.children.some((slice: any) => {
                          const sliceContentItems = regionContents.get(slice.id) || [];

                          return sliceContentItems.length > 0;
                        });
                      }

                      // Only open slice popup if no content exists
                      if (!hasRegionContent && !hasSliceContent) {
                        console.log('🖱️ Double-clicked region in canvas:', region.name);
                        setSlicingRegion(region);
                        setHighlightedRegion(region.id);
                        setSliceLines({ horizontal: [], vertical: [] });
                        setSliceMode('visual');
                        setShowSliceDialog(true);
                        setSlicePopupPosition({ x: 100, y: 100 }); // Reset to default position
                      }
                    }}
                  />

                  {/* Content Area Overlays */}
                  {(() => {
                    const contents = regionContents.get(region.id) || [];
                    if (contents.length === 0) return null;

                    let currentY = 0; // Track vertical position for stacking

                    return contents.map((content, contentIndex) => {
                    // DEBUG: Log rendering for region #2
                    if (region.id.includes('_0_master_2')) {
                      console.log(`🎨 RENDERING content for ${region.id}:`, {
                        content: content.content.text,
                        lines: (content.content.text || '').split('\n').length,
                        fontSize: content.typography?.fontSize,
                        color: content.typography?.fontColor,
                      });
                    }

                      // Calculate content dimensions - CONSTRAINED TO REGION BOUNDARIES
                      let contentWidth = 0;
                      let contentHeight = 0;

                      // Check if content occupies leftover space first
                      if (content.layout.occupyLeftoverSpace) {
                        // Calculate space used by other content in THIS region (excluding this one)
                        const otherContents = contents.filter((_, idx) => idx !== contentIndex);

                        // Create rectangles for existing content to find available space
                        const existingContentRects: { x: number, y: number, width: number, height: number }[] = [];

                        otherContents.forEach(otherContent => {
                          let otherWidth = 0;
                          let otherHeight = 0;

                          // Calculate width
                          if (otherContent.layout.fullWidth || otherContent.layout.width.value === 100) {
                            otherWidth = region.width;
                          } else if (otherContent.layout.width.unit === 'mm') {
                            otherWidth = Math.min(otherContent.layout.width.value, region.width);
                          } else {
                            otherWidth = Math.min((otherContent.layout.width.value / 100) * region.width, region.width);
                          }

                          // Calculate height
                          if (otherContent.layout.fullHeight || otherContent.layout.height.value === 100) {
                            otherHeight = region.height;
                          } else if (otherContent.layout.height.unit === 'mm') {
                            otherHeight = Math.min(otherContent.layout.height.value, region.height);
                          } else {
                            otherHeight = Math.min((otherContent.layout.height.value / 100) * region.height, region.height);
                          }

                          // Add content rectangle (positioned at 0,0 relative to region)
                          existingContentRects.push({
                            x: 0, // Content positioning within region starts at 0
                            y: 0,
                            width: otherWidth,
                            height: otherHeight
                          });
                        });



                        // For leftover space, calculate the remaining area after existing content
                        // Instead of finding largest rectangle, use simple subtraction approach

                        if (existingContentRects.length === 0) {
                          // No existing content, use full region
                          contentWidth = region.width;
                          contentHeight = region.height;
                          (content as any)._calculatedPosition = { x: 0, y: 0 };
                        } else {
                          // Find the rightmost edge of existing content
                          const rightmostEdge = Math.max(...existingContentRects.map(rect => rect.x + rect.width));
                          const bottomEdge = Math.max(...existingContentRects.map(rect => rect.y + rect.height));

                          // Calculate remaining space to the right
                          const remainingWidth = region.width - rightmostEdge;
                          const remainingHeight = region.height;

                          if (remainingWidth > 0) {
                            // Use the remaining space to the right
                            contentWidth = remainingWidth;
                            contentHeight = remainingHeight;
                            (content as any)._calculatedPosition = { x: rightmostEdge, y: 0 };
                          } else {
                            // No space to the right, try below
                            const remainingHeightBelow = region.height - bottomEdge;
                            if (remainingHeightBelow > 0) {
                              contentWidth = region.width;
                              contentHeight = remainingHeightBelow;
                              (content as any)._calculatedPosition = { x: 0, y: bottomEdge };
                            } else {
                              // Fallback: minimal space
                              contentWidth = 10;
                              contentHeight = 10;
                              (content as any)._calculatedPosition = { x: 0, y: 0 };
                            }
                          }
                        }


                      } else {
                        // Normal width calculation - CONSTRAINED TO REGION
                        if (content.layout.fullWidth || content.layout.width.value === 100) {
                          contentWidth = region.width;
                        } else if (content.layout.width.unit === 'mm') {
                          contentWidth = Math.min(content.layout.width.value, region.width); // Constrain to region
                        } else {
                          contentWidth = Math.min((content.layout.width.value / 100) * region.width, region.width);
                        }

                        // Normal height calculation - CONSTRAINED TO REGION
                        if (content.layout.fullHeight || content.layout.height.value === 100) {
                          contentHeight = region.height;
                        } else if (content.layout.height.unit === 'mm') {
                          contentHeight = Math.min(content.layout.height.value, region.height); // Constrain to region
                        } else {
                          contentHeight = Math.min((content.layout.height.value / 100) * region.height, region.height);
                        }
                      }

                      // ENFORCE REGION BOUNDARY CONSTRAINTS
                      contentWidth = Math.min(contentWidth, region.width);
                      contentHeight = Math.min(contentHeight, region.height);

                      // Get color for this content object
                      const overlayColor = getContentObjectColor(content.type, contentIndex);

                      // Calculate position - CONSTRAINED WITHIN REGION BOUNDARIES
                      const regionStartX = baseX + (region.x * scale);
                      const regionStartY = baseY + (region.y * scale);
                      const regionEndX = regionStartX + (region.width * scale);
                      const regionEndY = regionStartY + (region.height * scale);

                      // Position content within region boundaries
                      let overlayX: number, overlayY: number;

                      if (content.layout.occupyLeftoverSpace && (content as any)._calculatedPosition) {
                        // Use calculated position from leftover space algorithm
                        const calcPos = (content as any)._calculatedPosition;
                        overlayX = regionStartX + (calcPos.x * scale);
                        overlayY = regionStartY + (calcPos.y * scale);


                      } else {
                        // In Project Mode, content should occupy the whole region
                        if (isProjectMode) {
                          overlayX = regionStartX;
                          overlayY = regionStartY;
                        } else {
                          // Use normal stacking position for other modes
                          overlayX = regionStartX;
                          overlayY = regionStartY + (currentY * scale);
                        }
                      }

                      // In Project Mode, content occupies the whole region
                      let overlayWidth = isProjectMode ? (region.width * scale) : (contentWidth * scale);
                      let overlayHeight = isProjectMode ? (region.height * scale) : (contentHeight * scale);

                      // Ensure content doesn't exceed region boundaries
                      if (overlayX + overlayWidth > regionEndX) {
                        overlayWidth = regionEndX - overlayX;
                      }
                      if (overlayY + overlayHeight > regionEndY) {
                        overlayHeight = regionEndY - overlayY;
                      }

                      // Update currentY for next content - but only for non-leftover content
                      if (!content.layout.occupyLeftoverSpace) {
                        const nextY = currentY + contentHeight;
                        currentY = Math.min(nextY, region.height);
                      }
                      // Leftover content doesn't affect stacking position since it uses calculated position

                      return (
                        <g key={`${region.id}-content-overlay-${contentIndex}`}>
                          {/* Content overlay rectangle - More visible background */}
                          <rect
                            x={overlayX}
                            y={overlayY}
                            width={overlayWidth}
                            height={overlayHeight}
                            fill={(() => {
                              // Use content-type specific background color with higher opacity for visibility
                              const contentType = content.type;
                              const backgroundColors: { [key: string]: string } = {
                                'line-text': 'rgba(59, 130, 246, 0.25)',           // Light blue background
                                'pure-english-paragraph': 'rgba(16, 185, 129, 0.25)',  // Light green background
                                'translation-paragraph': 'rgba(245, 158, 11, 0.25)',   // Light amber/orange background
                                'washing-symbol': 'rgba(139, 92, 246, 0.25)',          // Light purple background
                                'image': 'rgba(239, 68, 68, 0.25)',                    // Light red background
                                'coo': 'rgba(6, 182, 212, 0.25)'                       // Light cyan background
                              };
                              return backgroundColors[contentType] || 'rgba(107, 114, 128, 0.25)';
                            })()}
                            opacity={0.8}
                            stroke={getContentObjectColor(content.type, contentIndex)}
                            strokeWidth={2}
                            strokeOpacity={0.9}
                            rx={3}
                            ry={3}
                            style={{
                              cursor: 'pointer',
                              pointerEvents: 'all'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.setAttribute('opacity', '1.0');
                              e.currentTarget.setAttribute('stroke-width', '3');
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.setAttribute('opacity', '0.8');
                              e.currentTarget.setAttribute('stroke-width', '2');
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleContentDoubleClick(content, region.id);
                            }}
                          />

                          {/* Overflow dots for text-based content */}
                          {['line-text', 'pure-english-paragraph', 'translation-paragraph'].includes(content.type) && isOverflowEnabled(content.id) && (() => {
                            const role = getOverflowRole(content.id);
                            const dotRadius = 4;
                            const centerX = overlayX + overlayWidth / 2;


                            return (
                              <g>
                                {/* Red dot (connector input) - top edge */}
                                {role === 'connector' && (
                                  <circle
                                    cx={centerX}
                                    cy={overlayY - dotRadius}
                                    r={dotRadius}
                                    fill="#f44336"
                                    stroke="white"
                                    strokeWidth="1"
                                    style={{ pointerEvents: 'none' }}
                                  />
                                )}

                                {/* Green dot (output) - bottom edge */}
                                <circle
                                  cx={centerX}
                                  cy={overlayY + overlayHeight + dotRadius}
                                  r={dotRadius}


                                  fill="#4caf50"
                                  stroke="white"
                                  strokeWidth="1"
                                  style={{ pointerEvents: 'none' }}
                                />
                              </g>
                            );
                          })()}

                          {/* Content overlay visual indicator only - text removed to prevent duplication with region content text */}
                        </g>
                      );
                    });
                  })()}

                  {/* Region Label */}
                  {showPartitionNames && (
                    <text
                      x={baseX + (region.x * scale) + (region.width * scale) / 2}
                      y={baseY + (region.y * scale) + 15}
                      fill={region.borderColor}
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      opacity="0.9"
                      style={{ pointerEvents: 'none' }}
                    >
                      R{regionIndex + 1}
                    </text>
                  )}

                  {/* Region Dimensions */}
                  <text
                    x={baseX + (region.x * scale) + (region.width * scale) / 2}
                    y={baseY + (region.y * scale) + (region.height * scale) - 5}
                    fill={region.borderColor}
                    fontSize="8"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.7"
                    style={{ pointerEvents: 'none' }}
                  >
                    {region.width}×{region.height}mm
                  </text>

                  {/* Overflow Sequence Number - Large overlay when toggle is ON */}
                  {showOverflowNumbers && (() => {
                    // Find if this region contains content that's part of the overflow chain
                    const regionContentList = regionContents.get(region.id) || [];
                    const chainContent = regionContentList.find((content: any) =>
                      isOverflowEnabled(content.id)
                    );

                    if (chainContent) {
                      const sequenceNumber = getOverflowNumber(chainContent.id);
                      const fontSize = Math.min(region.width * scale * 0.6, region.height * scale * 0.6);

                      return (
                        <text
                          x={baseX + (region.x * scale) + (region.width * scale) / 2}
                          y={baseY + (region.y * scale) + (region.height * scale) / 2}
                          fill="#000000"
                          fontSize={fontSize}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontWeight="bold"
                          opacity="0.8"
                          style={{
                            pointerEvents: 'none',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                        >
                          {sequenceNumber}
                        </text>
                      );
                    }
                    return null;
                  })()}

                  {/* Content Type Name Overlay - Center of parent region (only if no children) */}
                  {showContentTypeNames && (() => {
                    // Only show content type for parent regions without children (slices)
                    if (region.children && region.children.length > 0) return null;

                    const regionContentsArray = regionContents.get(region.id) || [];
                    if (regionContentsArray.length === 0) return null;

                    // Get the first content type name
                    const contentType = regionContentsArray[0]?.type || 'content';

                    return (
                      <text
                        x={baseX + (region.x * scale) + (region.width * scale) / 2}
                        y={baseY + (region.y * scale) + (region.height * scale) / 2}
                        fill="#333"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        opacity="0.8"
                        style={{
                          textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                          pointerEvents: 'none'
                        }}
                      >
                        {contentType}
                      </text>
                    );
                  })()}

                  {/* Full Region Text Content - Fill entire region like text-area */}
                  {showPreview && (() => {
                    const regionContentsArray = regionContents.get(region.id) || [];
                    if (regionContentsArray.length === 0) return null;

                    return regionContentsArray.map((content: any, contentIndex: number) => {
                      let displayText = '';

                      // Extract text based on content type
                      if (content.type === 'line-text' && content.content?.text) {
                        displayText = content.content.text;
                      } else if (content.type === 'new-line-text' && content.content?.text) {
                        displayText = content.content.text;
                        console.log('🎨 new-line-text displayText:', displayText, 'content:', content);
                      } else if (content.type === 'new-multi-line' && content.content?.text) {
                        displayText = content.content.text;
                      } else if (content.type === 'new-washing-care-symbol' && content.content?.text) {
                        displayText = content.content.text;
                        console.log('🧺 new-washing-care-symbol displayText:', displayText, 'content:', content);
                      } else if (content.type === 'pure-english-paragraph' && content.content?.text) {
                        displayText = content.content.text;
                      } else if (content.type === 'translation-paragraph') {
                        const primary = content.content?.primaryContent || '';
                        const secondary = content.content?.secondaryContent || '';
                        displayText = primary + (secondary ? ` / ${secondary}` : '');
                      } else if (content.type === 'washing-symbol' && content.content?.symbol) {
                        displayText = content.content.symbol;
                      } else if (content.type === 'image' && content.content?.src) {
                        displayText = `[Image: ${content.content.src}]`;
                      } else if (content.type === 'coo' && content.content?.country) {
                        displayText = content.content.country;
                      }

                      if (!displayText) {
                        console.log('❌ No displayText for content:', content.type, content.id, 'content.content:', content.content);
                        return null;
                      }

                      // Get content properties - use master properties for connectors
                      const role = getOverflowRole(content.id);
                      let effectiveLayout = content.layout;
                      let effectiveTypography = content.typography;

                      if (role === 'connector') {
                        const masterProps = getMasterProperties(content.id);
                        if (masterProps) {
                          effectiveLayout = masterProps.layout;
                          effectiveTypography = masterProps.typography;
                        }
                      }

                      // Special handling for new-line-text with custom configuration
                      let fontSize = effectiveTypography?.fontSize || 12;
                      let fontFamily = effectiveTypography?.fontFamily || 'Arial';
                      let fontColor = effectiveTypography?.fontColor || '#000000';
                      let textAlign = effectiveLayout?.horizontalAlign || 'left';
                      let verticalAlign = effectiveLayout?.verticalAlign || 'top';
                      let padding = effectiveLayout?.padding || { top: 2, right: 2, bottom: 2, left: 2 };
                      let fontSizeUnit = 'px';

                      if (content.type === 'new-line-text' && content.newLineTextConfig) {
                        const config = content.newLineTextConfig;
                        fontSize = config.typography.fontSize;
                        fontFamily = config.typography.fontFamily;
                        fontSizeUnit = config.typography.fontSizeUnit;
                        textAlign = config.alignment.horizontal;
                        verticalAlign = config.alignment.vertical;
                        padding = config.padding;

                        // For new-line-text, let findOptimalTextFit handle all text fitting
                        // Don't apply custom truncation logic here - let the advanced algorithm handle it
                        console.log('🎨 new-line-text using advanced text fitting for:', displayText);
                      } else if (content.type === 'new-multi-line' && content.newMultiLineConfig) {
                        const config = content.newMultiLineConfig;
                        fontSize = config.typography.fontSize;
                        fontFamily = config.typography.fontFamily;
                        fontSizeUnit = config.typography.fontSizeUnit;
                        textAlign = config.alignment.horizontal;
                        verticalAlign = config.alignment.vertical;
                        padding = config.padding;

                        // Skip old word wrapping - new-multi-line uses processed lines from preview
                        console.log('🎨 new-multi-line skipping old word wrapping, will use processed lines from preview');
                      } else if (content.type === 'new-washing-care-symbol' && content.newWashingCareSymbolConfig) {
                        const config = content.newWashingCareSymbolConfig;
                        fontSize = config.typography.fontSize;
                        fontFamily = config.typography.fontFamily;
                        fontSizeUnit = config.typography.fontSizeUnit;
                        textAlign = config.alignment.horizontal;
                        verticalAlign = config.alignment.vertical;
                        padding = config.padding;

                        console.log('🧺 new-washing-care-symbol using configuration:', config);
                      }

                      // PHASE 1: Use precise text measurement for rendering
                      // Convert font size to pixels for consistent processing
                      let fontSizeForProcessing = fontSize;
                      if (content.type === 'new-line-text' && content.newLineTextConfig) {
                        const config = content.newLineTextConfig;
                        if (config.typography.fontSizeUnit === 'pt') {
                          fontSizeForProcessing = fontSize * 4/3; // Convert points to pixels
                        } else if (config.typography.fontSizeUnit === 'mm') {
                          fontSizeForProcessing = fontSize * 3.779527559; // Convert mm to pixels
                        }
                        console.log('🎨 Font size conversion:', fontSize, config.typography.fontSizeUnit, '→', fontSizeForProcessing, 'px');
                      }
                      
                      // 🎯 ACCURATE TRUNCATION: Based on visual test results
                      let displayLines: string[];
                      let hasOverflow = false;
                      let optimalFit: any = null; // Declare for overflow logic
                      
                      if (content.type === 'new-line-text') {
                        // Use precise truncation based on visual test data
                        // Test result: "AB CD EF GH IJ KL MN" (25 chars) fits exactly in 24mm available width
                        // This gives us: 24mm ÷ 25 chars = 0.96mm per character
                        
                        const availableWidthMm = region.width - padding.left - padding.right;
                        const charWidthMm = 0.96; // From visual test: 24mm ÷ 25 chars
                        const maxChars = Math.floor(availableWidthMm / charWidthMm);
                        
                        console.log('🎯 ACCURATE TRUNCATION based on visual test:', {
                          originalText: displayText,
                          availableWidthMm: availableWidthMm + 'mm',
                          charWidthMm: charWidthMm + 'mm/char',
                          maxChars,
                          textLength: displayText.length,
                          willTruncate: displayText.length > maxChars
                        });
                        
                        if (displayText.length > maxChars) {
                          const truncateLength = Math.max(0, maxChars - 3); // Reserve space for "..."
                          if (truncateLength <= 0) {
                            displayText = '...';
                          } else {
                            displayText = displayText.substring(0, truncateLength) + '...';
                          }
                          console.log('🎯 Text truncated to:', displayText);
                        }
                        
                        displayLines = [displayText];
                        hasOverflow = false;
                        optimalFit = { overflow: '' };
                      } else if (content.type === 'new-multi-line') {
                        // Apply Canvas-First Sync logic-slice to regions
                        console.log('🎯 Canvas: Applying Canvas-First Sync logic-slice to region');

                        // Calculate available space for text in region (EXACT COPY from slice logic)
                        const regionWidthPx = region.width * scale;
                        const regionHeightPx = region.height * scale;
                        const paddingLeftPx = padding.left * scale;
                        const paddingRightPx = padding.right * scale;
                        const paddingTopPx = padding.top * scale;
                        const paddingBottomPx = padding.bottom * scale;

                        const availableWidthPx = Math.max(0, regionWidthPx - paddingLeftPx - paddingRightPx);
                        const availableHeightPx = Math.max(0, regionHeightPx - paddingTopPx - paddingBottomPx);

                        // Calculate font size for region (EXACT COPY from slice logic)
                        let regionFontSizeInPixels = fontSizeForProcessing;
                        const regionScaledFontSize = Math.max(6, regionFontSizeInPixels * zoom);

                        // Process text wrapping using Canvas-First Sync logic-slice
                        const regionProcessedResult = processChildRegionTextWrapping(
                          displayText,
                          availableWidthPx,
                          availableHeightPx,
                          regionScaledFontSize,
                          content.newMultiLineConfig?.typography?.fontFamily || 'Arial',
                          content.newMultiLineConfig?.lineBreak?.symbol || '\n',
                          content.newMultiLineConfig?.lineBreak?.lineSpacing || 1.2
                        );

                        displayLines = regionProcessedResult.lines;
                        hasOverflow = regionProcessedResult.hasOverflow;

                        console.log('✅ Canvas: Applied Canvas-First Sync logic-slice to region:', {
                          regionId: region.id,
                          availableWidth: availableWidthPx,
                          availableHeight: availableHeightPx,
                          fontSize: regionScaledFontSize,
                          lines: displayLines.length,
                          hasOverflow
                        });

                        optimalFit = { overflow: hasOverflow ? 'height-truncated' : '' };
                      } else {
                        // For other content types: use normal fitting algorithm
                        const preciseCapacity = calculatePreciseTextCapacity(
                          region.width,
                          region.height,
                          fontSizeForProcessing, // Use converted font size
                          fontFamily,
                          padding,
                          false // Use normal fitting for other content
                        );

                        optimalFit = findOptimalTextFit(
                          displayText,
                          region.width,
                          region.height,
                          fontSizeForProcessing, // Use converted font size
                          fontFamily,
                          padding,
                          false // Use normal fitting for other content
                        );

                        // Use optimal fit results for display - lines are already calculated!
                        displayLines = optimalFit.fittingLines;
                        hasOverflow = optimalFit.overflow.length > 0;
                      }

                      // Calculate render coordinates (zoom-dependent)
                      const regionWidthPx = region.width * scale;
                      const regionHeightPx = region.height * scale;
                      const paddingTopPx = padding.top * scale;
                      const paddingRightPx = padding.right * scale;
                      const paddingBottomPx = padding.bottom * scale;
                      const paddingLeftPx = padding.left * scale;
                      const scaledFontSize = Math.max(6, fontSize * zoom);
                      const lineHeight = scaledFontSize * 1.2;

                      // Handle overflow using Phase 1 results
                      if (isOverflowEnabled(content.id) && hasOverflow) {
                        // Find next region in overflow chain
                        const contentType = content.type;
                        const chain = overflowChains.get(contentType) || [];
                        const currentIndex = chain.indexOf(content.id);

                        if (currentIndex >= 0 && currentIndex < chain.length - 1) {
                          const nextContentId = chain[currentIndex + 1];

                          // Find the region containing the next content
                          let nextRegionId: string | null = null;
                          regionContents.forEach((contents, rId) => {
                            if (contents.some((c: any) => c.id === nextContentId)) {
                              nextRegionId = rId;
                            }
                          });

                          if (nextRegionId && optimalFit.overflow.trim()) {
                            // Update next region's content with overflow text
                            setTimeout(() => {
                              setRegionContents(prevContents => {
                                const newContents = new Map(prevContents);
                                const nextRegionContents = newContents.get(nextRegionId!) || [];

                                const updatedNextContents = nextRegionContents.map((c: any) => {
                                  if (c.id === nextContentId) {
                                    return {
                                      ...c,
                                      content: {
                                        ...c.content,
                                        text: optimalFit.overflow
                                      }
                                    };
                                  }
                                  return c;
                                });

                                newContents.set(nextRegionId!, updatedNextContents);
                                return newContents;
                              });
                            }, 100); // Small delay to avoid render conflicts
                          }
                        }
                      }

                      // Enhanced text anchor and position calculation with safety margins
                      let textAnchor: 'start' | 'middle' | 'end' = 'start';

                      // Calculate safety margins consistent with text wrapping logic
                      const fontSizeMm = scaledFontSize / 3.779527559; // Convert px to mm
                      const baseSafetyMargin = fontSizeMm * 0.1; // 10% of font size
                      const renderingMargin = 0.5; // 0.5mm for rendering discrepancies
                      const totalSafetyMargin = baseSafetyMargin + renderingMargin;
                      const safetyMarginPx = totalSafetyMargin * 3.779527559; // Convert to pixels

                      // Apply safety margins to text positioning
                      let textX = baseX + (region.x * scale) + paddingLeftPx + safetyMarginPx;

                      if (textAlign === 'center') {
                        textAnchor = 'middle';
                        // Center within the available area (respecting padding and safety margins)
                        const availableAreaX = baseX + (region.x * scale) + paddingLeftPx + safetyMarginPx;
                        const availableAreaWidth = regionWidthPx - paddingLeftPx - paddingRightPx - (2 * safetyMarginPx);
                        textX = availableAreaX + availableAreaWidth / 2;
                      } else if (textAlign === 'right') {
                        textAnchor = 'end';
                        textX = baseX + (region.x * scale) + regionWidthPx - paddingRightPx - safetyMarginPx;
                      }

                      console.log(`🎯 Text positioning: Anchor=${textAnchor}, X=${textX.toFixed(1)}px, SafetyMargin=${safetyMarginPx.toFixed(1)}px`);

                      // Calculate vertical starting position based on vertical alignment
                      let startY = baseY + (region.y * scale) + paddingTopPx;
                      if (verticalAlign === 'center') {
                        const totalTextHeight = displayLines.length * lineHeight;
                        // Center within the available area (respecting padding)
                        const availableAreaY = baseY + (region.y * scale) + paddingTopPx;
                        const availableAreaHeight = regionHeightPx - paddingTopPx - paddingBottomPx;
                        startY = availableAreaY + (availableAreaHeight - totalTextHeight) / 2;
                      } else if (verticalAlign === 'bottom') {
                        const totalTextHeight = displayLines.length * lineHeight;
                        startY = baseY + (region.y * scale) + regionHeightPx - paddingBottomPx - totalTextHeight;
                      }

                      return (
                        <g key={`${region.id}-text-group-${contentIndex}`}>
                          {/* Render text lines or washing care symbols without clipping */}
                          <g>
                            {content.type === 'new-washing-care-symbol' ? (
                              // Render washing care symbols using Wash Care Symbols M54 font
                              (() => {
                                const symbols = content.content?.symbols || ['b', 'G', '5', 'B', 'J'];
                                const symbolSize = Math.min(regionWidthPx / symbols.length * 0.6, regionHeightPx * 0.6, 30); // Scale to fit region
                                const symbolSpacing = (regionWidthPx * 0.8) / symbols.length; // Equal spacing within 80% of region width

                                // Center the container horizontally and vertically in the region
                                const regionCenterX = baseX + (region.x * scale) + (regionWidthPx / 2);
                                const regionCenterY = baseY + (region.y * scale) + (regionHeightPx / 2);
                                const containerStartX = regionCenterX - (regionWidthPx * 0.8) / 2;

                                return (
                                  <g key="washing-symbols-container">
                                    {symbols.map((symbol: string, symbolIndex: number) => {
                                      const symbolX = containerStartX + symbolIndex * symbolSpacing + symbolSpacing / 2;
                                      const symbolY = regionCenterY;

                                      // Render symbol using Wash Care Symbols M54 font
                                      return (
                                        <text
                                          key={`symbol-${symbolIndex}`}
                                          x={symbolX}
                                          y={symbolY}
                                          fill="black"
                                          fontSize={symbolSize}
                                          fontFamily="Wash Care Symbols M54"
                                          textAnchor="middle"
                                          dominantBaseline="central"
                                        >
                                          {symbol}
                                        </text>
                                      );
                                    })}
                                  </g>
                                );
                              })()
                            ) : (
                              // Render regular text lines
                              displayLines.map((line, lineIndex) => {
                                const textY = startY + (lineIndex + 1) * lineHeight;

                                return (
                                  <text
                                    key={`${region.id}-preview-${contentIndex}-line-${lineIndex}`}
                                    x={textX}
                                    y={textY}
                                    fill={fontColor}
                                    fontSize={scaledFontSize}
                                    fontFamily={fontFamily}
                                    textAnchor={textAnchor}
                                    dominantBaseline="alphabetic"
                                    opacity="0.9"
                                    style={{
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    {line}
                                  </text>
                                );
                              })
                            )}
                          </g>
                        </g>
                      );
                    });
                  })()}

                  {/* Padding boundaries visualization for new-line-text content */}
                  {(() => {
                    const regionContentsArray = regionContents.get(region.id) || [];
                    if (!regionContentsArray || regionContentsArray.length === 0) return null;
                    return regionContentsArray.map((content: any, contentIndex: number) => {
                      if (content.type !== 'new-line-text' || !content.newLineTextConfig) return null;
                      
                      const config = content.newLineTextConfig;
                      const regionWidthPx = region.width * scale;
                      const regionHeightPx = region.height * scale;
                      const paddingTopPx = config.padding.top * scale;
                      const paddingRightPx = config.padding.right * scale;
                      const paddingBottomPx = config.padding.bottom * scale;
                      const paddingLeftPx = config.padding.left * scale;
                      
                      // Only show if any padding is greater than 0 and supporting lines are enabled
                      if (!showSupportingLines || (config.padding.top === 0 && config.padding.right === 0 &&
                          config.padding.bottom === 0 && config.padding.left === 0)) {
                        return null;
                      }
                      
                      const regionX = baseX + (region.x * scale);
                      const regionY = baseY + (region.y * scale);
                      
                      return (
                        <g key={`${region.id}-padding-${contentIndex}`}>
                          {/* Top padding line */}
                          {config.padding.top > 0 && (
                            <line
                              x1={regionX + paddingLeftPx}
                              y1={regionY + paddingTopPx}
                              x2={regionX + regionWidthPx - paddingRightPx}
                              y2={regionY + paddingTopPx}
                              stroke="#ff6b35"
                              strokeWidth="1"
                              strokeDasharray="3,3"
                              opacity="0.7"
                            />
                          )}
                          
                          {/* Bottom padding line */}
                          {config.padding.bottom > 0 && (
                            <line
                              x1={regionX + paddingLeftPx}
                              y1={regionY + regionHeightPx - paddingBottomPx}
                              x2={regionX + regionWidthPx - paddingRightPx}
                              y2={regionY + regionHeightPx - paddingBottomPx}
                              stroke="#ff6b35"
                              strokeWidth="1"
                              strokeDasharray="3,3"
                              opacity="0.7"
                            />
                          )}
                          
                          {/* Left padding line */}
                          {config.padding.left > 0 && (
                            <line
                              x1={regionX + paddingLeftPx}
                              y1={regionY + paddingTopPx}
                              x2={regionX + paddingLeftPx}
                              y2={regionY + regionHeightPx - paddingBottomPx}
                              stroke="#ff6b35"
                              strokeWidth="1"
                              strokeDasharray="3,3"
                              opacity="0.7"
                            />
                          )}
                          
                          {/* Right padding line */}
                          {config.padding.right > 0 && (
                            <line
                              x1={regionX + regionWidthPx - paddingRightPx}
                              y1={regionY + paddingTopPx}
                              x2={regionX + regionWidthPx - paddingRightPx}
                              y2={regionY + regionHeightPx - paddingBottomPx}
                              stroke="#ff6b35"
                              strokeWidth="1"
                              strokeDasharray="3,3"
                              opacity="0.7"
                            />
                          )}
                        </g>
                      );
                    });
                  })()}

                  {/* Padding boundaries visualization for new-multi-line content */}
                  {(() => {
                    const regionContentsArray = regionContents.get(region.id) || [];
                    if (!regionContentsArray || regionContentsArray.length === 0) return null;
                    return regionContentsArray.map((content: any, contentIndex: number) => {
                      if (content.type !== 'new-multi-line' || !content.newMultiLineConfig) return null;

                      const config = content.newMultiLineConfig;
                      const regionWidthPx = region.width * scale;
                      const regionHeightPx = region.height * scale;
                      const paddingTopPx = config.padding.top * scale;
                      const paddingRightPx = config.padding.right * scale;
                      const paddingBottomPx = config.padding.bottom * scale;
                      const paddingLeftPx = config.padding.left * scale;

                      // Only show if any padding is greater than 0 and supporting lines are enabled
                      if (!showSupportingLines || (config.padding.top === 0 && config.padding.right === 0 &&
                          config.padding.bottom === 0 && config.padding.left === 0)) {
                        return null;
                      }

                      const regionX = baseX + (region.x * scale);
                      const regionY = baseY + (region.y * scale);

                      return (
                        <g key={`${region.id}-multi-padding-${contentIndex}`}>
                          {/* Top padding line */}
                          {config.padding.top > 0 && (
                            <line
                              x1={regionX + paddingLeftPx}
                              y1={regionY + paddingTopPx}
                              x2={regionX + regionWidthPx - paddingRightPx}
                              y2={regionY + paddingTopPx}
                              stroke="#22c55e"
                              strokeWidth="1"
                              strokeDasharray="3,3"
                              opacity="0.7"
                            />
                          )}

                          {/* Bottom padding line */}
                          {config.padding.bottom > 0 && (
                            <line
                              x1={regionX + paddingLeftPx}
                              y1={regionY + regionHeightPx - paddingBottomPx}
                              x2={regionX + regionWidthPx - paddingRightPx}
                              y2={regionY + regionHeightPx - paddingBottomPx}
                              stroke="#22c55e"
                              strokeWidth="1"
                              strokeDasharray="3,3"
                              opacity="0.7"
                            />
                          )}

                          {/* Left padding line */}
                          {config.padding.left > 0 && (
                            <line
                              x1={regionX + paddingLeftPx}
                              y1={regionY + paddingTopPx}
                              x2={regionX + paddingLeftPx}
                              y2={regionY + regionHeightPx - paddingBottomPx}
                              stroke="#22c55e"
                              strokeWidth="1"
                              strokeDasharray="3,3"
                              opacity="0.7"
                            />
                          )}

                          {/* Right padding line */}
                          {config.padding.right > 0 && (
                            <line
                              x1={regionX + regionWidthPx - paddingRightPx}
                              y1={regionY + paddingTopPx}
                              x2={regionX + regionWidthPx - paddingRightPx}
                              y2={regionY + regionHeightPx - paddingBottomPx}
                              stroke="#22c55e"
                              strokeWidth="1"
                              strokeDasharray="3,3"
                              opacity="0.7"
                            />
                          )}
                        </g>
                      );
                    });
                  })()}

                  {/* Content Placeholders removed - only show centered content type labels in overlays above */}
                </g>
                );

                // Render child regions if they exist
                if (region.children && region.children.length > 0) {
                  region.children.forEach((childRegion: Region, childIndex: number) => {
                    const isChildEditing = editingRegion && editingRegion.id === childRegion.id;
                    const isChildHighlighted = highlightedRegion === childRegion.id;

                    let childStrokeColor = childRegion.borderColor;
                    let childStrokeWidth = 1;

                    if (isChildEditing) {
                      childStrokeColor = '#007bff';
                      childStrokeWidth = 3;
                    } else if (isChildHighlighted) {
                      childStrokeColor = '#ff6b35';
                      childStrokeWidth = 2;
                    }

                    elements.push(
                      <g key={childRegion.id}>
                        {/* Child Region Rectangle */}
                        <rect
                          x={baseX + (childRegion.x * scale)}
                          y={baseY + (childRegion.y * scale)}
                          width={childRegion.width * scale}
                          height={childRegion.height * scale}
                          fill={hoveredRegionId === childRegion.id ? '#fff3e0' : // Orange highlight on hover
                                dragOverRegion === childRegion.id ?
                                (() => {
                                  const hasContent = (regionContents.get(childRegion.id) || []).length > 0;
                                  return hasContent ? '#ffebee' : getRegionBackgroundColor(childRegion.id); // Red tint for occupied, content-type color for empty
                                })() : getRegionBackgroundColor(childRegion.id)}
                          stroke={!showPartitionLines ? 'none' : // Hide partition lines when toggled off
                                  hoveredRegionId === childRegion.id ? '#ff6b35' : // Orange border on hover
                                  dragOverRegion === childRegion.id ?
                                  (() => {
                                    const hasContent = (regionContents.get(childRegion.id) || []).length > 0;
                                    return hasContent ? '#f44336' : '#4caf50'; // Red border for occupied, green for empty
                                  })() : childStrokeColor}
                          strokeWidth={!showPartitionLines ? 0 : // Hide partition lines when toggled off
                                      hoveredRegionId === childRegion.id ? 4 : // Thicker border on hover
                                      dragOverRegion === childRegion.id ? 3 : childStrokeWidth}
                          strokeDasharray="3,3"
                          opacity={hoveredRegionId === childRegion.id ? 1.0 : // Full opacity on hover
                                  dragOverRegion === childRegion.id ? 0.9 : 0.8}
                          style={{ cursor: isProjectMode ? 'copy' : 'pointer' }}
                          onDragOver={isProjectMode ? (e) => handleContentDragOver(e, childRegion.id) : undefined}
                          onDragLeave={isProjectMode ? handleContentDragLeave : undefined}
                          onDrop={isProjectMode ? (e) => handleContentDrop(e, childRegion.id) : undefined}
                          onMouseEnter={() => {
                            if (!editingRegion || editingRegion.id !== childRegion.id) {
                              setHighlightedRegion(childRegion.id);
                            }
                          }}
                          onMouseLeave={() => {
                            if (!editingRegion || editingRegion.id !== childRegion.id) {
                              setHighlightedRegion(null);
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Check if this slice has content
                            const sliceContentItems = regionContents.get(childRegion.id) || [];
                            const hasContent = sliceContentItems.length > 0;

                            if (hasContent) {
                              // Slice has content - open property dialog with pre-populated values
                              const content = sliceContentItems[0]; // Get first content item
                              handleContentDoubleClick(content, childRegion.id);
                            } else {
                              // Slice has no content - open slice dialog
                              setSlicingRegion(childRegion);
                              setHighlightedRegion(childRegion.id);
                              setSliceLines({ horizontal: [], vertical: [] });
                              setSliceMode('visual');
                              setShowSliceDialog(true);
                              setSlicePopupPosition({ x: 100, y: 100 });
                            }
                          }}
                        />

                        {/* Child Region Label */}
                        {showPartitionNames && (
                          <text
                            x={baseX + (childRegion.x * scale) + (childRegion.width * scale) / 2}
                            y={baseY + (childRegion.y * scale) + 12}
                            fill={childRegion.borderColor}
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            opacity="0.9"
                          >
                            S{childIndex + 1}
                          </text>
                        )}

                        {/* Child Region Dimensions */}
                        <text
                          x={baseX + (childRegion.x * scale) + (childRegion.width * scale) / 2}
                          y={baseY + (childRegion.y * scale) + (childRegion.height * scale) - 3}
                          fill={childRegion.borderColor}
                          fontSize="6"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          opacity="0.7"
                        >
                          {childRegion.width}×{childRegion.height}mm
                        </text>

                        {/* Child Region Overflow Sequence Number - Large overlay when toggle is ON */}
                        {showOverflowNumbers && (() => {
                          // Find if this child region contains content that's part of the overflow chain
                          const regionContentList = regionContents.get(childRegion.id) || [];
                          const chainContent = regionContentList.find((content: any) =>
                            isOverflowEnabled(content.id)
                          );

                          if (chainContent) {
                            const sequenceNumber = getOverflowNumber(chainContent.id);
                            const fontSize = Math.min(childRegion.width * scale * 0.6, childRegion.height * scale * 0.6);

                            return (
                              <text
                                x={baseX + (childRegion.x * scale) + (childRegion.width * scale) / 2}
                                y={baseY + (childRegion.y * scale) + (childRegion.height * scale) / 2}
                                fill="#000000"
                                fontSize={fontSize}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontWeight="bold"
                                opacity="0.8"
                                style={{
                                  pointerEvents: 'none',
                                  fontFamily: 'system-ui, -apple-system, sans-serif'
                                }}
                              >
                                {sequenceNumber}
                              </text>
                            );
                          }
                          return null;
                        })()}

                        {/* Content Type Name Overlay - Center of slice */}
                        {showContentTypeNames && (() => {
                          const sliceContents = regionContents.get(childRegion.id) || [];
                          if (sliceContents.length === 0) return null;

                          // Get the first content type name
                          const contentType = sliceContents[0]?.type || 'content';

                          return (
                            <text
                              x={baseX + (childRegion.x * scale) + (childRegion.width * scale) / 2}
                              y={baseY + (childRegion.y * scale) + (childRegion.height * scale) / 2}
                              fill="#333"
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              opacity="0.8"
                              style={{
                                textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
                              }}
                            >
                              {contentType}
                            </text>
                          );
                        })()}

                        {/* Child Region Text Content - Use same advanced rendering as main regions */}
                        {showPreview && (() => {
                          const sliceContents = regionContents.get(childRegion.id) || [];
                          if (sliceContents.length === 0) return null;

                          console.log('🎨 CHILD REGION RENDERING:', {
                            childRegionId: childRegion.id,
                            contentCount: sliceContents.length,
                            contentTypes: sliceContents.map(c => c.type)
                          });

                          return sliceContents.map((content: any, contentIndex: number) => {
                            let displayText = '';

                            // Extract text based on content type (same as main regions)
                            if (content.type === 'line-text' && content.content?.text) {
                              displayText = content.content.text;
                            } else if (content.type === 'new-line-text' && content.content?.text) {
                              displayText = content.content.text;
                              console.log('🎨 child new-line-text displayText:', displayText, 'content:', content);
                            } else if (content.type === 'new-multi-line' && content.content?.text) {
                              displayText = content.content.text;
                              console.log('🎨 child new-multi-line displayText:', displayText, 'content:', content);
                            } else if (content.type === 'new-washing-care-symbol' && content.content?.text) {
                              displayText = content.content.text;
                              console.log('🧺 child new-washing-care-symbol displayText:', displayText, 'content:', content);
                            } else if (content.type === 'pure-english-paragraph' && content.content?.text) {
                              displayText = content.content.text;
                            } else if (content.type === 'translation-paragraph') {
                              const primary = content.content?.primaryContent || '';
                              const secondary = content.content?.secondaryContent || '';
                              displayText = primary + (secondary ? ` / ${secondary}` : '');
                            } else if (content.type === 'washing-symbol' && content.content?.symbol) {
                              displayText = content.content.symbol;
                            } else if (content.type === 'image' && content.content?.src) {
                              displayText = `[Image: ${content.content.src}]`;
                            } else if (content.type === 'coo' && content.content?.country) {
                              displayText = content.content.country;
                            }

                            if (!displayText) {
                              console.log('❌ Child region: No displayText for content:', content.type, content.id, 'content.content:', content.content);
                              return null;
                            }

                            // Get content properties - use master properties for connectors (same as main regions)
                            const role = getOverflowRole(content.id);
                            let effectiveLayout = content.layout;
                            let effectiveTypography = content.typography;

                            if (role === 'connector') {
                              const masterProps = getMasterProperties(content.id);
                              if (masterProps) {
                                effectiveLayout = masterProps.layout || effectiveLayout;
                                effectiveTypography = masterProps.typography || effectiveTypography;
                              }
                            }

                            // Typography and layout (same as main regions)
                            let fontSize = effectiveTypography?.fontSize || 12;
                            let fontFamily = effectiveTypography?.fontFamily || 'Arial';
                            let fontSizeUnit = effectiveTypography?.fontSizeUnit || 'px';
                            let fontColor = effectiveTypography?.fontColor || '#000000';
                            let textAlign = effectiveLayout?.horizontalAlign || 'left';
                            let verticalAlign = effectiveLayout?.verticalAlign || 'top';
                            let padding = effectiveLayout?.padding || { top: 2, right: 2, bottom: 2, left: 2 };

                            // Handle new content types with their specific configs (same as main regions)
                            if (content.type === 'new-line-text' && content.newLineTextConfig) {
                              const config = content.newLineTextConfig;
                              fontSize = config.typography.fontSize;
                              fontFamily = config.typography.fontFamily;
                              fontSizeUnit = config.typography.fontSizeUnit;
                              textAlign = config.alignment.horizontal;
                              verticalAlign = config.alignment.vertical;
                              padding = config.padding;
                              console.log('🎨 child new-line-text using advanced text fitting for:', displayText);
                            } else if (content.type === 'new-multi-line' && content.newMultiLineConfig) {
                              const config = content.newMultiLineConfig;
                              fontSize = config.typography.fontSize;
                              fontFamily = config.typography.fontFamily;
                              fontSizeUnit = config.typography.fontSizeUnit;
                              textAlign = config.alignment.horizontal;
                              verticalAlign = config.alignment.vertical;
                              padding = config.padding;
                              console.log('🎨 child new-multi-line using processed lines from preview');
                            } else if (content.type === 'new-washing-care-symbol' && content.newWashingCareSymbolConfig) {
                              const config = content.newWashingCareSymbolConfig;
                              fontSize = config.typography.fontSize;
                              fontFamily = config.typography.fontFamily;
                              fontSizeUnit = config.typography.fontSizeUnit;
                              textAlign = config.alignment.horizontal;
                              verticalAlign = config.alignment.vertical;
                              padding = config.padding;
                              console.log('🧺 child new-washing-care-symbol using configuration:', config);
                            }

                            // Advanced text processing (same as main regions)
                            let displayLines: string[] = [];
                            let hasOverflow = false;
                            let optimalFit: any = { overflow: '' };

                            // PHASE 1: Use precise text measurement for rendering (same as main regions)
                            let fontSizeForProcessing = fontSize;
                            if (fontSizeUnit === 'pt') {
                              fontSizeForProcessing = fontSize * 4/3; // Convert pt to px
                            } else if (fontSizeUnit === 'mm') {
                              fontSizeForProcessing = fontSize * 3.779527559; // Convert mm to px
                            }

                            if (content.type === 'new-line-text') {
                              // For new-line-text: Use advanced text fitting (same as main regions)
                              console.log('🎨 child new-line-text using advanced text fitting for:', displayText);
                              displayLines = [displayText];
                              hasOverflow = false;
                              optimalFit = { overflow: '' };
                            } else if (content.type === 'new-multi-line') {
                              // For multi-line content: Calculate text wrapping for actual child region dimensions
                              console.log('🎯 Child Canvas: Calculating text wrapping for child region dimensions');

                              // Calculate available space for text in child region
                              const childRegionWidthPx = childRegion.width * scale;
                              const childRegionHeightPx = childRegion.height * scale;
                              const childPaddingLeftPx = padding.left * scale;
                              const childPaddingRightPx = padding.right * scale;
                              const childPaddingTopPx = padding.top * scale;
                              const childPaddingBottomPx = padding.bottom * scale;

                              const childAvailableWidthPx = Math.max(0, childRegionWidthPx - childPaddingLeftPx - childPaddingRightPx);
                              const childAvailableHeightPx = Math.max(0, childRegionHeightPx - childPaddingTopPx - childPaddingBottomPx);

                              // Calculate font size for child region
                              let childFontSizeInPixels = fontSizeForProcessing;
                              const childScaledFontSize = Math.max(6, childFontSizeInPixels * zoom);

                              // Process text wrapping for child region dimensions
                              const childLineSpacing = content.newMultiLineConfig?.lineBreak?.lineSpacing || 1.2;
                              const childLineHeight = childScaledFontSize * childLineSpacing;

                              // Calculate text wrapping for child region using canvas measurement
                              const childProcessedResult = processChildRegionTextWrapping(
                                displayText,
                                childAvailableWidthPx,
                                childAvailableHeightPx,
                                childScaledFontSize,
                                content.newMultiLineConfig?.typography?.fontFamily || 'Arial',
                                content.newMultiLineConfig?.lineBreak?.symbol || '\n',
                                content.newMultiLineConfig?.lineBreak?.lineSpacing || 1.2
                              );

                              displayLines = childProcessedResult.lines;
                              hasOverflow = childProcessedResult.hasOverflow;

                              console.log('✅ Child Canvas: Calculated wrapping for child region:', {
                                availableWidth: childAvailableWidthPx,
                                availableHeight: childAvailableHeightPx,
                                fontSize: childScaledFontSize,
                                lines: displayLines.length,
                                hasOverflow
                              });
                            } else {
                              // For other content types: Use simple processing
                              displayLines = [displayText];
                              hasOverflow = false;
                              optimalFit = { overflow: '' };
                            }

                            // Calculate positioning and dimensions (same as main regions)
                            // Child regions are positioned relative to the parent object
                            const childBaseX = baseX + (childRegion.x * scale);
                            const childBaseY = baseY + (childRegion.y * scale);
                            const regionWidthPx = childRegion.width * scale;
                            const regionHeightPx = childRegion.height * scale;
                            const paddingTopPx = padding.top * scale;
                            const paddingRightPx = padding.right * scale;
                            const paddingBottomPx = padding.bottom * scale;
                            const paddingLeftPx = padding.left * scale;

                            const availableWidthPx = Math.max(0, regionWidthPx - paddingLeftPx - paddingRightPx);
                            const availableHeightPx = Math.max(0, regionHeightPx - paddingTopPx - paddingBottomPx);

                            // Use the font size and line height calculated during text processing
                            let fontSizeInPixels = fontSizeForProcessing;
                            const scaledFontSize = Math.max(6, fontSizeInPixels * zoom);
                            const lineSpacing = content.newMultiLineConfig?.lineBreak?.lineSpacing || 1.2;
                            const lineHeight = scaledFontSize * lineSpacing;

                            // Calculate text positioning based on alignment
                            let textX = childBaseX + paddingLeftPx;
                            let textY = childBaseY + paddingTopPx;

                            if (textAlign === 'center') {
                              textX = childBaseX + regionWidthPx / 2;
                            } else if (textAlign === 'right') {
                              textX = childBaseX + regionWidthPx - paddingRightPx;
                            }

                            if (verticalAlign === 'center') {
                              const totalTextHeight = displayLines.length * lineHeight;
                              textY = childBaseY + (regionHeightPx - totalTextHeight) / 2;
                            } else if (verticalAlign === 'bottom') {
                              const totalTextHeight = displayLines.length * lineHeight;
                              textY = childBaseY + regionHeightPx - paddingBottomPx - totalTextHeight;
                            }

                            // Render text lines (same as main regions)
                            if (displayLines.length === 0) return null;

                            // Set text anchor based on alignment
                            let textAnchor: 'start' | 'middle' | 'end' = 'start';
                            if (textAlign === 'center') {
                              textAnchor = 'middle';
                            } else if (textAlign === 'right') {
                              textAnchor = 'end';
                            }

                            // Render washing care symbols or regular text
                            if (content.type === 'new-washing-care-symbol') {
                              // Render washing care symbols using Wash Care Symbols M54 font in child regions
                              const symbols = content.content?.symbols || ['b', 'G', '5', 'B', 'J'];
                              const symbolSize = Math.min(regionWidthPx / symbols.length * 0.6, regionHeightPx * 0.6, 25); // Scale to fit child region
                              const symbolSpacing = (regionWidthPx * 0.8) / symbols.length; // Equal spacing within 80% of region width

                              // Center the container horizontally and vertically in the child region
                              const childRegionCenterX = childBaseX + (regionWidthPx / 2);
                              const childRegionCenterY = childBaseY + (regionHeightPx / 2);
                              const containerStartX = childRegionCenterX - (regionWidthPx * 0.8) / 2;

                              return (
                                <g key="child-washing-symbols-container">
                                  {symbols.map((symbol: string, symbolIndex: number) => {
                                    const symbolX = containerStartX + symbolIndex * symbolSpacing + symbolSpacing / 2;
                                    const symbolY = childRegionCenterY;

                                    // Render symbol using Wash Care Symbols M54 font
                                    return (
                                      <text
                                        key={`child-symbol-${symbolIndex}`}
                                        x={symbolX}
                                        y={symbolY}
                                        fill="black"
                                        fontSize={symbolSize}
                                        fontFamily="Wash Care Symbols M54"
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                      >
                                        {symbol}
                                      </text>
                                    );
                                  })}
                                </g>
                              );
                            } else {
                              // Render regular text lines
                              return displayLines.map((line, lineIndex) => (
                                <text
                                  key={`child-text-${childRegion.id}-${contentIndex}-${lineIndex}`}
                                  x={textX}
                                  y={textY + (lineIndex + 1) * lineHeight}
                                  fill={fontColor}
                                  fontSize={scaledFontSize}
                                  fontFamily={fontFamily}
                                  textAnchor={textAnchor}
                                  dominantBaseline="alphabetic"
                                  opacity="0.95"
                                  style={{ pointerEvents: 'none' }}
                                >
                                  {line}
                                </text>
                              ));
                            }
                          });
                        })()}

                        {/* Padding boundaries visualization for new-multi-line content in child regions */}
                        {(() => {
                          const childContentItems = regionContents.get(childRegion.id) || [];
                          return childContentItems.map((content: any, contentIndex: number) => {
                            if (content.type !== 'new-multi-line' || !content.newMultiLineConfig) return null;

                            const config = content.newMultiLineConfig;
                            const childWidthPx = childRegion.width * scale;
                            const childHeightPx = childRegion.height * scale;
                            const paddingTopPx = config.padding.top * scale;
                            const paddingRightPx = config.padding.right * scale;
                            const paddingBottomPx = config.padding.bottom * scale;
                            const paddingLeftPx = config.padding.left * scale;

                            // Only show if any padding is greater than 0 and supporting lines are enabled
                            if (!showSupportingLines || (config.padding.top === 0 && config.padding.right === 0 &&
                                config.padding.bottom === 0 && config.padding.left === 0)) {
                              return null;
                            }

                            const childX = baseX + (childRegion.x * scale);
                            const childY = baseY + (childRegion.y * scale);

                            return (
                              <g key={`${childRegion.id}-multi-padding-${contentIndex}`}>
                                {/* Top padding line */}
                                {config.padding.top > 0 && (
                                  <line
                                    x1={childX + paddingLeftPx}
                                    y1={childY + paddingTopPx}
                                    x2={childX + childWidthPx - paddingRightPx}
                                    y2={childY + paddingTopPx}
                                    stroke="#22c55e"
                                    strokeWidth="1"
                                    strokeDasharray="3,3"
                                    opacity="0.7"
                                  />
                                )}

                                {/* Bottom padding line */}
                                {config.padding.bottom > 0 && (
                                  <line
                                    x1={childX + paddingLeftPx}
                                    y1={childY + childHeightPx - paddingBottomPx}
                                    x2={childX + childWidthPx - paddingRightPx}
                                    y2={childY + childHeightPx - paddingBottomPx}
                                    stroke="#22c55e"
                                    strokeWidth="1"
                                    strokeDasharray="3,3"
                                    opacity="0.7"
                                  />
                                )}

                                {/* Left padding line */}
                                {config.padding.left > 0 && (
                                  <line
                                    x1={childX + paddingLeftPx}
                                    y1={childY + paddingTopPx}
                                    x2={childX + paddingLeftPx}
                                    y2={childY + childHeightPx - paddingBottomPx}
                                    stroke="#22c55e"
                                    strokeWidth="1"
                                    strokeDasharray="3,3"
                                    opacity="0.7"
                                  />
                                )}

                                {/* Right padding line */}
                                {config.padding.right > 0 && (
                                  <line
                                    x1={childX + childWidthPx - paddingRightPx}
                                    y1={childY + paddingTopPx}
                                    x2={childX + childWidthPx - paddingRightPx}
                                    y2={childY + childHeightPx - paddingBottomPx}
                                    stroke="#22c55e"
                                    strokeWidth="1"
                                    strokeDasharray="3,3"
                                    opacity="0.7"
                                  />
                                )}
                              </g>
                            );
                          });
                        })()}
                      </g>
                    );
                  });
                }

                return elements;
              };

              return objectRegions.flatMap((region: Region, regionIndex: number) => renderRegionWithChildren(region, regionIndex));
            })()}

            {/* Chain connections moved to SVG level - see after all objects rendered */}



            {/* ZOOM-INDEPENDENT arrow marker for overflow connections */}
            <defs>
              <marker
                id="overflowArrow"
                markerWidth={10 / zoom}
                markerHeight={8 / zoom}
                refX={9 / zoom}
                refY={4 / zoom}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <polygon
                  points={`0 0, ${10/zoom} ${4/zoom}, 0 ${8/zoom}`}
                  fill="#000000"
                />
              </marker>
            </defs>

            {/* Sewing Lines with Dimensions */}
            {showSewingLines && (() => {
              // Check if mid-fold line is enabled - if so, don't show sewing lines
              const objectMidFoldLine = (obj as any).midFoldLine;
              if (objectMidFoldLine && objectMidFoldLine.enabled) {
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
            {obj.type?.includes('mother') && showSewingLines && (() => {
              const objectMidFoldLine = (obj as any).midFoldLine;
              if (!objectMidFoldLine || !objectMidFoldLine.enabled) {
                return null;
              }

              // Rendering mid-fold line on canvas (removed noisy logging)

              const midFold = objectMidFoldLine;
              const padding = midFold.padding || 3;
              const mmToPx = 3.78;
              const scale = zoom * mmToPx;
              // Note: padding is used for region calculations, not line display

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

                // Draw horizontal line (full width - padding is for regions, not line display)
                const lineStartX = baseX;
                const lineEndX = baseX + width;

                // Calculate padding areas
                const paddingPx = padding * scale;
                const topPaddingY = lineY - paddingPx;
                const bottomPaddingY = lineY;
                const paddingHeight = paddingPx;

                return (
                  <>
                    {/* Top Padding Area */}
                    <rect
                      x={lineStartX}
                      y={topPaddingY}
                      width={width}
                      height={paddingHeight}
                      fill="#d32f2f"
                      opacity="0.3"
                    />
                    {/* Bottom Padding Area */}
                    <rect
                      x={lineStartX}
                      y={bottomPaddingY}
                      width={width}
                      height={paddingHeight}
                      fill="#d32f2f"
                      opacity="0.3"
                    />
                    {/* Mid Fold Line */}
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

                // Draw vertical line (full height - padding is for regions, not line display)
                const lineStartY = baseY;
                const lineEndY = baseY + height;

                // Calculate padding areas
                const paddingPx = padding * scale;
                const leftPaddingX = lineX - paddingPx;
                const rightPaddingX = lineX;
                const paddingWidth = paddingPx;

                return (
                  <>
                    {/* Left Padding Area */}
                    <rect
                      x={leftPaddingX}
                      y={lineStartY}
                      width={paddingWidth}
                      height={height}
                      fill="#d32f2f"
                      opacity="0.3"
                    />
                    {/* Right Padding Area */}
                    <rect
                      x={rightPaddingX}
                      y={lineStartY}
                      width={paddingWidth}
                      height={height}
                      fill="#d32f2f"
                      opacity="0.3"
                    />
                    {/* Mid Fold Line */}
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
              {motherMeta.margins && selectedObject === obj && showSupportingLines && (
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

  // Check if any content dialog is open
  const isAnyDialogOpen = universalDialog.isOpen; // || regionOccupationDialog.isOpen;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f5f5f5',
      marginRight: ((showContentMenu || pinnedContentMenu) || (showHierarchyMenu || pinnedHierarchyMenu) || (showNewCtMenu || pinnedNewCtMenu)) ? '300px' : '0',
      pointerEvents: isLoadingMasterFile ? 'none' : 'auto',
      opacity: isLoadingMasterFile ? 0.6 : 1,
      transition: 'margin-right 0.3s ease, opacity 0.3s ease'
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
      {/* Header and Navigation - Show for both master file and project modes */}
      {(selectedCustomer || context === 'projects') && (
        <>
          {/* Navigation Buttons - Completely hidden in project mode */}
          {context !== 'projects' && (
            <NavigationButtons
              previousPagePath={
                isEditMode
                  ? "/master-files-management"
                  : "/coordinate-viewer"
              }
              previousPageLabel={
                isEditMode
                  ? "Master Files Management"
                  : "Create Method"
              }
              showMasterFilesButton={true}
              showPreviousButton={true}
            />
          )}

          {/* Debug: Context verification (removed noisy logging) */}

          {/* Header - Different for Project Mode vs Master File Mode */}
          {context === 'projects' ? (
            // Project Mode Header
            <>


              {/* Project Details Row */}
              <div style={{
                background: '#2d3748',
                color: 'white',
                padding: '12px 20px',
                borderBottom: '1px solid #4a5568'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#a0aec0' }}>
                    {selectedCustomer?.customerName || (() => {
                      // Extract customer name from project slug (e.g., "fall2025-ttt" -> "TTT")
                      if (projectSlug) {
                        const parts = projectSlug.split('-');
                        const lastPart = parts[parts.length - 1];
                        return lastPart.toUpperCase();
                      }
                      return 'Loading Customer';
                    })()} - {decodeURIComponent(projectName || projectSlug || 'Unknown Project')} - {(() => {
                      // Get master file name (3rd component)
                      const currentData = data || webCreationData;

                      // First try to get from originalMasterFile
                      if (originalMasterFile?.name) {
                        return originalMasterFile.name;
                      }

                      // If not available, try to extract from document field
                      if (currentData?.document) {
                        const docName = currentData.document;
                        if (docName.startsWith('Project: ')) {
                          // Extract master file name from "Project: {masterFileName}" format
                          return docName.replace('Project: ', '');
                        }
                      }

                      // Check URL parameters for master file info
                      const urlParams = new URLSearchParams(window.location.search);
                      const masterFileId = urlParams.get('masterFileId');
                      if (masterFileId) {
                        return `MasterFile-${masterFileId.split('_')[1] || masterFileId}`;
                      }

                      return isLoadingMasterFile ? 'Loading...' : 'Master File';
                    })()} - {(() => {
                      // Determine if editing existing layout or creating new one
                      const urlParams = new URLSearchParams(window.location.search);
                      const layoutId = urlParams.get('layoutId');

                      if (layoutId) {
                        // Editing existing layout - show layout with update timestamp
                        // First check if we have loaded project state with layout name
                        const currentData = data || webCreationData;
                        if (currentData && currentData.layoutName) {
                          return currentData.layoutName;
                        }

                        // Check URL parameter for layout name
                        const layoutName = urlParams.get('layoutName');
                        if (layoutName) {
                          return decodeURIComponent(layoutName);
                        }

                        // Fallback: show layout with update timestamp format
                        return `Layout ${layoutId.replace('layout_', '')} (Updated ${new Date().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        }).replace(/\//g, '/')} ${new Date().toLocaleTimeString('en-US', {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })})`;
                      } else {
                        // Creating new layout (no layoutId means "Add Master File" was clicked)
                        return 'creating new layout';
                      }
                    })()}
                  </span>

                  {/* Project Button */}
                  <button
                    onClick={() => {
                      if (projectSlug) {
                        navigate(`/projects/${projectSlug}`);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      background: '#f7fafc',
                      color: '#2d3748',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#edf2f7';
                      e.currentTarget.style.borderColor = '#2d3748';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f7fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    ← Project: {projectSlug}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              background: '#2d3748',
              color: 'white',
              padding: '12px 20px',
              borderBottom: '1px solid #4a5568'
            }}>
              {/* Master File Mode Header (original) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    🏷️ Care Label Designer - {selectedCustomer?.customerName || 'Loading Customer'}
                    <span style={{ color: '#90caf9', marginLeft: '10px', fontSize: '14px' }}>
                      v{packageJson.version}
                    </span>
                    {originalMasterFile && (
                      <span style={{ color: '#81c784', marginLeft: '10px' }}>
                        • Editing: {originalMasterFile.name}
                      </span>
                    )}
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#a0aec0' }}>
                  Contact: {selectedCustomer?.person || 'Loading'} • {selectedCustomer?.email || 'Loading'}
                  {originalMasterFile && (
                    <span style={{ marginLeft: '10px', color: '#90caf9' }}>
                      • Master File ID: {originalMasterFile.id}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content - Dynamic Canvas / Auto-hide Hierarchy Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        height: '100vh',
        marginRight: '0',
        transition: 'margin-right 0.3s ease'
      }}>
        {/* Canvas Area - Full width */}
        <div style={{
          width: '100%',
          background: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: 'none'
        }}>
          {data || isWebCreationMode ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Canvas Controls - Moved to top-left corner */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
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
                    v{packageJson.version} • API: {apiStatus}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <button onClick={handleZoomIn} style={buttonStyle}>+</button>
                  <button onClick={handleZoomOut} style={buttonStyle}>-</button>
                  <button onClick={handleZoomReset} style={buttonStyle}>1:1</button>
                  <button onClick={handleFitToScreen} style={buttonStyle}>Fit</button>
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


                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
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

                  <button
                    onClick={() => setShowOverflowNumbers(!showOverflowNumbers)}
                    style={{
                      ...buttonStyle,
                      background: showOverflowNumbers ? '#e3f2fd' : 'white',
                      color: showOverflowNumbers ? '#1976d2' : '#666',
                      fontSize: '10px',
                      padding: '4px 6px'
                    }}
                  >
                    🔢 Overflow #
                  </button>

                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    style={{
                      ...buttonStyle,
                      background: showPreview ? '#e3f2fd' : 'white',
                      color: showPreview ? '#1976d2' : '#666',
                      fontSize: '10px',
                      padding: '4px 6px'
                    }}
                    title="Toggle preview of input values in regions"
                  >
                    👁️ Preview
                  </button>

                  <button
                    onClick={() => setShowPartitionLines(!showPartitionLines)}
                    style={{
                      ...buttonStyle,
                      background: showPartitionLines ? '#e3f2fd' : 'white',
                      color: showPartitionLines ? '#1976d2' : '#666',
                      fontSize: '10px',
                      padding: '4px 6px'
                    }}
                    title="Toggle visibility of region and slice partition lines"
                  >
                    📐 Partition Line
                  </button>

                  <button
                    onClick={() => setShowSupportingLines(!showSupportingLines)}
                    style={{
                      ...buttonStyle,
                      background: showSupportingLines ? '#e3f2fd' : 'white',
                      color: showSupportingLines ? '#1976d2' : '#666',
                      fontSize: '10px',
                      padding: '4px 6px'
                    }}
                    title="Toggle visibility of supporting lines (margin, padding, mid-fold)"
                  >
                    ⋯ Supporting Line
                  </button>

                  <button
                    onClick={() => setShowPartitionNames(!showPartitionNames)}
                    style={{
                      ...buttonStyle,
                      background: showPartitionNames ? '#e3f2fd' : 'white',
                      color: showPartitionNames ? '#1976d2' : '#666',
                      fontSize: '10px',
                      padding: '4px 6px'
                    }}
                    title="Toggle visibility of partition names (R1, R2, S1, S2)"
                  >
                    🏷️ Partition Name
                  </button>

                  <button
                    onClick={() => setShowContentTypeNames(!showContentTypeNames)}
                    style={{
                      ...buttonStyle,
                      background: showContentTypeNames ? '#e3f2fd' : 'white',
                      color: showContentTypeNames ? '#1976d2' : '#666',
                      fontSize: '10px',
                      padding: '4px 6px'
                    }}
                    title="Toggle visibility of content type names (new-multiline-line, new-washing-care-symbol)"
                  >
                    📝 Content Type
                  </button>

                  <button
                    onClick={() => setShowSewingLines(!showSewingLines)}
                    style={{
                      ...buttonStyle,
                      background: showSewingLines ? '#fff3e0' : 'white',
                      color: showSewingLines ? '#ff5722' : '#666',
                      fontSize: '10px',
                      padding: '4px 6px'
                    }}
                    title="Toggle visibility of sewing lines (top, left, bottom, right) and mid-fold lines"
                  >
                    🧵 Sewing Line
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

                {/* Removed connection lines - now using overlay numbers inside regions */}


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

                {/* Project Button - Only show in project mode */}
                {context === 'projects' && projectSlug && (
                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => {
                        if (projectSlug) {
                          navigate(`/projects/${projectSlug}`);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: '#f7fafc',
                        color: '#2d3748',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#edf2f7';
                        e.currentTarget.style.borderColor = '#2d3748';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f7fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      ← Project: {projectSlug}
                    </button>
                  </div>
                )}
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

        {/* Hierarchy Panel - Auto-hide in project mode, fixed in other modes */}
        {(isWebCreationMode || context === 'projects') && (
          <div style={{
            position: isProjectMode ? 'fixed' : 'relative',
            top: isProjectMode ? '0' : 'auto',
            right: isProjectMode ? ((showHierarchyMenu || pinnedHierarchyMenu) ? '0' : '-100%') : 'auto',
            width: '300px',
            height: isProjectMode ? '100vh' : 'auto',
            background: 'white',
            padding: '20px',
            overflowY: 'auto',
            zIndex: isProjectMode ? 1001 : 'auto',
            transition: isProjectMode ? 'right 0.3s ease' : 'none',
            boxShadow: isProjectMode ? '-2px 0 10px rgba(0,0,0,0.1)' : 'none'
          }}
          onMouseEnter={handleHierarchyTriggerEnter}
          onMouseLeave={handleHierarchyLeave}
>
            {/* Disabled Overlay when dialogs are open - but not in master file mode */}
            {(showRegionDialog || showAddRegionDialog || isAnyDialogOpen) && !isMasterFileMode && (
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
                  {isAnyDialogOpen ? 'Menu Locked' : 'Hierarchy Locked'}
                  <span style={{ marginLeft: 8, fontSize: '11px', color: apiStatus === 'online' ? '#2f855a' : '#c53030', fontFamily: 'monospace' }}>
                    API: {apiStatus}
                  </span>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  textAlign: 'center'
                }}>
                  {isAnyDialogOpen ? 'Close content dialog to continue' : 'Close region dialog to continue'}
                </div>
              </div>
            )}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
            <h3 style={{margin: 0}}>
              {isMasterFileMode ? '📋 Master File Template' : isProjectMode ? '🏗️ Project Mode' : '📋 Layer Objects'}
            </h3>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Pin Button for Hierarchy Menu */}
              {isProjectMode && (
                <button
                  onClick={() => setPinnedHierarchyMenu(!pinnedHierarchyMenu)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    background: pinnedHierarchyMenu ? '#FF9800' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title={pinnedHierarchyMenu ? 'Unpin menu (will auto-hide)' : 'Pin menu (stays open)'}
                >
                  {pinnedHierarchyMenu ? '📌' : '📍'}
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
            {/* Fixed Draggable Header */}
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
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 10
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

            {/* Scrollable Dialog Content */}
            <div style={{
              padding: '30px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>

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

      {/* Region Edit Dialog - COMPLETELY REMOVED */}


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

                        if (spaceAnalysis.type === 'error') {
                          // Error case - silent operation, just uncheck
                          setUseWholeMother(false);
                          return;
                        } else if (spaceAnalysis.type === 'single' && spaceAnalysis.regions[0]) {
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
                          // Mid-fold line detected - silently create regions in non-full areas
                          // Store analysis for later use
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
                          // No available space or mid-fold with no viable regions - silent operation
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

      {/* Project Mode Tab - Always visible in project mode */}
      {isProjectMode && (
        <div
          style={{
            position: 'fixed',
            top: '45%',
            right: 0,
            width: '120px',
            height: 'auto',
            zIndex: 999,
            pointerEvents: 'auto'
          }}
          onMouseEnter={handleHierarchyTriggerEnter}
        >
          {/* Project Mode Tab */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '0',
              width: '110px',
              height: '80px',
              backgroundColor: '#2d3748',
              borderRadius: '8px 0 0 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '-4px 0 12px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              padding: '8px'
            }}
          >
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>📋</div>
            <div style={{ textAlign: 'center', lineHeight: '1.2', fontWeight: '500' }}>
              PROJECT MODE
            </div>
            <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
              ({(data?.objects || webCreationData?.objects || []).filter(obj => obj.type === 'mother').length} Mothers, {(data?.objects || webCreationData?.objects || []).length} Objects)
            </div>
          </div>
        </div>
      )}

      {/* Content Types Tab - Always visible in project mode */}
      {isProjectMode && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(45% + 100px)', // Position below Project Mode tab as a group
            right: 0,
            width: '120px',
            height: 'auto',
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
          onMouseEnter={handleMenuTriggerEnter}
        >
          {/* Content Types Tab */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '0',
              width: '110px',
              height: '80px',
              backgroundColor: '#4a5568',
              borderRadius: '8px 0 0 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '-4px 0 12px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              padding: '8px'
            }}
          >
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>📝</div>
            <div style={{ textAlign: 'center', lineHeight: '1.2', fontWeight: '500' }}>
              CONTENT TYPES
            </div>
            <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
              Drag to regions
            </div>
          </div>
        </div>
      )}

      {/* New CT Tab - Always visible in project mode */}
      {isProjectMode && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(45% + 200px)', // Position below Content Types tab
            right: 0,
            width: '120px',
            height: 'auto',
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
          onMouseEnter={handleNewCtTriggerEnter}
        >
          {/* New CT Tab */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '0',
              width: '110px',
              height: '80px',
              backgroundColor: '#6b46c1',
              borderRadius: '8px 0 0 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '-4px 0 12px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              padding: '8px'
            }}
          >
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>🆕</div>
            <div style={{ textAlign: 'center', lineHeight: '1.2', fontWeight: '500' }}>
              NEW CT
            </div>
            <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
              New content
            </div>
          </div>
        </div>
      )}

      {/* Content Menu - Auto-hide in project mode */}
      <ContentMenu
        isVisible={(showContentMenu || pinnedContentMenu) && isProjectMode}
        regionContents={regionContents}
        onEditContent={handleEditContent}
        onDeleteContent={handleDeleteContent}
        onMouseEnter={handleMenuTriggerEnter}
        onMouseLeave={handleMenuLeave}
        isPinned={pinnedContentMenu}
        onTogglePin={() => setPinnedContentMenu(!pinnedContentMenu)}
      />

      {/* New CT Menu - Auto-hide in project mode */}
      <NewCtMenu
        isVisible={(showNewCtMenu || pinnedNewCtMenu) && isProjectMode}
        onMouseEnter={handleNewCtTriggerEnter}
        onMouseLeave={handleNewCtLeave}
        isPinned={pinnedNewCtMenu}
        onTogglePin={() => setPinnedNewCtMenu(!pinnedNewCtMenu)}
      />

      {/* Region Occupation Dialog */}
      {/* <RegionOccupationDialog
        isOpen={regionOccupationDialog.isOpen}
        contentType={regionOccupationDialog.contentType}
        contentIcon={regionOccupationDialog.contentIcon}
        regionId={regionOccupationDialog.regionId}
        regionHeight={regionOccupationDialog.regionHeight}
        onConfirm={handleRegionOccupationConfirm}
        onCancel={handleRegionOccupationCancel}
      /> */}

      {/* Universal Content Dialog */}
      {universalDialog.contentType && (() => {
        // Find region data for validation
        const currentData = data || webCreationData;
        let regionWidth = 100;
        let regionHeight = 50;
        let currentRegionContents: any[] = [];

        if (currentData) {
          for (const obj of currentData.objects) {
            if (obj.type?.includes('mother')) {
              const regions = (obj as any).regions || [];
              const targetRegion = regions.find((r: any) => r.id === universalDialog.regionId);
              if (targetRegion) {
                regionWidth = targetRegion.width;
                regionHeight = targetRegion.height;
                break;
              }
            }
          }
        }

        currentRegionContents = regionContents.get(universalDialog.regionId) || [];

        return (
          <UniversalContentDialog
            isOpen={universalDialog.isOpen}
            contentType={universalDialog.contentType}
            regionId={universalDialog.regionId}
            regionWidth={regionWidth}
            regionHeight={regionHeight}
            regionContents={currentRegionContents}
            editingContent={universalDialog.editingContent} // Pass editing content
            // Overflow props
            isOverflowEnabled={isOverflowEnabled}
            getOverflowRole={getOverflowRole}
            onOverflowToggle={handleOverflowToggle}
            onGetMasterProperties={getMasterProperties}
            onRecalculateOverflow={recalculateOverflowChain}
            masterPropertiesVersion={masterPropertiesVersion}
            onSave={handleUniversalContentSave}
            onCancel={handleUniversalContentCancel}
          />
        );
      })()}

      {/* Preview Control Panel - Only show in project mode */}
      {/* <PreviewControlPanel
        isOpen={showPreviewPanel && isProjectMode}
        settings={previewSettings}
        onSettingsChange={setPreviewSettings}
        onClose={() => setShowPreviewPanel(false)}
        regionIds={(() => {
          const currentData = data || webCreationData;
          if (!currentData) return [];
          const regionIds: string[] = [];
          for (const obj of currentData.objects) {
            if (obj.type?.includes('mother')) {
              const regions = (obj as any).regions || [];
              regionIds.push(...regions.map((r: any) => r.id));
            }
          }
          return regionIds;
        })()}
      /> */}





      {/* Region Slice Dialog - Draggable */}
      {showSliceDialog && slicingRegion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000
        }}>
          <div style={{
            position: 'absolute',
            left: slicePopupPosition.x,
            top: slicePopupPosition.y,
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            minWidth: '600px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '15px',
              marginBottom: '20px'
            }}>
              {/* Draggable Header */}
              <div
                style={{
                  padding: '10px 15px',
                  background: '#f5f5f5',
                  borderBottom: '1px solid #ddd',
                  cursor: 'move',
                  userSelect: 'none'
                }}
                onMouseDown={handleSliceMouseDown}
              >
                <h2 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  ✂️ Slice Region: "{slicingRegion.name || 'Unnamed'}" ({slicingRegion.width}×{slicingRegion.height}mm)
                </h2>
              </div>

              <div style={{ padding: '15px' }}>
                {/* Minimum Size Input */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '15px',
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef'
                }}>
                  <label style={{
                    fontWeight: 'bold',
                    color: '#495057',
                    fontSize: '14px'
                  }}>
                    Minimum Region Size:
                  </label>
                  <input
                    type="number"
                    value={sliceMinSize}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= 0.1 && value <= 50) { // Reasonable range
                        setSliceMinSize(value);
                      }
                    }}
                    min="0.1"
                    max="50"
                    step="0.1"
                    style={{
                      width: '60px',
                      padding: '4px 8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      textAlign: 'center'
                    }}
                  />
                  <span style={{
                    color: '#6c757d',
                    fontSize: '14px'
                  }}>
                    mm
                  </span>
                  <span style={{
                    color: '#6c757d',
                    fontSize: '12px',
                    fontStyle: 'italic'
                  }}>
                    (Regions smaller than this will be skipped)
                  </span>
                </div>

                {/* Mode Tabs */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '15px'
              }}>
                <button
                  onClick={() => setSliceMode('visual')}
                  style={{
                    padding: '8px 16px',
                    border: sliceMode === 'visual' ? '2px solid #ff9800' : '2px solid #ddd',
                    borderRadius: '6px',
                    background: sliceMode === 'visual' ? '#fff3e0' : 'white',
                    color: sliceMode === 'visual' ? '#e65100' : '#666',
                    cursor: 'pointer',
                    fontWeight: sliceMode === 'visual' ? 'bold' : 'normal'
                  }}
                >
                  🎨 Visual Draw
                </button>
                <button
                  onClick={() => setSliceMode('mm')}
                  style={{
                    padding: '8px 16px',
                    border: sliceMode === 'mm' ? '2px solid #ff9800' : '2px solid #ddd',
                    borderRadius: '6px',
                    background: sliceMode === 'mm' ? '#fff3e0' : 'white',
                    color: sliceMode === 'mm' ? '#e65100' : '#666',
                    cursor: 'pointer',
                    fontWeight: sliceMode === 'mm' ? 'bold' : 'normal'
                  }}
                >
                  📏 MM Precision
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div style={{
              display: 'flex',
              gap: '20px',
              minHeight: '300px'
            }}>
              {/* Preview Area */}
              <div style={{
                flex: 1,
                border: '2px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                background: '#f9f9f9'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
                  Preview
                </h3>
                {/* A: Preview Area - MOTHER THUMBNAIL STYLE */}
                <div style={{
                  width: '100%',
                  height: '200px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: 'white',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Width dimension text - simple top */}
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    textAlign: 'center',
                    padding: '5px 0',
                    background: 'white',
                    flexShrink: 0
                  }}>
                    {slicingRegion.width}mm
                  </div>

                  {/* Canvas container - flex grow */}
                  <div style={{
                    flex: 1,
                    background: '#f9f9f9',
                    position: 'relative',
                    minHeight: 0,
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
                    {/* Height dimension text - simple left side */}
                    <div style={{
                      position: 'absolute',
                      left: '5px',
                      top: '50%',
                      transform: 'translateY(-50%) rotate(-90deg)',
                      fontSize: '10px',
                      color: '#666',
                      whiteSpace: 'nowrap'
                    }}>
                      {slicingRegion.height}mm
                    </div>

                    {/* Canvas SVG - mother thumbnail style */}
                    <svg
                      width="100%"
                      height="100%"
                      viewBox={`0 0 ${slicingRegion.width} ${slicingRegion.height}`}
                      preserveAspectRatio="xMidYMid meet"
                      style={{
                        background: '#f9f9f9',
                        display: 'block'
                      }}
                    >



                    {/* Horizontal cut lines */}
                    {sliceLines.horizontal.map((cut, index) => (
                      <line
                        key={`h-${index}`}
                        x1="0"
                        y1={cut}
                        x2={slicingRegion.width}
                        y2={cut}
                        stroke="#ff9800"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                      />
                    ))}

                    {/* Vertical cut lines */}
                    {sliceLines.vertical.map((cut, index) => (
                      <line
                        key={`v-${index}`}
                        x1={cut}
                        y1="0"
                        x2={cut}
                        y2={slicingRegion.height}
                        stroke="#ff9800"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                      />
                    ))}



                    {/* Preview of resulting regions */}
                    {(() => {
                      const hCuts = [0, ...sliceLines.horizontal.filter(cut => cut > 0 && cut < slicingRegion.height).sort((a, b) => a - b), slicingRegion.height];
                      const vCuts = [0, ...sliceLines.vertical.filter(cut => cut > 0 && cut < slicingRegion.width).sort((a, b) => a - b), slicingRegion.width];

                      const previewRegions = [];
                      let regionIndex = 0;

                      for (let i = 0; i < hCuts.length - 1; i++) {
                        for (let j = 0; j < vCuts.length - 1; j++) {
                          const width = vCuts[j + 1] - vCuts[j];
                          const height = hCuts[i + 1] - hCuts[i];

                          if (width >= 10 && height >= 10) {
                            previewRegions.push(
                              <g key={`preview-${regionIndex}`}>
                                <rect
                                  x={vCuts[j]}
                                  y={hCuts[i]}
                                  width={width}
                                  height={height}
                                  fill="rgba(255, 152, 0, 0.1)"
                                  stroke="#ff9800"
                                  strokeWidth="1"
                                />
                                <text
                                  x={vCuts[j] + width / 2}
                                  y={hCuts[i] + height / 2}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize="8"
                                  fill="#e65100"
                                  fontWeight="bold"
                                >
                                  {regionIndex + 1}
                                </text>
                              </g>
                            );
                            regionIndex++;
                          }
                        }
                      }

                      return previewRegions;
                    })()}
                    </svg>
                  </div>
                </div>
              </div>

              {/* Controls Area */}
              <div style={{
                width: '250px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                background: '#f9f9f9'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
                  {sliceMode === 'visual' ? 'Drawing Tools' : 'Measurements'}
                </h3>

                {sliceMode === 'visual' ? (
                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
                      Click and drag to draw slice lines on the preview area.
                    </p>
                    <button
                      onClick={() => setSliceLines({ horizontal: [], vertical: [] })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🗑️ Clear All Lines
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                        <span style={{ transform: 'rotate(-90deg)', display: 'inline-block' }}>✂️</span> Horizontal Cuts (from top):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 30,60,90"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                        onChange={(e) => {
                          const values = e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                          setSliceLines(prev => ({ ...prev, horizontal: values }));
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                        <span style={{ transform: 'rotate(0deg)', display: 'inline-block' }}>✂️</span> Vertical Cuts (from left):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 40,80"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                        onChange={(e) => {
                          const values = e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                          setSliceLines(prev => ({ ...prev, vertical: values }));
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Result Info */}
            <div style={{
              marginTop: '20px',
              padding: '10px',
              background: '#e3f2fd',
              borderRadius: '6px',
              fontSize: '12px'
            }}>
              {(() => {
                const hCuts = [0, ...sliceLines.horizontal.filter(cut => cut > 0 && cut < slicingRegion.height).sort((a, b) => a - b), slicingRegion.height];
                const vCuts = [0, ...sliceLines.vertical.filter(cut => cut > 0 && cut < slicingRegion.width).sort((a, b) => a - b), slicingRegion.width];

                let validRegions = 0;
                let invalidRegions = 0;

                for (let i = 0; i < hCuts.length - 1; i++) {
                  for (let j = 0; j < vCuts.length - 1; j++) {
                    const width = vCuts[j + 1] - vCuts[j];
                    const height = hCuts[i + 1] - hCuts[i];

                    if (width >= sliceMinSize && height >= sliceMinSize) {
                      validRegions++;
                    } else {
                      invalidRegions++;
                    }
                  }
                }

                return (
                  <div>
                    <div><strong>Result:</strong> Will create {validRegions} valid regions</div>
                    {invalidRegions > 0 && (
                      <div style={{ color: '#d32f2f', marginTop: '5px' }}>
                        ⚠️ {invalidRegions} regions will be skipped (smaller than {sliceMinSize}mm minimum)
                      </div>
                    )}
                    {validRegions === 0 && (
                      <div style={{ color: '#d32f2f', marginTop: '5px' }}>
                        ❌ No valid regions can be created with these cuts
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              marginTop: '20px'
            }}>
              <button
                onClick={() => {
                  setShowSliceDialog(false);
                  setSlicingRegion(null);
                  setHighlightedRegion(null);
                  setSliceLines({ horizontal: [], vertical: [] });
                }}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ❌ Cancel
              </button>
              <button
                onClick={() => {
                  setSliceLines({ horizontal: [], vertical: [] });
                }}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #ff9800',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#ff9800',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 Reset
              </button>
              <button
                onClick={() => {
                  console.log('🔪 Executing slice operation with lines:', sliceLines);

                  if (!slicingRegion) return;

                  // Determine if we're slicing a child region
                  const isChildSlice = !!slicingRegion.parentId;

                  // Perform the slice operation
                  const sliceResult = sliceRegion(slicingRegion, sliceLines.horizontal, sliceLines.vertical, isChildSlice);

                  if (isChildSlice) {
                    // Child slicing - replace the child with new slices at same level
                    if (!sliceResult.replacementRegions || sliceResult.replacementRegions.length === 0) {
                      alert(`❌ No valid regions could be created. Check that cuts create regions larger than ${sliceMinSize}mm.`);
                      return;
                    }

                    const currentData = data || webCreationData;
                    if (!currentData) return;

                    const updatedObjects = currentData.objects.map(obj => {
                      if (obj.type === 'mother') {
                        const motherRegions = (obj as any).regions || [];
                        const updatedRegions = motherRegions.map((region: Region) => {
                          if (region.id === slicingRegion.parentId && region.children) {
                            // Replace the sliced child with new slices
                            const updatedChildren = region.children.flatMap((child: Region) =>
                              child.id === slicingRegion.id ? sliceResult.replacementRegions! : [child]
                            );
                            return { ...region, children: updatedChildren };
                          }
                          return region;
                        });
                        return { ...obj, regions: updatedRegions };
                      }
                      return obj;
                    });

                    const updatedData = { ...currentData, objects: updatedObjects };
                    setData(updatedData);
                    setWebCreationData(updatedData);

                    // Clear content for the original slice
                    const updatedContents = new Map(regionContents);
                    updatedContents.delete(slicingRegion.id);
                    setRegionContents(updatedContents);

                    setNotification(`✂️ Slice "${slicingRegion.name}" replaced with ${sliceResult.replacementRegions.length} new slices`);
                  } else {
                    // Parent slicing - create hierarchical structure
                    if (!sliceResult.childRegions || sliceResult.childRegions.length === 0) {
                      alert(`❌ No valid regions could be created. Check that cuts create regions larger than ${sliceMinSize}mm.`);
                      return;
                    }

                    const currentData = data || webCreationData;
                    if (!currentData) return;

                    const updatedObjects = currentData.objects.map(obj => {
                      if (obj.type === 'mother') {
                        const motherRegions = (obj as any).regions || [];
                        const regionIndex = motherRegions.findIndex((r: Region) => r.id === slicingRegion.id);

                        if (regionIndex !== -1) {
                          const updatedRegions = [
                            ...motherRegions.slice(0, regionIndex),
                            sliceResult.parentRegion!, // Replace with parent that has children
                            ...motherRegions.slice(regionIndex + 1)
                          ];

                          return { ...obj, regions: updatedRegions };
                        }
                      }
                      return obj;
                    });

                    const updatedData = { ...currentData, objects: updatedObjects };
                    setData(updatedData);
                    setWebCreationData(updatedData);

                    // Clear content for the original region
                    const updatedContents = new Map(regionContents);
                    updatedContents.delete(slicingRegion.id);
                    setRegionContents(updatedContents);

                    setNotification(`✂️ Region "${slicingRegion.name}" sliced into ${sliceResult.childRegions.length} child regions`);
                  }

                  // Close the dialog
                  setShowSliceDialog(false);
                  setSlicingRegion(null);
                  setHighlightedRegion(null);
                  setSliceLines({ horizontal: [], vertical: [] });
                  setTimeout(() => setNotification(null), 3000);

                  console.log('✅ Slice operation completed successfully');
                }}
                disabled={sliceLines.horizontal.length === 0 && sliceLines.vertical.length === 0}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: (sliceLines.horizontal.length === 0 && sliceLines.vertical.length === 0) ? '#ccc' : '#ff9800',
                  color: 'white',
                  cursor: (sliceLines.horizontal.length === 0 && sliceLines.vertical.length === 0) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ✂️ Slice Region
              </button>
            </div>
              </div>
          </div>
        </div>
      )}

      {/* Custom Content Warning Dialog */}
      {contentWarningDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#f44336', // Red background
            color: '#ffeb3b', // Yellow text
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            border: '2px solid #ffeb3b'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#ffeb3b'
            }}>
              ⚠️ Content Replacement Warning
            </h3>

            <div style={{
              fontSize: '14px',
              lineHeight: '1.5',
              marginBottom: '25px',
              color: '#ffeb3b'
            }}>
              <p style={{ margin: '0 0 10px 0' }}>
                This <strong>{contentWarningDialog.areaType}</strong> already contains content:
              </p>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                📦 Current: {contentWarningDialog.existingContent}
              </p>
              <p style={{ margin: '0 0 15px 0', fontWeight: 'bold' }}>
                🆕 New: {contentWarningDialog.newContent}
              </p>
              <p style={{ margin: '0' }}>
                Do you want to replace the existing content?
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center'
            }}>
              <button
                onClick={contentWarningDialog.onConfirm}
                style={{
                  backgroundColor: '#ffeb3b',
                  color: '#f44336',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minWidth: '100px'
                }}
              >
                Replace
              </button>
              <button
                onClick={contentWarningDialog.onCancel}
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffeb3b',
                  border: '2px solid #ffeb3b',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minWidth: '100px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Line Text Configuration Dialog */}
      {newLineTextDialog && (
        <NewLineTextDialog
          isOpen={newLineTextDialog.isOpen}
          regionId={newLineTextDialog.regionId}
          regionWidth={newLineTextDialog.regionWidth}
          regionHeight={newLineTextDialog.regionHeight}
          editingContent={newLineTextDialog.editingContent}
          onSave={handleNewLineTextSave}
          onCancel={handleNewLineTextCancel}
        />
      )}

      {/* New Multi-line Configuration Dialog */}
      {newMultiLineDialog && (
        <NewMultiLineDialog
          isOpen={newMultiLineDialog.isOpen}
          regionId={newMultiLineDialog.regionId}
          regionWidth={newMultiLineDialog.regionWidth}
          regionHeight={newMultiLineDialog.regionHeight}
          editingContent={newMultiLineDialog.editingContent}
          onSave={handleNewMultiLineSave}
          onCancel={handleNewMultiLineCancel}
        />
      )}

      {/* New Washing Care Symbol Blank Dialog */}
      {newWashingCareSymbolDialog && (
        <NewWashingCareSymbolDialog
          isOpen={newWashingCareSymbolDialog.isOpen}
          regionId={newWashingCareSymbolDialog.regionId}
          regionWidth={newWashingCareSymbolDialog.regionWidth}
          regionHeight={newWashingCareSymbolDialog.regionHeight}
          editingContent={newWashingCareSymbolDialog.editingContent}
          onSave={handleNewWashingCareSymbolSave}
          onCancel={handleNewWashingCareSymbolCancel}
        />
      )}

      {/* New Washing Care Symbol Configuration Dialog */}
      {newWashingCareSymbolDialog && (
        <NewWashingCareSymbolDialog
          isOpen={newWashingCareSymbolDialog.isOpen}
          regionId={newWashingCareSymbolDialog.regionId}
          regionWidth={newWashingCareSymbolDialog.regionWidth}
          regionHeight={newWashingCareSymbolDialog.regionHeight}
          editingContent={newWashingCareSymbolDialog.editingContent}
          onSave={handleNewWashingCareSymbolSave}
          onCancel={handleNewWashingCareSymbolCancel}
        />
      )}

      {/* Version Footer */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: ((showContentMenu || pinnedContentMenu) || (showHierarchyMenu || pinnedHierarchyMenu) || (showNewCtMenu || pinnedNewCtMenu)) ? '320px' : '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 1000,
        transition: 'right 0.3s ease'
      }}>
        v{packageJson.version} | Port: {window.location.port || '80'} | {new Date().toLocaleString()}
      </div>
    </div>
  );
}

export default App;






