/**
 * NewOrderTab Component
 *
 * NEW tab content for creating new orders
 * Contains: Customer Management, Project Info, Order Data, Submit Options
 */

import React, { useState, useEffect } from 'react';
import { useOrderVariable } from '../contexts/OrderVariableContext';
import { customerService, Customer } from '../services/customerService';
import { projectService, Project } from '../services/projectService';
import { masterFileService } from '../services/masterFileService';

interface OrderFormData {
  // Customer Management
  customerId: string;
  customerName: string;
  contact: string;
  phone: string;
  email: string;
  address: string;

  // Project Information
  projectId: string;
  projectSlug: string;
  layoutId: string; // NEW: Selected layout card from project
  masterId: string;
  masterFileId: string;

  // Order Data
  orderNumber: string;
  quantity: number;
  variableValues: { [key: string]: string | number };

  // Submit Options
  status: 'draft' | 'confirmed' | 'send_out' | 'in_production' | 'shipped';
}

interface MasterFile {
  id: string;
  name: string;
  customerId: string;
}

interface LayoutCard {
  id: string;
  name: string;
  width: number;
  height: number;
  masterFileId?: string;
  createdAt: string;
  updatedAt: string;
}

interface EditingOrder {
  id: string;
  orderNumber?: string; // Sequential number (001, 002, etc.)
  userOrderNumber?: string; // User-entered order number field
  customerId: string;
  projectSlug: string;
  layoutId: string;
  quantity: number;
  variableData: any;
  createdAt: string;
  status: 'draft' | 'confirmed' | 'send_out' | 'in_production' | 'shipped';
}

interface NewOrderTabProps {
  editingOrder?: EditingOrder | null;
  isViewMode?: boolean;
  onClearOrder?: () => void;
}

const NewOrderTab: React.FC<NewOrderTabProps> = ({ editingOrder, isViewMode = false, onClearOrder }) => {
  const { getAllProjects, createProject, createOrder } = useOrderVariable();

  const [formData, setFormData] = useState<OrderFormData>({
    customerId: '',
    customerName: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    projectId: '',
    projectSlug: '',
    layoutId: '',
    masterId: '',
    masterFileId: '',
    orderNumber: '',
    quantity: 1,
    variableValues: {},
    status: 'draft'
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [layoutCards, setLayoutCards] = useState<LayoutCard[]>([]);
  const [masterFiles, setMasterFiles] = useState<MasterFile[]>([]);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingLayouts, setLoadingLayouts] = useState(false);
  const [loadingMasterFiles, setLoadingMasterFiles] = useState(false);

  // Variable mode state - REMOVED: Not needed, variables show automatically if layout has them
  // const [isVariableEnabled, setIsVariableEnabled] = useState(false);

  // Validation modal state
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Variable components from layout
  interface VariableComponent {
    id: string;
    type: 'comp-trans' | 'multi-line';
    name: string; // Component label/name for display
    config: any; // Original component config
  }
  const [variableComponents, setVariableComponents] = useState<VariableComponent[]>([]);

  // Variable values for each component
  interface ComponentVariableData {
    [componentId: string]: {
      type: 'comp-trans' | 'multi-line';
      data: any; // Composition data or text content
      remark?: string; // Variable remark
    };
  }
  const [componentVariables, setComponentVariables] = useState<ComponentVariableData>({});

  // Order lines - each line has quantity and variable data
  interface OrderLine {
    id: string;
    lineNumber: number;
    quantity: number;
    componentVariables: ComponentVariableData;
  }
  const [orderLines, setOrderLines] = useState<OrderLine[]>([
    {
      id: 'line_1',
      lineNumber: 1,
      quantity: 1,
      componentVariables: {}
    }
  ]);

  // Load editing order data
  useEffect(() => {
    if (editingOrder) {
      console.log('📝 Loading order for editing:', editingOrder);

      // Load customer, project, and layout data
      const loadOrderData = async () => {
        try {
          // 1. Load customer data
          const customer = customers.find(c => c.id === editingOrder.customerId);

          // 2. Load project to get projectId
          const allProjects = await projectService.getAllProjects();
          const project = allProjects.find(p => p.slug === editingOrder.projectSlug);

          // 3. Load layout to get masterId
          let masterId = '';
          try {
            const storageKey = `project_${editingOrder.projectSlug}_layouts`;
            const savedLayouts = localStorage.getItem(storageKey);
            if (savedLayouts) {
              const parsedLayouts = JSON.parse(savedLayouts);
              const layout = parsedLayouts.find((l: any) => l.id === editingOrder.layoutId);
              masterId = layout?.canvasData?.masterFileId || '';
            }
          } catch (error) {
            console.error('Error loading layout for masterId:', error);
          }

          // Set all form data
          setFormData(prev => ({
            ...prev,
            customerId: customer?.id || editingOrder.customerId,
            customerName: customer?.customerName || '',
            contact: customer?.person || '',
            phone: customer?.tel || '',
            email: customer?.email || '',
            address: '',
            projectId: project?.id || '',
            projectSlug: editingOrder.projectSlug,
            layoutId: editingOrder.layoutId,
            masterId: masterId,
            quantity: editingOrder.quantity,
            orderNumber: editingOrder.userOrderNumber || '',
          }));

          console.log('✅ Loaded order form data:', {
            customerId: customer?.id,
            projectId: project?.id,
            layoutId: editingOrder.layoutId,
            masterId
          });
        } catch (error) {
          console.error('Error loading order data:', error);
        }
      };

      loadOrderData();

      // Load variable data - set after a delay to ensure layout extraction completes
      setTimeout(() => {
        // Check if order has new multi-line format
        if ((editingOrder as any).orderLines && Array.isArray((editingOrder as any).orderLines)) {
          // New format - load order lines
          setOrderLines((editingOrder as any).orderLines);
          console.log('✅ Loaded order lines:', (editingOrder as any).orderLines);
        } else {
          // Old format - load single variable data (backward compatibility)
          if (editingOrder.variableData) {
            setComponentVariables(editingOrder.variableData);
            // Create a single line with the old data
            setOrderLines([
              {
                id: 'line_1',
                lineNumber: 1,
                quantity: editingOrder.quantity,
                componentVariables: editingOrder.variableData
              }
            ]);
            console.log('✅ Loaded variable data (old format):', editingOrder.variableData);
          }
        }
      }, 200);

      console.log(isViewMode ? '👁️ View Mode: All fields will be disabled' : '✏️ Edit Mode: Fields are editable');
    }
  }, [editingOrder, isViewMode, customers]);

  // Extract variable-enabled components from selected layout
  useEffect(() => {
    const extractVariableComponents = () => {
      if (!formData.layoutId || !formData.projectSlug) {
        setVariableComponents([]);
        setComponentVariables({});
        return;
      }

      try {
        // Load the full layout data
        const storageKey = `project_${formData.projectSlug}_layouts`;
        const savedLayouts = localStorage.getItem(storageKey);

        if (savedLayouts) {
          const parsedLayouts = JSON.parse(savedLayouts);
          const selectedLayout = parsedLayouts.find((layout: any) => layout.id === formData.layoutId);

          if (selectedLayout && selectedLayout.canvasData?.objects) {
            const components: VariableComponent[] = [];

            // Helper function to recursively extract variables from region and slices
            const extractFromRegion = (region: any, regionContents: any) => {
              const hasSlices = region.children && Array.isArray(region.children) && region.children.length > 0;

              if (hasSlices) {
                // Region has slices - extract from slices only
                region.children.forEach((childRegion: any) => {
                  extractFromRegion(childRegion, regionContents);
                });
              } else {
                // Region without slices - extract from regionContents[region.id]
                if (regionContents && regionContents[region.id]) {
                  const contents = regionContents[region.id];
                  if (Array.isArray(contents)) {
                    contents.forEach((content: any, contentIndex: number) => {
                      if (content.type === 'new-comp-trans' &&
                          content.newCompTransConfig?.isVariableEnabled) {
                        const remark = content.newCompTransConfig?.variableRemark;
                        components.push({
                          id: `${region.id}_content_${contentIndex}`,
                          type: 'comp-trans',
                          name: remark ? `Composition Translation (${remark})` : `Composition Translation (${region.id})`,
                          config: content.newCompTransConfig
                        });
                      }

                      if (content.type === 'new-multi-line' &&
                          content.newMultiLineConfig?.isVariableEnabled) {
                        const remark = content.newMultiLineConfig?.variableRemark;
                        components.push({
                          id: `${region.id}_content_${contentIndex}`,
                          type: 'multi-line',
                          name: remark ? `Multi-line Text (${remark})` : `Multi-line Text (${region.id})`,
                          config: content.newMultiLineConfig
                        });
                      }
                    });
                  }
                }
              }
            };

            // Extract from all regions (including slices)
            selectedLayout.canvasData.objects.forEach((obj: any, objIndex: number) => {
              const isChildMother = obj.type === 'mother' && (
                /Mother_\d+[A-Z]/.test(obj.name) ||
                obj.copiedFrom ||
                obj.isChild
              );

              if (isChildMother) return;

              if (obj.regions && Array.isArray(obj.regions)) {
                obj.regions.forEach((region: any) => {
                  extractFromRegion(region, selectedLayout.regionContents);
                });
              }
            });

            setVariableComponents(components);
            console.log(`✅ Found ${components.length} variable-enabled components in layout:`, components);

            // Only initialize with empty data if NOT loading an existing order
            // If we're loading an order (editingOrder exists), the data will be loaded separately
            if (!editingOrder) {
              // Initialize component variables with empty data for new orders
              const initialData: ComponentVariableData = {};
              components.forEach(comp => {
                console.log('🏷️ Initializing component with remark:', comp.id, 'remark:', comp.config?.variableRemark);
                if (comp.type === 'comp-trans') {
                  // Initialize with default composition structure
                  initialData[comp.id] = {
                    type: 'comp-trans',
                    data: {
                      compositions: [
                        { material: '', percentage: '' }
                      ]
                    },
                    remark: comp.config?.variableRemark || '' // Add remark from config
                  };
                } else if (comp.type === 'multi-line') {
                  // Initialize with empty text
                  initialData[comp.id] = {
                    type: 'multi-line',
                    data: {
                      textContent: ''
                    },
                    remark: comp.config?.variableRemark || '' // Add remark from config
                  };
                }
              });
              console.log('📦 Final initialData with remarks:', initialData);
              setComponentVariables(initialData);

              // Also initialize for all order lines
              setOrderLines(orderLines.map(line => ({
                ...line,
                componentVariables: initialData
              })));

              console.log('📝 Initialized empty variable data for new order and all lines');
            } else {
              console.log('📋 Skipping initialization - loading existing order data');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error extracting variable components from layout:', error);
        setVariableComponents([]);
      }
    };

    extractVariableComponents();
  }, [formData.layoutId, formData.projectSlug]);

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const allCustomers = await customerService.getAllCustomers();
        setCustomers(allCustomers);
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  // Load projects and master files for selected customer
  useEffect(() => {
    const loadCustomerData = async () => {
      if (!formData.customerId || formData.customerId === 'new') {
        setProjects([]);
        setMasterFiles([]);
        return;
      }

      // Load projects for this customer
      setLoadingProjects(true);
      try {
        const allProjects = await projectService.getAllProjects();
        const customerProjects = allProjects.filter(p => p.customerId === formData.customerId);
        setProjects(customerProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoadingProjects(false);
      }

      // Load master files for this customer
      setLoadingMasterFiles(true);
      try {
        const response = await masterFileService.getAllMasterFiles();
        if (response.success && response.data) {
          const customerMasterFiles = response.data
            .filter(mf => mf.customerId === formData.customerId)
            .map(mf => ({
              id: mf.id,
              name: mf.name,
              customerId: mf.customerId,
              designData: (mf as any).designData // Include designData to access unitPrice
            }));
          setMasterFiles(customerMasterFiles as any);
        }
      } catch (error) {
        console.error('Failed to load master files:', error);
      } finally {
        setLoadingMasterFiles(false);
      }
    };

    loadCustomerData();
  }, [formData.customerId]);

  // Helper function to check if a layout has variable-enabled components
  const layoutHasVariables = (layoutId: string): boolean => {
    if (!formData.projectSlug) return false;

    try {
      const storageKey = `project_${formData.projectSlug}_layouts`;
      const savedLayouts = localStorage.getItem(storageKey);

      if (savedLayouts) {
        const parsedLayouts = JSON.parse(savedLayouts);
        const layout = parsedLayouts.find((l: any) => l.id === layoutId);

        if (!layout) return false;

        // Helper to check if content is a variable
        const isVariableContent = (content: any): boolean => {
          return (content.type === 'new-comp-trans' && content.newCompTransConfig?.isVariableEnabled) ||
                 (content.type === 'new-multi-line' && content.newMultiLineConfig?.isVariableEnabled);
        };

        // Helper to recursively check region and its slices
        const regionHasVariables = (region: any, regionContents: any): boolean => {
          const hasSlices = region.children && Array.isArray(region.children) && region.children.length > 0;

          if (hasSlices) {
            // Region has slices - check slices only
            return region.children.some((childRegion: any) => regionHasVariables(childRegion, regionContents));
          } else {
            // Region without slices - check regionContents[region.id]
            if (regionContents && regionContents[region.id]) {
              const contents = regionContents[region.id];
              if (Array.isArray(contents)) {
                return contents.some((content: any) => isVariableContent(content));
              }
            }
          }
          return false;
        };

        // Scan all regions (including slices)
        if (layout.canvasData?.objects) {
          const hasVariables = layout.canvasData.objects.some((obj: any) => {
            const isChildMother = obj.type === 'mother' && (
              /Mother_\d+[A-Z]/.test(obj.name) ||
              obj.copiedFrom ||
              obj.isChild
            );

            if (isChildMother) return false;

            if (obj.regions && Array.isArray(obj.regions)) {
              return obj.regions.some((region: any) =>
                regionHasVariables(region, layout.regionContents)
              );
            }
            return false;
          });

          if (hasVariables) return true;
        }

        return false;
      }
    } catch (error) {
      console.error('Error checking layout variables:', error);
    }
    return false;
  };

  // Load layout cards for selected project AND master file
  useEffect(() => {
    const loadProjectLayouts = () => {
      if (!formData.projectId || !formData.projectSlug || !formData.masterId) {
        setLayoutCards([]);
        return;
      }

      setLoadingLayouts(true);
      try {
        // Load layouts from localStorage
        const storageKey = `project_${formData.projectSlug}_layouts`;
        const savedLayouts = localStorage.getItem(storageKey);

        if (savedLayouts) {
          const parsedLayouts = JSON.parse(savedLayouts);

          // Filter layouts to only show those created with the selected master file
          const filteredLayouts = parsedLayouts.filter((layout: any) =>
            layout.canvasData?.masterFileId === formData.masterId
          );

          const layouts = filteredLayouts.map((layout: any, index: number) => {
            // Get actual dimensions from canvasData objects (same logic as Master Files Management)
            let width = 200;
            let height = 189;

            if (layout.canvasData?.objects && Array.isArray(layout.canvasData.objects) && layout.canvasData.objects.length > 0) {
              // Find the largest object (usually the mother)
              const objects = layout.canvasData.objects;
              let largestObject = objects[0];
              let maxArea = largestObject.width * largestObject.height;

              objects.forEach((obj: any) => {
                const area = obj.width * obj.height;
                if (area > maxArea) {
                  maxArea = area;
                  largestObject = obj;
                }
              });

              width = largestObject.width;
              height = largestObject.height;
            }

            return {
              id: layout.id || `layout_${index}`,
              name: layout.name || `Layout ${index + 1}`,
              width,
              height,
              masterFileId: layout.canvasData?.masterFileId,
              createdAt: layout.createdAt || new Date().toISOString(),
              updatedAt: layout.updatedAt || layout.createdAt || new Date().toISOString()
            };
          });
          setLayoutCards(layouts);
          console.log(`✅ Loaded ${layouts.length} layout cards for project ${formData.projectSlug} with master file ${formData.masterId}`);
        } else {
          setLayoutCards([]);
          console.log(`📝 No saved layouts found for project ${formData.projectSlug}`);
        }
      } catch (error) {
        console.error('❌ Error loading project layouts:', error);
        setLayoutCards([]);
      } finally {
        setLoadingLayouts(false);
      }
    };

    loadProjectLayouts();
  }, [formData.projectId, formData.projectSlug, formData.masterId]);

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    const selectedCustomer = customers.find(c => c.id === customerId);

    if (selectedCustomer) {
      setFormData({
        ...formData,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.customerName,
        contact: selectedCustomer.person,
        phone: selectedCustomer.tel,
        email: selectedCustomer.email,
        address: '', // Customer service doesn't have address field, leave empty
        projectId: '', // Reset project, layout and master file when customer changes
        projectSlug: '',
        layoutId: '',
        masterId: ''
      });
    } else {
      // Clear customer data if "New Customer" is selected
      setFormData({
        ...formData,
        customerId: '',
        customerName: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        projectId: '',
        projectSlug: '',
        layoutId: '',
        masterId: ''
      });
    }
  };

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    const selectedProject = projects.find(p => p.id === projectId);

    if (selectedProject) {
      setFormData({
        ...formData,
        projectId: selectedProject.id,
        projectSlug: selectedProject.slug,
        masterId: '', // Reset master file when project changes
        layoutId: '' // Reset layout when project changes
      });
    } else {
      setFormData({
        ...formData,
        projectId: '',
        projectSlug: '',
        masterId: '',
        layoutId: ''
      });
    }
  };

  // Handle master file selection
  const handleMasterFileSelect = (masterId: string) => {
    setFormData({
      ...formData,
      masterId: masterId,
      layoutId: '' // Reset layout when master file changes
    });
  };

  // Language code to translation index mapping (matches NewCompTransDialog)
  const languageCodeToTranslationIndex: { [key: string]: number } = {
    'ES': 0,  // Spanish
    'FR': 1,  // French
    'EN': 2,  // English
    'PT': 3,  // Portuguese
    'DU': 4,  // Dutch
    'IT': 5,  // Italian
    'GR': 6,  // Greek
    'JA': 7,  // Japanese
    'DE': 8,  // German
    'DA': 9,  // Danish
    'SL': 10, // Slovenian
    'CH': 11, // Chinese
    'KO': 12, // Korean
    'ID': 13, // Indonesian
    'AR': 14, // Arabic
    'GA': 15, // Galician
    'CA': 16, // Catalan
    'BS': 17  // Basque
  };

  // Material options for composition dropdown
  const materialOptions = [
    'Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Nylon',
    'Acrylic', 'Rayon', 'Spandex', 'Elastane', 'Viscose', 'Modal'
  ];

  // Add new order line
  const handleAddLine = () => {
    const newLineNumber = orderLines.length + 1;

    // Initialize with the same structure as existing lines
    const initialData: ComponentVariableData = {};
    variableComponents.forEach(comp => {
      if (comp.type === 'comp-trans') {
        initialData[comp.id] = {
          type: 'comp-trans',
          data: {
            compositions: [
              { material: '', percentage: '' }
            ]
          }
        };
      } else if (comp.type === 'multi-line') {
        initialData[comp.id] = {
          type: 'multi-line',
          data: {
            textContent: ''
          }
        };
      }
    });

    const newLine: OrderLine = {
      id: `line_${newLineNumber}`,
      lineNumber: newLineNumber,
      quantity: 1,
      componentVariables: initialData
    };
    setOrderLines([...orderLines, newLine]);
  };

  // Remove order line
  const handleRemoveLine = (lineId: string) => {
    if (orderLines.length === 1) {
      alert('Cannot remove the last line');
      return;
    }
    const updatedLines = orderLines
      .filter(line => line.id !== lineId)
      .map((line, index) => ({
        ...line,
        lineNumber: index + 1,
        id: `line_${index + 1}`
      }));
    setOrderLines(updatedLines);
  };

  // Update line quantity
  const handleUpdateLineQuantity = (lineId: string, quantity: number) => {
    setOrderLines(orderLines.map(line =>
      line.id === lineId ? { ...line, quantity } : line
    ));
  };

  // Update line component variables
  const handleUpdateLineComponentVariables = (lineId: string, componentId: string, data: any) => {
    setOrderLines(orderLines.map(line => {
      if (line.id === lineId) {
        return {
          ...line,
          componentVariables: {
            ...line.componentVariables,
            [componentId]: data
          }
        };
      }
      return line;
    }));
  };

  const saveToOrderManagement = (status: 'draft' | 'confirmed') => {
    console.log('💾 saveToOrderManagement called with status:', status);

    // Get existing orders
    const existingOrders = JSON.parse(localStorage.getItem('order_management') || '[]');

    // Calculate total quantity from all lines
    const totalQuantity = orderLines.reduce((sum, line) => sum + (line.quantity || 0), 0);

    // Get master file name and unit price from selected master file
    const selectedMasterFile = masterFiles.find(mf => mf.id === formData.masterId);
    const masterFileName = selectedMasterFile?.name || formData.masterId || 'N/A';

    // Extract unit price from master file
    let unitPrice = '';
    if (selectedMasterFile && (selectedMasterFile as any).designData?.objects) {
      const motherWithPrice = (selectedMasterFile as any).designData.objects.find((obj: any) =>
        obj.type === 'mother' && obj.unitPrice
      );
      unitPrice = motherWithPrice?.unitPrice || '';
    }

    // Get customer currency
    const selectedCustomer = customers.find(c => c.id === formData.customerId);
    const currency = selectedCustomer?.currency || '';

    // Clear actualPageCount from order lines if comp-trans DATA changes were made
    const orderLinesWithClearedPageCounts = orderLines.map(line => {
      if (!editingOrder) return line;

      // Find the original line from the editing order
      const originalOrderLines = (editingOrder as any).orderLines || [];
      const originalLine = originalOrderLines.find((ol: any) => ol.lineNumber === line.lineNumber);

      if (!originalLine) return line;

      // Check if comp-trans DATA has changed (not just quantity)
      let hasCompTransDataChanged = false;

      Object.entries(line.componentVariables).forEach(([componentId, componentData]: [string, any]) => {
        if (componentData.type === 'comp-trans') {
          const originalComponentData = originalLine.componentVariables?.[componentId];

          if (!originalComponentData) {
            hasCompTransDataChanged = true;
            return;
          }

          // Compare compositions (material and percentage)
          const currentCompositions = componentData.data?.compositions || [];
          const originalCompositions = originalComponentData.data?.compositions || [];

          // Check if composition data is different
          if (currentCompositions.length !== originalCompositions.length) {
            hasCompTransDataChanged = true;
            return;
          }

          // Compare each composition
          for (let i = 0; i < currentCompositions.length; i++) {
            const current = currentCompositions[i];
            const original = originalCompositions[i];

            if (current.material !== original.material ||
                String(current.percentage) !== String(original.percentage)) {
              hasCompTransDataChanged = true;
              return;
            }
          }
        }
      });

      if (hasCompTransDataChanged) {
        // Clear the actualPageCount to trigger recalculation
        const { actualPageCount, ...lineWithoutPageCount } = line as any;
        console.log(`🔄 Clearing actualPageCount for line ${line.lineNumber} due to composition data changes`);
        return lineWithoutPageCount;
      }

      return line;
    });

    // Check if we're editing an existing order
    if (editingOrder) {
      console.log('✏️ Updating existing order:', editingOrder.id);

      const orderData = {
        ...editingOrder, // Keep existing data like id, orderNumber, createdAt
        userOrderNumber: formData.orderNumber, // Update user-entered order number
        customerId: formData.customerId,
        customerName: formData.customerName,
        projectSlug: formData.projectSlug,
        layoutId: formData.layoutId,
        masterFileId: formData.masterId,
        masterFileName: masterFileName,
        quantity: totalQuantity,
        orderLines: orderLinesWithClearedPageCounts, // Use cleared page counts
        variableData: componentVariables,
        currency: currency,
        unitPrice: unitPrice,
        status: status
      };

      // Update the existing order in the array
      const updatedOrders = existingOrders.map((o: any) =>
        o.id === editingOrder.id ? orderData : o
      );

      localStorage.setItem('order_management', JSON.stringify(updatedOrders));
      console.log('✅ Order updated successfully!');

      return orderData;
    } else {
      // Creating new order
      const nextOrderNumber = String(existingOrders.length + 1).padStart(3, '0');
      const orderIdTimestamp = Date.now();

      const orderData = {
        id: `order_${orderIdTimestamp}`,
        orderNumber: nextOrderNumber,
        userOrderNumber: formData.orderNumber,
        customerId: formData.customerId,
        customerName: formData.customerName,
        projectSlug: formData.projectSlug,
        layoutId: formData.layoutId,
        masterFileId: formData.masterId,
        masterFileName: masterFileName,
        quantity: totalQuantity,
        orderLines: orderLines, // For new orders, no need to clear page counts
        variableData: componentVariables,
        currency: currency,
        unitPrice: unitPrice,
        createdAt: new Date().toISOString(),
        status: status
      };

      console.log('📦 Order data to save:', orderData);
      console.log('📚 Existing orders before save:', existingOrders.length);

      // Save to localStorage (order management)
      existingOrders.push(orderData);
      localStorage.setItem('order_management', JSON.stringify(existingOrders));

      console.log('✅ Order saved! Total orders now:', existingOrders.length);
      console.log('💽 Saved to localStorage key: "order_management"');

      // Verify the save
      const verification = localStorage.getItem('order_management');
      console.log('🔍 Verification - localStorage now contains:', verification ? JSON.parse(verification).length + ' orders' : 'No data');

      return orderData;
    }
  };

  const handleSaveDraft = () => {
    saveToOrderManagement('draft');
    alert('💾 Order saved as draft');
    setShowValidationModal(false);

    // Reset form
    setFormData({
      customerId: '',
      customerName: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      projectId: '',
      projectSlug: '',
      layoutId: '',
      masterId: '',
      masterFileId: '',
      orderNumber: '',
      quantity: 1,
      variableValues: {},
      status: 'draft'
    });
    setComponentVariables({});
    setOrderLines([
      {
        id: 'line_1',
        lineNumber: 1,
        quantity: 1,
        componentVariables: {}
      }
    ]);
  };

  const handleContinueInput = () => {
    setShowValidationModal(false);
  };

  const handleSubmitOrder = () => {
    // This is not used anymore - keeping for backwards compatibility
    console.log('Submit Order:', formData);
  };

  // Validate for draft - only check basic required fields
  const validateForDraft = (): { isValid: boolean; missingFields: string[] } => {
    const missing: string[] = [];

    // Check only basic required fields for draft
    if (!formData.customerId) missing.push('Customer');
    if (!formData.projectSlug) missing.push('Project');
    if (!formData.layoutId) missing.push('Layout');

    // Check total quantity from all lines
    const totalQuantity = orderLines.reduce((sum, line) => sum + (line.quantity || 0), 0);
    if (!totalQuantity || totalQuantity <= 0) missing.push('Quantity (at least one line must have quantity > 0)');

    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  };

  // Validate for complete - check all fields including composition percentages
  const validateForComplete = (): { isValid: boolean; missingFields: string[] } => {
    const missing: string[] = [];

    // Check basic fields
    if (!formData.customerId) missing.push('Customer');
    if (!formData.customerName) missing.push('Customer Name');
    if (!formData.orderNumber) missing.push('Order Number (PO#)');
    if (!formData.projectSlug) missing.push('Project');
    if (!formData.layoutId) missing.push('Layout');

    // Check if master file exists for the selected layout
    if (formData.layoutId && formData.projectSlug) {
      try {
        const storageKey = `project_${formData.projectSlug}_layouts`;
        const savedLayouts = localStorage.getItem(storageKey);
        if (savedLayouts) {
          const parsedLayouts = JSON.parse(savedLayouts);
          const layout = parsedLayouts.find((l: any) => l.id === formData.layoutId);
          if (!layout?.canvasData?.masterFileId && !layout?.canvasData?.masterFileName) {
            missing.push('Master File (layout is missing master file information)');
          }
        }
      } catch (error) {
        console.error('Error checking master file:', error);
      }
    }

    // Check total quantity from all lines
    const totalQuantity = orderLines.reduce((sum, line) => sum + (line.quantity || 0), 0);
    if (!totalQuantity || totalQuantity <= 0) missing.push('Quantity (at least one line must have quantity > 0)');

    // Check variable components data for ALL lines
    orderLines.forEach((line, lineIndex) => {
      variableComponents.forEach((component) => {
        const componentData = line.componentVariables[component.id];

        if (component.type === 'comp-trans') {
          const compositions = componentData?.data?.compositions || [];
          if (compositions.length === 0) {
            missing.push(`Line ${line.lineNumber} - ${component.name} - no materials added`);
          } else {
            // Check if all fields are filled
            compositions.forEach((comp: any, index: number) => {
              if (!comp.material) {
                missing.push(`Line ${line.lineNumber} - ${component.name} - Material ${index + 1} not selected`);
              }
              if (!comp.percentage || comp.percentage === '') {
                missing.push(`Line ${line.lineNumber} - ${component.name} - Percentage ${index + 1} not filled`);
              }
            });

            // Check if total percentage = 100%
            const totalPercentage = compositions.reduce((sum: number, c: any) => sum + (parseFloat(c.percentage) || 0), 0);
            if (totalPercentage !== 100) {
              missing.push(`Line ${line.lineNumber} - ${component.name} - Total percentage must equal 100% (currently ${totalPercentage}%)`);
            }
          }
        } else if (component.type === 'multi-line') {
          if (!componentData?.data?.textContent) {
            missing.push(`Line ${line.lineNumber} - ${component.name} - text content not filled`);
          }
        }
      });
    });

    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  };

  const handleSubmit = () => {
    // Check if can be saved as complete
    const completeValidation = validateForComplete();

    if (completeValidation.isValid) {
      // All fields valid including percentage = 100% - save as confirmed
      saveToOrderManagement('confirmed');
      setShowSuccessModal(true);
    } else {
      // Check if can at least be saved as draft
      const draftValidation = validateForDraft();

      if (draftValidation.isValid) {
        // Basic fields filled but composition incomplete - can only save as draft
        setValidationErrors(completeValidation.missingFields);
        setShowValidationModal(true);
      } else {
        // Even basic fields not filled - show all missing fields
        setValidationErrors(draftValidation.missingFields);
        setShowValidationModal(true);
      }
    }
  };

  const handleNewOrder = () => {
    // Reset form for new order
    setFormData({
      customerId: '',
      customerName: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      projectId: '',
      projectSlug: '',
      layoutId: '',
      masterId: '',
      masterFileId: '',
      orderNumber: '',
      quantity: 1,
      variableValues: {},
      status: 'draft'
    });
    setComponentVariables({});
    setOrderLines([
      {
        id: 'line_1',
        lineNumber: 1,
        quantity: 1,
        componentVariables: {}
      }
    ]);
    setShowSuccessModal(false);
  };

  const handleGoToOrderManagement = () => {
    // Reset form
    setFormData({
      customerId: '',
      customerName: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      projectId: '',
      projectSlug: '',
      layoutId: '',
      masterId: '',
      masterFileId: '',
      orderNumber: '',
      quantity: 1,
      variableValues: {},
      status: 'draft'
    });
    setComponentVariables({});
    setOrderLines([
      {
        id: 'line_1',
        lineNumber: 1,
        quantity: 1,
        componentVariables: {}
      }
    ]);
    setShowSuccessModal(false);

    // Call parent to switch to order history tab
    if (onClearOrder) {
      onClearOrder();
    }
  };

  // Helper variable for disabled state
  const isDisabled = isViewMode;

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header with Back Button (when viewing/editing existing order) */}
      {editingOrder && (
        <div style={{
          backgroundColor: isViewMode ? '#eff6ff' : '#ecfdf5',
          borderRadius: '8px',
          padding: '16px 24px',
          marginBottom: '24px',
          border: `2px solid ${isViewMode ? '#3b82f6' : '#10b981'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: isViewMode ? '#1e40af' : '#047857'
            }}>
              {isViewMode ? '👁️ VIEW MODE' : '✏️ EDIT MODE'}
            </span>
            <span style={{
              fontSize: '14px',
              color: '#64748b'
            }}>
              Order #{editingOrder.orderNumber || editingOrder.id.split('_')[1] || editingOrder.id}
            </span>
          </div>
          <button
            onClick={onClearOrder}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#64748b',
              backgroundColor: 'white',
              border: '2px solid #cbd5e0',
              borderRadius: '6px',
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
            ← Back to Order History
          </button>
        </div>
      )}

      {/* a) CUSTOMER MANAGEMENT */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a202c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          👤 CUSTOMER MANAGEMENT
        </h3>

        {/* Customer Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#4a5568',
            marginBottom: '6px'
          }}>
            Select Customer <span style={{ color: '#3b82f6' }}>*</span>
          </label>
          <select
            value={formData.customerId}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            disabled={loadingCustomers || isViewMode}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '2px solid #3b82f6',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: loadingCustomers ? '#f7fafc' : 'white',
              cursor: loadingCustomers ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">
              {loadingCustomers ? 'Loading customers...' : '-- Select Existing Customer or Create New --'}
            </option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.customerName} ({customer.person})
              </option>
            ))}
            <option value="new" style={{ fontWeight: 'bold', color: '#3b82f6' }}>
              ➕ Create New Customer
            </option>
          </select>
        </div>

        {/* Customer Details - Auto-filled or Editable */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          padding: '16px',
          backgroundColor: formData.customerId ? '#f0f9ff' : '#f7fafc',
          borderRadius: '6px',
          border: `2px dashed ${formData.customerId ? '#3b82f6' : '#cbd5e0'}`
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Customer Name
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="ABC Garment Factory"
              disabled={(!!formData.customerId && formData.customerId !== 'new') || isDisabled}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: (!!formData.customerId && formData.customerId !== 'new') ? '#e2e8f0' : 'white',
                cursor: (!!formData.customerId && formData.customerId !== 'new') ? 'not-allowed' : 'text',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!formData.customerId || formData.customerId === 'new') {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }
              }}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Contact Person
            </label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="John Smith"
              disabled={(!!formData.customerId && formData.customerId !== 'new') || isDisabled}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: (!!formData.customerId && formData.customerId !== 'new') ? '#e2e8f0' : 'white',
                cursor: (!!formData.customerId && formData.customerId !== 'new') ? 'not-allowed' : 'text',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!formData.customerId || formData.customerId === 'new') {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }
              }}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-555-1234"
              disabled={(!!formData.customerId && formData.customerId !== 'new') || isDisabled}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: (!!formData.customerId && formData.customerId !== 'new') ? '#e2e8f0' : 'white',
                cursor: (!!formData.customerId && formData.customerId !== 'new') ? 'not-allowed' : 'text',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!formData.customerId || formData.customerId === 'new') {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }
              }}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@abc.com"
              disabled={(!!formData.customerId && formData.customerId !== 'new') || isDisabled}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: (!!formData.customerId && formData.customerId !== 'new') ? '#e2e8f0' : 'white',
                cursor: (!!formData.customerId && formData.customerId !== 'new') ? 'not-allowed' : 'text',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!formData.customerId || formData.customerId === 'new') {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }
              }}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Address (Optional)
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street, City, Country"
              disabled={isDisabled}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          {formData.customerId && formData.customerId !== 'new' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{
                fontSize: '13px',
                color: '#3b82f6',
                margin: 0,
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ℹ️ Customer data loaded from Master File. Fields are read-only.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* b) PROJECT INFORMATION */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a202c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📋 PROJECT INFORMATION
        </h3>

        {!formData.customerId || formData.customerId === 'new' ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#fff7ed',
            border: '2px dashed #fb923c',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#c2410c',
              margin: 0,
              fontWeight: '500'
            }}>
              ⚠️ Please select a customer first to view related projects and master files
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '16px',
            padding: '16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '6px',
            border: '2px dashed #3b82f6'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                marginBottom: '6px'
              }}>
                Project Name <span style={{ color: '#3b82f6' }}>*</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                disabled={loadingProjects || projects.length === 0 || isDisabled}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: (loadingProjects || projects.length === 0) ? '#f7fafc' : 'white',
                  cursor: (loadingProjects || projects.length === 0) ? 'not-allowed' : 'pointer',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  if (!loadingProjects && projects.length > 0) {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }
                }}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="">
                  {loadingProjects ? 'Loading projects...' :
                   projects.length === 0 ? 'No projects found for this customer' :
                   'Select Project...'}
                </option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {!loadingProjects && projects.length > 0 && (
                <p style={{
                  fontSize: '12px',
                  color: '#10b981',
                  margin: '4px 0 0 0',
                  fontStyle: 'italic'
                }}>
                  ✓ {projects.length} project(s) found
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                marginBottom: '6px'
              }}>
                Master File <span style={{ color: '#3b82f6' }}>*</span>
              </label>
              <select
                value={formData.masterId}
                onChange={(e) => handleMasterFileSelect(e.target.value)}
                disabled={loadingMasterFiles || masterFiles.length === 0 || isDisabled}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: (loadingMasterFiles || masterFiles.length === 0) ? '#f7fafc' : 'white',
                  cursor: (loadingMasterFiles || masterFiles.length === 0) ? 'not-allowed' : 'pointer',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  if (!loadingMasterFiles && masterFiles.length > 0) {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }
                }}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="">
                  {loadingMasterFiles ? 'Loading master files...' :
                   masterFiles.length === 0 ? 'No master files found for this customer' :
                   'Select Master File...'}
                </option>
                {masterFiles.map(masterFile => (
                  <option key={masterFile.id} value={masterFile.id}>
                    {masterFile.name}
                  </option>
                ))}
              </select>
              {!loadingMasterFiles && masterFiles.length > 0 && (
                <p style={{
                  fontSize: '12px',
                  color: '#10b981',
                  margin: '4px 0 0 0',
                  fontStyle: 'italic'
                }}>
                  ✓ {masterFiles.length} master file(s) found
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                marginBottom: '6px'
              }}>
                Layout Card <span style={{ color: '#3b82f6' }}>*</span>
              </label>
              <select
                value={formData.layoutId}
                onChange={(e) => setFormData({ ...formData, layoutId: e.target.value })}
                disabled={loadingLayouts || layoutCards.length === 0 || !formData.masterId || isDisabled}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: (loadingLayouts || layoutCards.length === 0 || !formData.masterId) ? '#f7fafc' : 'white',
                  cursor: (loadingLayouts || layoutCards.length === 0 || !formData.masterId) ? 'not-allowed' : 'pointer',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  if (!loadingLayouts && layoutCards.length > 0 && formData.masterId) {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }
                }}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="">
                  {!formData.masterId ? 'Select master file first' :
                   loadingLayouts ? 'Loading layouts...' :
                   layoutCards.length === 0 ? 'No layouts found for this master file' :
                   'Select Layout Card...'}
                </option>
                {layoutCards.map(layout => (
                  <option key={layout.id} value={layout.id}>
                    {layoutHasVariables(layout.id) ? '🔄 ' : ''}{layout.name} ({layout.width}×{layout.height}mm)
                  </option>
                ))}
              </select>
              {!loadingLayouts && layoutCards.length > 0 && formData.masterId && (
                <p style={{
                  fontSize: '12px',
                  color: '#10b981',
                  margin: '4px 0 0 0',
                  fontStyle: 'italic'
                }}>
                  ✓ {layoutCards.length} layout card(s) found
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                marginBottom: '6px'
              }}>
                Layout Created Date
              </label>
              <input
                type="text"
                value={(() => {
                  // Get layout creation date
                  if (formData.layoutId && formData.projectSlug) {
                    try {
                      const storageKey = `project_${formData.projectSlug}_layouts`;
                      const savedLayouts = localStorage.getItem(storageKey);
                      if (savedLayouts) {
                        const parsedLayouts = JSON.parse(savedLayouts);
                        const layout = parsedLayouts.find((l: any) => l.id === formData.layoutId);
                        if (layout?.createdAt) {
                          return new Date(layout.createdAt).toLocaleDateString();
                        }
                      }
                    } catch (error) {
                      console.error('Error getting layout date:', error);
                    }
                  }
                  return 'Select a layout';
                })()}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#f7fafc',
                  color: '#718096',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* c) ORDER DATA */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a202c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📝 ORDER DATA
        </h3>

        {/* Order Number, Total Quantity, and Unit Price */}
        <div style={{
          display: 'flex',
          gap: '32px',
          marginBottom: '20px',
          alignItems: 'flex-end'
        }}>
          {/* Order Number */}
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Order Number
            </label>
            <input
              type="text"
              value={formData.orderNumber}
              onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              placeholder="#001"
              disabled={isDisabled}
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Total Quantity */}
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Total Quantity(pcs)
            </label>
            <div style={{
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#f8f9fa',
              color: '#1a202c',
              fontWeight: '600',
              maxWidth: '300px'
            }}>
              {orderLines.reduce((sum, line) => sum + (line.quantity || 0), 0)}
            </div>
          </div>

          {/* Unit Price */}
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '6px'
            }}>
              Unit Price {(() => {
                const selectedCustomer = customers.find(c => c.id === formData.customerId);
                return selectedCustomer?.currency ? `(${selectedCustomer.currency})` : '';
              })()}
            </label>
            <input
              type="text"
              value={(() => {
                const selectedMasterFile = masterFiles.find(mf => mf.id === formData.masterId);
                if (selectedMasterFile && (selectedMasterFile as any).designData?.objects) {
                  const motherWithPrice = (selectedMasterFile as any).designData.objects.find((obj: any) =>
                    obj.type === 'mother' && obj.unitPrice
                  );
                  return motherWithPrice?.unitPrice || '';
                }
                return '';
              })()}
              disabled={true}
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#f8f9fa',
                color: '#1a202c',
                fontWeight: '600',
                cursor: 'not-allowed'
              }}
            />
          </div>
        </div>

        {/* Add Line Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: '16px'
        }}>
          <button
            onClick={handleAddLine}
            disabled={isDisabled}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#10b981',
              border: '2px solid #10b981',
              borderRadius: '6px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              if (!isDisabled) {
                e.currentTarget.style.backgroundColor = '#059669';
                e.currentTarget.style.borderColor = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDisabled) {
                e.currentTarget.style.backgroundColor = '#10b981';
                e.currentTarget.style.borderColor = '#10b981';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span> Add Layout
          </button>
        </div>

        {/* Order Lines */}
        {orderLines.map((line, lineIndex) => (
          <div key={line.id} style={{
            marginBottom: '24px',
            padding: '20px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            backgroundColor: '#fafbfc'
          }}>
            {/* Line Header with Line Number and Delete Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <h4 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#1a202c'
              }}>
                Layout {line.lineNumber}
              </h4>
              {orderLines.length > 1 && (
                <button
                  onClick={() => handleRemoveLine(line.id)}
                  disabled={isDisabled}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#ef4444',
                    backgroundColor: 'transparent',
                    border: '2px solid #ef4444',
                    borderRadius: '6px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  🗑️ Delete
                </button>
              )}
            </div>

            {/* Quantity + Variable Components Container */}
            <div style={{
              display: 'flex',
              gap: '32px',
              alignItems: 'flex-start'
            }}>
              {/* Left 20% - Order Quantity */}
              <div style={{
                width: '20%',
                minWidth: '150px',
                flexShrink: 0
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#4a5568',
                  marginBottom: '6px'
                }}>
                  Order Quantity (pcs)
                </label>
                <input
                  type="number"
                  value={line.quantity}
                  onChange={(e) => handleUpdateLineQuantity(line.id, parseInt(e.target.value) || 1)}
                  min="1"
                  disabled={isDisabled}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Right 80% - Variable Components Section */}
              <div style={{
                flex: 1,
                minWidth: 0
              }}>
                {/* Variable Components Label */}
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#4a5568',
                  marginBottom: '6px'
                }}>
                  {formData.layoutId && variableComponents.length > 0
                    ? `📋 Variable Components (${variableComponents.length} found from "${layoutCards.find(l => l.id === formData.layoutId)?.name || 'layout'}")`
                    : 'Variable Components'}
                </label>

                {/* Display selected languages for comp-trans components */}
                {formData.layoutId && variableComponents.some(comp => comp.type === 'comp-trans' && comp.config?.selectedLanguages) && (
                  <div style={{
                    marginBottom: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #dbeafe',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#1e40af'
                  }}>
                    {(() => {
                      const compTransWithLangs = variableComponents.find(comp => comp.type === 'comp-trans' && comp.config?.selectedLanguages);
                      if (compTransWithLangs) {
                        const selectedLangs = compTransWithLangs.config.selectedLanguages || [];
                        const languageSequence = compTransWithLangs.config.languageSequence || {};

                        // Sort languages by selection sequence order (1, 2, 3, 4...)
                        const sortedLangs = [...selectedLangs].sort((a, b) => {
                          const seqA = languageSequence[a] || 0;
                          const seqB = languageSequence[b] || 0;
                          return seqA - seqB;
                        });

                        // Get language full names
                        const availableLanguages = [
                          { code: 'AR', name: 'Arabic' },
                          { code: 'BS', name: 'Basque' },
                          { code: 'CA', name: 'Catalan' },
                          { code: 'CH', name: 'Chinese' },
                          { code: 'DA', name: 'Danish' },
                          { code: 'DU', name: 'Dutch' },
                          { code: 'EN', name: 'English' },
                          { code: 'FR', name: 'French' },
                          { code: 'GA', name: 'Galician' },
                          { code: 'DE', name: 'German' },
                          { code: 'GR', name: 'Greek' },
                          { code: 'ID', name: 'Indonesian' },
                          { code: 'IT', name: 'Italian' },
                          { code: 'JA', name: 'Japanese' },
                          { code: 'KO', name: 'Korean' },
                          { code: 'PT', name: 'Portuguese' },
                          { code: 'SL', name: 'Slovenian' },
                          { code: 'ES', name: 'Spanish' }
                        ];

                        // Format as "CODE LanguageName (sequence)"
                        const formattedLangs = sortedLangs.map(code => {
                          const lang = availableLanguages.find(l => l.code === code);
                          const seq = languageSequence[code] || '';
                          return lang ? `${lang.code} ${lang.name} (${seq})` : code;
                        });

                        return (
                          <span>
                            🧵 <strong>Composition Translation</strong> - {'{'}({formattedLangs.join(', ')}){'}'}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

        {!formData.layoutId ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#fff7ed',
            border: '2px dashed #fb923c',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#c2410c',
              margin: 0,
              fontWeight: '500'
            }}>
              ⚠️ Please select a layout card to view and edit variable fields
            </p>
          </div>
        ) : variableComponents.length === 0 ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#f7fafc',
            border: '2px dashed #cbd5e0',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: 0,
              fontWeight: '500'
            }}>
              📝 No variable-enabled components found in this layout
            </p>
            <p style={{
              fontSize: '13px',
              color: '#94a3b8',
              margin: '8px 0 0 0',
              fontStyle: 'italic'
            }}>
              Enable "Variable" toggle in Composition Translation or Multi-line Text settings
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Variable Components */}
            {variableComponents.map((component, componentIndex) => (
              <div
                key={component.id}
                style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                {/* Component Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1a202c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {component.type === 'comp-trans' ? '🧵' : '📝'} {component.name}
                  </h4>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    backgroundColor: component.type === 'comp-trans' ? '#fef3c7' : '#dbeafe',
                    color: component.type === 'comp-trans' ? '#92400e' : '#1e40af',
                    borderRadius: '4px',
                    fontWeight: '600'
                  }}>
                    {component.type === 'comp-trans' ? 'Composition' : 'Multi-line'}
                  </span>
                </div>

                {/* Component-specific inputs */}
                {component.type === 'comp-trans' ? (
                  // Composition Translation Inputs - Match NewCompTransDialog layout exactly
                  (() => {
                    const compositions = line.componentVariables[component.id]?.data?.compositions || [];
                    const totalPercentage = compositions.reduce((sum: number, c: any) => sum + (parseFloat(c.percentage) || 0), 0);
                    const lastRow = compositions[compositions.length - 1];
                    const isLastRowComplete = lastRow && lastRow.percentage && lastRow.material;
                    const canAddMore = isLastRowComplete && totalPercentage < 100;
                    const isPercentageValid = totalPercentage === 100;

                    return (
                      <div style={{
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa'
                      }}>
                        {/* Header Row */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: isPercentageValid ? '#333' : '#ef4444'
                          }}>
                            Material Composition: ({totalPercentage}%)
                          </div>
                          <button
                            onClick={() => {
                              const currentComps = line.componentVariables[component.id]?.data?.compositions || [];
                              handleUpdateLineComponentVariables(line.id, component.id, {
                                type: 'comp-trans',
                                data: { compositions: [...currentComps, { material: '', percentage: '' }] },
                                remark: line.componentVariables[component.id]?.remark || component.config?.variableRemark || ''
                              });
                            }}
                            disabled={!canAddMore || isDisabled}
                            style={{
                              padding: '4px 8px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              border: `1px solid ${canAddMore && !isDisabled ? '#007bff' : '#cbd5e0'}`,
                              borderRadius: '4px',
                              backgroundColor: canAddMore && !isDisabled ? '#007bff' : '#e5e7eb',
                              color: canAddMore && !isDisabled ? 'white' : '#9ca3af',
                              cursor: canAddMore && !isDisabled ? 'pointer' : 'not-allowed',
                              opacity: canAddMore && !isDisabled ? 1 : 0.6
                            }}
                          >
                            +
                          </button>
                        </div>

                    {/* Composition Rows */}
                    {(line.componentVariables[component.id]?.data?.compositions || [{ material: '', percentage: '' }]).map((comp: any, compIndex: number) => (
                      <div
                        key={compIndex}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 2fr auto',
                          gap: '12px',
                          marginBottom: compIndex < (line.componentVariables[component.id]?.data?.compositions || []).length - 1 ? '12px' : '0',
                          alignItems: 'end'
                        }}
                      >
                        {/* Percentage Input */}
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '4px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            Percentage (%):
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={comp.percentage}
                            onChange={(e) => {
                              const newCompositions = [...(line.componentVariables[component.id]?.data?.compositions || [])];
                              newCompositions[compIndex] = { ...newCompositions[compIndex], percentage: e.target.value };
                              handleUpdateLineComponentVariables(line.id, component.id, {
                                type: 'comp-trans',
                                data: { compositions: newCompositions },
                                remark: line.componentVariables[component.id]?.remark || component.config?.variableRemark || ''
                              });
                            }}
                            placeholder=""
                            disabled={isDisabled}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: 'white'
                            }}
                          />
                        </div>

                        {/* Material Element */}
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '4px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            Material Element:
                          </label>
                          <select
                            value={comp.material}
                            onChange={(e) => {
                              const newCompositions = [...(line.componentVariables[component.id]?.data?.compositions || [])];
                              newCompositions[compIndex] = { ...newCompositions[compIndex], material: e.target.value };
                              handleUpdateLineComponentVariables(line.id, component.id, {
                                type: 'comp-trans',
                                data: { compositions: newCompositions },
                                remark: line.componentVariables[component.id]?.remark || component.config?.variableRemark || ''
                              });
                            }}
                            disabled={isDisabled}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: 'white'
                            }}
                          >
                            <option value="">Select material...</option>
                            {/* Show current material if already selected */}
                            {comp.material && !(() => {
                              const selectedMaterials = (line.componentVariables[component.id]?.data?.compositions || [])
                                .filter((c: any, idx: number) => c.material && c.percentage > 0 && idx !== compIndex)
                                .map((c: any) => c.material);
                              return !selectedMaterials.includes(comp.material);
                            })() && (
                              <option key={comp.material} value={comp.material}>
                                {comp.material} (selected)
                              </option>
                            )}
                            {/* Show available materials (excluding already selected in other rows) */}
                            {materialOptions.filter(mat => {
                              const selectedMaterials = (line.componentVariables[component.id]?.data?.compositions || [])
                                .filter((c: any, idx: number) => c.material && c.percentage > 0 && idx !== compIndex)
                                .map((c: any) => c.material);
                              return !selectedMaterials.includes(mat);
                            }).map(mat => (
                              <option key={mat} value={mat}>{mat}</option>
                            ))}
                          </select>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            const newCompositions = (line.componentVariables[component.id]?.data?.compositions || []).filter((_: any, i: number) => i !== compIndex);
                            handleUpdateLineComponentVariables(line.id, component.id, {
                              type: 'comp-trans',
                              data: { compositions: newCompositions.length > 0 ? newCompositions : [{ material: '', percentage: '' }] },
                              remark: line.componentVariables[component.id]?.remark || component.config?.variableRemark || ''
                            });
                          }}
                          disabled={(line.componentVariables[component.id]?.data?.compositions || []).length <= 1 || isDisabled}
                          style={{
                            padding: '8px 12px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#ef4444',
                            backgroundColor: 'white',
                            border: '1px solid #ef4444',
                            borderRadius: '4px',
                            cursor: (componentVariables[component.id]?.data?.compositions || []).length > 1 ? 'pointer' : 'not-allowed',
                            opacity: (componentVariables[component.id]?.data?.compositions || []).length > 1 ? 1 : 0.4
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                    );
                  })()
                ) : (
                  // Multi-line Text Input
                  <div style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#4a5568',
                      marginBottom: '8px'
                    }}>
                      Text Content:
                    </label>
                    <textarea
                      value={line.componentVariables[component.id]?.data?.textContent || ''}
                      onChange={(e) => {
                        handleUpdateLineComponentVariables(line.id, component.id, {
                          type: 'multi-line',
                          data: { textContent: e.target.value },
                          remark: line.componentVariables[component.id]?.remark || component.config?.variableRemark || ''
                        });
                      }}
                      disabled={isDisabled}
                      placeholder="Enter multi-line text content..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        backgroundColor: 'white',
                        cursor: 'text',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }
                      }}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
              </div>
              {/* End Right 80% - Variable Components */}
            </div>
            {/* End Quantity + Variable Components Container */}
          </div>
        ))}
        {/* End Order Lines */}
      </div>

      {/* Submit Button - Hidden in View Mode */}
      {!isViewMode && (
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          paddingTop: '24px'
        }}>
          <button
            onClick={handleSubmit}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#3b82f6',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
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
            ✅ Submitted
          </button>
        </div>
      )}

      {/* Validation Modal */}
      {showValidationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            {(() => {
              // Check if basic fields are filled (can save as draft)
              const canSaveAsDraft = validateForDraft().isValid;

              return (
                <>
                  <h3 style={{
                    margin: '0 0 20px 0',
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#c2410c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {canSaveAsDraft ? '⚠️ Cannot Submit as Complete' : '⚠️ Incomplete Fields'}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    color: '#4a5568',
                    margin: '0 0 16px 0',
                    lineHeight: '1.5'
                  }}>
                    {canSaveAsDraft
                      ? 'The following issues prevent submitting as complete. You can save as draft and complete later:'
                      : 'The following fields need to be completed:'}
                  </p>

                  <ul style={{
                    margin: '0 0 24px 0',
                    padding: '0 0 0 20px',
                    fontSize: '14px',
                    color: '#1a202c'
                  }}>
                    {validationErrors.map((error, index) => (
                      <li key={index} style={{
                        marginBottom: '8px',
                        lineHeight: '1.4'
                      }}>
                        {error}
                      </li>
                    ))}
                  </ul>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={handleContinueInput}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#4a5568',
                        backgroundColor: 'white',
                        border: '2px solid #cbd5e0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f7fafc';
                        e.currentTarget.style.borderColor = '#a0aec0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#cbd5e0';
                      }}
                    >
                      Continue to input
                    </button>

                    {canSaveAsDraft && (
                      <button
                        onClick={handleSaveDraft}
                        style={{
                          padding: '10px 20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'white',
                          backgroundColor: '#f59e0b',
                          border: '2px solid #f59e0b',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#d97706';
                          e.currentTarget.style.borderColor = '#d97706';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f59e0b';
                          e.currentTarget.style.borderColor = '#f59e0b';
                        }}
                      >
                        💾 Save as draft
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              ✅
            </div>

            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: '#10b981'
            }}>
              Order Submitted Successfully!
            </h3>

            <p style={{
              fontSize: '16px',
              color: '#4a5568',
              margin: '0 0 32px 0',
              lineHeight: '1.5'
            }}>
              What would you like to do next?
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleNewOrder}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: '#3b82f6',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
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
                📝 New Order
              </button>

              <button
                onClick={handleGoToOrderManagement}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: '#10b981',
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
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
                📚 Go to Order Management
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrderTab;
