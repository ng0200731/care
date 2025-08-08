# Son Object Attributes Documentation

## Overview
This document lists all attributes and properties for Son Objects in the Care Label Layout System.

## Son Object Types
```typescript
type SonObjectType = 'text' | 'image' | 'barcode' | 'translation' | 'washing' | 'size' | 'composition' | 'special';
```

### Available Son Types:
- 📝 **text** - Text content
- 🖼️ **image** - Image content  
- 📊 **barcode** - Barcode/QR codes
- 🌐 **translation** - Multi-language text
- 🧺 **washing** - Washing symbols
- 📏 **size** - Size breakdown information
- 📊 **composition** - Material composition percentages
- ⭐ **special** - Special wording/instructions

---

## Core Son Object Interface (Database)

### SonObject (Main Interface)
```typescript
interface SonObject {
  id: string;                    // Unique identifier
  templateId: string;            // Parent template ID
  type: SonObjectType;           // Object type
  name: string;                  // Display name
  positionX: number;             // X coordinate in mm
  positionY: number;             // Y coordinate in mm
  width?: number;                // Object width in mm (optional)
  height?: number;               // Object height in mm (optional)
  content: any;                  // Type-specific content
  formatting: any;               // Type-specific formatting
  regionId?: string;             // Associated region ID (optional)
  rowHeight?: number;            // Row height for layout (optional)
  columns?: number;              // Number of columns (optional)
  selectedColumn?: number;       // Selected column index (optional)
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  isActive: boolean;             // Active status
  displayOrder: number;          // Display order/z-index
}
```

---

## Son Metadata Interface (Legacy/UI)

### SonMetadata (UI Interface)
```typescript
interface SonMetadata {
  id: string;                                    // Unique identifier
  sonType: SonObjectType;                        // Object type
  content: string;                               // Text content
  details: any;                                  // Type-specific details
  
  // Text Formatting
  fontFamily?: string;                           // Font family (default: 'Arial')
  fontSize?: number;                             // Font size (default: 12)
  textAlign?: 'left' | 'center' | 'right';      // Text alignment (default: 'left')
  fontWeight?: 'normal' | 'bold';               // Font weight (default: 'normal')
  
  // Text Overflow Handling
  textOverflow?: 'resize' | 'linebreak';        // Overflow handling (default: 'linebreak')
  lineBreakType?: 'word' | 'character';         // Line break method (default: 'word')
  characterConnector?: string;                   // Character connector (default: '-')
  
  // Margins
  margins?: {
    top: number;                                 // Top margin in mm (default: 2)
    bottom: number;                              // Bottom margin in mm (default: 2)
    left: number;                                // Left margin in mm (default: 2)
    right: number;                               // Right margin in mm (default: 2)
  };
  
  // Space Allocation
  spaceAllocation?: {
    region: string;                              // Target region (default: 'content')
    rowHeight: number;                           // Row height in mm (default: 10)
    columns: number;                             // Number of columns (default: 1)
    selectedColumn: number;                      // Selected column (default: 1)
    allocated: boolean;                          // Allocation status (default: false)
  };
}
```

---

## Text Son Object (Specific Implementation)

### TextSonData Interface
```typescript
interface TextSonData {
  id: string;                                    // Unique identifier
  type: 'text';                                  // Fixed type for text objects
  content: string;                               // Text content
  
  // Formatting Properties
  formatting: {
    fontFamily: string;                          // Font family (default: 'Arial')
    fontSize: number;                            // Font size (default: 12)
    textAlign: 'left' | 'center' | 'right';     // Text alignment (default: 'left')
    fontWeight: 'normal' | 'bold';              // Font weight (default: 'normal')
  };
  
  // Margin Properties
  margins: {
    top: number;                                 // Top margin in mm (default: 2)
    bottom: number;                              // Bottom margin in mm (default: 2)
    left: number;                                // Left margin in mm (default: 2)
    right: number;                               // Right margin in mm (default: 2)
  };
  
  // Overflow Handling
  overflow: {
    handling: 'resize' | 'lineBreaks';          // Overflow method (default: 'resize')
    lineBreakMethod: 'word' | 'character';      // Line break method (default: 'word')
  };
  
  // Space Allocation
  spaceAllocation: {
    region: string;                              // Target region (default: 'content')
    rowHeight: number;                           // Row height in mm (default: 10)
    columns: number;                             // Number of columns (default: 1)
    selectedColumn: number;                      // Selected column (default: 1)
  };
  
  // Position
  position: {
    x: number;                                   // X coordinate in mm (default: 0)
    y: number;                                   // Y coordinate in mm (default: 0)
  };
}
```

---

## Base Son Object Interface

### BaseSonObject Interface
```typescript
interface BaseSonObject {
  id: string;                                    // Unique identifier
  type: SonObjectType;                           // Object type
  position: {
    x: number;                                   // X coordinate in mm
    y: number;                                   // Y coordinate in mm
  };
}
```

---

## Request Interfaces

### CreateSonObjectRequest
```typescript
interface CreateSonObjectRequest {
  templateId: string;            // Parent template ID (required)
  type: SonObjectType;           // Object type (required)
  name: string;                  // Display name (required)
  positionX: number;             // X coordinate in mm (required)
  positionY: number;             // Y coordinate in mm (required)
  width?: number;                // Object width in mm (optional)
  height?: number;               // Object height in mm (optional)
  content: any;                  // Type-specific content (required)
  formatting: any;               // Type-specific formatting (required)
  regionId?: string;             // Associated region ID (optional)
  rowHeight?: number;            // Row height for layout (optional)
  columns?: number;              // Number of columns (optional)
  selectedColumn?: number;       // Selected column index (optional)
  displayOrder?: number;         // Display order/z-index (optional, default: 0)
}
```

### UpdateSonObjectRequest
```typescript
interface UpdateSonObjectRequest {
  id: string;                    // Object ID (required)
  name?: string;                 // Display name (optional)
  positionX?: number;            // X coordinate in mm (optional)
  positionY?: number;            // Y coordinate in mm (optional)
  width?: number;                // Object width in mm (optional)
  height?: number;               // Object height in mm (optional)
  content?: any;                 // Type-specific content (optional)
  formatting?: any;              // Type-specific formatting (optional)
  regionId?: string;             // Associated region ID (optional)
  rowHeight?: number;            // Row height for layout (optional)
  columns?: number;              // Number of columns (optional)
  selectedColumn?: number;       // Selected column index (optional)
  displayOrder?: number;         // Display order/z-index (optional)
}
```

---

## Default Values

### Text Son Object Defaults
```typescript
const defaultTextSon = {
  type: 'text',
  content: '',
  fontFamily: 'Arial',
  fontSize: 12,
  textAlign: 'left',
  fontWeight: 'normal',
  textOverflow: 'resize',
  lineBreakType: 'word',
  characterConnector: '',
  margins: { top: 2, bottom: 2, left: 2, right: 2 },
  spaceAllocation: {
    region: 'content',
    rowHeight: 10,
    columns: 1,
    selectedColumn: 1,
    allocated: false
  },
  position: { x: 0, y: 0 }
};
```

---

## Notes

1. **Multiple Interfaces**: The system uses different interfaces for different purposes:
   - `SonObject` - Database/API interface
   - `SonMetadata` - UI/Legacy interface  
   - `TextSonData` - Specific text implementation
   - `BaseSonObject` - Base interface for all types

2. **Type Safety**: All interfaces use TypeScript for type safety and better development experience.

3. **Extensibility**: The system is designed to support multiple son object types, though currently only text is fully implemented.

4. **Positioning**: All positions and dimensions are in millimeters (mm) for precision.

5. **Optional Fields**: Many fields are optional to provide flexibility in object creation and updates.
