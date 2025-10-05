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

// Material translations for 18 languages (ES, FR, EN, PT, DU, IT, GR, JA, DE, DA, SL, CH, KO, ID, AR, GA, CA, BS)
const materialTranslations: { [key: string]: string[] } = {
  'Cotton': ['algodón', 'coton', 'cotton', 'algodão', 'katoen', 'cotone', 'ΒΑΜΒΑΚΙ', 'コットン', 'baumwolle', 'bomuld', 'bombaž', '棉', '면', 'katun', 'قطن', 'algodón', 'cotó', 'kotoia'],
  'Polyester': ['poliéster', 'polyester', 'polyester', 'poliéster', 'polyester', 'poliestere', 'ΠΟΛΥΕΣΤΕΡΑΣ', 'ポリエステル', 'polyester', 'polyester', 'poliester', '聚酯纤维', '폴리에스터', 'poliester', 'بوليستير', 'poliéster', 'polièster', 'poliesterra'],
  'Elastane': ['elastano', 'élasthanne', 'elastane', 'elastano', 'elastaan', 'elastan', 'ΕΛΑΣΤΑΝΗ', 'エラスタン', 'elastan', 'elastan', 'elastan', '氨纶', '엘라스탄', 'elastan', 'إيلاستان', 'elastano', 'elastà', 'elastanoa'],
  'Viscose': ['viscosa', 'viscose', 'viscose', 'viscose', 'viscose', 'viscosa', 'ΒΙΣΚΟΖΗ', 'ビスコース', 'viskose', 'viskose', 'viskoza', '粘胶纤维', '비스코스', 'viskosa', 'فيسكوز', 'viscosa', 'viscosa', 'biskosea'],
  'Wool': ['lana', 'laine', 'wool', 'lã', 'wol', 'lana', 'ΜΑΛΛΙ', 'ウール', 'wolle', 'uld', 'volna', '羊毛', '울', 'wol', 'صوف', 'la', 'llana', 'artilea'],
  'Nylon': ['nailon', 'nylon', 'nylon', 'nylon', 'nylon', 'nailon', 'ΝΑΪΛΟΝ', 'ナイロン', 'nylon', 'nylon', 'najlon', '锦纶', '나일론', 'nilon', 'نايلون', 'nailon', 'niló', 'nylona'],
};

// Generate multi-language text from composition data
const generateMultiLanguageComposition = (compositions: any[], separator: string = ' - ') => {
  const lines: string[] = [];

  compositions.forEach((comp: any) => {
    if (comp.material && comp.percentage) {
      // Get translations for this material (case-insensitive lookup)
      const materialKey = Object.keys(materialTranslations).find(
        key => key.toLowerCase() === comp.material.toLowerCase()
      );

      const translations = materialKey ? materialTranslations[materialKey] : null;

      if (translations && translations.length === 18) {
        // Join all 18 languages with separator
        const multiLangText = translations.join(separator);
        // Ensure percentage is a number
        const percentage = typeof comp.percentage === 'string' ? parseInt(comp.percentage, 10) : comp.percentage;
        const line = `${percentage}% ${multiLangText}`;
        lines.push(line);
      } else {
        // Fallback: use original material name if no translation found
        const percentage = typeof comp.percentage === 'string' ? parseInt(comp.percentage, 10) : comp.percentage;
        const line = `${percentage}% ${comp.material}`;
        lines.push(line);
      }
    }
  });

  return lines.join('\n\n');
};

// Apply order variable data to layout
const applyOrderDataToLayout = (layoutData: any, variableData: any) => {
  console.log('🎨 Applying order variable data to layout...');

  // Deep copy
  const updatedLayout = JSON.parse(JSON.stringify(layoutData));

  // Apply variable data to each component
  Object.entries(variableData).forEach(([componentId, componentData]: [string, any]) => {
    const match = componentId.match(/^(.+)_(?:region)?[Cc]ontent_(\d+)$/);
    if (!match) return;

    const regionId = match[1];
    const contentIndex = parseInt(match[2], 10);

    // Find the mother and region
    for (const obj of updatedLayout.objects) {
      if (obj.type?.includes('mother')) {
        const regions = obj.regions || [];
        const targetRegion = regions.find((r: any) => r.id === regionId);

        if (targetRegion) {
          const contents = targetRegion.contents || [];
          const targetContent = contents[contentIndex];

          if (targetContent) {
            if (componentData.type === 'multi-line' && targetContent.type === 'new-multi-line') {
              targetContent.content = targetContent.content || {};
              targetContent.content.text = componentData.data.textContent;
              targetContent.newMultiLineConfig = targetContent.newMultiLineConfig || {};
              targetContent.newMultiLineConfig.textContent = componentData.data.textContent;

            } else if (componentData.type === 'comp-trans' && targetContent.type === 'new-comp-trans') {
              const compositions = componentData.data.compositions || [];

              // Normalize percentages
              const normalizedCompositions = compositions.map((comp: any) => ({
                ...comp,
                percentage: typeof comp.percentage === 'string' ? parseInt(comp.percentage, 10) : comp.percentage
              }));

              // Get original separator
              const originalSeparator = targetContent.newCompTransConfig?.textContent?.separator || ' - ';

              // Generate 18-language text
              const multiLanguageText = generateMultiLanguageComposition(normalizedCompositions, originalSeparator);

              // Update config
              targetContent.newCompTransConfig = targetContent.newCompTransConfig || {};
              targetContent.newCompTransConfig.materialCompositions = normalizedCompositions;
              targetContent.newCompTransConfig.selectedLanguages = ['ES', 'FR', 'EN', 'PT', 'DU', 'IT', 'GR', 'JA', 'DE', 'DA', 'SL', 'CH', 'KO', 'ID', 'AR', 'GA', 'CA', 'BS'];
              targetContent.newCompTransConfig.textContent = targetContent.newCompTransConfig.textContent || {};
              targetContent.newCompTransConfig.textContent.separator = originalSeparator;
              targetContent.newCompTransConfig.textContent.generatedText = multiLanguageText;
              targetContent.newCompTransConfig.textContent.originalText = multiLanguageText;
              targetContent.content = targetContent.content || {};
              targetContent.content.text = multiLanguageText;
            }
          }
          break;
        }
      }
    }
  });

  return updatedLayout;
};

type OrderStatusValue = 'draft' | 'confirmed' | 'send_out' | 'in_production' | 'shipped';
type OrderStatus = 'all' | OrderStatusValue;

interface Order {
  id: string;
  orderNumber?: string; // Sequential number (001, 002, etc.)
  userOrderNumber?: string; // User-entered order number field
  customerId: string;
  customerName?: string; // Customer name from Customer Management
  projectSlug: string;
  layoutId: string;
  masterFileId?: string; // Master file ID
  masterFileName?: string; // Master file name
  quantity: number;
  variableData: any;
  createdAt: string;
  status: OrderStatusValue;
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Status change confirmation modal
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ orderId: string; newStatus: OrderStatusValue } | null>(null);

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
      case 'confirmed': return '✅';
      case 'send_out': return '📤';
      case 'in_production': return '🏭';
      case 'shipped': return '🚚';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#64748b';
      case 'confirmed': return '#10b981';
      case 'send_out': return '#3b82f6';
      case 'in_production': return '#f59e0b';
      case 'shipped': return '#6366f1';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'DRAFT';
      case 'confirmed': return 'CONFIRMED';
      case 'send_out': return 'SEND OUT';
      case 'in_production': return 'IN PRODUCTION';
      case 'shipped': return 'SHIPPED';
      default: return status.toUpperCase();
    }
  };

  // Get available next statuses based on current status
  const getAvailableNextStatuses = (currentStatus: string): OrderStatusValue[] => {
    switch (currentStatus) {
      case 'draft':
        return ['confirmed'];
      case 'confirmed':
        return ['send_out'];
      case 'send_out':
        return ['in_production'];
      case 'in_production':
        return ['shipped'];
      case 'shipped':
        return [];
      default:
        return [];
    }
  };

  // Handle status change with confirmation
  const handleStatusChange = (orderId: string, newStatus: OrderStatusValue) => {
    if (!newStatus) return;

    setPendingStatusChange({ orderId, newStatus });
    setShowStatusConfirmModal(true);
  };

  // Confirm status change
  const confirmStatusChange = () => {
    if (!pendingStatusChange) return;

    try {
      const updatedOrders = orders.map(order => {
        if (order.id === pendingStatusChange.orderId) {
          return { ...order, status: pendingStatusChange.newStatus };
        }
        return order;
      });

      setOrders(updatedOrders);
      localStorage.setItem('order_management', JSON.stringify(updatedOrders));

      console.log(`✅ Order ${pendingStatusChange.orderId} status changed to ${pendingStatusChange.newStatus}`);
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      alert('Error updating order status');
    }

    setShowStatusConfirmModal(false);
    setPendingStatusChange(null);
  };

  // Cancel status change
  const cancelStatusChange = () => {
    setShowStatusConfirmModal(false);
    setPendingStatusChange(null);
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

  // Get master file name from layoutId
  const getMasterFileName = (projectSlug: string, layoutId: string): string => {
    try {
      const storageKey = `project_${projectSlug}_layouts`;
      const savedLayouts = localStorage.getItem(storageKey);

      if (savedLayouts) {
        const parsedLayouts = JSON.parse(savedLayouts);
        const layout = parsedLayouts.find((l: any) => l.id === layoutId);

        // Check if layout has master file name directly in canvasData
        if (layout?.canvasData?.masterFileName) {
          return layout.canvasData.masterFileName;
        }

        // Otherwise try to get from masterFileId
        if (layout?.canvasData?.masterFileId) {
          // Get master file name from master files list
          const masterFilesKey = `master_files`;
          const savedMasterFiles = localStorage.getItem(masterFilesKey);
          if (savedMasterFiles) {
            const masterFiles = JSON.parse(savedMasterFiles);
            const masterFile = masterFiles.find((mf: any) => mf.id === layout.canvasData.masterFileId);
            if (masterFile) {
              return masterFile.name || masterFile.id;
            }
          }

          // Try to extract name from project-specific master files
          const projectMasterKey = `project_${projectSlug}_master_files`;
          const projectMasterFiles = localStorage.getItem(projectMasterKey);
          if (projectMasterFiles) {
            const parsedProjectMasters = JSON.parse(projectMasterFiles);
            const masterFile = parsedProjectMasters.find((mf: any) => mf.id === layout.canvasData.masterFileId);
            if (masterFile) {
              return masterFile.name || masterFile.id;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading master file name:', error);
    }
    return 'N/A';
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

    // Add total quantity
    variables.push({ name: 'Total Quantity', value: order.quantity.toString() });

    // Check if order has multiple lines (new format)
    if ((order as any).orderLines && Array.isArray((order as any).orderLines)) {
      const orderLines = (order as any).orderLines;

      // Display each line's data (but skip individual line quantities in summary)
      orderLines.forEach((line: any, lineIndex: number) => {
        // Line variable component data only (no line quantity in summary)
        if (line.componentVariables) {
          Object.entries(line.componentVariables).forEach(([componentId, componentData]: [string, any]) => {
            if (componentData.type === 'comp-trans') {
              const compositions = componentData.data?.compositions || [];
              compositions.forEach((comp: any, index: number) => {
                if (comp.material && comp.percentage) {
                  variables.push({
                    name: `  Material ${index + 1}`,
                    value: `${comp.percentage}% ${comp.material}`
                  });
                }
              });
            } else if (componentData.type === 'multi-line') {
              const textContent = componentData.data?.textContent || '';
              if (textContent) {
                variables.push({
                  name: '  Multi-line Text',
                  value: textContent
                });
              }
            }
          });
        }
      });
    } else {
      // Old format - single line order (backward compatibility)
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
    }

    // Get layout name
    const layoutName = getLayoutName(order.projectSlug, order.layoutId);

    // Get master file name - use saved value or try to look it up
    const masterFileName = order.masterFileName || getMasterFileName(order.projectSlug, order.layoutId);

    // Use orderNumber if available, otherwise fall back to timestamp
    const displayOrderNumber = order.orderNumber
      ? `#${order.orderNumber}`
      : `#${order.id.split('_')[1] || order.id}`;

    return {
      id: order.id,
      orderNumber: displayOrderNumber,
      date: formattedDate,
      projectName: order.projectSlug || 'N/A',
      masterFileName: masterFileName,
      layoutName: layoutName,
      layoutId: order.layoutId || 'N/A',
      customerId: order.customerId || 'N/A',
      customerName: order.customerName || 'N/A',
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

  // Preview artwork - Generate PDF using hidden iframe (same quality as "Print as PDF")
  const order2preview = async (order: Order) => {
    try {
      console.log('🖨️ Generating PDF preview for order:', order);
      console.log('📊 Order has orderLines:', (order as any).orderLines);
      console.log('📊 Number of lines:', (order as any).orderLines?.length || 0);

      // Show loading modal
      setIsGeneratingPDF(true);

      // Load layout from localStorage
      const storageKey = `project_${order.projectSlug}_layouts`;
      const savedLayouts = localStorage.getItem(storageKey);

      if (!savedLayouts) {
        setIsGeneratingPDF(false);
        alert('❌ Layout not found for this order');
        return;
      }

      const parsedLayouts = JSON.parse(savedLayouts);
      const layout = parsedLayouts.find((l: any) => l.id === order.layoutId);

      if (!layout || !layout.canvasData) {
        setIsGeneratingPDF(false);
        alert('❌ Layout data not found');
        return;
      }

      console.log('✅ Loaded layout:', layout.name);

      // Save order data to sessionStorage for canvas to access
      // Check if order has new multi-line format
      const orderPreviewData: any = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        projectSlug: order.projectSlug,
        layoutId: order.layoutId
      };

      if ((order as any).orderLines && Array.isArray((order as any).orderLines)) {
        // New format - use order lines
        orderPreviewData.orderLines = (order as any).orderLines;
        console.log('💾 Saving multi-line order data for preview');
      } else {
        // Old format - use variableData
        orderPreviewData.variableData = order.variableData;
        console.log('💾 Saving single-line order data for preview');
      }

      sessionStorage.setItem('__order_preview_data__', JSON.stringify(orderPreviewData));

      console.log('💾 Saved order data to sessionStorage');

      // Determine number of pages (lines) to generate
      const orderLines = orderPreviewData.orderLines || [{ componentVariables: orderPreviewData.variableData }];
      const totalPages = orderLines.length;

      console.log(`📄 Generating ${totalPages} page(s) for ${totalPages} order line(s) in ONE PDF file with Print as PDF styling`);

      let completedPages = 0;
      const pdfPages: Array<{ pageNumber: number, pdfData: string, paperWidth: number, paperHeight: number, orientation: string }> = [];

      // Function to generate PDF page for a specific line using Print as PDF method
      const generatePDFForLine = (lineIndex: number) => {
        return new Promise<void>((resolve, reject) => {
          const line = orderLines[lineIndex];

          // Update sessionStorage with current line data
          const currentLineData = {
            ...orderPreviewData,
            currentLineIndex: lineIndex,
            currentLine: line,
            totalLines: totalPages,
            multiPageMode: true // Flag for multi-page PDF generation
          };
          sessionStorage.setItem('__order_preview_data__', JSON.stringify(currentLineData));

          // Create hidden iframe to render canvas and generate PDF
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.top = '-9999px';
          iframe.style.left = '-9999px';
          iframe.style.width = '1920px';
          iframe.style.height = '1080px';
          iframe.style.border = 'none';
          iframe.style.opacity = '0';
          iframe.style.pointerEvents = 'none';

          // Build canvas URL with auto-generate PDF flag and line index
          const masterFileId = layout.canvasData?.masterFileId || '';
          const projectName = order.projectSlug;
          const canvasUrl = `/create_zero?context=projects&projectSlug=${order.projectSlug}&masterFileId=${masterFileId}&projectName=${encodeURIComponent(projectName)}&layoutId=${order.layoutId}&orderPreview=true&autoGeneratePDF=true&lineIndex=${lineIndex}`;

          console.log(`📍 Loading canvas for Line ${lineIndex + 1}/${totalPages}:`, canvasUrl);

          // Listen for PDF generation completion message from iframe
          const messageHandler = (event: MessageEvent) => {
            if (event.data.type === 'PDF_PAGE_GENERATED') {
              console.log(`✅ PDF page generated for Line ${lineIndex + 1}/${totalPages}`);

              // Store PDF page data
              pdfPages.push({
                pageNumber: event.data.pageNumber,
                pdfData: event.data.pdfData,
                paperWidth: event.data.paperWidth,
                paperHeight: event.data.paperHeight,
                orientation: event.data.orientation
              });

              // Clear timeout
              clearTimeout(timeout);

              // Clean up
              window.removeEventListener('message', messageHandler);
              document.body.removeChild(iframe);

              resolve();

            } else if (event.data.type === 'PDF_ERROR') {
              console.error(`❌ PDF generation error for Line ${lineIndex + 1}:`, event.data.error);

              // Clear timeout
              clearTimeout(timeout);

              // Clean up
              window.removeEventListener('message', messageHandler);
              document.body.removeChild(iframe);

              reject(new Error(event.data.error));
            }
          };

          window.addEventListener('message', messageHandler);

          // Set timeout in case iframe fails to load
          const timeout = setTimeout(() => {
            console.error(`❌ PDF generation timeout for Line ${lineIndex + 1}`);
            window.removeEventListener('message', messageHandler);
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            reject(new Error('Timeout'));
          }, 60000); // 60 second timeout per page

          // Add load event listener
          iframe.onload = () => {
            console.log(`✅ Iframe loaded for Line ${lineIndex + 1}`);
          };

          iframe.onerror = () => {
            console.error(`❌ Iframe failed to load for Line ${lineIndex + 1}`);
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            document.body.removeChild(iframe);
            reject(new Error('Iframe load failed'));
          };

          // Append iframe to body
          iframe.src = canvasUrl;
          document.body.appendChild(iframe);
        });
      };

      // Generate PDFs sequentially for all lines and combine
      (async () => {
        try {
          // Step 1: Generate all PDF pages
          for (let i = 0; i < totalPages; i++) {
            await generatePDFForLine(i);
            completedPages++;
            console.log(`✅ Progress: ${completedPages}/${totalPages} pages completed`);
          }

          // Step 2: Combine all PDF pages into one document using pdf-lib
          console.log(`📄 Combining ${totalPages} PDF page(s) into one document using pdf-lib...`);

          const { PDFDocument } = await import('pdf-lib');

          // Sort pages by page number
          pdfPages.sort((a, b) => a.pageNumber - b.pageNumber);

          // Create a new PDF document
          const mergedPdf = await PDFDocument.create();

          // Add all pages from individual PDFs
          for (let i = 0; i < pdfPages.length; i++) {
            const pageData = pdfPages[i];
            console.log(`📄 Adding page ${i + 1}/${totalPages} to combined PDF...`);

            // Convert data URI to Uint8Array
            const base64Data = pageData.pdfData.split(',')[1];
            const binaryData = atob(base64Data);
            const uint8Array = new Uint8Array(binaryData.length);
            for (let j = 0; j < binaryData.length; j++) {
              uint8Array[j] = binaryData.charCodeAt(j);
            }

            // Load the PDF
            const pdfDoc = await PDFDocument.load(uint8Array);

            // Copy all pages from this PDF to merged PDF
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => {
              mergedPdf.addPage(page);
            });

            console.log(`✅ Page ${i + 1} added to combined PDF`);
          }

          // Save the combined PDF
          const pdfBytes = await mergedPdf.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);

          // Create download link
          const orderNumber = orderPreviewData.orderNumber || orderPreviewData.userOrderNumber || 'Unknown';
          const fileName = `Order_${orderNumber}_${totalPages}pages_${new Date().toISOString().slice(0, 10)}.pdf`;

          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();

          URL.revokeObjectURL(url);

          console.log(`✅ Combined PDF with ${totalPages} page(s) generated successfully: ${fileName}`);
          setIsGeneratingPDF(false);

        } catch (error) {
          console.error('❌ Error generating multi-page PDF:', error);
          setIsGeneratingPDF(false);
          alert(`❌ Error generating PDF: ${error}`);
        }
      })();

      console.log('⏳ Waiting for canvas to render and generate PDF...');
      console.log('⏱️ Timeout set to 60 seconds');

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      setIsGeneratingPDF(false);
      alert('❌ Error generating PDF. Please check console for details.');
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
      {/* PDF Generation Loading Modal */}
      {isGeneratingPDF && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            minWidth: '300px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              animation: 'spin 1s linear infinite'
            }}>🖨️</div>
            <h3 style={{
              margin: '0 0 10px 0',
              color: '#2d3748',
              fontSize: '20px'
            }}>Generating PDF...</h3>
            <p style={{
              margin: 0,
              color: '#718096',
              fontSize: '14px'
            }}>Please wait while we prepare your order preview</p>
          </div>
        </div>
      )}
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

        {(['all', 'draft', 'confirmed', 'send_out', 'in_production', 'shipped'] as OrderStatus[]).map((status) => (
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
            {status === 'all' ? 'All' : getStatusLabel(status)}
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
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span>👤 {displayOrder.customerName}</span>
                    <span>📋 Order #: {order.userOrderNumber}</span>
                  </div>
                  <div>
                    {displayOrder.projectName} - {displayOrder.masterFileName} - {displayOrder.layoutName}
                  </div>
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
            <div style={{ marginBottom: '16px' }}>
              {/* Check if order has multiple lines */}
              {(order as any).orderLines && Array.isArray((order as any).orderLines) && (order as any).orderLines.length > 0 ? (
                <>
                  {/* First row: Order Number and Total Quantity */}
                  <div style={{
                    display: 'flex',
                    gap: '24px',
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    {displayOrder.variables.slice(0, 2).map((variable, index) => (
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
                          fontWeight: '600',
                          marginLeft: '6px'
                        }}>
                          {variable.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Lines with individual PDF icons */}
                  {(order as any).orderLines.map((line: any, lineIndex: number) => (
                    <div key={lineIndex} style={{
                      marginBottom: '12px',
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '8px'
                          }}>
                            <div>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>Line {line.lineNumber || lineIndex + 1} Quantity: </span>
                              <span style={{ fontSize: '13px', color: '#1a202c', fontWeight: '500' }}>{line.quantity}</span>
                            </div>
                            {line.componentVariables && Object.entries(line.componentVariables).map(([componentId, componentData]: [string, any]) => (
                              <React.Fragment key={componentId}>
                                {componentData.type === 'multi-line' && componentData.data?.textContent && (
                                  <div>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Multi-line Text: </span>
                                    <span style={{ fontSize: '13px', color: '#1a202c', fontWeight: '500' }}>{componentData.data.textContent}</span>
                                  </div>
                                )}
                                {componentData.type === 'comp-trans' && componentData.data?.compositions?.map((comp: any, idx: number) => (
                                  comp.material && comp.percentage && (
                                    <div key={idx}>
                                      <span style={{ fontSize: '12px', color: '#64748b' }}>Material {idx + 1}: </span>
                                      <span style={{ fontSize: '13px', color: '#1a202c', fontWeight: '500' }}>{comp.percentage}% {comp.material}</span>
                                    </div>
                                  )
                                ))}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                        {/* Individual Line PDF Preview Icon */}
                        {displayOrder.status !== 'draft' && (
                          <button
                            onClick={() => {
                              // Generate PDF for this specific line only
                              const singleLineOrder = {
                                ...order,
                                orderLines: [line]
                              };
                              order2preview(singleLineOrder as any);
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '20px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e0f2fe';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title={`Preview PDF for Line ${line.lineNumber || lineIndex + 1}`}
                          >
                            📄
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                // Old single-line format
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
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
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {/* View + Edit button for draft and confirmed */}
              {(displayOrder.status === 'draft' || displayOrder.status === 'confirmed') && (
                <button
                  onClick={() => onEditOrder(order)}
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
                  👁️ View + Edit
                </button>
              )}

              {/* View button for other statuses */}
              {displayOrder.status !== 'draft' && displayOrder.status !== 'confirmed' && (
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
              )}

              {/* Preview Artwork button - only active for confirmed and later statuses */}
              <button
                onClick={() => displayOrder.status !== 'draft' ? order2preview(order) : null}
                disabled={displayOrder.status === 'draft'}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: displayOrder.status === 'draft' ? '#cbd5e0' : 'white',
                  backgroundColor: displayOrder.status === 'draft' ? '#f1f5f9' : '#8b5cf6',
                  border: displayOrder.status === 'draft' ? '2px solid #e2e8f0' : '2px solid #8b5cf6',
                  borderRadius: '6px',
                  cursor: displayOrder.status === 'draft' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: displayOrder.status === 'draft' ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (displayOrder.status !== 'draft') {
                    e.currentTarget.style.backgroundColor = '#7c3aed';
                    e.currentTarget.style.borderColor = '#7c3aed';
                  }
                }}
                onMouseLeave={(e) => {
                  if (displayOrder.status !== 'draft') {
                    e.currentTarget.style.backgroundColor = '#8b5cf6';
                    e.currentTarget.style.borderColor = '#8b5cf6';
                  }
                }}
              >
                📄 Preview Artwork
              </button>

              {/* Change Status dropdown */}
              <select
                value=""
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
                  if (e.target.value) {
                    handleStatusChange(order.id, e.target.value as OrderStatusValue);
                    e.target.value = ''; // Reset dropdown
                  }
                }}
              >
                <option value="">Change Status ▼</option>
                {/* Show all statuses but dim the unavailable ones */}
                {(['draft', 'confirmed', 'send_out', 'in_production', 'shipped'] as OrderStatusValue[]).map((status) => {
                  const availableStatuses = getAvailableNextStatuses(displayOrder.status);
                  const isAvailable = availableStatuses.includes(status);

                  return (
                    <option
                      key={status}
                      value={status}
                      disabled={!isAvailable}
                      style={{
                        color: isAvailable ? '#1a202c' : '#cbd5e0'
                      }}
                    >
                      {getStatusLabel(status)} {!isAvailable ? '(unavailable)' : ''}
                    </option>
                  );
                })}
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

      {/* Status Change Confirmation Modal */}
      {showStatusConfirmModal && pendingStatusChange && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '450px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a202c'
            }}>
              ⚠️ Confirm Status Change
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '15px',
              color: '#64748b',
              lineHeight: '1.6'
            }}>
              Are you sure you want to change the order status to <strong style={{ color: '#1a202c' }}>{getStatusLabel(pendingStatusChange.newStatus)}</strong>?
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelStatusChange}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#64748b',
                  backgroundColor: 'white',
                  border: '2px solid #cbd5e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                ❌ Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#3b82f6',
                  border: '2px solid #3b82f6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.borderColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
              >
                ✅ Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
