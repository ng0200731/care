/**
 * OrderHistoryTab Component
 *
 * ORDER HISTORY tab content for viewing submitted orders
 * Contains: Filter, Order list with actions
 */

import React, { useState, useEffect } from 'react';
import { useOrderVariable } from '../contexts/OrderVariableContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

type OrderStatus = 'all' | 'draft' | 'complete' | 'send' | 'confirmed' | 'in_production' | 'completed';

interface Order {
  id: string;
  orderNumber?: string; // Sequential number (001, 002, etc.)
  userOrderNumber?: string; // User-entered order number field
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
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<OrderStatus>('all');
  const [orders, setOrders] = useState<Order[]>([]);

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  // Load orders from localStorage
  const loadOrders = () => {
    try {
      const savedOrders = localStorage.getItem('order_management');
      console.log('🔍 Checking localStorage for order_management:', savedOrders ? 'Found data' : 'No data');

      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);

        // Sort orders by createdAt descending (latest first)
        const sortedOrders = parsedOrders.sort((a: Order, b: Order) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setOrders(sortedOrders);
        console.log('✅ Loaded orders from localStorage:', sortedOrders);
        console.log(`📊 Total orders: ${sortedOrders.length}`);
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

  // Get layout name from layoutId
  const getLayoutName = (projectSlug: string, layoutId: string): string => {
    try {
      const storageKey = `project_${projectSlug}_layouts`;
      const savedLayouts = localStorage.getItem(storageKey);

      if (savedLayouts) {
        const parsedLayouts = JSON.parse(savedLayouts);
        const layout = parsedLayouts.find((l: any) => l.id === layoutId);
        return layout?.name || layoutId;
      }
    } catch (error) {
      console.error('Error loading layout name:', error);
    }
    return layoutId;
  };

  // Format order data for display
  const formatOrderForDisplay = (order: Order) => {
    const date = new Date(order.createdAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Extract variable data
    const variables: { name: string; value: string }[] = [];

    // Add user-entered order number if available
    if (order.userOrderNumber) {
      variables.push({ name: 'Order Number', value: order.userOrderNumber });
    }

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

    // Get layout name
    const layoutName = getLayoutName(order.projectSlug, order.layoutId);

    // Use orderNumber if available, otherwise fall back to timestamp
    const displayOrderNumber = order.orderNumber
      ? `#${order.orderNumber}`
      : `#${order.id.split('_')[1] || order.id}`;

    return {
      id: order.id,
      orderNumber: displayOrderNumber,
      date: formattedDate,
      projectName: order.projectSlug || 'N/A',
      layoutName: layoutName,
      layoutId: order.layoutId || 'N/A',
      customerId: order.customerId || 'N/A',
      status: order.status,
      variables
    };
  };

  // Convert composition array to generatedText format (same format as NewCompTransDialog)
  const formatCompositionText = (compositions: any[]): string => {
    if (!compositions || compositions.length === 0) return '';

    const lines = compositions
      .filter(comp => comp.material && comp.percentage)
      .map(comp => `${comp.percentage}% ${comp.material}`);

    return lines.join('\n\n');
  };

  // Apply order variable data to layout content
  const applyVariableDataToLayout = (layoutData: any, variableData: any) => {
    console.log('🔄 Applying variable data to layout...');

    // Deep clone to avoid mutating original
    const updatedLayout = JSON.parse(JSON.stringify(layoutData));

    if (!updatedLayout.canvasData?.objects) {
      console.warn('⚠️ No objects in layout canvasData');
      return updatedLayout;
    }

    // Iterate through all objects (mothers) and their regions
    updatedLayout.canvasData.objects.forEach((obj: any) => {
      if (obj.regions && Array.isArray(obj.regions)) {
        obj.regions.forEach((region: any) => {
          if (region.contents && Array.isArray(region.contents)) {
            region.contents.forEach((content: any, contentIndex: number) => {
              // Generate component ID to match saved data
              const componentId = `${region.id}_content_${contentIndex}`;
              const varData = variableData[componentId];

              if (varData) {
                console.log(`✅ Applying data to ${componentId}:`, varData);

                if (varData.type === 'comp-trans' && content.type === 'new-comp-trans') {
                  // Convert composition array to generatedText
                  const generatedText = formatCompositionText(varData.data.compositions);

                  // Apply to newCompTransConfig
                  if (!content.newCompTransConfig) {
                    content.newCompTransConfig = {};
                  }
                  if (!content.newCompTransConfig.textContent) {
                    content.newCompTransConfig.textContent = {};
                  }

                  content.newCompTransConfig.textContent.generatedText = generatedText;
                  content.newCompTransConfig.textContent.originalText = generatedText;

                  console.log(`  📝 Comp-trans text: ${generatedText}`);
                } else if (varData.type === 'multi-line' && content.type === 'new-multi-line') {
                  // Apply multi-line text
                  if (!content.newMultiLineConfig) {
                    content.newMultiLineConfig = {};
                  }
                  if (!content.content) {
                    content.content = {};
                  }

                  content.content.text = varData.data.textContent;
                  content.newMultiLineConfig.textContent = varData.data.textContent;

                  console.log(`  📝 Multi-line text: ${varData.data.textContent}`);
                }
              }
            });
          }
        });
      }
    });

    console.log('✅ Variable data applied to layout');
    return updatedLayout;
  };

  // Preview artwork - save order data to sessionStorage and navigate to canvas
  const order2preview = async (order: Order) => {
    try {
      console.log('🎨 Generating preview for order:', order);

      // Load layout from localStorage to get master file info
      const storageKey = `project_${order.projectSlug}_layouts`;
      const savedLayouts = localStorage.getItem(storageKey);

      if (!savedLayouts) {
        alert('Layout not found for this order');
        return;
      }

      const parsedLayouts = JSON.parse(savedLayouts);
      const layout = parsedLayouts.find((l: any) => l.id === order.layoutId);

      if (!layout) {
        alert('Layout not found');
        return;
      }

      console.log('✅ Loaded layout:', layout.name);

      // Save order variable data to sessionStorage for App.tsx to access
      sessionStorage.setItem('__order_preview_data__', JSON.stringify({
        orderId: order.id,
        orderNumber: order.orderNumber,
        variableData: order.variableData,
        projectSlug: order.projectSlug,
        layoutId: order.layoutId
      }));

      console.log('💾 Saved order data to sessionStorage for preview');
      console.log('🎯 Navigating to canvas for preview...');

      // Navigate to canvas page with orderPreview=true flag
      // App.tsx will detect this and apply the order data after layout loads
      const masterFileId = layout.canvasData?.masterFileId || '';
      const projectName = order.projectSlug;

      navigate(
        `/create_zero?context=projects&projectSlug=${order.projectSlug}&masterFileId=${masterFileId}&projectName=${encodeURIComponent(projectName)}&layoutId=${order.layoutId}&orderPreview=true`
      );

    } catch (error) {
      console.error('❌ Error generating preview:', error);
      alert('Error generating preview. Please try again.');
    }
  };

  // Download PDF
  const downloadPDF = async () => {
    if (!previewImage || !previewOrder) return;

    try {
      // Load layout to get dimensions
      const storageKey = `project_${previewOrder.projectSlug}_layouts`;
      const savedLayouts = localStorage.getItem(storageKey);
      const parsedLayouts = JSON.parse(savedLayouts || '[]');
      const layout = parsedLayouts.find((l: any) => l.id === previewOrder.layoutId);

      const width = layout?.canvasData?.width || 200;
      const height = layout?.canvasData?.height || 189;

      // Create PDF with canvas dimensions (convert mm to points: 1mm = 2.83465 points)
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [width, height]
      });

      // Add image to PDF
      pdf.addImage(previewImage, 'PNG', 0, 0, width, height);

      // Download
      const orderNumber = previewOrder.orderNumber || previewOrder.id.split('_')[1];
      pdf.save(`Order_${orderNumber}_artwork.pdf`);

      console.log('✅ PDF downloaded successfully');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
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
                  <span>📄 {displayOrder.layoutName}</span>
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

              {displayOrder.status === 'complete' && (
                <button
                  onClick={() => order2preview(order)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: '#8b5cf6',
                    border: '2px solid #8b5cf6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#7c3aed';
                    e.currentTarget.style.borderColor = '#7c3aed';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8b5cf6';
                    e.currentTarget.style.borderColor = '#8b5cf6';
                  }}
                >
                  📄 Preview Artwork
                </button>
              )}

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

      {/* Preview Artwork Modal */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'auto'
          }}>
            {previewLoading ? (
              // Loading state
              <div style={{
                textAlign: 'center',
                padding: '40px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  border: '6px solid #f3f3f3',
                  borderTop: '6px solid #8b5cf6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }}></div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a202c'
                }}>
                  🎨 Generating PDF Preview...
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  Please wait while we render your artwork
                </p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : (
              // Preview loaded
              <>
                <h2 style={{
                  margin: '0 0 20px 0',
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1a202c'
                }}>
                  📄 Artwork Preview
                </h2>

                {previewOrder && (
                  <p style={{
                    margin: '0 0 24px 0',
                    fontSize: '14px',
                    color: '#64748b',
                    textAlign: 'center'
                  }}>
                    Order #{previewOrder.orderNumber || previewOrder.id.split('_')[1]}
                  </p>
                )}

                {/* Canvas Preview Image */}
                <div style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(90vh - 250px)',
                  overflow: 'auto',
                  marginBottom: '24px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <img
                    src={previewImage}
                    alt="Artwork Preview"
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      margin: '0 auto'
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={downloadPDF}
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'white',
                      backgroundColor: '#10b981',
                      border: '2px solid #10b981',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
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
                    ✅ Download PDF
                  </button>

                  <button
                    onClick={() => {
                      setShowPreviewModal(false);
                      setPreviewImage('');
                      setPreviewOrder(null);
                    }}
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#64748b',
                      backgroundColor: 'white',
                      border: '2px solid #cbd5e0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#94a3b8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#cbd5e0';
                    }}
                  >
                    ❌ Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryTab;
