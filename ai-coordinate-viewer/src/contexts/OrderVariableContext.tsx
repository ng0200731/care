/**
 * Order Variable Context
 *
 * Provides order variable functionality throughout the application
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  orderVariableManager,
  OrderVariable,
  Order,
  ProjectOrderData,
  createDefaultProject,
  createDefaultOrder,
  replaceVariablesInText,
  extractVariablePlaceholders
} from '../services/orderVariableSystem';

interface OrderVariableContextType {
  // Current project/order selection
  currentProjectId: string | null;
  currentOrderId: string | null;
  setCurrentProject: (projectId: string | null) => void;
  setCurrentOrder: (orderId: string | null) => void;

  // Project operations
  getProject: (projectId: string) => ProjectOrderData | null;
  createProject: (projectName: string, customerName: string) => ProjectOrderData;
  getAllProjects: () => ProjectOrderData[];

  // Order operations
  getOrder: (projectId: string, orderId: string) => Order | null;
  createOrder: (projectId: string, orderNumber: string, customerName?: string) => Order;
  updateOrder: (projectId: string, orderId: string, data: Partial<Order>) => void;
  deleteOrder: (projectId: string, orderId: string) => void;

  // Variable definition operations
  addVariable: (projectId: string, variable: OrderVariable) => void;
  updateVariable: (projectId: string, variableId: string, updates: Partial<OrderVariable>) => void;
  deleteVariable: (projectId: string, variableId: string) => void;
  getProjectVariables: (projectId: string) => OrderVariable[];

  // Variable value operations
  getVariableValue: (projectId: string, orderId: string, variableId: string) => string | number | null;
  setVariableValue: (projectId: string, orderId: string, variableId: string, value: string | number) => void;

  // Text replacement
  replaceVariables: (text: string, projectId: string, orderId: string) => string;
  getVariablePlaceholders: (text: string) => string[];
}

const OrderVariableContext = createContext<OrderVariableContextType | undefined>(undefined);

export const OrderVariableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const setCurrentProject = useCallback((projectId: string | null) => {
    setCurrentProjectId(projectId);
    setCurrentOrderId(null); // Reset order when project changes
  }, []);

  const setCurrentOrder = useCallback((orderId: string | null) => {
    setCurrentOrderId(orderId);
  }, []);

  const getProject = useCallback((projectId: string) => {
    return orderVariableManager.getProject(projectId);
  }, []);

  const createProject = useCallback((projectName: string, customerName: string) => {
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const project = createDefaultProject(projectId, projectName, customerName);
    orderVariableManager.saveProject(project);
    return project;
  }, []);

  const getAllProjects = useCallback(() => {
    return orderVariableManager.getAllProjects();
  }, []);

  const getOrder = useCallback((projectId: string, orderId: string) => {
    return orderVariableManager.getOrder(projectId, orderId);
  }, []);

  const createOrder = useCallback((projectId: string, orderNumber: string, customerName?: string) => {
    const order = createDefaultOrder(projectId, orderNumber, customerName);
    orderVariableManager.addOrder(projectId, order);
    return order;
  }, []);

  const updateOrder = useCallback((projectId: string, orderId: string, data: Partial<Order>) => {
    orderVariableManager.updateOrder(projectId, orderId, data);
  }, []);

  const deleteOrder = useCallback((projectId: string, orderId: string) => {
    orderVariableManager.deleteOrder(projectId, orderId);
  }, []);

  const addVariable = useCallback((projectId: string, variable: OrderVariable) => {
    orderVariableManager.addVariable(projectId, variable);
  }, []);

  const updateVariable = useCallback((projectId: string, variableId: string, updates: Partial<OrderVariable>) => {
    orderVariableManager.updateVariable(projectId, variableId, updates);
  }, []);

  const deleteVariable = useCallback((projectId: string, variableId: string) => {
    orderVariableManager.deleteVariable(projectId, variableId);
  }, []);

  const getProjectVariables = useCallback((projectId: string) => {
    const project = orderVariableManager.getProject(projectId);
    return project?.availableVariables || [];
  }, []);

  const getVariableValue = useCallback((projectId: string, orderId: string, variableId: string) => {
    return orderVariableManager.getOrderVariableValue(projectId, orderId, variableId);
  }, []);

  const setVariableValue = useCallback((projectId: string, orderId: string, variableId: string, value: string | number) => {
    orderVariableManager.setOrderVariableValue(projectId, orderId, variableId, value);
  }, []);

  const replaceVariables = useCallback((text: string, projectId: string, orderId: string) => {
    return replaceVariablesInText(text, projectId, orderId);
  }, []);

  const getVariablePlaceholders = useCallback((text: string) => {
    return extractVariablePlaceholders(text);
  }, []);

  const value: OrderVariableContextType = {
    currentProjectId,
    currentOrderId,
    setCurrentProject,
    setCurrentOrder,
    getProject,
    createProject,
    getAllProjects,
    getOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    addVariable,
    updateVariable,
    deleteVariable,
    getProjectVariables,
    getVariableValue,
    setVariableValue,
    replaceVariables,
    getVariablePlaceholders
  };

  return (
    <OrderVariableContext.Provider value={value}>
      {children}
    </OrderVariableContext.Provider>
  );
};

export const useOrderVariable = () => {
  const context = useContext(OrderVariableContext);
  if (context === undefined) {
    throw new Error('useOrderVariable must be used within an OrderVariableProvider');
  }
  return context;
};
