import React from 'react';
import MainNavigation from './MainNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
        width: '280px',
        height: '100vh',
        zIndex: 10
      }}>
        <MainNavigation />
      </div>

      {/* Main Content Area */}
      <div style={{
        marginLeft: '280px', // Now matches menu width exactly with border-box
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
              Care Label Layout System
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
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: '30px',
          overflow: 'auto'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
