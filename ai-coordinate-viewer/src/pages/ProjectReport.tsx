import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalPages: number;
  averagePagesPerProject: number;
  projectsByStatus: {
    draft: number;
    inProgress: number;
    review: number;
    completed: number;
  };
  projectsByCustomer: {
    customerName: string;
    projectCount: number;
    pageCount: number;
  }[];
  recentActivity: {
    projectName: string;
    action: string;
    date: string;
    customerName: string;
  }[];
}

const ProjectReport: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for now - will be replaced with API calls
  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalProjects: 15,
        activeProjects: 8,
        completedProjects: 7,
        totalPages: 45,
        averagePagesPerProject: 3.2,
        projectsByStatus: {
          draft: 3,
          inProgress: 5,
          review: 2,
          completed: 5
        },
        projectsByCustomer: [
          { customerName: 'Nike Inc.', projectCount: 4, pageCount: 12 },
          { customerName: 'Adidas AG', projectCount: 3, pageCount: 9 },
          { customerName: 'H&M', projectCount: 2, pageCount: 6 },
          { customerName: 'Zara', projectCount: 3, pageCount: 8 },
          { customerName: 'Uniqlo', projectCount: 3, pageCount: 10 }
        ],
        recentActivity: [
          { projectName: 'Summer Collection 2024', action: 'Updated', date: '2024-12-20', customerName: 'Nike Inc.' },
          { projectName: 'Winter Jackets Labels', action: 'Created', date: '2024-12-18', customerName: 'Adidas AG' },
          { projectName: 'Basic T-Shirt Labels', action: 'Completed', date: '2024-12-15', customerName: 'H&M' },
          { projectName: 'Denim Collection', action: 'Updated', date: '2024-12-12', customerName: 'Zara' },
          { projectName: 'Casual Wear Labels', action: 'Created', date: '2024-12-10', customerName: 'Uniqlo' }
        ]
      });
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <div style={{ fontSize: '16px', color: '#666' }}>Generating project report...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px' 
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '36px', fontWeight: 'bold', opacity: '0.9' }}>
            📊 Project Report
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
            Overview of all projects, statistics, and recent activity
          </p>
        </div>
        
        <button
          onClick={() => navigate('/projects')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ← Back to Projects
        </button>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2', marginBottom: '8px' }}>
            {stats.totalProjects}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Projects</div>
        </div>

        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#388e3c', marginBottom: '8px' }}>
            {stats.activeProjects}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Active Projects</div>
        </div>

        <div style={{
          backgroundColor: '#f3e5f5',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7b1fa2', marginBottom: '8px' }}>
            {stats.totalPages}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Pages</div>
        </div>

        <div style={{
          backgroundColor: '#fff3e0',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f57c00', marginBottom: '8px' }}>
            {stats.averagePagesPerProject.toFixed(1)}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Avg Pages/Project</div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '30px'
      }}>
        {/* Project Status Chart */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Projects by Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(stats.projectsByStatus).map(([status, count]) => {
              const colors = {
                draft: '#6c757d',
                inProgress: '#007bff', 
                review: '#ffc107',
                completed: '#28a745'
              };
              const percentage = (count / stats.totalProjects) * 100;
              
              return (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '80px', 
                    fontSize: '14px', 
                    textTransform: 'capitalize',
                    color: '#666'
                  }}>
                    {status.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div style={{
                    flex: 1,
                    height: '20px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: colors[status as keyof typeof colors],
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  <div style={{ 
                    width: '40px', 
                    textAlign: 'right',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: colors[status as keyof typeof colors]
                  }}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Customers */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Top Customers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.projectsByCustomer.slice(0, 5).map((customer, index) => (
              <div key={customer.customerName} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: index === 0 ? '#f8f9fa' : 'transparent',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                    {customer.customerName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {customer.projectCount} projects • {customer.pageCount} pages
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
          Recent Activity
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stats.recentActivity.map((activity, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: activity.action === 'Completed' ? '#28a745' : 
                                  activity.action === 'Created' ? '#007bff' : '#ffc107'
                }}></div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                    {activity.projectName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {activity.action} • {activity.customerName}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {new Date(activity.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectReport;
