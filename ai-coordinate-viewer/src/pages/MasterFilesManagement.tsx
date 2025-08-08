// Master Files Management Page
// Level 1: Master File Management with real database integration

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MasterFileWithSummary, CreateMasterFileRequest } from '../types/database';
import { masterFileService } from '../services/masterFileService';
import { customerService, Customer } from '../services/customerService';

const MasterFilesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [masterFiles, setMasterFiles] = useState<MasterFileWithSummary[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [enlargedThumbnail, setEnlargedThumbnail] = useState<string | null>(null);

  // Backend API status for import feature
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/health');
        if (!cancelled) setApiStatus(res.ok ? 'online' : 'offline');
      } catch {
        if (!cancelled) setApiStatus('offline');
      }
    };
    ping();
    const t = setInterval(ping, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // Extract actual dimensions from design data
  const getActualDimensions = (designData: any): string => {
    if (!designData || !designData.objects || designData.objects.length === 0) {
      return "No Data";
    }

    // Find the largest object (usually the mother object)
    const objects = designData.objects;
    let largestObject = objects[0];
    let maxArea = largestObject.width * largestObject.height;

    objects.forEach((obj: any) => {
      const area = obj.width * obj.height;
      if (area > maxArea) {
        maxArea = area;
        largestObject = obj;
      }
    });

    return `${largestObject.width.toFixed(0)}×${largestObject.height.toFixed(0)}mm`;
  };

  // Generate large detailed thumbnail from design data
  const generateLargeThumbnailFromData = (designData: any, thumbnailSize: { width: number; height: number }): string => {
    if (!designData || !designData.objects || designData.objects.length === 0) {
      return `<svg width="${thumbnailSize.width}" height="${thumbnailSize.height}" viewBox="0 0 ${thumbnailSize.width} ${thumbnailSize.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f5f5f5"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#999" font-size="24">No Design Data</text>
      </svg>`;
    }

    const objects = designData.objects;

    // Calculate bounds from object coordinates
    const bounds = objects.reduce((acc: any, obj: any) => ({
      minX: Math.min(acc.minX, obj.x),
      minY: Math.min(acc.minY, obj.y),
      maxX: Math.max(acc.maxX, obj.x + obj.width),
      maxY: Math.max(acc.maxY, obj.y + obj.height)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    // Add generous padding for large view - more space for details
    const padding = 80;
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    const totalWidth = contentWidth + (padding * 2);
    const totalHeight = contentHeight + (padding * 2);

    // FORCE object to use exactly 80% of 1500×1000px canvas, then enlarge 1.5x
    const targetArea = {
      width: thumbnailSize.width * 0.8,   // 1200px target area
      height: thumbnailSize.height * 0.8  // 800px target area
    };

    // Calculate scale to make object fill 80% area, then multiply by 1.5
    const scaleX = targetArea.width / totalWidth;
    const scaleY = targetArea.height / totalHeight;
    const baseScale = Math.min(scaleX, scaleY); // Fit within 80% area, maintain proportions
    const scale = baseScale * 1.5; // Enlarge 1.5 times bigger

    // Calculate final dimensions and centering offset
    const finalWidth = totalWidth * scale;
    const finalHeight = totalHeight * scale;
    const offsetX = (thumbnailSize.width - finalWidth) / 2;
    const offsetY = (thumbnailSize.height - finalHeight) / 2;

    // Generate large detailed SVG
    let svgContent = `<svg width="${thumbnailSize.width}" height="${thumbnailSize.height}" viewBox="0 0 ${thumbnailSize.width} ${thumbnailSize.height}" xmlns="http://www.w3.org/2000/svg">`;

    // Define detailed filters
    svgContent += `<defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="3" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.2"/>
      </filter>
    </defs>`;

    // Clean white background
    svgContent += `<rect width="100%" height="100%" fill="white"/>`;

    // Create group with transform for scaling and positioning
    svgContent += `<g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">`;
    svgContent += `<g transform="translate(${-bounds.minX + padding}, ${-bounds.minY + padding})">`;

    // Render each object with full details
    objects.forEach((obj: any) => {
      const x = obj.x;
      const y = obj.y;
      const width = obj.width;
      const height = obj.height;

      // Determine object style based on type - THINNER lines for better detail
      let fillColor = 'none';
      let strokeColor = '#333';
      let strokeWidth = '1.5'; // Thinner for better detail visibility
      let strokeDasharray = 'none';

      if (obj.type === 'mother') {
        fillColor = '#f8f9fa';
        strokeColor = '#2196F3';
        strokeWidth = '1'; // Thin clean outline
      } else if (obj.type?.includes('son')) {
        fillColor = '#fff3e0';
        strokeColor = '#FF9800';
        strokeWidth = '1.5';
        strokeDasharray = '4,4';
      } else {
        fillColor = '#f5f5f5';
        strokeColor = '#666';
      }

      // Main object rectangle (outer border) with shadow
      svgContent += `<rect x="${x}" y="${y}" width="${width}" height="${height}"
        fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"
        stroke-dasharray="${strokeDasharray}" filter="url(#shadow)"/>`;

      // Add sewing line (inner dashed line) for mother objects
      if (obj.type === 'mother') {
        const sewingMargin = 3; // 3mm inside from edge
        svgContent += `<rect x="${x + sewingMargin}" y="${y + sewingMargin}"
          width="${width - (sewingMargin * 2)}" height="${height - (sewingMargin * 2)}"
          fill="none" stroke="#666" stroke-width="1" stroke-dasharray="2,2" opacity="0.7"/>`;
      }

      // NO fold line for clean design - removed unnecessary above sharp

      // Add margin details, sewing position, and mid-fold for mother objects
      if (obj.type === 'mother') {
        // Get margin data from object
        const margins = obj.margins || { top: 2, bottom: 2, left: 3, right: 3 };

        // Add margin detail labels (2mm, 3mm...) - reduced to 1/3 size
        const labelFontSize = Math.max(3, Math.min(4, 3.3 * scale));

        // Top margin label
        if (margins.top > 0) {
          svgContent += `<text x="${x + width/2}" y="${y - 5}"
            fill="#666" font-size="${labelFontSize}" text-anchor="middle" font-weight="bold">
            ${margins.top}mm</text>`;
        }

        // Bottom margin label
        if (margins.bottom > 0) {
          svgContent += `<text x="${x + width/2}" y="${y + height + 15}"
            fill="#666" font-size="${labelFontSize}" text-anchor="middle" font-weight="bold">
            ${margins.bottom}mm</text>`;
        }

        // Left margin label
        if (margins.left > 0) {
          svgContent += `<text x="${x - 15}" y="${y + height/2}"
            fill="#666" font-size="${labelFontSize}" text-anchor="middle" font-weight="bold"
            transform="rotate(-90, ${x - 15}, ${y + height/2})">
            ${margins.left}mm</text>`;
        }

        // Right margin label
        if (margins.right > 0) {
          svgContent += `<text x="${x + width + 15}" y="${y + height/2}"
            fill="#666" font-size="${labelFontSize}" text-anchor="middle" font-weight="bold"
            transform="rotate(90, ${x + width + 15}, ${y + height/2})">
            ${margins.right}mm</text>`;
        }

        // Add sewing position if exists (but not if mid-fold line is enabled)
        if (obj.sewingPosition && obj.sewingPosition !== 'none' && !(obj.midFoldLine && obj.midFoldLine.enabled)) {
          const sewingOffset = obj.sewingOffset || 0;

          if (obj.sewingPosition === 'top') {
            const sewingY = y + sewingOffset;
            svgContent += `<line x1="${x}" y1="${sewingY}" x2="${x + width}" y2="${sewingY}"
              stroke="#d32f2f" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.9"/>`;
            svgContent += `<text x="${x + width + 5}" y="${sewingY}"
              fill="#d32f2f" font-size="${labelFontSize}" font-weight="bold" text-anchor="start">
              ${sewingOffset}mm</text>`;
          } else if (obj.sewingPosition === 'bottom') {
            const sewingY = y + height - sewingOffset;
            svgContent += `<line x1="${x}" y1="${sewingY}" x2="${x + width}" y2="${sewingY}"
              stroke="#d32f2f" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.9"/>`;
            svgContent += `<text x="${x + width + 5}" y="${sewingY}"
              fill="#d32f2f" font-size="${labelFontSize}" font-weight="bold" text-anchor="start">
              ${sewingOffset}mm</text>`;
          } else if (obj.sewingPosition === 'left') {
            const sewingX = x + sewingOffset;
            svgContent += `<line x1="${sewingX}" y1="${y}" x2="${sewingX}" y2="${y + height}"
              stroke="#d32f2f" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.9"/>`;
            svgContent += `<text x="${sewingX}" y="${y - 5}"
              fill="#d32f2f" font-size="${labelFontSize}" font-weight="bold" text-anchor="middle">
              ${sewingOffset}mm</text>`;
          } else if (obj.sewingPosition === 'right') {
            const sewingX = x + width - sewingOffset;
            svgContent += `<line x1="${sewingX}" y1="${y}" x2="${sewingX}" y2="${y + height}"
              stroke="#d32f2f" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.9"/>`;
            svgContent += `<text x="${sewingX}" y="${y - 5}"
              fill="#d32f2f" font-size="${labelFontSize}" font-weight="bold" text-anchor="middle">
              ${sewingOffset}mm</text>`;
          }
        }

        // Enhanced Mid-Fold Line Rendering (moved outside sewing condition)
        if (obj.midFoldLine && obj.midFoldLine.enabled) {
          const midFold = obj.midFoldLine;
          const padding = midFold.padding || 3;

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
              stroke="#d32f2f" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.9"/>`;

            // Add label
            svgContent += `<text x="${x + width + 5}" y="${lineY}"
              fill="#d32f2f" font-size="${labelFontSize}" font-weight="bold" text-anchor="start">
              Mid-Fold (${midFold.direction})</text>`;

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
              stroke="#d32f2f" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.9"/>`;

            // Add label
            svgContent += `<text x="${lineX + 5}" y="${y - 5}"
              fill="#d32f2f" font-size="${labelFontSize}" font-weight="bold" text-anchor="start">
              Mid-Fold (${midFold.direction})</text>`;
          }
        }

        // Render Regions
        if (obj.regions && obj.regions.length > 0) {
          obj.regions.forEach((region: any) => {
            // Region rectangle (no border, just fill)
            svgContent += `<rect x="${x + region.x}" y="${y + region.y}"
              width="${region.width}" height="${region.height}"
              fill="${region.backgroundColor || '#e3f2fd'}"
              stroke="none" opacity="0.7"/>`;

            // Region label
            svgContent += `<text x="${x + region.x + region.width/2}" y="${y + region.y + 8}"
              fill="${region.borderColor || '#2196f3'}" font-size="${labelFontSize}"
              font-weight="bold" text-anchor="middle">
              ${region.name}</text>`;

            // Region dimensions
            svgContent += `<text x="${x + region.x + region.width/2}" y="${y + region.y + region.height - 3}"
              fill="${region.borderColor || '#2196f3'}" font-size="${labelFontSize * 0.8}"
              text-anchor="middle" opacity="0.8">
              ${region.width}×${region.height}mm</text>`;
          });
        }
      }

      // Mid-Fold line (independent of sewingPosition) + fallback for legacy 'mid-fold' sewingPosition
      const mf = (obj as any).midFoldLine;
      if (mf && mf.enabled) {
        const midFoldLabelSize = Math.max(3, Math.min(4, 3.3 * scale));
        if (mf.type === 'horizontal') {
          let lineY = mf.position?.useDefault ? (y + height / 2) : (mf.direction === 'top' ? y + (mf.position?.customDistance || 0) : y + height - (mf.position?.customDistance || 0));
          svgContent += `<line x1="${x}" y1="${lineY}" x2="${x + width}" y2="${lineY}"
            stroke="#d32f2f" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.9"/>`;
          svgContent += `<text x="${x + width + 5}" y="${lineY}"
            fill="#d32f2f" font-size="${midFoldLabelSize}" font-weight="bold" text-anchor="start">Mid-Fold (${mf.direction})</text>`;
        } else if (mf.type === 'vertical') {
          let lineX = mf.position?.useDefault ? (x + width / 2) : (mf.direction === 'left' ? x + (mf.position?.customDistance || 0) : x + width - (mf.position?.customDistance || 0));
          svgContent += `<line x1="${lineX}" y1="${y}" x2="${lineX}" y2="${y + height}"
            stroke="#d32f2f" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.9"/>`;
          svgContent += `<text x="${lineX + 5}" y="${y - 5}"
            fill="#d32f2f" font-size="${midFoldLabelSize}" font-weight="bold" text-anchor="start">Mid-Fold (${mf.direction})</text>`;
        }
      } else if ((obj as any).sewingPosition === 'mid-fold') {
        // Legacy support: treat as centered horizontal mid-fold
        const midFoldLabelSize = Math.max(3, Math.min(4, 3.3 * scale));
        const lineY = y + height / 2;
        svgContent += `<line x1="${x}" y1="${lineY}" x2="${x + width}" y2="${lineY}"
          stroke="#d32f2f" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.9"/>`;
        svgContent += `<text x="${x + width + 5}" y="${lineY}"
          fill="#d32f2f" font-size="${midFoldLabelSize}" font-weight="bold" text-anchor="start">Mid-Fold</text>`;
      }

      // Render regions (top/bottom etc.) inside mother objects
      const regions = Array.isArray((obj as any).regions) ? (obj as any).regions : [];
      regions.forEach((r: any) => {
        const rx = x + (r.x || 0);
        const ry = y + (r.y || 0);
        const rw = r.width || 0;
        const rh = r.height || 0;
        const bg = r.backgroundColor || 'rgba(76, 175, 80, 0.08)';
        const border = r.borderColor || '#4CAF50';
        svgContent += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}"
          fill="${bg}" stroke="${border}" stroke-width="0.5" stroke-dasharray="1,2" opacity="0.9"/>`;
        // Optional region name label
        if (r.name) {
          const rLabelSize = Math.max(3, Math.min(4, 3.2 * scale));
          svgContent += `<text x="${rx + rw / 2}" y="${ry + 12}" fill="#4CAF50" font-size="${rLabelSize}" font-weight="bold" text-anchor="middle">${r.name}</text>`;
        }
      });

      // Add ONLY dimensions - NO object names, NO margin labels - reduced to 1/3 size
      const dimFontSize = Math.max(4, Math.min(5.3, 4.7 * scale));
      svgContent += `<text x="${x + width/2}" y="${y + height + dimFontSize + 10}"
        text-anchor="middle" font-size="${dimFontSize}" fill="#333" font-weight="bold">
        ${width.toFixed(0)}×${height.toFixed(0)}mm
      </text>`;
    });

    svgContent += `</g></g>`;

    // Professional layout boundary - clean and minimal
    const layoutMargin = 10; // Clean professional margin
    svgContent += `<rect x="${offsetX - layoutMargin}" y="${offsetY - layoutMargin}"
      width="${finalWidth + (layoutMargin * 2)}" height="${finalHeight + (layoutMargin * 2)}"
      fill="none" stroke="#2196F3" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.7"/>`;

    // Clean layout corner markers
    const cornerSize = 4;
    const corners = [
      [offsetX - layoutMargin, offsetY - layoutMargin], // Top-left
      [offsetX + finalWidth + layoutMargin - cornerSize, offsetY - layoutMargin], // Top-right
      [offsetX - layoutMargin, offsetY + finalHeight + layoutMargin - cornerSize], // Bottom-left
      [offsetX + finalWidth + layoutMargin - cornerSize, offsetY + finalHeight + layoutMargin - cornerSize] // Bottom-right
    ];
    corners.forEach(([cx, cy]) => {
      svgContent += `<rect x="${cx}" y="${cy}" width="${cornerSize}" height="${cornerSize}"
        fill="#2196F3" opacity="0.7"/>`;
    });

    // Add canvas border (thin border around entire thumbnail)
    svgContent += `<rect x="4" y="4" width="${thumbnailSize.width - 8}" height="${thumbnailSize.height - 8}"
      fill="none" stroke="#2196F3" stroke-width="4"/>`;

    svgContent += `</svg>`;

    return svgContent;
  };

  // Create form state
  const [createForm, setCreateForm] = useState<CreateMasterFileRequest>({
    name: '',
    width: 200,
    height: 150,
    customerId: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load customers
      const customersResult = await customerService.getAllCustomers();
      setCustomers(customersResult);

      // Load master files
      const filters = {
        search: searchTerm || undefined,
        customerId: selectedCustomer || undefined
      };
      const masterFilesResult = await masterFileService.getAllMasterFiles(filters);
      if (masterFilesResult.success) {
        setMasterFiles(masterFilesResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMasterFile = async () => {
    if (!createForm.name || !createForm.customerId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const result = await masterFileService.createMasterFile(createForm);
      if (result.success) {
        setShowCreateForm(false);
        setCreateForm({
          name: '',
          width: 200,
          height: 150,
          customerId: '',
          description: ''
        });
        loadData(); // Reload the list
        alert('Master file created successfully!');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating master file:', error);
      alert('Failed to create master file');
    }
  };

  const handleDeleteMasterFile = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete all associated templates and son objects.`)) {
      try {
        const result = await masterFileService.deleteMasterFile(id);
        if (result.success) {
          loadData(); // Reload the list
          console.log('Master file deleted successfully:', name);
        } else {
          console.error(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting master file:', error);
      }
    }
  };

  const handleSelectMasterFile = (masterFile: MasterFileWithSummary) => {
    // Navigate to template management for this master file
    navigate(`/master-files/${masterFile.id}/templates`);
  };

  const handleEditMasterFile = (masterFile: MasterFileWithSummary) => {
    // Show loading overlay and prevent clicks
    setNavigating(true);
    // Navigate to create_zero with master file ID for editing
    navigate(`/create_zero?masterFileId=${masterFile.id}`);
  };

  const filteredMasterFiles = masterFiles.filter(mf =>
    (!searchTerm || mf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (mf.description && mf.description.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (!selectedCustomer || mf.customerId === selectedCustomer)
  );

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}>
        {/* Loading Spinner */}
        <div style={{
          width: '60px',
          height: '60px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #2196F3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '30px'
        }}></div>

        {/* Loading Text */}
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '15px'
        }}>
          Loading Master Files...
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: '16px',
          color: '#666'
        }}>
          Please wait while we fetch your care label layouts
        </div>

        {/* CSS Animation */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      pointerEvents: navigating ? 'none' : 'auto',
      opacity: navigating ? 0.7 : 1,
      transition: 'opacity 0.3s ease'
    }}>
      {/* Navigation Loading Overlay */}
      {navigating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.97)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10001,
          pointerEvents: 'all'
        }}>
          {/* Loading Spinner */}
          <div style={{
            width: '70px',
            height: '70px',
            border: '6px solid #f3f3f3',
            borderTop: '6px solid #28a745',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '30px'
          }}></div>

          {/* Loading Text */}
          <div style={{
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '15px'
          }}>
            Opening Editor...
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: '18px',
            color: '#666'
          }}>
            Loading your care label design for editing
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

      {/* Back to Master Files Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/master-files')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4a5568',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2d3748';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4a5568';
          }}
        >
          ← Back to Master Files
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '36px', fontWeight: 'bold', opacity: '0.9' }}>
          📁 Master Files Management
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
          Create and manage master files for your care label layouts
        </p>
      </div>

      {/* Actions Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1 }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search master files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '200px'
            }}
          />

          {/* Customer Filter */}
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="">All Customers</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.customerName}
              </option>
            ))}
          </select>

          {/* Import from Browser Storage (to SQL) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={async () => {
                if (apiStatus !== 'online') {
                  alert('Backend API is offline. Start the server on port 3001 to import.');
                  return;
                }
                try {
                  const raw = localStorage.getItem('care_label_db_master_files');
                  if (!raw) {
                    alert('No browser-stored master files found to import.');
                    return;
                  }
                  const list = JSON.parse(raw);
                  let imported = 0, skipped = 0, failed = 0;
                  for (const mf of list) {
                    try {
                      // Check if exists by name via existing list (best-effort)
                      const exists = masterFiles.some(x => x.name.toLowerCase() === mf.name.toLowerCase());
                      if (exists) { skipped++; continue; }
                      const body = {
                        name: mf.name,
                        description: mf.description || '',
                        width: mf.width || 200,
                        height: mf.height || 150,
                        customerId: mf.customerId || 'default',
                        canvasImage: mf.canvasImage || null,
                        designData: mf.designData || (mf.data ? (typeof mf.data === 'string' ? JSON.parse(mf.data).designData : mf.data.designData) : null)
                      } as any;
                      const resp = await fetch('http://localhost:3001/api/master-files', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
                      });
                      if (resp.ok) imported++; else failed++;
                    } catch {
                      failed++;
                    }
                  }
                  alert(`Import complete. Imported: ${imported}, Skipped: ${skipped}, Failed: ${failed}`);
                  await loadData();
                } catch (e) {
                  console.error(e);
                  alert('Import failed. See console for details.');
                }
              }}
              disabled={apiStatus !== 'online'}
              title={apiStatus !== 'online' ? 'Backend offline' : 'Import master files from browser storage into SQL'}
              style={{
                padding: '8px 12px',
                backgroundColor: apiStatus === 'online' ? '#2f855a' : '#a0aec0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: apiStatus === 'online' ? 'pointer' : 'not-allowed',
                fontSize: '14px'
              }}
            >
              ⬆️ Import from Browser Storage
            </button>
            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: apiStatus === 'online' ? '#2f855a' : '#c53030' }}>
              API: {apiStatus}
            </span>
          </div>


          {/* Search Button */}
          <button
            onClick={loadData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔍 Search
          </button>
        </div>


      </div>

      {/* Master Files Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {filteredMasterFiles.map(masterFile => (
          <div
            key={masterFile.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'default',
              transition: 'all 0.2s ease'
            }}
            // Clicking the card no longer navigates
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onMouseEnter={(e) => {
              // Disable hover float-up effect per request
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Canvas Image Preview */}
            {(masterFile as any).canvasImage && (
              <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                <div
                  style={{
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#fafafa',
                    minHeight: '120px',
                    maxHeight: '180px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent parent card click
                    console.log('🔍 Thumbnail clicked, generating large view');
                    // Generate large detailed thumbnail (MUCH bigger - 5x size with all details)
                    const largeThumbnail = generateLargeThumbnailFromData(
                      (masterFile as any).designData,
                      { width: 1500, height: 1000 }
                    );
                    setEnlargedThumbnail(largeThumbnail);
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#4CAF50';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(76, 175, 80, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                    // Make zoom icon more prominent on hover
                    const zoomIcon = e.currentTarget.querySelector('div[style*="position: absolute"]') as HTMLElement;
                    if (zoomIcon) {
                      zoomIcon.style.opacity = '1';
                      zoomIcon.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                    // Reset zoom icon
                    const zoomIcon = e.currentTarget.querySelector('div[style*="position: absolute"]') as HTMLElement;
                    if (zoomIcon) {
                      zoomIcon.style.opacity = '0.9';
                      zoomIcon.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {/* Zoom indicator */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(33, 150, 243, 0.9)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    opacity: 0.9,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    🔍
                  </div>
                  {/* Handle both data URLs and raw SVG strings */}
                  {(masterFile as any).canvasImage.startsWith('data:') ? (
                    <img
                      src={(masterFile as any).canvasImage}
                      alt="Canvas preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <div
                      // Render small preview from design data to keep styling consistent (regions + mid-fold)
                      dangerouslySetInnerHTML={{ __html: generateLargeThumbnailFromData((masterFile as any).designData, { width: 300, height: 200 }) }}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    />
                  )}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '8px',
                  fontWeight: '500',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🎨 Clean Layout Preview
                    {(masterFile as any).canvasImage.startsWith('data:image/png') && (
                      <span style={{
                        color: '#2196F3',
                        fontSize: '10px',
                        background: '#e3f2fd',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>PNG</span>
                    )}
                    {(masterFile as any).canvasImage.startsWith('<svg') && (
                      <span style={{
                        color: '#4CAF50',
                        fontSize: '10px',
                        background: '#e8f5e8',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>SVG</span>
                    )}
                  </div>

                  {/* Show actual dimensions from design data */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#333',
                    background: '#f0f0f0',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: '1px solid #ddd'
                  }}>
                    📐 {getActualDimensions((masterFile as any).designData)}
                  </div>
                </div>
              </div>
            )}

            {/* Master File Header */}
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
                📄 {masterFile.name}
              </h3>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Customer: {customers.find(c => c.id === masterFile.customerId)?.customerName || 'Default Customer'}
              </div>
            </div>

            {/* Dimensions */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                📐 Dimensions
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {getActualDimensions((masterFile as any).designData)}
              </div>
            </div>

            {/* Templates Info */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                📋 Templates
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {masterFile.templateCount} template{masterFile.templateCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Design Data Info */}
            {(masterFile as any).designData && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  🎨 Design Objects
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {(masterFile as any).designData.objects?.length || 0} objects
                  {(masterFile as any).designData.metadata?.createdInWebMode && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      borderRadius: '3px',
                      fontSize: '11px'
                    }}>
                      WEB CREATED
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {masterFile.description && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  📝 Description
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {masterFile.description}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', color: '#999' }}>
                Created: {masterFile.createdAt.toLocaleDateString()}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                Updated: {masterFile.updatedAt.toLocaleDateString()}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditMasterFile(masterFile);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectMasterFile(masterFile);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🎨 Manage Templates
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMasterFile(masterFile.id, masterFile.name);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMasterFiles.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📁</div>
          <h3>No Master Files Found</h3>
          <p>Create your first master file to get started with care label layouts.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            ➕ Create Master File
          </button>
        </div>
      )}

      {/* Create Master File Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0' }}>Create New Master File</h2>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Master File Name *
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter master file name"
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Width (mm) *
                </label>
                <input
                  type="number"
                  value={createForm.width}
                  onChange={(e) => setCreateForm({...createForm, width: parseFloat(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  min="1"
                  step="0.1"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Height (mm) *
                </label>
                <input
                  type="number"
                  value={createForm.height}
                  onChange={(e) => setCreateForm({...createForm, height: parseFloat(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  min="1"
                  step="0.1"
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Customer *
              </label>
              <select
                value={createForm.customerId}
                onChange={(e) => setCreateForm({...createForm, customerId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Optional description"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMasterFile}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Create Master File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Thumbnail Modal */}
      {enlargedThumbnail && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setEnlargedThumbnail(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setEnlargedThumbnail(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
              }}
            >
              ✕
            </button>

            {/* Enlarged thumbnail */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>🔍 Large Detailed Layout Preview (5x Size)</h3>

              <div style={{
                border: '3px solid #2196F3',
                borderRadius: '12px',
                padding: '40px',
                backgroundColor: '#fafafa',
                maxWidth: '1600px',
                maxHeight: '1100px',
                overflow: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {enlargedThumbnail.startsWith('data:') ? (
                  <img
                    src={enlargedThumbnail}
                    alt="Enlarged layout preview"
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{ __html: enlargedThumbnail }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  />
                )}
              </div>

              <div style={{
                fontSize: '14px',
                color: '#666',
                textAlign: 'center',
                maxWidth: '600px',
                lineHeight: '1.4'
              }}>
                <strong>Large Technical View (1500×1000px)</strong><br/>
                Clean professional layout showing:<br/>
                • <span style={{color: '#2196F3'}}>Outermost outline</span> (blue rectangles)<br/>
                • <span style={{color: '#2196F3'}}>Folder lines</span> (simple rectangles)<br/>
                • <span style={{color: '#4CAF50'}}>Margins</span> (green dashed lines)<br/>
                • <span style={{color: '#333'}}>Dimensions</span> (width×height in mm)<br/>
                <em>Click outside or the ✕ button to close.</em>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterFilesManagement;
