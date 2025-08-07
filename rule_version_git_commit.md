# Version Management & Git Commit Rules

## 🎯 MANDATORY PROTOCOL FOR ALL CODE CHANGES

This document establishes the **STRICT** version management and git commit protocol that **MUST** be followed for every single code change, no matter how small.

---

## 📋 Version Increment Rules

### **Rule 1: EVERY Code Change = Version Increment**
- **NO EXCEPTIONS**: Every code modification requires a version bump
- **Even smallest fixes**: Single line changes, typo fixes, comment updates
- **Consistent tracking**: Maintains complete change history

### **Version Numbering Convention: Major.Minor.Patch**

#### **Patch Increment** (x.x.X)
- Bug fixes and small improvements
- Typo corrections
- Performance optimizations
- UI tweaks
- **Examples**: `1.7.1` → `1.7.2`

#### **Minor Increment** (x.X.0)
- New features and enhancements
- New UI components
- Additional functionality
- **Examples**: `1.7.2` → `1.8.0`

#### **Major Increment** (X.0.0)
- Breaking changes
- Complete feature overhauls
- Architecture changes
- **Examples**: `1.8.0` → `2.0.0`

---

## 📝 Git Commit Message Rules

### **Rule 2: DETAILED Commit Messages Required**

#### **Format**: `v#.#.# - [Detailed description of changes and reasoning]`

#### **Good Examples**:
```
v1.7.2 - Fix region overlap validation logic to prevent regions from overlapping with existing regions when using automatic space detection
v1.8.0 - Add advanced fold line pattern support with custom dash patterns, multiple fold lines per mother object, and enhanced visual styling options
v1.7.3 - Update canvas zoom performance by optimizing SVG rendering and reducing unnecessary re-renders during pan operations
v1.8.1 - Fix mid-fold line padding calculation error that caused incorrect region positioning when using custom distance settings
```

#### **Bad Examples** (DO NOT USE):
```
v1.7.2 - Fix bug
v1.8.0 - Add feature
v1.7.3 - Update
```

### **Message Requirements**:
- **Explain WHAT** was changed
- **Explain WHY** it was changed
- **Include technical details** when relevant
- **Mention affected components** or features

---

## 🧪 Testing Requirements

### **Rule 3: ALWAYS Test Before Commit**

#### **Mandatory Testing Steps**:
1. **Browser Testing**: Open application and verify functionality
2. **Version Display**: Confirm new version appears in UI (header, canvas controls)
3. **Feature Testing**: Test the specific changes made
4. **Compilation Check**: Ensure no TypeScript/build errors
5. **Basic Navigation**: Verify core functionality still works

#### **Testing Locations**:
- Main welcome screen (version in header)
- Customer work area (version in customer header)
- Canvas area (version in controls panel)
- Specific feature being modified

---

## 🔄 Complete Workflow Steps

### **MANDATORY Sequence for EVERY Code Change**:

1. **📝 Plan Change**: Understand what needs to be modified
2. **🔢 Update Version**: Increment `package.json` version appropriately
3. **💻 Make Changes**: Implement the code modifications
4. **🧪 Test Thoroughly**: Follow all testing requirements above
5. **✅ Verify Version Display**: Confirm UI shows new version
6. **⏸️ WAIT for User Instruction**: Do NOT commit automatically
7. **📦 Git Workflow** (ONLY when user says "git add commit push"):
   ```bash
   git add .
   git commit -m "v#.#.# - [Detailed description of changes and reasoning]"
   git push
   ```

### **🚫 IMPORTANT: Manual Commit Only**
- **NEVER** automatically execute git commands
- **ALWAYS** wait for explicit user instruction
- **ONLY** commit when user specifically requests it
- User will say "git add commit push" or similar when ready

---

## 📍 Version Display Locations

### **Current Implementation** (v1.6.0+):
- **Main Header**: Welcome screen with styled version badge
- **Customer Header**: Top-right during active work
- **Canvas Controls**: Top-right corner next to zoom controls

### **Source of Truth**: 
- `ai-coordinate-viewer/package.json` version field
- Automatically displayed via `packageJson.version`

---

## 🚫 Violations & Consequences

### **NEVER Do These**:
- ❌ Code changes without version increment
- ❌ Vague or short commit messages
- ❌ Committing without testing
- ❌ Skipping version display verification
- ❌ Multiple unrelated changes in one commit

### **Quality Standards**:
- **Professional Development**: Maintain enterprise-level standards
- **Traceability**: Every change must be trackable
- **Reliability**: Users always know what version they're using
- **Debugging**: Clear history for troubleshooting

---

## 📊 Examples of Proper Implementation

### **Small Fix Example**:
```
Version: 1.7.1 → 1.7.2
Change: Fix typo in button text
Commit: "v1.7.2 - Fix typo in Add Region button text from 'Creat' to 'Create' to improve user interface clarity"
```

### **Feature Addition Example**:
```
Version: 1.7.2 → 1.8.0
Change: Add export functionality
Commit: "v1.8.0 - Add PDF export functionality for master files with custom page sizing, margin controls, and high-resolution output for professional printing"
```

### **Bug Fix Example**:
```
Version: 1.8.0 → 1.8.1
Change: Fix calculation error
Commit: "v1.8.1 - Fix mid-fold line positioning calculation that caused 2mm offset error when using custom distance settings instead of center positioning"
```

---

## 🎯 Success Metrics

### **Compliance Indicators**:
- ✅ Every commit has version increment
- ✅ All commit messages are detailed and clear
- ✅ Version display works in all UI locations
- ✅ No compilation errors
- ✅ Features work as expected after changes

### **Quality Assurance**:
- **User Confidence**: Clear version tracking
- **Developer Efficiency**: Easy change tracking
- **Support Quality**: Quick issue identification
- **Professional Standards**: Enterprise-level development practices

---

**This protocol is MANDATORY and must be followed for every code change without exception.**

*Last Updated: 2025-01-08 - v1.7.2*
