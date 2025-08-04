// Master File Service - Handles CRUD operations for master files
// This will be connected to backend API later

export interface MasterFile {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  dimensions: {
    width: number;
    height: number;
  };
  lastModified: string;
  size: string;
  objects: number;
  createdAt: string;
  updatedAt: string;
  data?: any; // JSON data for coordinate viewer
}

export interface CreateMasterFileRequest {
  name: string;
  description: string;
  category: string;
  tags: string[];
  dimensions: {
    width: number;
    height: number;
  };
}

export interface UpdateMasterFileRequest extends Partial<CreateMasterFileRequest> {
  id: string;
  data?: any;
  objects?: number;
  size?: string;
}

class MasterFileService {
  private storageKey = 'masterFiles';
  private baseUrl = 'http://localhost:3001/api'; // Backend API URL

  // Get all master files
  async getAllMasterFiles(): Promise<MasterFile[]> {
    try {
      // Try to fetch from backend first
      const response = await fetch(`${this.baseUrl}/master-files`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    // Fallback to local storage
    return this.getFromLocalStorage();
  }

  // Get master file by ID
  async getMasterFileById(id: string): Promise<MasterFile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/master-files/${id}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    // Fallback to local storage
    const files = this.getFromLocalStorage();
    return files.find(file => file.id === id) || null;
  }

  // Create new master file
  async createMasterFile(data: CreateMasterFileRequest): Promise<MasterFile> {
    const newFile: MasterFile = {
      id: this.generateId(),
      ...data,
      lastModified: 'Just now',
      size: '0.5 KB',
      objects: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch(`${this.baseUrl}/master-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFile),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    // Fallback to local storage
    const files = this.getFromLocalStorage();
    files.push(newFile);
    this.saveToLocalStorage(files);
    return newFile;
  }

  // Update master file
  async updateMasterFile(data: UpdateMasterFileRequest): Promise<MasterFile> {
    try {
      const response = await fetch(`${this.baseUrl}/master-files/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    // Fallback to local storage
    const files = this.getFromLocalStorage();
    const index = files.findIndex(file => file.id === data.id);
    
    if (index === -1) {
      throw new Error('Master file not found');
    }

    const updatedFile = {
      ...files[index],
      ...data,
      updatedAt: new Date().toISOString(),
      lastModified: 'Just now'
    };

    files[index] = updatedFile;
    this.saveToLocalStorage(files);
    return updatedFile;
  }

  // Delete master file
  async deleteMasterFile(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/master-files/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    // Fallback to local storage
    const files = this.getFromLocalStorage();
    const filteredFiles = files.filter(file => file.id !== id);
    
    if (filteredFiles.length === files.length) {
      return false; // File not found
    }

    this.saveToLocalStorage(filteredFiles);
    return true;
  }

  // Search master files
  async searchMasterFiles(query: string): Promise<MasterFile[]> {
    const files = await this.getAllMasterFiles();
    const lowercaseQuery = query.toLowerCase();

    return files.filter(file =>
      file.name.toLowerCase().includes(lowercaseQuery) ||
      file.description.toLowerCase().includes(lowercaseQuery) ||
      file.category.toLowerCase().includes(lowercaseQuery) ||
      file.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Filter master files by category
  async filterByCategory(category: string): Promise<MasterFile[]> {
    const files = await this.getAllMasterFiles();
    return files.filter(file => file.category === category);
  }

  // Save coordinate data to master file
  async saveCoordinateData(id: string, coordinateData: any): Promise<MasterFile> {
    const updateData: UpdateMasterFileRequest = {
      id,
      data: coordinateData
    };

    // Calculate objects count from coordinate data
    if (coordinateData && coordinateData.objects) {
      updateData.objects = coordinateData.objects.length;
      
      // Estimate file size based on JSON string length
      const jsonString = JSON.stringify(coordinateData);
      const sizeInKB = (jsonString.length / 1024).toFixed(1);
      updateData.size = `${sizeInKB} KB`;
    }

    return this.updateMasterFile(updateData);
  }

  // Private helper methods
  private getFromLocalStorage(): MasterFile[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }

    // Return default mock data if nothing in storage
    return this.getDefaultMockData();
  }

  private saveToLocalStorage(files: MasterFile[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(files));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDefaultMockData(): MasterFile[] {
    return [
      {
        id: '1',
        name: 'Mother_1.json',
        description: 'Basic care label layout',
        category: 'care-label',
        tags: ['basic', 'care-label'],
        dimensions: { width: 50, height: 30 },
        lastModified: '2 hours ago',
        size: '2.4 KB',
        objects: 5,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        name: 'Complex_Layout.json',
        description: 'Multi-object care label design',
        category: 'care-label',
        tags: ['complex', 'multi-object'],
        dimensions: { width: 75, height: 45 },
        lastModified: '1 day ago',
        size: '4.1 KB',
        objects: 12,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        name: 'Simple_Design.json',
        description: 'Minimal care label',
        category: 'size-label',
        tags: ['simple', 'minimal'],
        dimensions: { width: 40, height: 25 },
        lastModified: '3 days ago',
        size: '1.8 KB',
        objects: 3,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  // Initialize service with mock data if needed
  async initialize(): Promise<void> {
    const files = this.getFromLocalStorage();
    if (files.length === 0) {
      // Initialize with default data
      const defaultFiles = this.getDefaultMockData();
      this.saveToLocalStorage(defaultFiles);
    }
  }
}

// Export singleton instance
export const masterFileService = new MasterFileService();

// Initialize on import
masterFileService.initialize();
