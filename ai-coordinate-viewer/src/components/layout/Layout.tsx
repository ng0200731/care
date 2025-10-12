import React from 'react';
import { useLocation } from 'react-router-dom';
import MainNavigation from './MainNavigation';

// Import version from package.json
const packageJson = require('../../../package.json');

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // Check if we're in project context
  const urlParams = new URLSearchParams(location.search);
  const context = urlParams.get('context');
  const isLayout2 = urlParams.get('layout') === '2';
  const isProjectContext = context === 'projects';
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f7fa'
    }}>
      {/* Sidebar Navigation - Fixed */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: isLayout2 ? '280px' : '220px', // Reduced from 280px to 220px
        height: '100vh',
        zIndex: 10
      }}>
        <MainNavigation />
      </div>

      {/* Main Content Area */}
      <div style={{
        marginLeft: isLayout2 ? '280px' : '220px', // Reduced from 280px to 220px for more content space
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <header style={{
          background: '#f7fafc',
          padding: '20px 30px',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: 'none'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              margin: 0,
              color: '#2d3748',
              fontSize: '22px', // 24px -> 22px (-10%)
              fontWeight: '600'
            }}>
              Care Label Layout System{isProjectContext ? ' - Project' : ''}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{
                padding: '8px 16px',
                background: '#2d3748',
                color: 'white',
                fontSize: '13px', // 14px -> 13px (-10%)
                fontWeight: '500'
              }}>
                🟢 System Online
              </div>
              <div style={{
                padding: '8px 16px',
                background: 'white',
                color: '#4a5568',
                fontSize: '13px', // 14px -> 13px (-10%)
                border: '1px solid #e2e8f0'
              }}>
                {new Date().toLocaleDateString()}
              </div>
              <div style={{
                padding: '8px 16px',
                background: '#f7fafc',
                color: '#2d3748',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}>
                v{packageJson.version}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: '30px',
          overflow: 'auto',
          height: 'calc(100vh - 101px)' // Subtract header height to create scrollable container
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
