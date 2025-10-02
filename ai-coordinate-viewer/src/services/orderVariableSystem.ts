/**
 * Order Variable System
 *
 * Manages order-by-order variable data for projects
 * Each project can have multiple orders with different variable values
 */

// Variable data types
export type VariableDataType = 'text' | 'number' | 'dropdown';

// Variable definition
export interface OrderVariable {
  id: string;
  name: string;
  type: VariableDataType;
  dropdownOptions?: string[]; // For dropdown type
  defaultValue?: string | number;
}

// Order-specific variable value
export interface OrderVariableValue {
  variableId: string;
  value: string | number;
}

// Order data
export interface Order {
  id: string;
  orderNumber: string;
  projectId: string;
  customerName?: string;
  variables: OrderVariableValue[];
  createdAt: string;
  updatedAt: string;
}

// Project with orders
export interface ProjectOrderData {
  projectId: string;
  projectName: string;
  customerName: string;
  availableVariables: OrderVariable[]; // Variables defined for this project
  orders: Order[];
}

/**
 * Order Variable Storage Manager
 * Handles storage and retrieval of order variable data
 */
class OrderVariableManager {
  private storageKey = 'order_variable_data';

  /**
   * Get all project order data
   */
  getAllProjects(): ProjectOrderData[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Get project order data by project ID
   */
  getProject(projectId: string): ProjectOrderData | null {
    const projects = this.getAllProjects();
    return projects.find(p => p.projectId === projectId) || null;
  }

  /**
   * Create or update project
   */
  saveProject(projectData: ProjectOrderData): void {
    const projects = this.getAllProjects();
    const index = projects.findIndex(p => p.projectId === projectData.projectId);

    if (index >= 0) {
      projects[index] = projectData;
    } else {
      projects.push(projectData);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(projects));
  }

  /**
   * Add new order to project
   */
  addOrder(projectId: string, order: Order): void {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    project.orders.push(order);
    this.saveProject(project);
  }

  /**
   * Update existing order
   */
  updateOrder(projectId: string, orderId: string, orderData: Partial<Order>): void {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const orderIndex = project.orders.findIndex(o => o.id === orderId);
    if (orderIndex < 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    project.orders[orderIndex] = {
      ...project.orders[orderIndex],
      ...orderData,
      updatedAt: new Date().toISOString()
    };

    this.saveProject(project);
  }

  /**
   * Delete order
   */
  deleteOrder(projectId: string, orderId: string): void {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    project.orders = project.orders.filter(o => o.id !== orderId);
    this.saveProject(project);
  }

  /**
   * Get order by ID
   */
  getOrder(projectId: string, orderId: string): Order | null {
    const project = this.getProject(projectId);
    if (!project) return null;

    return project.orders.find(o => o.id === orderId) || null;
  }

  /**
   * Add variable definition to project
   */
  addVariable(projectId: string, variable: OrderVariable): void {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    project.availableVariables.push(variable);
    this.saveProject(project);
  }

  /**
   * Update variable definition
   */
  updateVariable(projectId: string, variableId: string, updates: Partial<OrderVariable>): void {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const varIndex = project.availableVariables.findIndex(v => v.id === variableId);
    if (varIndex < 0) {
      throw new Error(`Variable ${variableId} not found`);
    }

    project.availableVariables[varIndex] = {
      ...project.availableVariables[varIndex],
      ...updates
    };

    this.saveProject(project);
  }

  /**
   * Delete variable definition
   */
  deleteVariable(projectId: string, variableId: string): void {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    project.availableVariables = project.availableVariables.filter(v => v.id !== variableId);

    // Also remove this variable from all orders
    project.orders.forEach(order => {
      order.variables = order.variables.filter(v => v.variableId !== variableId);
    });

    this.saveProject(project);
  }

  /**
   * Get variable value for specific order
   */
  getOrderVariableValue(projectId: string, orderId: string, variableId: string): string | number | null {
    const order = this.getOrder(projectId, orderId);
    if (!order) return null;

    const variableValue = order.variables.find(v => v.variableId === variableId);
    return variableValue?.value || null;
  }

  /**
   * Set variable value for specific order
   */
  setOrderVariableValue(
    projectId: string,
    orderId: string,
    variableId: string,
    value: string | number
  ): void {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const orderIndex = project.orders.findIndex(o => o.id === orderId);
    if (orderIndex < 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    const order = project.orders[orderIndex];
    const varIndex = order.variables.findIndex(v => v.variableId === variableId);

    if (varIndex >= 0) {
      order.variables[varIndex].value = value;
    } else {
      order.variables.push({ variableId, value });
    }

    order.updatedAt = new Date().toISOString();
    this.saveProject(project);
  }
}

// Singleton instance
export const orderVariableManager = new OrderVariableManager();

/**
 * Utility functions for variable replacement in text
 */

/**
 * Replace variables in text with actual order values
 * Format: {{variableName}} will be replaced with the actual value
 *
 * @param text - Text containing variable placeholders
 * @param projectId - Project ID
 * @param orderId - Order ID
 * @returns Text with variables replaced
 */
export function replaceVariablesInText(
  text: string,
  projectId: string,
  orderId: string
): string {
  const project = orderVariableManager.getProject(projectId);
  if (!project) return text;

  const order = orderVariableManager.getOrder(projectId, orderId);
  if (!order) return text;

  let result = text;

  // Replace each variable
  project.availableVariables.forEach(variable => {
    const value = orderVariableManager.getOrderVariableValue(projectId, orderId, variable.id);
    if (value !== null) {
      const placeholder = `{{${variable.name}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
  });

  return result;
}

/**
 * Extract variable placeholders from text
 *
 * @param text - Text to analyze
 * @returns Array of variable names found in text
 */
export function extractVariablePlaceholders(text: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

/**
 * Create default project structure
 */
export function createDefaultProject(
  projectId: string,
  projectName: string,
  customerName: string
): ProjectOrderData {
  return {
    projectId,
    projectName,
    customerName,
    availableVariables: [],
    orders: []
  };
}

/**
 * Create default order
 */
export function createDefaultOrder(
  projectId: string,
  orderNumber: string,
  customerName?: string
): Order {
  return {
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orderNumber,
    projectId,
    customerName,
    variables: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
