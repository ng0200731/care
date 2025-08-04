// Mock Database Service for Care Label Layout System
// Frontend-compatible database simulation with localStorage persistence

import { 
  MasterFile, 
  MasterFileWithSummary, 
  Template, 
  TemplateWithSummary, 
  SonObject 
} from '../types/database';

// =====================================================
// MOCK DATABASE STORAGE
// =====================================================

class MockDatabase {
  private storagePrefix = 'care_label_db_';
  
  // =====================================================
  // STORAGE UTILITIES
  // =====================================================
  
  private getStorageKey(table: string): string {
    return `${this.storagePrefix}${table}`;
  }
  
  private loadTable<T>(tableName: string): T[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(tableName));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error loading table ${tableName}:`, error);
      return [];
    }
  }
  
  private saveTable<T>(tableName: string, data: T[]): void {
    try {
      localStorage.setItem(this.getStorageKey(tableName), JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving table ${tableName}:`, error);
    }
  }
  
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // =====================================================
  // MASTER FILES OPERATIONS
  // =====================================================
  
  async createMasterFile(data: Omit<MasterFile, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'revisionNumber' | 'revisionHistory'>): Promise<MasterFile> {
    const masterFiles = this.loadTable<MasterFile>('master_files');

    // Check for duplicate names
    const existingFile = masterFiles.find(mf => mf.name.toLowerCase() === data.name.toLowerCase() && mf.isActive);
    if (existingFile) {
      throw new Error(`Master file with name "${data.name}" already exists. Please choose a different name.`);
    }

    const now = new Date();
    const newMasterFile: MasterFile = {
      ...data,
      id: this.generateId(),
      revisionNumber: 1,
      revisionHistory: [{
        version: 1,
        updatedAt: now,
        changes: 'Initial creation',
        canvasImage: data.canvasImage
      }],
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    masterFiles.push(newMasterFile);
    this.saveTable('master_files', masterFiles);

    return newMasterFile;
  }
  
  async getAllMasterFiles(): Promise<MasterFileWithSummary[]> {
    const masterFiles = this.loadTable<MasterFile>('master_files');
    const templates = this.loadTable<Template>('templates');
    const customers = this.loadTable<any>('customers'); // Assuming customers exist

    return masterFiles
      .filter(mf => mf.isActive)
      .map(mf => {
        const customer = customers.find(c => c.id === mf.customerId);
        const templateCount = templates.filter(t => t.masterFileId === mf.id && t.isActive).length;
        const lastTemplateUpdate = templates
          .filter(t => t.masterFileId === mf.id && t.isActive)
          .reduce((latest, t) => {
            const tUpdatedAt = typeof t.updatedAt === 'string' ? new Date(t.updatedAt) : t.updatedAt;
            return tUpdatedAt > latest ? tUpdatedAt : latest;
          }, new Date(0));

        // Ensure dates are Date objects
        const createdAt = typeof mf.createdAt === 'string' ? new Date(mf.createdAt) : mf.createdAt;
        const updatedAt = typeof mf.updatedAt === 'string' ? new Date(mf.updatedAt) : mf.updatedAt;

        return {
          ...mf,
          createdAt,
          updatedAt,
          customerName: customer?.customerName || 'Unknown Customer',
          contactPerson: customer?.contactPerson || 'Unknown Contact',
          templateCount,
          lastTemplateUpdate: lastTemplateUpdate.getTime() > 0 ? lastTemplateUpdate : undefined
        } as MasterFileWithSummary;
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async getMasterFileById(id: string): Promise<MasterFile | null> {
    const masterFiles = this.loadTable<MasterFile>('master_files');
    const masterFile = masterFiles.find(mf => mf.id === id && mf.isActive);

    if (!masterFile) return null;

    // Ensure dates are Date objects
    return {
      ...masterFile,
      createdAt: typeof masterFile.createdAt === 'string' ? new Date(masterFile.createdAt) : masterFile.createdAt,
      updatedAt: typeof masterFile.updatedAt === 'string' ? new Date(masterFile.updatedAt) : masterFile.updatedAt
    };
  }
  
  async updateMasterFile(id: string, updates: Partial<Omit<MasterFile, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>>): Promise<MasterFile | null> {
    const masterFiles = this.loadTable<MasterFile>('master_files');
    const index = masterFiles.findIndex(mf => mf.id === id && mf.isActive);
    
    if (index === -1) return null;
    
    masterFiles[index] = {
      ...masterFiles[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveTable('master_files', masterFiles);
    return masterFiles[index];
  }
  
  async deleteMasterFile(id: string): Promise<boolean> {
    const masterFiles = this.loadTable<MasterFile>('master_files');
    const index = masterFiles.findIndex(mf => mf.id === id);
    
    if (index === -1) return false;
    
    masterFiles[index].isActive = false;
    masterFiles[index].updatedAt = new Date();
    
    this.saveTable('master_files', masterFiles);
    return true;
  }
  
  // =====================================================
  // TEMPLATES OPERATIONS
  // =====================================================
  
  async createTemplate(data: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Template> {
    const templates = this.loadTable<Template>('templates');
    
    // Auto-assign page number if not provided
    let pageNumber = data.pageNumber;
    if (!pageNumber) {
      const existingPages = templates
        .filter(t => t.masterFileId === data.masterFileId && t.isActive)
        .map(t => t.pageNumber);
      pageNumber = existingPages.length > 0 ? Math.max(...existingPages) + 1 : 1;
    }
    
    const newTemplate: Template = {
      ...data,
      pageNumber,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    templates.push(newTemplate);
    this.saveTable('templates', templates);
    
    return newTemplate;
  }
  
  async getTemplatesByMasterFile(masterFileId: string): Promise<TemplateWithSummary[]> {
    const templates = this.loadTable<Template>('templates');
    const masterFiles = this.loadTable<MasterFile>('master_files');
    const sonObjects = this.loadTable<SonObject>('son_objects');
    
    const masterFile = masterFiles.find(mf => mf.id === masterFileId);
    
    return templates
      .filter(t => t.masterFileId === masterFileId && t.isActive)
      .map(t => {
        const sonObjectCount = sonObjects.filter(so => so.templateId === t.id && so.isActive).length;
        
        return {
          ...t,
          masterFileName: masterFile?.name || 'Unknown Master',
          masterWidth: masterFile?.width || 0,
          masterHeight: masterFile?.height || 0,
          sonObjectCount
        } as TemplateWithSummary;
      })
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }
  
  async getTemplateById(id: string): Promise<Template | null> {
    const templates = this.loadTable<Template>('templates');
    return templates.find(t => t.id === id && t.isActive) || null;
  }
  
  async updateTemplate(id: string, updates: Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>>): Promise<Template | null> {
    const templates = this.loadTable<Template>('templates');
    const index = templates.findIndex(t => t.id === id && t.isActive);
    
    if (index === -1) return null;
    
    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveTable('templates', templates);
    return templates[index];
  }
  
  async deleteTemplate(id: string): Promise<boolean> {
    const templates = this.loadTable<Template>('templates');
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) return false;
    
    templates[index].isActive = false;
    templates[index].updatedAt = new Date();
    
    this.saveTable('templates', templates);
    return true;
  }
  
  // =====================================================
  // SON OBJECTS OPERATIONS
  // =====================================================
  
  async createSonObject(data: Omit<SonObject, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<SonObject> {
    const sonObjects = this.loadTable<SonObject>('son_objects');
    
    const newSonObject: SonObject = {
      ...data,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    sonObjects.push(newSonObject);
    this.saveTable('son_objects', sonObjects);
    
    return newSonObject;
  }
  
  async getSonObjectsByTemplate(templateId: string): Promise<SonObject[]> {
    const sonObjects = this.loadTable<SonObject>('son_objects');
    
    return sonObjects
      .filter(so => so.templateId === templateId && so.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getSonObjectById(id: string): Promise<SonObject | null> {
    const sonObjects = this.loadTable<SonObject>('son_objects');
    return sonObjects.find(so => so.id === id && so.isActive) || null;
  }
  
  async updateSonObject(id: string, updates: Partial<Omit<SonObject, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>>): Promise<SonObject | null> {
    const sonObjects = this.loadTable<SonObject>('son_objects');
    const index = sonObjects.findIndex(so => so.id === id && so.isActive);
    
    if (index === -1) return null;
    
    sonObjects[index] = {
      ...sonObjects[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveTable('son_objects', sonObjects);
    return sonObjects[index];
  }
  
  async deleteSonObject(id: string): Promise<boolean> {
    const sonObjects = this.loadTable<SonObject>('son_objects');
    const index = sonObjects.findIndex(so => so.id === id);
    
    if (index === -1) return false;
    
    sonObjects[index].isActive = false;
    sonObjects[index].updatedAt = new Date();
    
    this.saveTable('son_objects', sonObjects);
    return true;
  }
  
  // =====================================================
  // UTILITY METHODS
  // =====================================================
  
  async initializeDatabase(): Promise<void> {
    // Initialize with sample data if empty
    const masterFiles = this.loadTable<MasterFile>('master_files');
    if (masterFiles.length === 0) {
      console.log('🚀 Initializing mock database with sample data...');
      // Add any initial sample data here if needed
    }
  }
  
  async clearDatabase(): Promise<void> {
    const tables = ['master_files', 'templates', 'son_objects'];
    tables.forEach(table => {
      localStorage.removeItem(this.getStorageKey(table));
    });
    console.log('🗑️ Mock database cleared');
  }
}

export const mockDatabase = new MockDatabase();
export default mockDatabase;
