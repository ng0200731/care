/**
 * OrderHistoryTab Component
 *
 * ORDER HISTORY tab content for viewing submitted orders
 * Contains: Filter, Order list with actions
 */

import React, { useState, useEffect } from 'react';
import { useOrderVariable } from '../contexts/OrderVariableContext';

type OrderStatus = 'all' | 'draft' | 'complete' | 'send' | 'confirmed' | 'in_production' | 'completed';

interface Order {
  id: string;
  customerId: string;
  projectSlug: string;
  layoutId: string;
  quantity: number;
  variableData: any;
  createdAt: string;
  status: 'draft' | 'complete';
}

interface OrderHistoryTabProps {
  onViewOrder: (order: Order) => void;
  onEditOrder: (order: Order) => void;
}

const OrderHistoryTab: React.FC<OrderHistoryTabProps> = ({ onViewOrder, onEditOrder }) => {
  const [filterStatus, setFilterStatus] = useState<OrderStatus>('all');
  const [orders, setOrders] = useState<Order[]>([]);

  // Load orders from localStorage
  const loadOrders = () => {
    try {
      const savedOrders = localStorage.getItem('order_management');
      console.log('🔍 Checking localStorage for order_management:', savedOrders ? 'Found data' : 'No data');

      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        setOrders(parsedOrders);
        console.log('✅ Loaded orders from localStorage:', parsedOrders);
        console.log(`📊 Total orders: ${parsedOrders.length}`);
      } else {
        setOrders([]);
        console.log('📝 No orders found in localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setOrders([]);
    }
  };

  useEffect(() => {
    console.log('🔄 OrderHistoryTab mounted - loading orders');
    loadOrders();
  }, []);

  // Filter orders based on status
  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return '💾';
      case 'complete': return '✅';
      case 'send': return '📤';
      case 'confirmed': return '✅';
      case 'in_production': return '🏭';
      case 'completed': return '✔️';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#64748b';
      case 'complete': return '#10b981';
      case 'send': return '#3b82f6';
      case 'confirmed': return '#10b981';
      case 'in_production': return '#f59e0b';
      case 'completed': return '#6366f1';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.toUpperCase().replace('_', ' ');
  };

  // Format order data for display
  const formatOrderForDisplay = (order: Order) => {
    const date = new Date(order.createdAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Extract variable data
    const variables: { name: string; value: string }[] = [];

    // Add quantity
    variables.push({ name: 'Quantity', value: order.quantity.toString() });

    // Add variable component data
    if (order.variableData) {
      Object.entries(order.variableData).forEach(([componentId, componentData]: [string, any]) => {
        if (componentData.type === 'comp-trans') {
          const compositions = componentData.data?.compositions || [];
          compositions.forEach((comp: any, index: number) => {
            if (comp.material && comp.percentage) {
              variables.push({
                name: `Material ${index + 1}`,
                value: `${comp.percentage}% ${comp.material}`
              });
            }
          });
        } else if (componentData.type === 'multi-line') {
          const textContent = componentData.data?.textContent || '';
          if (textContent) {
            variables.push({
              name: 'Multi-line Text',
              value: textContent
            });
          }
        }
      });
    }

    return {
      id: order.id,
      orderNumber: `#${order.id.split('_')[1] || order.id}`,
      date: formattedDate,
      projectName: order.projectSlug || 'N/A',
      layoutId: order.layoutId || 'N/A',
      customerId: order.customerId || 'N/A',
      status: order.status,
      variables
    };
  };

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Filter Bar */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={loadOrders}
          style={{
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: '#10b981',
            border: '2px solid #10b981',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginRight: '12px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
            e.currentTarget.style.borderColor = '#059669';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10b981';
            e.currentTarget.style.borderColor = '#10b981';
          }}
        >
          🔄 Refresh
        </button>

        <span style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#64748b'
        }}>
          Filter:
        </span>

        {(['all', 'draft', 'complete'] as OrderStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: '500',
              color: filterStatus === status ? 'white' : '#64748b',
              backgroundColor: filterStatus === status ? '#3b82f6' : 'transparent',
              border: filterStatus === status ? '2px solid #3b82f6' : '2px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'capitalize'
            }}
            onMouseEnter={(e) => {
              if (filterStatus !== status) {
                e.currentTarget.style.borderColor = '#cbd5e0';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (filterStatus !== status) {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {filteredOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1a202c' }}>
              No orders found
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {filterStatus === 'all'
                ? 'Create your first order in the NEW tab'
                : `No ${filterStatus} orders found`}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const displayOrder = formatOrderForDisplay(order);
            return (
          <div
            key={displayOrder.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '2px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            {/* Order Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1a202c'
                  }}>
                    {getStatusIcon(displayOrder.status)} Order {displayOrder.orderNumber}
                  </span>
                  <span style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: getStatusColor(displayOrder.status),
                    borderRadius: '12px'
                  }}>
                    {getStatusLabel(displayOrder.status)}
                  </span>
                </div>

                <div style={{
                  fontSize: '14px',
                  color: '#64748b',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <span>📅 {displayOrder.date}</span>
                  <span>📁 {displayOrder.projectName}</span>
                  <span>📄 {displayOrder.layoutId}</span>
                  <span>👤 {displayOrder.customerId}</span>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div style={{
              height: '1px',
              backgroundColor: '#e2e8f0',
              margin: '16px 0'
            }} />

            {/* Order Variables */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {displayOrder.variables.map((variable, index) => (
                <div key={index}>
                  <span style={{
                    fontSize: '13px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    {variable.name}:
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: '#1a202c',
                    fontWeight: '500',
                    marginLeft: '6px'
                  }}>
                    {variable.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => onViewOrder(order)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#3b82f6',
                  backgroundColor: 'transparent',
                  border: '2px solid #3b82f6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                👁️ View
              </button>

              {displayOrder.status === 'draft' ? (
                <button
                  onClick={() => onEditOrder(order)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#10b981',
                    backgroundColor: 'transparent',
                    border: '2px solid #10b981',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ecfdf5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ✏️ Continue Edit
                </button>
              ) : (
                <button
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#64748b',
                    backgroundColor: 'transparent',
                    border: '2px solid #cbd5e0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ✏️ Edit
                </button>
              )}

              <button
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#6366f1',
                  backgroundColor: 'transparent',
                  border: '2px solid #6366f1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#eef2ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                🖨️ Print
              </button>

              {displayOrder.status === 'draft' && (
                <>
                  <button
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#3b82f6',
                      backgroundColor: 'transparent',
                      border: '2px solid #3b82f6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    📤 Send
                  </button>

                  <button
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#ef4444',
                      backgroundColor: 'transparent',
                      border: '2px solid #ef4444',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    🗑️ Delete
                  </button>
                </>
              )}

              <select
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#64748b',
                  backgroundColor: 'white',
                  border: '2px solid #cbd5e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
                onChange={(e) => {
                  console.log('Change status to:', e.target.value);
                }}
              >
                <option value="">Change Status ▼</option>
                <option value="draft">Draft</option>
                <option value="send">Send</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_production">In Production</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
            );
          })
        )}
      </div>

      {/* Action Bar */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#475569',
            backgroundColor: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = '#cbd5e0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          📊 Export All
        </button>

        <button
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#475569',
            backgroundColor: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = '#cbd5e0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          🖨️ Print All
        </button>
      </div>
    </div>
  );
};

export default OrderHistoryTab;
