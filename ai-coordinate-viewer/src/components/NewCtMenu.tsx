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
      {/* Line Text Button */}
      <button
        style={{
          width: '100%',
          padding: '15px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
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
        onClick={() => {
          console.log('Line Text button clicked');
          // Add functionality here later
        }}
      >
        <span style={{ fontSize: '18px' }}>📝</span>
        Line Text
      </button>
    </div>
  );
};

export default NewCtMenu;
