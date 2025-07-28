# 📋 Label Layout System - Complete Requirements

## 🎯 Core Problem
- Current piece-by-piece approach creates inconsistent spacing
- Users need better control over layout and margins
- Need intuitive, visual way to design labels with real-time feedback

---

## 🏗️ System Architecture

### Layout Structure
```
┌─────────────────────────────────────────────────────┬─────────────────┐
│                Canvas (70%)                         │   Left Panel    │
│                                                     │     (30%)       │
│              [Visual Canvas]                        │                 │
│                                                     │ 📋 Hierarchy    │
│              Keep existing:                         │ ▼ frame23       │
│               • Pan & zoom                          │   👶 son1       │
│               • Object rendering                    │   👶 son2       │
│               • Selection highlighting              │     ├─ Type     │
│               • Grid system                         │     ├─ Content  │
│                                                     │     ├─ Margins  │
│                                                     │     ├─ Align    │
│                                                     │     └─ Font     │
│                                                     │   👶 son3       │
│                                                     │ ▼ frame1        │
└─────────────────────────────────────────────────────┴─────────────────┘
```

### Region-Based System
- **Regions**: Header, Content, Care, Legal areas
- **Rows**: Horizontal divisions within regions
- **Columns**: Vertical divisions (focus on 2-column layouts)
- **Content**: 7 types of content in each column

---

## 📝 Content Types (8 Types)

### 1. 📝 Text
- Product names, descriptions, general text
- Font family, size, color controls
- Multi-line support

### 2. 🖼️ Image
- Brand logos, product photos, icons
- File upload support (PNG, JPG, SVG, PDF)
- Image scaling and positioning
- Aspect ratio preservation
- Image quality optimization for print
- Background removal tools
- Image filters and adjustments

### 3. 📊 Barcode
- Product codes, QR codes, EAN-13, etc.
- Format selection (Code128, QR, DataMatrix)
- Fixed width for consistent sizing

### 4. 🌍 Translation
- Multi-language support
- Base text + translations
- Language count display
- File upload for translation data

### 5. 🧺 Washing Symbol
- Care instruction symbols
- Symbol grid selection
- Custom symbol upload
- Temperature and care type indicators

### 6. 📏 Size Breakdown
- Size charts (XS, S, M, L, XL, etc.)
- Custom size addition
- Measurement inputs per size
- File upload for size charts

### 7. 📊 % Composition
- Material composition tracking
- Multi-part support (Body, Sleeve, etc.)
- Percentage validation (must equal 100%)
- Material name + percentage inputs

### 8. ⭐ Special Wording
- Legal text, warnings, special instructions
- Preset common phrases
- Free-form text input

---

## 🎨 Font Management System

### 1. Document-Level Fonts (Global)
- **Primary Font**: Most text content
- **Secondary Font**: Headers, emphasis
- **Small Text Font**: Legal text, care instructions
- Each with: Family, Size, Color, Weight

### 2. Son-Level Font Override
- **Document Mode**: Use global font settings
- **Preset Mode**: Choose from Primary/Secondary/Small
- **Custom Mode**: Individual font control
- Real-time font preview

### 3. Font Consistency Tools
- Bulk font application
- Inconsistency warnings
- "Fix all fonts" functionality
- Visual indicators (📄🎯🎨)

---

## � Measurement & Scale System

### 1. Unit Management
- **Primary Units**: mm, inches, points support
- **Unit Conversion**: Automatic conversion between units
- **Precision Control**: 1-3 decimal places
- **Display Preferences**: User-selectable unit display

### 2. Scale & DPI Management
- **Production DPI**: 300 DPI for print quality
- **Display DPI**: 96 DPI for screen rendering
- **Scale Factors**: Automatic conversion between screen/print
- **Zoom Levels**: 25%, 50%, 100%, 150%, 200%, Fit to View
- **Zoom Map Position**: Top right corner of canvas
- **Real-time Coordinates**: Mouse position tracking in mm

### 3. Production Constraints
- **Minimum Text Size**: 1.5mm (readable limit)
- **Minimum Margins**: 1.0mm (cutting tolerance)
- **Bleed Areas**: 2mm safety margin
- **Safe Zones**: 3mm from label edges
- **Maximum Dimensions**: 200mm x 300mm label size

### 4. Measurement Validation
- **Real-time warnings**: Text too small, margins insufficient
- **Production readiness**: Check all measurements meet standards
- **Export validation**: Ensure measurements are production-safe
- **Unit consistency**: Warn about mixed units

---

## �️ Image Management System

### 1. File Upload & Support
- **Supported Formats**: PNG, JPG, JPEG, SVG, PDF, AI, EPS
- **File Size Limits**: Max 50MB per image
- **Drag & Drop**: Direct upload to canvas or content library
- **Batch Upload**: Multiple images at once
- **Cloud Storage**: Integration with Google Drive, Dropbox

### 2. Image Processing
- **Automatic Optimization**: Convert to print-ready resolution (300 DPI)
- **Format Conversion**: Auto-convert to best format for production
- **Background Removal**: AI-powered background removal tools
- **Image Filters**: Brightness, contrast, saturation adjustments
- **Color Profile**: CMYK conversion for print accuracy

### 3. Scaling & Positioning
- **Aspect Ratio Lock**: Maintain proportions during resize
- **Scaling Modes**: Fit, Fill, Stretch, Original size
- **Smart Scaling**: Automatic size suggestions based on content area
- **Resolution Warnings**: Alert when image quality is insufficient
- **Print Size Calculator**: Show actual print dimensions

### 4. Image Library Management
- **Asset Library**: Store frequently used logos and images
- **Categories**: Organize by brand, product type, symbols
- **Search & Filter**: Find images by name, size, format
- **Version Control**: Track image updates and changes
- **Usage Tracking**: See where images are used across labels

---

## 🎯 Space Allocation System

### 1. Step-by-Step Allocation Workflow
When user clicks a son object, the system guides through space allocation:

```
Step 1: Click Son → Step 2: Region → Step 3: Height → Step 4: Columns → Step 5: Column Selection → Step 6: Confirm
```

### 2. Space Allocation Process
- **Region Selection**: Choose which region (Header, Content, Care, Legal)
- **Height Definition**: Specify row height in mm
- **Column Layout**: Choose 1, 2, 3 columns or custom split
- **Column Assignment**: Select which column for the son
- **Space Confirmation**: Finalize allocation with real-time preview

### 3. Multi-Son Region Support
- **Multiple sons per region**: ✅ Flexible arrangement
- **Different columns**: Each son can occupy different columns
- **Balance space usage**: Remaining columns available for other sons
- **Dynamic layouts**: Mix of 1-column, 2-column, 3-column arrangements

### 4. Visual Space Management
```
Example: Header Region with 3 sons
┌─────────┬─────────┬─────────┐
│ son2    │ son1    │ son3    │
│ Logo    │ Barcode │ Text    │ ← All in same row, different columns
│ [25mm height, 3 columns]    │
└─────────┴─────────┴─────────┘
```

### 5. Space Tracking & Availability
- **Available Space**: Green overlay shows unused columns
- **Occupied Space**: Red overlay shows used columns
- **Real-time Dimensions**: Display actual mm measurements
- **Space Toggle**: Show/hide allocation overlay
- **Conflict Detection**: Warn about overlapping content

---

## ��📐 Layout & Spacing System

### 1. Region Structure
```
┌─────────────────────────────────────┐
│  Header Region (Brand/Logo/Barcode) │
├─────────────────────────────────────┤
│  Content Region (Product Info)      │
│  ┌─────────────┬─────────────────┐   │
│  │ Material 60%│ Composition 40% │   │ ← 2 columns
│  └─────────────┴─────────────────┘   │
├─────────────────────────────────────┤
│  Care Region (Washing/Instructions) │
├─────────────────────────────────────┤
│  Legal Region (Size/Compliance)     │
└─────────────────────────────────────┘
```

### 2. Dynamic Column System
- **Flexible widths**: 50-50, 70-30, custom percentages
- **Fixed widths**: mm-based for precise control
- **Content-aware sizing**: Barcodes get fixed width, text flexible
- **Multi-column support**: 1, 2, 3 columns or custom arrangements
- **Balance space management**: Unused columns remain available
- **Per-row configuration**: Each row can have different column layouts

### 3. Margin Control
```
┌─────────────────────────────────┐
│ ↑ Top Margin (mm)               │
│ ← Left │  Content  │ Right → │
│ ↓ Bottom Margin (mm)            │
└─────────────────────────────────┘
```
- **Individual control**: Top, Right, Bottom, Left margins
- **Visual editor**: Input fields with live preview
- **Consistent spacing**: Rules across the label

### 4. Alignment Control
```
┌─────────────────────────────────┐
│ ↖️ Top-Left    ⬆️ Top-Center    ↗️ Top-Right    │
│                                 │
│ ⬅️ Mid-Left    ⭕ Center       ➡️ Mid-Right    │
│                                 │
│ ↙️ Bot-Left    ⬇️ Bot-Center    ↘️ Bot-Right    │
└─────────────────────────────────┘
```
- **9-position alignment**: Full horizontal + vertical control
- **Content-aware**: Different options per content type
- **Visual guides**: Real-time alignment indicators on canvas

---

## 🖱️ User Interface & Interactions

### 1. Left Panel (30%) - Hierarchical Expansion with Space Allocation
```
📋 Objects Hierarchy:

▼ frame23 (6 objects)                    [👑 Fit View]
  👶 son1 ────────────────────────────── [🎯 Pan To] [📐 Allocate Space]
    ├─ 🎯 Type: Text
    ├─ 📝 Content: "Made in China"
    ├─ 📍 Space: Header Region, Row 1, Col 2 (25mm × 60mm)
    ├─ 📐 Margins: T:5 R:3 B:5 L:3
    ├─ 📍 Alignment: Center-Middle
    ├─ 🎨 Font: Document Primary
    └─ 📊 Preview: [Made in China]

  👶 son2 ────────────────────────────── [🎯 Pan To] [📐 Allocate Space]
    ├─ 🎯 Type: Barcode
    ├─ 📍 Space: Header Region, Row 1, Col 1 (25mm × 30mm)
    └─ (collapsed)

▶ frame1 (8 objects)                     [👑 Fit View]
```

### 2. Expansion Behavior
- **Downward expansion**: Natural, intuitive flow
- **Accordion style**: Smooth animations
- **Single expansion**: Only one son expanded at a time
- **Context preservation**: Attributes stay with their son

### 3. Canvas Interactions (70%)
- **Mother click**: Fit to view (100% zoom, centered)
- **Son click**: Pan to center (keep current zoom)
- **Existing features**: Pan, zoom, selection unchanged

### 4. Zoom Map Controls (Top Right Corner)
```
Canvas Layout with Zoom Block in Top Right:
┌─────────────────────────────────────────────────────────────────────┐
│                                                 ┌─────────────────┐ │
│                                                 │ Zoom: 152%      │ │
│                                                 │ [+] [-] [1:1] [Fit] │ │
│                Canvas Area                      │ 📐 Dimensions   │ │
│                                                 │ Pan: Click & drag │ │
│                                                 │ Zoom: Mouse wheel │ │
│                                                 │                 │ │
│                                                 │ Coordinates (mm): │ │
│                                                 │ X: 153.73       │ │
│                                                 │ Y: 170.40       │ │
│                                                 └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**🚨 CRITICAL BUG: Zoom controls currently in WRONG POSITION (top left instead of top right)**
**Implementation Priority: URGENT - Fix zoom block positioning immediately**

- **Position**: Fixed absolute positioning in top right corner of canvas area
- **Z-Index**: High priority overlay to stay above canvas content
- **Zoom Level Display**: Current zoom percentage (e.g., 152%)
- **Zoom Controls**: +/- buttons, 1:1 actual size, Fit to view button
- **Interaction Guide**: Pan and zoom instructions for user reference
- **Real-time Coordinates**: Live mouse position tracking in mm
- **Dimensions Toggle**: Show/hide measurement overlay button
- **Fixed Position**: Remains in corner during all pan/zoom operations
- **Styling**: Semi-transparent background, rounded corners, subtle shadow

---

## ⚡ Real-Time Preview System

### 1. Live Updates
- **Content changes**: Immediate canvas update as user types
- **Margin adjustments**: Live margin indicators on canvas
- **Alignment changes**: Instant positioning updates
- **Font changes**: Instant typography preview
- **Type switching**: Dynamic form updates

### 2. Visual Feedback
```
Canvas Shows:
├─ Original object boundary (dashed line)
├─ Content area with margins (colored overlay)
├─ Live content preview (actual text/barcode)
├─ Margin indicators (T:5, R:3, B:5, L:3)
├─ Alignment guides (center lines, position dots)
├─ Space allocation overlay (toggle on/off)
│  ├─ Available space (green overlay)
│  ├─ Occupied space (red overlay)
│  └─ Real dimensions (mm measurements)
└─ Content type icons (📝�️�📊🌍🧺📏📊⭐)
```

### 3. Performance
- **Debounced updates**: 100ms delay for smooth typing
- **Selective re-rendering**: Only changed objects update
- **Memory efficient**: Optimized state management

---

## 💾 Data Management

### 1. Export/Import
- **Son metadata export**: JSON with all configurations
- **Template system**: Save/load common layouts
- **File uploads**: Translation files, size charts, symbols
- **Production export**: Ready for manufacturing

### 2. Data Structure
```javascript
const sonMetadata = {
  id: 'son1',
  type: 'image', // 'text' | 'image' | 'barcode' | 'translation' | etc.
  content: 'Made in China', // For text, or file path for images
  spaceAllocation: { // NEW: Space allocation data
    region: 'header',           // Which region
    regionId: 'header-region-1',
    row: 1,                     // Which row in region
    rowHeight: 25,              // Height in mm
    column: 2,                  // Which column (1, 2, 3, etc.)
    columnWidth: '33%',         // Width as percentage or mm
    totalColumns: 3,            // Total columns in this row
    position: {                 // Calculated absolute position
      x: 66,                    // mm from left
      y: 10,                    // mm from top
      width: 60,                // mm
      height: 25                // mm
    },
    allocated: true,            // Space has been allocated
    conflicts: []               // Any space conflicts
  },
  imageData: { // Only for image type
    file: 'logo.png',
    originalSize: { width: 200, height: 100 }, // pixels
    displaySize: { width: 50, height: 25 },    // mm
    aspectRatio: 2.0,
    format: 'PNG',
    dpi: 300,
    scaling: 'fit', // 'fit' | 'fill' | 'stretch' | 'original'
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      backgroundRemoval: false
    }
  },
  margins: {
    top: 5, right: 3, bottom: 5, left: 3,
    unit: 'mm' // Unit for all margin values
  },
  alignment: {
    horizontal: 'center', // 'left' | 'center' | 'right'
    vertical: 'middle'    // 'top' | 'middle' | 'bottom'
  },
  font: {
    mode: 'document', // 'document' | 'preset' | 'custom'
    preset: 'primary',
    custom: {
      family: 'Arial',
      size: 12,
      sizeUnit: 'pt', // pt, mm, px
      color: '#000'
    }
  },
  measurements: {
    unit: 'mm',           // Primary unit for this object
    precision: 2,         // Decimal places
    validated: true,      // Passes production constraints
    warnings: []          // Array of measurement warnings
  },
  region: 'content',
  row: 1,
  column: 1
};

// Document-level settings with space management
const documentSettings = {
  measurements: {
    primaryUnit: 'mm',
    displayUnit: 'mm',
    precision: 2,
    dpi: 300,
    scale: '1:1'
  },
  constraints: {
    minTextSize: 1.5,     // mm
    minMargin: 1.0,       // mm
    bleedArea: 2.0,       // mm
    safeZone: 3.0         // mm
  },
  spaceManagement: { // NEW: Space allocation settings
    regions: [
      {
        id: 'header',
        name: 'Header Region',
        bounds: { x: 10, y: 10, width: 180, height: 40 },
        rows: [
          {
            id: 'header-row-1',
            height: 25,
            columns: [
              { id: 'col-1', width: '33%', occupied: false },
              { id: 'col-2', width: '33%', occupied: true, occupiedBy: 'son1' },
              { id: 'col-3', width: '34%', occupied: false }
            ]
          }
        ]
      }
    ],
    visualSettings: {
      showSpaceOverlay: true,
      availableColor: 'rgba(76,175,80,0.3)', // Green
      occupiedColor: 'rgba(244,67,54,0.3)',  // Red
      showDimensions: true
    }
  }
};
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation
- 30% left / 70% right layout
- Basic hierarchy with accordion expansion
- Son metadata system
- **Space allocation workflow implementation**
- **Step-by-step allocation dialog**
- Real-time content updates

### Phase 2: Content Types
- All 8 content type forms (including Image)
- Type-specific editors
- **Image upload and processing system**
- **Image scaling and positioning tools**
- Basic margin controls
- Alignment system
- Font management system
- **Measurement system implementation**
- **Unit conversion and validation**

### Phase 3: Advanced Layout
- **Multi-son region support**
- **Dynamic column arrangements**
- **Balance space management**
- Advanced margin visualization
- Alignment guides and indicators
- **Visual space overlay system**
- Template system

### Phase 4: Polish
- Performance optimizations
- Advanced typography
- **Image library management**
- **Advanced image processing (AI background removal)**
- File upload/export
- Production-ready features

---

## ✅ Key Benefits

1. **Consistent Design**: Grid-based professional layouts
2. **Real-Time Feedback**: See changes immediately
3. **Intuitive Interface**: Familiar accordion/tree structure
4. **Precise Control**: Exact margin, alignment, and font control
5. **Flexible Layout**: 2-column system handles most use cases
6. **Rich Media Support**: Professional image handling with optimization
7. **Efficient Workflow**: Templates and bulk operations
8. **Production Ready**: Export for manufacturing

---

## 🎯 Success Criteria

- **User can create professional labels** with consistent spacing
- **Real-time preview** shows exactly what will be produced
- **Intuitive workflow** requires minimal training
- **Flexible system** handles various label types and sizes
- **Export-ready** files for production use
- **Template system** speeds up common label creation

---

*This document serves as the complete specification for the Label Layout System development.*
