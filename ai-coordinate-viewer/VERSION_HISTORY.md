# Care Label Layout System - Version History

## Version 2.1.55 - Added Text Content Generation with Multi-Language Material Translations
**Release Date:** 2025-01-14
**Commit:** TBD

### 📝 Text Content Generation Feature
- **New Text Content Section**: Added below Material Composition section
  - **Separator Input**: Customizable separator for material translations (default: " - ")
  - **Text Value Display**: Read-only textarea showing generated composition text
  - **Auto-Generation**: Real-time text generation based on material compositions and selected languages
  - **Multi-Language Support**: Displays material names in all selected languages
- **Material Translation System**:
  - **18-Language Support**: Complete translations for COTTON, POLYESTER, ELASTANE, VISCOSE
  - **Language Order**: ES, FR, EN, PT, DU, IT, GR, JA, DE, DA, SL, CH, KO, ID, AR, GA, CA, BS
  - **Example Output**: "100% algodón - coton - cotton - algodão - katoen - cotone - ΒΑΜΒΑΚΙ - コットン - baumwolle - bomuld - bombaž - 棉 - 면 - katun - قطن - algodón - cotó - kotoia"
- **Dynamic Text Generation**:
  - **Multi-Material Support**: Each material composition on separate line
  - **Percentage Display**: Shows percentage with translated material names
  - **Line Breaks**: Automatic line breaks between different materials
  - **Real-Time Updates**: Text updates instantly when compositions or languages change
- **Enhanced User Experience**:
  - **2-Column Layout**: Separator input | Text value display
  - **Monospace Font**: Better readability for generated text
  - **Resizable Textarea**: Users can adjust height as needed
  - **Visual Feedback**: Clear separation and styling

## Version 2.1.54 - Fixed Material Input Accessibility for Over-100% Corrections
**Release Date:** 2025-01-14
**Commit:** TBD

### 🔧 Critical UX Fix
- **Always Active Material Inputs**: Fixed issue where material inputs were disabled when total > 100%
  - **Problem**: Users couldn't edit percentages to fix over-100% situations
  - **Solution**: Material inputs (percentage and dropdown) remain always active
  - **Benefit**: Users can now correct over-100% compositions by editing values
  - **Validation**: Only "+" button and "Save" button are disabled when total > 100%
- **Improved User Experience**:
  - **Editable Inputs**: Percentage and material dropdowns always accessible
  - **Clear Workflow**: Users can fix over-100% by reducing existing percentages
  - **Logical Behavior**: Only prevent adding more materials or saving when over 100%

## Version 2.1.53 - Enhanced Material Composition with Dynamic Validation
**Release Date:** 2025-01-14
**Commit:** ea7c2d4

### 🧪 Enhanced Material Composition System
- **Dynamic Material Composition**: Multiple material rows with percentage validation
  - **"+" Button**: Add new material composition rows (enabled when total < 100%)
  - **Remove Button**: Delete individual material rows (× button)
  - **Real-time Total**: Display current percentage total in header
  - **Smart Validation**: Three validation states based on total percentage:
    * **>100%**: Disable material elements, "+" button, and "Save" button
    * **=100%**: Enable material elements, disable "+" button, enable "Save" button
    * **<100%**: Enable material elements, enable "+" button, disable "Save" button
- **Enhanced Interface**:
  - **"Save" Button**: Changed from "Add Composition Trans" to "Save"
  - **Green Save Button**: Color changes to green (#28a745) when enabled
  - **Disabled States**: Visual feedback for disabled controls
  - **3-Column Grid**: Percentage | Material | Remove button layout
- **Improved User Experience**:
  - **Multiple Materials**: Support for complex material compositions
  - **Percentage Validation**: Ensures total equals exactly 100%
  - **Visual Feedback**: Clear indication of validation state
  - **Dynamic Controls**: Buttons enable/disable based on composition state

## Version 2.1.51 - Improved Alignment Layout and Doubled Dialog Width
**Release Date:** 2025-01-14
**Commit:** 4e9d1da

### 🎨 UI Enhancements
- **Improved Language Display**: Updated language selection with database codes
  - **Correct Database Codes**: Using proper 2-letter codes (AR, BS, CA, CH, DA, DU, EN, FR, GA, DE, GR, ID, IT, JA, KO, PT, SL, ES)
  - **Removed Flag Emojis**: Eliminated confusing flag icons that didn't match properly
  - **Clean Format**: Display as "CODE Language" (e.g., "AR Arabic", "EN English")
  - **Bold Codes**: Language codes displayed in bold for better readability
- **Improved Alignment Layout**: Redesigned alignment section with side-by-side layout
  - **Horizontal Alignment**: Left side - Left/Center/Right radio buttons
  - **Vertical Alignment**: Right side - Top/Center/Bottom radio buttons
  - **Better Space Usage**: More efficient use of column width
  - **Cleaner Organization**: Logical grouping of related controls
- **Doubled Dialog Width**: Increased popup menu width from 500px to 1000px
  - **Better Space Utilization**: More room for 3-column layout
  - **Improved Readability**: Less cramped controls and text
  - **Enhanced Language Grid**: Better display of all 18 languages
  - **Comfortable Layout**: More breathing room for all sections

## Version 2.1.50 - Enhanced Composition Translation Dialog with 3-Column Layout
**Release Date:** 2025-01-14
**Commit:** a22a3b6

### 🌐 Composition Translation Improvements
- **New 3-Column Layout**: Completely redesigned composition translation popup menu
  - **Row 1 - Column 1**: 📏 Padding (mm) - Left, Top, Right, Bottom inputs
  - **Row 1 - Column 2**: 📐 Alignment - Horizontal (Left/Center/Right) and Vertical (Top/Center/Bottom) radio buttons
  - **Row 1 - Column 3**: ✏️ Typography - Font Family dropdown and Font Size with unit selector
  - **Row 2**: Comprehensive language selection from composition table
  - **Multi-Select Languages**: Users can select multiple languages with checkboxes
  - **Quick Actions**: "Select All" and "Deselect All" buttons for convenience
  - **Visual Feedback**: Selected languages displayed with flags and names
  - **Language Options**: All 18 languages from composition table (Arabic, Basque, Catalan, Chinese, Danish, Dutch, English, French, Galician, German, Greek, Indonesian, Italian, Japanese, Korean, Portuguese, Slovenian, Spanish)

### 🎨 UI Enhancements
- **3-Column Grid Layout**: Efficient use of horizontal space with bordered sections
- **Compact Controls**: Smaller input fields and labels to fit 3-column design
- **Visual Language Selection**: Flag icons and clear language names for all 18 supported languages in 4-column grid
- **Selection Counter**: Shows number of selected languages in header
- **Selected Languages Display**: Visual confirmation of current selections with badges
- **Consistent Styling**: All sections have matching borders and background colors

### 🔧 Technical Improvements
- **Enhanced Config Interface**: Added `selectedLanguages` array to configuration
- **Language Management**: Functions for toggle, select all, and deselect all
- **3-Column Grid System**: CSS Grid layout for optimal space utilization
- **Integrated Alignment Controls**: Moved alignment controls into main layout
- **State Management**: Proper handling of language selection state
- **Error Prevention**: Added null checks and default values for all arrays

## Version 2.1.49 - Enhanced Mother Edit Button Visibility
**Release Date:** 2025-01-12
**Commit:** TBD

### 🎨 UI Enhancement
- **Enhanced Edit Button Styling**: Made mother edit button more prominent and always clearly enabled
  - **Problem**: Edit button appeared dimmed/disabled when regions existed
  - **Solution**: Applied explicit blue gradient styling with hover effects
  - **Features**:
    - Bright blue gradient background (`#2196F3` to `#1976D2`)
    - Hover effect with scale animation
    - Explicit `disabled={false}` and `opacity: 1`
    - High z-index to prevent overlay interference
    - Bold white text for maximum visibility

### 🔧 Technical Improvements
- **Explicit Styling**: Overrides any inherited disabled styles
- **Hover Feedback**: Visual confirmation that button is interactive
- **Z-Index Protection**: Ensures button stays above any overlay elements
- **Accessibility**: Clear visual indication of button availability

---

## Version 2.1.48 - Fixed Mother Edit Button Availability
**Release Date:** 2025-01-12
**Commit:** TBD

### 🐛 Critical Bug Fix
- **Fixed Mother Edit Button**: Removed restriction that prevented editing mother objects when regions exist
  - **Problem**: Edit button disappeared after creating regions, forcing users to delete all regions to edit mother
  - **Root Cause**: Edit button condition included `context !== 'projects'` which was blocking access
  - **Solution**: Simplified condition to only check `isWebCreationMode`
  - **Result**: Users can now edit mother objects at any time, regardless of regions

### 🔧 Technical Improvements
- **Simplified Edit Logic**: Removed unnecessary context restrictions for mother editing
- **Better User Experience**: No longer need to delete regions to modify mother properties
- **Consistent Behavior**: Edit functionality now available throughout the workflow

---

## Version 2.1.47 - Fixed Header & Mid Fold Line Padding Visualization
**Release Date:** 2025-01-12
**Commit:** TBD

### 🎯 UI/UX Improvements
- **Fixed Header for Edit Mother Dialog**: Header now stays fixed at top when scrolling
  - **Problem**: Header scrolled with content making it hard to see dialog title
  - **Solution**: Added `position: sticky, top: 0, zIndex: 10` to header
  - **Benefit**: Always visible dialog title and drag handle
- **Scrollable Content Area**: Dialog content now has max height with scroll
  - **Implementation**: `maxHeight: '400px', overflowY: 'auto'`
  - **Benefit**: Better space management for long forms

### 🎨 Visual Enhancement
- **Mid Fold Line Padding Visualization**: Added visual padding areas around mid fold lines
  - **Horizontal Lines**: Shows padding areas above and below the fold line
  - **Vertical Lines**: Shows padding areas left and right of the fold line
  - **Styling**: Semi-transparent red rectangles (`#d32f2f`, 30% opacity)
  - **Purpose**: Clearly shows restricted areas where regions cannot be placed

### 🔧 Technical Improvements
- **Enhanced Canvas Rendering**: Improved mid fold line visualization system
- **Consistent Color Scheme**: Padding areas use same color as fold lines for clarity
- **Responsive Design**: Padding visualization scales with zoom level
- **User Experience**: Better visual feedback for layout constraints

---

## Version 2.1.46 - Fixed Leftover Space Size Calculation
**Release Date:** 2025-01-12
**Commit:** TBD

### 🐛 Critical Bug Fix
- **Fixed Leftover Space Size**: Resolved incorrect size calculation for "Occupy leftover space" content
  - **Problem**: Algorithm was finding 13×116mm instead of full remaining space (18×126mm)
  - **Root Cause**: `findLargestAvailableRectangle()` finds largest single rectangle, not all remaining space
  - **Solution**: Replaced with simple subtraction approach for leftover space calculation
  - **Result**: Leftover content now uses full remaining area as expected

### 🔧 Technical Improvements
- **Simplified Algorithm**: Direct calculation of remaining space instead of complex rectangle finding
- **Better Logic**: Prioritizes space to the right, then below existing content
- **Accurate Sizing**: Uses actual remaining dimensions (region.width - usedWidth)
- **Debug Enhancement**: Updated debug output to show new calculation method

---

## Version 2.1.45 - Fixed Debug Panel Infinite Re-render
**Release Date:** 2025-01-12
**Commit:** TBD

### 🐛 Critical Bug Fix
- **Fixed Infinite Re-render Loop**: Resolved "Too many re-renders" error in debug panel
  - **Problem**: `setDebugInfo` calls during render cycle caused infinite re-render loop
  - **Solution**: Use `setTimeout` to defer state updates outside render cycle
  - **Approach**: Debug info stored using async state updates with proper TypeScript typing
  - **Result**: Debug panel works without causing render loops

### 🔧 Technical Improvements
- **Render-Safe Debug Storage**: Debug info updates deferred using `setTimeout`
- **TypeScript Compliance**: Fixed variable typing issues for `overlayX` and `overlayY`
- **Performance**: No unnecessary re-renders, debug info updates asynchronously
- **User Experience**: Clear button restored, debug panel shows real-time calculations

---

## Version 2.1.44 - Added Debug Panel for Leftover Space
**Release Date:** 2025-01-12
**Commit:** TBD

### 🐛 Debug Enhancement
- **Added On-Screen Debug Panel**: Real-time debugging information displayed on web page
  - **Problem**: Console logs are too sensitive and hard to copy due to mouse movements
  - **Solution**: Debug panel shows leftover space calculations directly on the page
  - **Features**: Shows region dimensions, existing content, found space, and positioning info
  - **UI**: Fixed position panel with clear button, scrollable, and professional styling

### 🔧 Technical Improvements
- **Debug State Management**: Added `debugInfo` state to store debug messages
- **Real-time Updates**: Debug info updates as leftover space calculations occur
- **User-Friendly Display**: Formatted debug information with clear labels and structure
- **Easy Access**: No need to open browser console, information visible on page

---

## Version 2.1.43 - Fixed "Occupy Leftover Space" Positioning
**Release Date:** 2025-01-12
**Commit:** TBD

### 🐛 Critical Positioning Fix
- **Fixed Content Positioning for "Occupy Leftover Space"**: Content now properly positions in calculated available space
  - **Problem**: Content was using vertical stacking position instead of calculated horizontal position
  - **Result**: Content appeared as thin line at bottom instead of occupying right half
  - **Solution**: Store and use calculated position (x, y) from space detection algorithm
  - **Positioning**: Content now correctly positions at calculated coordinates within region

### 🔧 Technical Improvements
- **Position Storage**: Store calculated position in content object for rendering
- **Conditional Positioning**: Use calculated position for leftover content, normal stacking for others
- **Stack Management**: Leftover content doesn't affect vertical stacking of other content
- **Debug Logging**: Enhanced positioning debug information

---

## Version 2.1.42 - Fixed "Occupy Leftover Space" Logic
**Release Date:** 2025-01-12
**Commit:** TBD

### 🐛 Critical Bug Fix
- **Fixed "Occupy Leftover Space" Content Logic**: Completely rewrote the leftover space calculation
  - **Problem**: Content with "Occupy leftover space" was only looking for vertical space (remaining height)
  - **Result**: Content appeared as thin horizontal line instead of occupying available horizontal space
  - **Solution**: Now finds largest available rectangular area within the region
  - **Works with**: All scenarios (with/without mid-fold lines, any region configuration)

### 🔧 Technical Improvements
- **Enhanced Space Detection**: Uses existing `findLargestAvailableRectangle()` function
- **Proper Content Positioning**: Calculates actual content rectangles for space analysis
- **Region Boundary Respect**: Content stays within region boundaries
- **Content Overlap Prevention**: Avoids overlapping with existing content
- **Debug Logging**: Added comprehensive logging for troubleshooting

### 🎯 Scenarios Fixed
- **No Mid-Fold**: Content properly occupies right half of region (W=50%, H=100%)
- **Horizontal Mid-Fold**: Content occupies available space in respective regions
- **Vertical Mid-Fold**: Content occupies available space in respective regions
- **Any Region Size**: Logic works consistently across all region configurations

---

## Version 1.9.0 - Backend Server Added (SQLite)

## Version 1.9.2 - Master Files UI fixes: customer label, card click, thumbnails
- Master Files grid now resolves customer name from customers list and metadata
- Disabled card body navigation; use explicit Manage Templates button
- Large thumbnail shows regions and mid-fold line; region border thin + dotted
- Small thumbnail synced to show same styling as large preview
- Minor: mid-fold legacy sewingPosition support in preview generator

- Added Express + Prisma + SQLite backend at http://localhost:3001
- Frontend auto-detects backend availability and displays API status badge
- Region editing persists to SQL via masterFileService.updateMasterFile
- Fallback to localStorage remains when backend is offline


## Version 1.7.0 (Current) - Mid-Fold Region Creation
**Release Date:** 2025-01-08
**Commit:** TBD

### 🎯 Major Features
- **Mid-Fold Aware Region Creation**: Revolutionary region placement system
  - Regions automatically respect mid-fold line constraints
  - Cannot cross over mid-fold lines (horizontal or vertical)
  - Automatic space splitting for "Use remaining available space"
  - Intelligent padding consideration (default 3mm from mid-fold line)

### 🔧 Technical Enhancements
- **Enhanced Space Analysis**: New `findAvailableSpaceWithMidFold()` function
  - Detects horizontal and vertical mid-fold lines
  - Calculates available space on each side of mid-fold
  - Respects configurable padding distances
  - Handles custom positioning and 50/50 center splits

### 🎨 User Experience Improvements
- **Automatic Region Splitting**:
  - Creates "Region_Top" and "Region_Bottom" for horizontal mid-folds
  - Creates "Region_Left" and "Region_Right" for vertical mid-folds
  - Confirmation dialog before creating multiple regions
  - Clear success messages with region names

### 🚫 Smart Constraints
- **Mid-Fold Line Respect**: Regions automatically positioned to avoid crossing mid-fold
- **Padding Awareness**: All calculations include mid-fold line padding
- **Boundary Validation**: Ensures regions fit within available space
- **Conflict Prevention**: No overlap with existing regions or margins

### 📱 Enhanced UI
- **Visual Feedback**: Updated description text explains mid-fold awareness
- **Confirmation Dialogs**: User approval required for automatic splits
- **Debug Logging**: Comprehensive console output for troubleshooting
- **Error Handling**: Clear messages when insufficient space available

---

## Version 1.6.0 - Mid-Fold Line Enhancement
**Release Date:** 2025-01-08
**Commit:** 71f93d4

### 🎯 Major Features
- **Enhanced Mid-Fold Line System**: Complete redesign of mid-fold line functionality
  - Support for horizontal and vertical fold types
  - Custom distance positioning or 50/50 center split
  - Configurable padding from edges (default 3mm)
  - Professional red dashed line appearance (#d32f2f, 3px width, 4,4 dash pattern)

### 🔧 Technical Improvements
- **Main Canvas Rendering**: Added mid-fold line rendering to `renderObject` function
- **Conflict Prevention**: Sewing lines automatically disabled when mid-fold line is enabled
- **Zoom-Responsive**: Mid-fold lines scale properly with zoom and pan operations
- **Visual Labels**: Added "Mid-Fold H" and "Mid-Fold V" labels for clarity

### 🐛 Bug Fixes
- **Canvas Display Issue**: Fixed mid-fold lines not appearing on main canvas
- **Sewing Line Conflicts**: Prevented overlap between sewing lines and mid-fold lines
- **Master File Consistency**: Ensured mid-fold lines render consistently in both canvas and master file views

### 🎨 UI/UX Enhancements
- **Version Display**: Added version number display in multiple locations:
  - Main header (welcome screen)
  - Customer header (during work)
  - Canvas controls (top-right corner)
- **Enhanced Configuration UI**: Improved mid-fold line configuration dialog
- **Debug Logging**: Added comprehensive logging for troubleshooting

### 📝 Code Quality
- **Clean Architecture**: Separated old and new mid-fold line logic
- **Enhanced Debugging**: Added console logs for canvas rendering and save operations
- **Type Safety**: Maintained TypeScript compatibility throughout

---

## Version 1.5.5 - Previous Release
**Release Date:** 2025-01-07

### Features
- Basic mid-fold line configuration UI
- Sewing position management
- Mother object creation and editing
- Region management system
- Master file management

### Known Issues (Fixed in 1.6.0)
- Mid-fold lines not displaying on main canvas
- Sewing line conflicts with mid-fold lines
- Inconsistent rendering between canvas and master files

---

## Version History Notes

### Version Numbering Convention
- **Major.Minor.Patch** (e.g., 1.6.0)
- **Major**: Breaking changes or significant feature overhauls
- **Minor**: New features, enhancements, major bug fixes
- **Patch**: Small bug fixes, minor improvements

### Development Guidelines
1. **Always update version** in `package.json` for each release
2. **Document all changes** in this VERSION_HISTORY.md file
3. **Include commit hash** for traceability
4. **Test thoroughly** before version increment
5. **Update UI version display** to match package.json

### Future Roadmap
- **1.6.1**: Minor bug fixes and performance improvements
- **1.7.0**: Advanced fold line features (multiple fold lines, custom patterns)
- **1.8.0**: Enhanced export capabilities and print optimization
- **2.0.0**: Complete UI redesign and workflow optimization

---

*This version history is automatically updated with each release to maintain clear documentation of system evolution.*
