import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MainNavigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: '🏠',
      description: 'Overview and quick access'
    },
    {
      path: '/master-files',
      label: 'Master Files',
      icon: '📁',
      description: 'Create and manage master files'
    },
    {
      path: '/master-files-management',
      label: 'Master Files DB',
      icon: '🗄️',
      description: 'Database master files management'
    },
    {
      path: '/suppliers',
      label: 'Suppliers',
      icon: '🏭',
      description: 'Manage supplier information'
    },
    {
      path: '/orders',
      label: 'Orders',
      icon: '📋',
      description: 'Track and manage orders'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav style={{
      background: '#2d3748',
      padding: '15px', // Reduced padding from 20px to 15px
      minHeight: '100vh',
      width: '220px', // Reduced from 280px to 220px
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
      boxSizing: 'border-box'
    }}>
      {/* Logo/Title */}
      <div style={{
        marginBottom: '30px', // Reduced from 40px to 30px
        textAlign: 'center'
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '22px', // 24px -> 22px (-10%)
          fontWeight: 'bold',
          margin: '0',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Care Label Layout
        </h1>
        <p style={{
          color: '#a0aec0',
          fontSize: '13px', // 14px -> 13px (-10%)
          margin: '5px 0 0 0'
        }}>
          Management System
        </p>
      </div>

      {/* Navigation Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'block',
              padding: '12px 15px', // Reduced padding for narrower menu
              borderRadius: '0px',
              textDecoration: 'none',
              color: isActive(item.path) ? '#2d3748' : '#e2e8f0',
              background: isActive(item.path)
                ? '#f7fafc'
                : 'transparent',
              border: isActive(item.path)
                ? '2px solid #e2e8f0'
                : '2px solid transparent',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = '#4a5568';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#e2e8f0';
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <span style={{ fontSize: '22px' }}>{item.icon}</span>
              <div>
                <div style={{
                  fontSize: '14px', // 16px -> 14px (-10%)
                  fontWeight: '600',
                  marginBottom: '2px'
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '11px', // 12px -> 11px (-10%)
                  opacity: 0.8
                }}>
                  {item.description}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* User Icon */}
      <div style={{
        position: 'absolute',
        bottom: '15px', // Reduced from 20px to 15px
        left: '15px' // Reduced from 20px to 15px
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: '#4a5568',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: '#e2e8f0',
          border: '1px solid #718096'
        }}>
          👤
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
