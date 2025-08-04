import React from 'react';
import MainNavigation from './MainNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f5f7fa'
    }}>
      {/* Sidebar Navigation */}
      <MainNavigation />
      
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <header style={{
          background: 'white',
          padding: '20px 30px',
          borderBottom: '1px solid #e1e5e9',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              margin: 0,
              color: '#2d3748',
              fontSize: '24px',
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
                background: '#e6fffa',
                color: '#234e52',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                🟢 System Online
              </div>
              <div style={{
                padding: '8px 16px',
                background: '#f7fafc',
                color: '#4a5568',
                borderRadius: '8px',
                fontSize: '14px',
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
