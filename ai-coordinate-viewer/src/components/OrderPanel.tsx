/**
 * OrderPanel Component
 *
 * Main ORDER panel displayed in right frame when ORDER is clicked in left menu
 * Contains 2 BIG TABS: NEW and ORDER HISTORY
 */

import React, { useState } from 'react';
import NewOrderTab from './NewOrderTab';
import OrderHistoryTab from './OrderHistoryTab';

type TabType = 'new' | 'history';

interface OrderData {
  id: string;
  customerId: string;
  projectSlug: string;
  layoutId: string;
  quantity: number;
  variableData: any;
  createdAt: string;
  status: 'draft' | 'complete';
}

const OrderPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [editingOrder, setEditingOrder] = useState<OrderData | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const handleViewOrder = (order: OrderData) => {
    setEditingOrder(order);
    setIsViewMode(true);
    setActiveTab('new');
  };

  const handleEditOrder = (order: OrderData) => {
    setEditingOrder(order);
    setIsViewMode(false);
    setActiveTab('new');
  };

  const handleClearOrder = () => {
    setEditingOrder(null);
    setIsViewMode(false);
    setActiveTab('history'); // Switch back to history tab
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        backgroundColor: 'white',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '600',
          color: '#1a202c'
        }}>
          ORDER MANAGEMENT
        </h2>
      </div>

      {/* Tab Navigation - 2 BIG TABS */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '2px solid #e2e8f0',
        padding: '0 24px'
      }}>
        <div style={{
          display: 'flex',
          gap: '4px'
        }}>
          {/* NEW Tab */}
          <button
            onClick={() => setActiveTab('new')}
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: activeTab === 'new' ? '600' : '500',
              color: activeTab === 'new' ? '#2563eb' : '#64748b',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'new' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'new') {
                e.currentTarget.style.color = '#475569';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'new') {
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            📝 NEW
          </button>

          {/* ORDER HISTORY Tab */}
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: activeTab === 'history' ? '600' : '500',
              color: activeTab === 'history' ? '#2563eb' : '#64748b',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'history' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'history') {
                e.currentTarget.style.color = '#475569';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'history') {
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            📚 ORDER HISTORY
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px'
      }}>
        {activeTab === 'new' ? (
          <NewOrderTab
            editingOrder={editingOrder}
            isViewMode={isViewMode}
            onClearOrder={handleClearOrder}
          />
        ) : (
          <OrderHistoryTab
            onViewOrder={handleViewOrder}
            onEditOrder={handleEditOrder}
          />
        )}
      </div>
    </div>
  );
};

export default OrderPanel;
