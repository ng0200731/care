import React from 'react';

interface NewCtMenuProps {
  isVisible: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

const NewCtMenu: React.FC<NewCtMenuProps> = ({
  isVisible,
  onMouseEnter,
  onMouseLeave,
  isPinned = false,
  onTogglePin
}) => {
  // Drag handlers for Line Text
  const handleLineTextDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    const newLineTextContentType = {
      id: 'new-line-text',
      name: 'Line Text',
      icon: '📝',
      description: 'New style line text content',
      isNewCt: true // Flag to identify this as new CT content
    };

    console.log('🚀 NEW CT DRAG START:', newLineTextContentType.name, 'ID:', newLineTextContentType.id);
    e.dataTransfer.setData('application/json', JSON.stringify(newLineTextContentType));
    e.dataTransfer.effectAllowed = 'copy';

    // Add visual feedback
    e.currentTarget.style.opacity = '0.5';
  };

  // Drag handlers for Multi-line
  const handleMultiLineDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    const multiLineContentType = {
      id: 'new-multi-line',
      name: 'Multi Line',
      icon: '📄',
      description: 'New style multi-line text content',
      isNewCt: true // Flag to identify this as new CT content
    };

    console.log('🚀 NEW CT DRAG START:', multiLineContentType.name, 'ID:', multiLineContentType.id);
    e.dataTransfer.setData('application/json', JSON.stringify(multiLineContentType));
    e.dataTransfer.effectAllowed = 'copy';

    // Add visual feedback
    e.currentTarget.style.opacity = '0.5';
  };

  // Drag handlers for Washing Care Symbol
  const handleWashingCareSymbolDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    const washingCareSymbolContentType = {
      id: 'new-washing-care-symbol',
      name: 'Washing Care Symbol',
      icon: '🧺',
      description: 'New style washing care symbol content',
      isNewCt: true // Flag to identify this as new CT content
    };

    console.log('🚀 NEW CT DRAG START:', washingCareSymbolContentType.name, 'ID:', washingCareSymbolContentType.id);
    e.dataTransfer.setData('application/json', JSON.stringify(washingCareSymbolContentType));
    e.dataTransfer.effectAllowed = 'copy';

    // Add visual feedback
    e.currentTarget.style.opacity = '0.5';
  };

  // Drag handlers for Comp Trans
  const handleCompTransDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    const compTransContentType = {
      id: 'new-comp-trans',
      name: 'Comp Trans',
      icon: '🌐',
      description: 'New style composition translation content',
      isNewCt: true // Flag to identify this as new CT content
    };

    console.log('🚀 NEW CT DRAG START:', compTransContentType.name, 'ID:', compTransContentType.id);
    e.dataTransfer.setData('application/json', JSON.stringify(compTransContentType));
    e.dataTransfer.effectAllowed = 'copy';

    // Add visual feedback
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLButtonElement>) => {
    // Reset visual feedback
    e.currentTarget.style.opacity = '1';
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        width: '300px',
        height: '100vh',
        backgroundColor: '#6b46c1', // Same purple background as the tab
        borderLeft: '1px solid #553c9a',
        padding: '20px',
        boxSizing: 'border-box',
        position: 'fixed',
        right: isVisible ? 0 : '-300px', // Slide animation
        top: 0,
        zIndex: 1000,
        overflowY: 'auto',
        overflowX: 'visible',
        transition: 'right 0.3s ease-in-out' // Smooth slide animation
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Line Text Button - Draggable */}
      <button
        draggable
        onDragStart={handleLineTextDragStart}
        onDragEnd={handleDragEnd}
        style={{
          width: '100%',
          padding: '15px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'grab',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          userSelect: 'none',
          marginBottom: '12px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.cursor = 'grabbing';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.cursor = 'grab';
        }}
        onClick={() => {
          console.log('Line Text button clicked');
          // Add functionality here later
        }}
      >
        <span style={{ fontSize: '18px' }}>📝</span>
        Line Text
      </button>

      {/* Multi-line Button - Draggable */}
      <button
        draggable
        onDragStart={handleMultiLineDragStart}
        onDragEnd={handleDragEnd}
        style={{
          width: '100%',
          padding: '15px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'grab',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.cursor = 'grabbing';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.cursor = 'grab';
        }}
        onClick={() => {
          console.log('Multi-line button clicked');
          // Add functionality here later
        }}
      >
        <span style={{ fontSize: '18px' }}>📄</span>
        Multi-line
      </button>

      {/* Washing Care Symbol Button - Draggable */}
      <button
        draggable
        onDragStart={handleWashingCareSymbolDragStart}
        onDragEnd={handleDragEnd}
        style={{
          width: '100%',
          padding: '15px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'grab',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          userSelect: 'none',
          marginTop: '12px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.cursor = 'grabbing';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.cursor = 'grab';
        }}
        onClick={() => {
          console.log('Washing Care Symbol button clicked');
          // Add functionality here later
        }}
      >
        <span style={{ fontSize: '18px' }}>🧺</span>
        Washing Care Symbol
      </button>

      {/* Comp Trans Button - Draggable */}
      <button
        draggable
        onDragStart={handleCompTransDragStart}
        onDragEnd={handleDragEnd}
        style={{
          width: '100%',
          padding: '15px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'grab',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          userSelect: 'none',
          marginTop: '12px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.cursor = 'grabbing';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.cursor = 'grab';
        }}
        onClick={() => {
          console.log('Comp Trans button clicked');
          // Add functionality here later
        }}
      >
        <span style={{ fontSize: '18px' }}>🌐</span>
        Comp Trans
      </button>
    </div>
  );
};

export default NewCtMenu;
