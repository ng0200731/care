// Son Object Service for Care Label Layout System
// Frontend-compatible mock database implementation - Level 3: Son Objects

import {
  SonObject,
  CreateSonObjectRequest,
  UpdateSonObjectRequest,
  SonObjectFilters,
  ApiResponse
} from '../types/database';
import { mockDatabase } from '../database/mockDatabase';

class SonObjectService {
  
  // =====================================================
  // CREATE SON OBJECT
  // =====================================================
  
  async createSonObject(request: CreateSonObjectRequest): Promise<ApiResponse<SonObject>> {
    try {
      // Verify template exists
      const template = await mockDatabase.getTemplateById(request.templateId);
      if (!template) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      const sonObject = await mockDatabase.createSonObject({
        templateId: request.templateId,
        type: request.type,
        name: request.name,
        positionX: request.positionX,
        positionY: request.positionY,
        width: request.width,
        height: request.height,
        content: request.content,
        formatting: request.formatting,
        regionId: request.regionId,
        rowHeight: request.rowHeight,
        columns: request.columns,
        selectedColumn: request.selectedColumn,
        displayOrder: request.displayOrder || 0
      });

      return {
        success: true,
        data: sonObject,
        message: 'Son object created successfully'
      };
    } catch (error) {
      console.error('❌ Error creating son object:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create son object'
      };
    }
  }
  
  // =====================================================
  // GET SON OBJECTS
  // =====================================================
  
  async getSonObjectsByTemplate(templateId: string, filters?: SonObjectFilters): Promise<ApiResponse<SonObject[]>> {
    try {
      let sonObjects = await mockDatabase.getSonObjectsByTemplate(templateId);

      // Apply filters
      if (filters?.type) {
        sonObjects = sonObjects.filter(so => so.type === filters.type);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        sonObjects = sonObjects.filter(so =>
          so.name.toLowerCase().includes(searchLower) ||
          JSON.stringify(so.content).toLowerCase().includes(searchLower)
        );
      }

      return {
        success: true,
        data: sonObjects
      };
    } catch (error) {
      console.error('❌ Error fetching son objects:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch son objects'
      };
    }
  }
  
  async getSonObjectById(id: string): Promise<ApiResponse<SonObject>> {
    try {
      const sonObject = await mockDatabase.getSonObjectById(id);

      if (!sonObject) {
        return {
          success: false,
          error: 'Son object not found'
        };
      }

      return {
        success: true,
        data: sonObject
      };
    } catch (error) {
      console.error('❌ Error fetching son object:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch son object'
      };
    }
  }
  
  // =====================================================
  // UPDATE SON OBJECT
  // =====================================================

  async updateSonObject(request: UpdateSonObjectRequest): Promise<ApiResponse<SonObject>> {
    try {
      const updates: any = {};

      if (request.name) updates.name = request.name;
      if (request.positionX !== undefined) updates.positionX = request.positionX;
      if (request.positionY !== undefined) updates.positionY = request.positionY;
      if (request.width !== undefined) updates.width = request.width;
      if (request.height !== undefined) updates.height = request.height;
      if (request.content) updates.content = request.content;
      if (request.formatting) updates.formatting = request.formatting;
      if (request.regionId !== undefined) updates.regionId = request.regionId;
      if (request.rowHeight !== undefined) updates.rowHeight = request.rowHeight;
      if (request.columns !== undefined) updates.columns = request.columns;
      if (request.selectedColumn !== undefined) updates.selectedColumn = request.selectedColumn;
      if (request.displayOrder !== undefined) updates.displayOrder = request.displayOrder;

      const updatedSonObject = await mockDatabase.updateSonObject(request.id, updates);

      if (!updatedSonObject) {
        return {
          success: false,
          error: 'Son object not found'
        };
      }

      return {
        success: true,
        data: updatedSonObject,
        message: 'Son object updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating son object:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update son object'
      };
    }
  }

  // =====================================================
  // DELETE SON OBJECT
  // =====================================================

  async deleteSonObject(id: string): Promise<ApiResponse<void>> {
    try {
      const success = await mockDatabase.deleteSonObject(id);

      if (!success) {
        return {
          success: false,
          error: 'Son object not found'
        };
      }

      return {
        success: true,
        message: 'Son object deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error deleting son object:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete son object'
      };
    }
  }
}

export const sonObjectService = new SonObjectService();
export default sonObjectService;
