import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationButtonsProps {
  previousPagePath?: string;
  previousPageLabel?: string;
  showMasterFilesButton?: boolean;
  showPreviousButton?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  previousPagePath,
  previousPageLabel = "Previous Page",
  showMasterFilesButton = true,
  showPreviousButton = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in project context
  const urlParams = new URLSearchParams(location.search);
  const context = urlParams.get('context');
  const isProjectContext = context === 'projects';

  const handleBackToMasterFiles = () => {
    // If we're in project context, go to projects page
    if (isProjectContext) {
      navigate('/projects');
    } else if (previousPagePath === '/master-files-management') {
      navigate('/master-files-management');
    } else {
      navigate('/master-files');
    }
  };

  const handleBackToPrevious = () => {
    if (previousPagePath) {
      navigate(previousPagePath);
    } else {
      navigate(-1); // Go back one page in history
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      padding: '0 0px'
    }}>
      {showMasterFilesButton && (
        <button
          onClick={handleBackToMasterFiles}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#2d3748',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4a5568';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#2d3748';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isProjectContext ? '📋 Back to Projects' : '🏠 Back to Master Files'}
        </button>
      )}

      {showPreviousButton && (
        <button
          onClick={handleBackToPrevious}
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
          ← {previousPageLabel}
        </button>
      )}
    </div>
  );
};

export default NavigationButtons;
