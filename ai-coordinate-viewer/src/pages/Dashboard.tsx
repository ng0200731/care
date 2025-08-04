import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const quickActions = [
    {
      title: 'Create Master File',
      description: 'Start a new label layout design',
      icon: '📄',
      path: '/master-files/create',
      color: '#2d3748',
      bgColor: '#f7fafc'
    },
    {
      title: 'Import from JSON',
      description: 'Load existing design from file',
      icon: '📥',
      path: '/master-files/import',
      color: '#2d3748',
      bgColor: '#f7fafc'
    },
    {
      title: 'Add Supplier',
      description: 'Register new supplier information',
      icon: '🏭',
      path: '/suppliers/create',
      color: '#2d3748',
      bgColor: '#f7fafc'
    },
    {
      title: 'Create Order',
      description: 'Place new order with supplier',
      icon: '📋',
      path: '/orders/create',
      color: '#2d3748',
      bgColor: '#f7fafc'
    }
  ];

  const stats = [
    { label: 'Master Files', value: '12', icon: '📁', color: '#2d3748' },
    { label: 'Suppliers', value: '5', icon: '🏭', color: '#2d3748' },
    { label: 'Active Orders', value: '8', icon: '📋', color: '#2d3748' },
    { label: 'Completed', value: '24', icon: '✅', color: '#2d3748' }
  ];

  return (
    <div>
      {/* Welcome Section */}
      <div style={{
        background: '#2d3748',
        padding: '40px',
        marginBottom: '30px',
        color: 'white',
        textAlign: 'center',
        border: '1px solid #4a5568'
      }}>
        <h1 style={{
          fontSize: '32px', // 36px -> 32px (-10%)
          fontWeight: 'bold',
          margin: '0 0 10px 0'
        }}>
          Welcome to Care Label Layout System
        </h1>
        <p style={{
          fontSize: '16px', // 18px -> 16px (-10%)
          color: '#e2e8f0',
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
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}
          >
            <div style={{
              fontSize: '29px', // 32px -> 29px (-10%)
              marginBottom: '10px'
            }}>
              {stat.icon}
            </div>
            <div style={{
              fontSize: '25px', // 28px -> 25px (-10%)
              fontWeight: 'bold',
              color: stat.color,
              marginBottom: '5px'
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: '13px', // 14px -> 13px (-10%)
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
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f7fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
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
                    background: action.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    border: '1px solid #e2e8f0'
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
