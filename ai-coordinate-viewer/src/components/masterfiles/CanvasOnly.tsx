import React, { useEffect, useState } from 'react';
import App from '../../App';

const CanvasOnly: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Force web creation mode when this component mounts
    // This ensures the canvas is shown immediately without the Create Method interface

    // Set a flag in sessionStorage to indicate we're in canvas-only mode
    sessionStorage.setItem('forceWebCreationMode', 'true');

    // Set ready state to trigger App re-render
    setIsReady(true);

    // Clean up when component unmounts
    return () => {
      sessionStorage.removeItem('forceWebCreationMode');
    };
  }, []);

  // Don't render App until we've set the flag
  if (!isReady) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎨</div>
          <div>Loading Canvas...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%' }}>
      <App />
    </div>
  );
};

export default CanvasOnly;
