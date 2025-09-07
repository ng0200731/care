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
        padding: '0',
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
      {/* Empty content - just the purple background */}
    </div>
  );
};

export default NewCtMenu;
