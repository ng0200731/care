import React from 'react';
import { Link } from 'react-router-dom';

const MasterFiles: React.FC = () => {

  return (
    <div>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '50px'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#2d3748',
          margin: '0 0 15px 0'
        }}>
          🗄️ Care Label System
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#718096',
          margin: 0
        }}>
          Choose what you'd like to do
        </p>
      </div>

      {/* Main Action Buttons - 3 Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto 50px auto'
      }}>
        {/* Start Label Design Button */}
        <Link
          to="/master-files/select-customer"
          style={{
            display: 'block',
            padding: '40px 30px',
            background: '#667eea',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
            border: 'none'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
          }}
        >
          <div style={{
            fontSize: '51px',
            marginBottom: '20px'
          }}>
            🎨
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            margin: '0 0 15px 0'
          }}>
            Start Label Design
          </h2>
          <p style={{
            fontSize: '16px',
            margin: 0,
            opacity: 0.9,
            lineHeight: '1.5'
          }}>
            Create new care label layouts from scratch or import existing designs
          </p>
        </Link>

        {/* Customer Management Button */}
        <Link
          to="/customers"
          style={{
            display: 'block',
            padding: '40px 30px',
            background: '#4facfe',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 25px rgba(79, 172, 254, 0.3)',
            border: 'none'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(79, 172, 254, 0.4)';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.3)';
          }}
        >
          <div style={{
            fontSize: '51px',
            marginBottom: '20px'
          }}>
            👥
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            margin: '0 0 15px 0'
          }}>
            Customer Management
          </h2>
          <p style={{
            fontSize: '16px',
            margin: 0,
            opacity: 0.9,
            lineHeight: '1.5'
          }}>
            Manage customer information, contacts, and account settings
          </p>
        </Link>

        {/* Master File Management Button */}
        <Link
          to="/master-files-management"
          style={{
            display: 'block',
            padding: '40px 30px',
            background: '#f093fb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 25px rgba(240, 147, 251, 0.3)',
            border: 'none'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(240, 147, 251, 0.4)';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(240, 147, 251, 0.3)';
          }}
        >
          <div style={{
            fontSize: '51px',
            marginBottom: '20px'
          }}>
            🗄️
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            margin: '0 0 15px 0'
          }}>
            Master File Management
          </h2>
          <p style={{
            fontSize: '16px',
            margin: 0,
            opacity: 0.9,
            lineHeight: '1.5'
          }}>
            View, edit, and organize all your saved master files and templates
          </p>
        </Link>
      </div>


    </div>
  );
};

export default MasterFiles;
