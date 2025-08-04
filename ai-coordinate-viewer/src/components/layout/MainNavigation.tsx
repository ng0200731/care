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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      minHeight: '100vh',
      width: '280px',
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
    }}>
      {/* Logo/Title */}
      <div style={{
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Care Label Layout
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '14px',
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
              padding: '15px 20px',
              borderRadius: '12px',
              textDecoration: 'none',
              color: isActive(item.path) ? '#667eea' : 'white',
              background: isActive(item.path) 
                ? 'white' 
                : 'rgba(255,255,255,0.1)',
              border: isActive(item.path) 
                ? '2px solid #667eea' 
                : '2px solid transparent',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateX(5px)';
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '2px'
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.8
                }}>
                  {item.description}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* User Info */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        padding: '15px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'white'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            👤
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              Demo User
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Administrator
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
