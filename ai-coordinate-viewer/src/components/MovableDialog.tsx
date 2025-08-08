import React, { useState, useRef, useEffect } from 'react';

interface MovableDialogProps {
  isOpen: boolean;
  title: string;
  icon: string;
  children: React.ReactNode;
  onClose?: () => void;
  width?: string;
  height?: string;
  storageKey?: string; // For remembering position
}

const MovableDialog: React.FC<MovableDialogProps> = ({
  isOpen,
  title,
  icon,
  children,
  onClose,
  width = '600px',
  height = 'auto',
  storageKey
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(() => {
    // Try to restore position from localStorage
    if (storageKey) {
      const saved = localStorage.getItem(`dialog-position-${storageKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved dialog position');
        }
      }
    }
    // Default centered position
    return {
      x: window.innerWidth / 2 - 300, // Assuming 600px width
      y: window.innerHeight / 2 - 200
    };
  });

  // Save position to localStorage when it changes
  useEffect(() => {
    if (storageKey && position) {
      localStorage.setItem(`dialog-position-${storageKey}`, JSON.stringify(position));
    }
  }, [position, storageKey]);

  // Handle mouse down on header (start dragging)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dialogRef.current) return;
    
    const rect = dialogRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    e.preventDefault();
  };

  // Handle mouse move (dragging)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep dialog within viewport bounds
      const maxX = window.innerWidth - 400; // Minimum 400px visible
      const maxY = window.innerHeight - 100; // Minimum 100px visible
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  return (
    <>
      {/* Left menu blocker only - 30% width to match hierarchy panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '30%',
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1600,
        pointerEvents: 'auto'
      }} />

      {/* Canvas area backdrop - allows interaction */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '30%',
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        zIndex: 1500,
        pointerEvents: 'none' // This is key - allows canvas interaction
      }} />

      {/* Movable Dialog */}
      <div
        ref={dialogRef}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width,
          height,
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Draggable Header */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            padding: '20px 30px 15px 30px',
            borderBottom: '1px solid #e2e8f0',
            cursor: isDragging ? 'grabbing' : 'grab',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#2d3748'
            }}>
              {title}
            </h2>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {/* Drag indicator */}
            <div style={{
              fontSize: '16px',
              color: '#718096',
              cursor: 'grab'
            }}>
              ⋮⋮
            </div>
            
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#718096',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f7fafc';
                  e.currentTarget.style.color = '#2d3748';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#718096';
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '20px 30px 30px 30px',
          overflowY: 'auto',
          flex: 1
        }}>
          {children}
        </div>
      </div>
    </>
  );
};

export default MovableDialog;
