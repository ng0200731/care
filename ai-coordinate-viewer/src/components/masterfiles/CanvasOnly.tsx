import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import App from '../../App';

const CanvasOnly: React.FC = () => {
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Force web creation mode when this component mounts
    // This ensures the canvas is shown immediately without the Create Method interface

    // Set a flag in sessionStorage to indicate we're in canvas-only mode
    sessionStorage.setItem('forceWebCreationMode', 'true');

    // Check if there's a master file ID in the URL parameters
    const urlParams = new URLSearchParams(location.search);
    const masterFileId = urlParams.get('masterFileId');

    if (masterFileId) {
      // Store the master file ID so App.tsx can pick it up
      sessionStorage.setItem('editMasterFileId', masterFileId);
      console.log('🎨 CanvasOnly: Master file ID detected for editing:', masterFileId);
    }

    // Set ready state to trigger App re-render
    setIsReady(true);

    // Clean up when component unmounts
    return () => {
      sessionStorage.removeItem('forceWebCreationMode');
      sessionStorage.removeItem('editMasterFileId');
    };
  }, [location.search]);

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
