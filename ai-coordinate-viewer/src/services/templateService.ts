// Template Service for Care Label Layout System
// Frontend-compatible mock database implementation - Level 2: Templates

import {
  Template,
  TemplateWithSummary,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateFilters,
  ApiResponse
} from '../types/database';
import { mockDatabase } from '../database/mockDatabase';

class TemplateService {
  
  // =====================================================
  // CREATE TEMPLATE
  // =====================================================
  
  async createTemplate(request: CreateTemplateRequest): Promise<ApiResponse<Template>> {
    try {
      // Verify master file exists
      const masterFile = await mockDatabase.getMasterFileById(request.masterFileId);
      if (!masterFile) {
        return {
          success: false,
          error: 'Master file not found'
        };
      }

      const template = await mockDatabase.createTemplate({
        name: request.name,
        masterFileId: request.masterFileId,
        pageNumber: request.pageNumber || 1,
        description: request.description,
        regions: request.regions,
        gridSettings: request.gridSettings
      });

      return {
        success: true,
        data: template,
        message: 'Template created successfully'
      };
    } catch (error) {
      console.error('❌ Error creating template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create template'
      };
    }
  }
  
  // =====================================================
  // GET TEMPLATES
  // =====================================================
  
  async getTemplatesByMasterFile(masterFileId: string, filters?: TemplateFilters): Promise<ApiResponse<TemplateWithSummary[]>> {
    try {
      let templates = await mockDatabase.getTemplatesByMasterFile(masterFileId);

      // Apply filters
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        templates = templates.filter(t =>
          t.name.toLowerCase().includes(searchLower) ||
          (t.description && t.description.toLowerCase().includes(searchLower))
        );
      }

      if (filters?.pageNumber) {
        templates = templates.filter(t => t.pageNumber === filters.pageNumber);
      }

      if (filters?.hasObjects !== undefined) {
        if (filters.hasObjects) {
          templates = templates.filter(t => t.sonObjectCount > 0);
        } else {
          templates = templates.filter(t => t.sonObjectCount === 0);
        }
      }

      return {
        success: true,
        data: templates
      };
    } catch (error) {
      console.error('❌ Error fetching templates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch templates'
      };
    }
  }
  
  async getTemplateById(id: string): Promise<ApiResponse<Template>> {
    try {
      const template = await mockDatabase.getTemplateById(id);

      if (!template) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      return {
        success: true,
        data: template
      };
    } catch (error) {
      console.error('❌ Error fetching template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch template'
      };
    }
  }
  
  // =====================================================
  // UPDATE TEMPLATE
  // =====================================================

  async updateTemplate(request: UpdateTemplateRequest): Promise<ApiResponse<Template>> {
    try {
      const updates: any = {};

      if (request.name) updates.name = request.name;
      if (request.description !== undefined) updates.description = request.description;
      if (request.regions) updates.regions = request.regions;
      if (request.gridSettings) updates.gridSettings = request.gridSettings;

      const updatedTemplate = await mockDatabase.updateTemplate(request.id, updates);

      if (!updatedTemplate) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      return {
        success: true,
        data: updatedTemplate,
        message: 'Template updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update template'
      };
    }
  }

  // =====================================================
  // DELETE TEMPLATE
  // =====================================================

  async deleteTemplate(id: string): Promise<ApiResponse<void>> {
    try {
      const success = await mockDatabase.deleteTemplate(id);

      if (!success) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      return {
        success: true,
        message: 'Template deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete template'
      };
    }
  }
}

export const templateService = new TemplateService();
export default templateService;
