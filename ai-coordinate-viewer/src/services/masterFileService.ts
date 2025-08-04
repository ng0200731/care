// Master File Service for Care Label Layout System
// Frontend-compatible mock database implementation - Level 1: Master Files

import {
  MasterFile,
  MasterFileWithSummary,
  CreateMasterFileRequest,
  UpdateMasterFileRequest,
  MasterFileFilters,
  ApiResponse,
  InheritanceWarning
} from '../types/database';
import { mockDatabase } from '../database/mockDatabase';

class MasterFileService {

  // =====================================================
  // CREATE MASTER FILE
  // =====================================================

  async createMasterFile(request: CreateMasterFileRequest): Promise<ApiResponse<MasterFile>> {
    try {
      const masterFile = await mockDatabase.createMasterFile({
        name: request.name,
        width: request.width,
        height: request.height,
        customerId: request.customerId,
        description: request.description,
        designData: request.designData,
        canvasImage: request.canvasImage
      });

      return {
        success: true,
        data: masterFile,
        message: 'Master file created successfully'
      };
    } catch (error) {
      console.error('❌ Error creating master file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create master file'
      };
    }
  }

  // =====================================================
  // GET MASTER FILES
  // =====================================================

  async getAllMasterFiles(filters?: MasterFileFilters): Promise<ApiResponse<MasterFileWithSummary[]>> {
    try {
      let masterFiles = await mockDatabase.getAllMasterFiles();

      // Apply filters
      if (filters?.customerId) {
        masterFiles = masterFiles.filter(mf => mf.customerId === filters.customerId);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        masterFiles = masterFiles.filter(mf =>
          mf.name.toLowerCase().includes(searchLower) ||
          (mf.description && mf.description.toLowerCase().includes(searchLower))
        );
      }

      if (filters?.createdAfter) {
        masterFiles = masterFiles.filter(mf => mf.createdAt >= filters.createdAfter!);
      }

      if (filters?.createdBefore) {
        masterFiles = masterFiles.filter(mf => mf.createdAt <= filters.createdBefore!);
      }

      if (filters?.hasTemplates !== undefined) {
        if (filters.hasTemplates) {
          masterFiles = masterFiles.filter(mf => mf.templateCount > 0);
        } else {
          masterFiles = masterFiles.filter(mf => mf.templateCount === 0);
        }
      }

      return {
        success: true,
        data: masterFiles
      };
    } catch (error) {
      console.error('❌ Error fetching master files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch master files'
      };
    }
  }

  async getMasterFileById(id: string): Promise<ApiResponse<MasterFile>> {
    try {
      const masterFile = await mockDatabase.getMasterFileById(id);

      if (!masterFile) {
        return {
          success: false,
          error: 'Master file not found'
        };
      }

      return {
        success: true,
        data: masterFile
      };
    } catch (error) {
      console.error('❌ Error fetching master file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch master file'
      };
    }
  }

  // =====================================================
  // UPDATE MASTER FILE
  // =====================================================

  async updateMasterFile(request: UpdateMasterFileRequest): Promise<ApiResponse<InheritanceWarning | null>> {
    try {
      const updates: any = {};

      if (request.name) updates.name = request.name;
      if (request.width) updates.width = request.width;
      if (request.height) updates.height = request.height;
      if (request.description !== undefined) updates.description = request.description;
      if (request.designData !== undefined) updates.designData = request.designData;
      if (request.canvasImage !== undefined) updates.canvasImage = request.canvasImage;

      const updatedMasterFile = await mockDatabase.updateMasterFile(request.id, updates);

      if (!updatedMasterFile) {
        return {
          success: false,
          error: 'Master file not found'
        };
      }

      // For now, we'll skip the complex inheritance warning logic
      // This can be implemented later when needed
      return {
        success: true,
        data: null,
        message: 'Master file updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating master file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update master file'
      };
    }
  }

  // =====================================================
  // DELETE MASTER FILE
  // =====================================================

  async deleteMasterFile(id: string): Promise<ApiResponse<void>> {
    try {
      const success = await mockDatabase.deleteMasterFile(id);

      if (!success) {
        return {
          success: false,
          error: 'Master file not found'
        };
      }

      return {
        success: true,
        message: 'Master file deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error deleting master file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete master file'
      };
    }
  }
}

export const masterFileService = new MasterFileService();
export default masterFileService;