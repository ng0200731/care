// Database entity types for Care Label Layout System
// Complete hierarchy: Master Files → Templates → Son Objects

// =====================================================
// MASTER FILE ENTITIES
// =====================================================

export interface MasterFileRevision {
  version: number;
  updatedAt: Date;
  changes: string;
  canvasImage?: string;             // SVG snapshot for this revision
}

export interface MasterFile {
  id: string;
  name: string;
  width: number;                    // Canvas width in mm
  height: number;                   // Canvas height in mm
  customerId: string;
  description?: string;
  designData?: any;                 // Store complete design data (objects, metadata, etc.)
  canvasImage?: string;             // Current SVG image
  revisionNumber: number;           // Current revision number
  revisionHistory: MasterFileRevision[]; // Complete revision history
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface MasterFileWithSummary extends MasterFile {
  customerName: string;
  contactPerson: string;
  templateCount: number;
  lastTemplateUpdate?: Date;
}

export interface CreateMasterFileRequest {
  name: string;
  width: number;
  height: number;
  customerId: string;
  description?: string;
  designData?: any;                 // Optional design data (objects, metadata, etc.)
  canvasImage?: string;             // SVG image of the design
}

export interface UpdateMasterFileRequest {
  id: string;
  name?: string;
  width?: number;
  height?: number;
  description?: string;
}

// =====================================================
// TEMPLATE ENTITIES
// =====================================================

export interface Template {
  id: string;
  name: string;
  masterFileId: string;
  pageNumber: number;
  description?: string;
  regions?: LayoutRegion[];
  gridSettings?: GridSettings;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TemplateWithSummary extends Template {
  masterFileName: string;
  masterWidth: number;
  masterHeight: number;
  sonObjectCount: number;
}

export interface CreateTemplateRequest {
  name: string;
  masterFileId: string;
  pageNumber?: number;              // Auto-assigned if not provided
  description?: string;
  regions?: LayoutRegion[];
  gridSettings?: GridSettings;
}

export interface UpdateTemplateRequest {
  id: string;
  name?: string;
  description?: string;
  regions?: LayoutRegion[];
  gridSettings?: GridSettings;
}

// =====================================================
// SON OBJECT ENTITIES
// =====================================================

export type SonObjectType = 'text' | 'image' | 'barcode' | 'translation' | 'washing' | 'size' | 'composition' | 'special';

export interface SonObject {
  id: string;
  templateId: string;
  type: SonObjectType;
  name: string;
  positionX: number;                // X coordinate in mm
  positionY: number;                // Y coordinate in mm
  width?: number;                   // Object width in mm
  height?: number;                  // Object height in mm
  content: any;                     // Type-specific content
  formatting: any;                  // Type-specific formatting
  regionId?: string;
  rowHeight?: number;
  columns?: number;
  selectedColumn?: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateSonObjectRequest {
  templateId: string;
  type: SonObjectType;
  name: string;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  content: any;
  formatting: any;
  regionId?: string;
  rowHeight?: number;
  columns?: number;
  selectedColumn?: number;
  displayOrder?: number;
}

export interface UpdateSonObjectRequest {
  id: string;
  name?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  content?: any;
  formatting?: any;
  regionId?: string;
  rowHeight?: number;
  columns?: number;
  selectedColumn?: number;
  displayOrder?: number;
}

// =====================================================
// LAYOUT CONFIGURATION TYPES
// =====================================================

export interface LayoutRegion {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'content' | 'header' | 'footer' | 'sidebar';
  allowedObjectTypes?: SonObjectType[];
}

export interface GridSettings {
  enabled: boolean;
  size: number;                     // Grid size in mm
  snapToGrid: boolean;
  showGrid: boolean;
  color: string;
}

// =====================================================
// TEMPLATE INHERITANCE TYPES
// =====================================================

export interface TemplateInheritanceLog {
  id: string;
  masterFileId: string;
  changeType: 'dimension_change' | 'property_change';
  oldValues: any;
  newValues: any;
  affectedTemplates: string[];      // Template IDs
  userAcknowledged: boolean;
  createdAt: Date;
}

export interface InheritanceWarning {
  masterFileId: string;
  masterFileName: string;
  changeType: 'dimension_change' | 'property_change';
  oldValues: any;
  newValues: any;
  affectedTemplates: {
    id: string;
    name: string;
    pageNumber: number;
  }[];
  message: string;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// =====================================================
// SEARCH AND FILTER TYPES
// =====================================================

export interface MasterFileFilters {
  customerId?: string;
  search?: string;                  // Search in name and description
  createdAfter?: Date;
  createdBefore?: Date;
  hasTemplates?: boolean;
}

export interface TemplateFilters {
  masterFileId?: string;
  search?: string;
  pageNumber?: number;
  hasObjects?: boolean;
}

export interface SonObjectFilters {
  templateId?: string;
  type?: SonObjectType;
  search?: string;                  // Search in name and content
}

// =====================================================
// EXPORT/IMPORT TYPES
// =====================================================

export interface ExportMasterFileData {
  masterFile: MasterFile;
  templates: (Template & {
    sonObjects: SonObject[];
  })[];
  exportedAt: Date;
  version: string;
}

export interface ImportMasterFileData {
  masterFile: Omit<MasterFile, 'id' | 'createdAt' | 'updatedAt'>;
  templates: (Omit<Template, 'id' | 'masterFileId' | 'createdAt' | 'updatedAt'> & {
    sonObjects: Omit<SonObject, 'id' | 'templateId' | 'createdAt' | 'updatedAt'>[];
  })[];
}
