# Care Label Layout System - Version History

## Version 1.6.0 (Current) - Mid-Fold Line Enhancement
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
