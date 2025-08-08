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
  private baseUrl = 'http://localhost:3001/api'; // Backend API URL

  // =====================================================
  // CREATE MASTER FILE
  // =====================================================

  async createMasterFile(request: CreateMasterFileRequest): Promise<ApiResponse<MasterFile>> {
    try {
      // Try backend API first
      try {
        const response = await fetch(`${this.baseUrl}/master-files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: request.name,
            description: request.description,
            width: request.width,
            height: request.height,
            customerId: request.customerId,
            designData: request.designData,
            canvasImage: request.canvasImage
          }),
        });

        if (response.ok) {
          const result = await response.json();
          return {
            success: true,
            data: result.masterFile,
            message: result.message
          };
        }
      } catch (apiError) {
        console.warn('Backend API not available, using mock database:', apiError);
      }

      // Fallback to mock database
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
      // Try backend API first
      try {
        const response = await fetch(`${this.baseUrl}/master-files`);
        if (response.ok) {
          const result = await response.json();
          // Transform backend data to match frontend interface
          const masterFiles = result.masterFiles.map((mf: any) => {
            let parsed: any = null;
            try { parsed = mf.data ? JSON.parse(mf.data) : null; } catch {}
            const metaCustomerName = parsed?.designData?.metadata?.customerName;
            return {
              id: mf.id,
              name: mf.name,
              description: mf.description,
              width: mf.width || 200,
              height: mf.height || 150,
              customerId: mf.customerId || 'default',
              canvasImage: mf.canvasImage,
              designData: parsed?.designData ?? null,
              revisionNumber: 1,
              revisionHistory: [],
              createdAt: new Date(mf.createdAt),
              updatedAt: new Date(mf.updatedAt),
              isActive: true,
              customerName: metaCustomerName || 'Default Customer',
              contactPerson: 'N/A',
              templateCount: 0,
              lastTemplateUpdate: undefined
            } as MasterFileWithSummary;
          });

          return {
            success: true,
            data: masterFiles
          };
        }
      } catch (apiError) {
        console.warn('Backend API not available, using mock database:', apiError);
      }

      // Fallback to mock database
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
      // Try backend API first
      try {
        const response = await fetch(`${this.baseUrl}/master-files/${id}`);
        if (response.ok) {
          const result = await response.json();
          const mf = result.masterFile;

          // Transform backend data to match frontend interface
          const masterFile: MasterFile = {
            id: mf.id,
            name: mf.name,
            description: mf.description,
            width: mf.width || 200,
            height: mf.height || 150,
            customerId: mf.customerId || 'default',
            canvasImage: mf.canvasImage,
            designData: mf.data ? JSON.parse(mf.data).designData : null,
            revisionNumber: 1,
            revisionHistory: [],
            createdAt: new Date(mf.createdAt),
            updatedAt: new Date(mf.updatedAt),
            isActive: true
          };

          return {
            success: true,
            data: masterFile
          };
        }
      } catch (apiError) {
        console.warn('Backend API not available, using mock database:', apiError);
      }

      // Fallback to mock database
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
      // Try backend API first
      try {
        const response = await fetch(`${this.baseUrl}/master-files/${request.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: request.name,
            description: request.description,
            width: request.width,
            height: request.height,
            designData: request.designData,
            canvasImage: request.canvasImage
          }),
        });

        if (response.ok) {
          return {
            success: true,
            data: null,
            message: 'Master file updated successfully'
          };
        }
      } catch (apiError) {
        console.warn('Backend API not available, using mock database:', apiError);
      }

      // Fallback to mock database
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