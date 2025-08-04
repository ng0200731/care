import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const quickActions = [
    {
      title: 'Create Master File',
      description: 'Start a new label layout design',
      icon: '📄',
      path: '/master-files/create',
      color: '#4299e1',
      bgColor: '#ebf8ff'
    },
    {
      title: 'Import from JSON',
      description: 'Load existing design from file',
      icon: '📥',
      path: '/master-files/import',
      color: '#38a169',
      bgColor: '#f0fff4'
    },
    {
      title: 'Add Supplier',
      description: 'Register new supplier information',
      icon: '🏭',
      path: '/suppliers/create',
      color: '#ed8936',
      bgColor: '#fffaf0'
    },
    {
      title: 'Create Order',
      description: 'Place new order with supplier',
      icon: '📋',
      path: '/orders/create',
      color: '#9f7aea',
      bgColor: '#faf5ff'
    }
  ];

  const stats = [
    { label: 'Master Files', value: '12', icon: '📁', color: '#4299e1' },
    { label: 'Suppliers', value: '5', icon: '🏭', color: '#38a169' },
    { label: 'Active Orders', value: '8', icon: '📋', color: '#ed8936' },
    { label: 'Completed', value: '24', icon: '✅', color: '#9f7aea' }
  ];

  return (
    <div>
      {/* Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '40px',
        marginBottom: '30px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          margin: '0 0 10px 0',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Welcome to Care Label Layout System
        </h1>
        <p style={{
          fontSize: '18px',
          opacity: 0.9,
          margin: 0
        }}>
          Manage your label designs, suppliers, and orders all in one place
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}
          >
            <div style={{
              fontSize: '32px',
              marginBottom: '10px'
            }}>
              {stat.icon}
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: stat.color,
              marginBottom: '5px'
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#718096',
              fontWeight: '500'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#2d3748',
          marginBottom: '20px'
        }}>
          Quick Actions
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              style={{
                textDecoration: 'none',
                display: 'block'
              }}
            >
              <div
                style={{
                  background: 'white',
                  padding: '25px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    background: action.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    {action.icon}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: action.color,
                      margin: '0 0 5px 0'
                    }}>
                      {action.title}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#718096',
                      margin: 0
                    }}>
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#2d3748',
          marginBottom: '20px'
        }}>
          Recent Activity
        </h2>
        
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          padding: '25px'
        }}>
          <div style={{
            textAlign: 'center',
            color: '#718096',
            padding: '40px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
            <p style={{ fontSize: '16px', margin: 0 }}>
              Activity tracking will be available once you start using the system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
