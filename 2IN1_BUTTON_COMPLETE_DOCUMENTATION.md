# 2in1 Button: Complete Technical Documentation
**Version: 2.9.128**
**Last Updated: 2025-10-11**

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Structure](#component-structure)
4. [Line-by-Line Flow](#line-by-line-flow)
5. [Height Calculation System](#height-calculation-system)
6. [N-Split Algorithm](#n-split-algorithm)
7. [Canvas Rendering](#canvas-rendering)
8. [PDF Generation](#pdf-generation)
9. [Troubleshooting](#troubleshooting)
10. [Code Reference](#code-reference)

---

## 1. Overview

### What is the 2in1 Button?

The **2in1 Button** is a universal handler that combines two critical operations into one seamless action:

1. **Save**: Saves composition translation configuration
2. **Generate**: Automatically detects overflow and splits text across multiple regions

### Key Features

- ✅ **Universal Handler**: Works for both regions and slices
- ✅ **Automatic N-Split Detection**: Intelligently splits text into N mothers when overflow occurs
- ✅ **Text Preservation**: All text is preserved, no data loss
- ✅ **CHECK-BASED Verification**: Ensures asynchronous operations complete successfully
- ✅ **User-Adjustable Safety Margins**: Tricky height/width parameters prevent clipping
- ✅ **Visual Feedback**: Real-time preview of split results

### Use Cases

**Scenario 1: Single Region (No Overflow)**
```
User enters: 50% Cotton, 50% Polyester (18 languages)
Height: 20mm (fits in one region)
Result: Text saved to current region only
```

**Scenario 2: Multi-Region (Overflow Detected)**
```
User enters: 50% Cotton, 30% Polyester, 20% Elastane (18 languages)
Height: 50mm (requires 3 regions at 20mm each)
Result: Text automatically split across 3 mothers
  - Mother 1: Lines 1-10
  - Mother 2: Lines 11-20
  - Mother 3: Lines 21-30
```

---

## 2. Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   NewCompTransDialog.tsx (Composition Dialog)         │  │
│  │   - Material Input (Cotton, Polyester, etc.)         │  │
│  │   - Language Selection (18 languages)                │  │
│  │   - 2in1 Button Handler                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 CALCULATION & LOGIC LAYER                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   detectOverflowAndSplitN() - Line 542              │  │
│  │   - Calculate lines per mother                       │  │
│  │   - Determine total mothers needed                   │  │
│  │   - Split text into N chunks                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   handle2in1() - Line 2794                          │  │
│  │   - Detect source (region/slice)                     │  │
│  │   - Remove existing child mothers                    │  │
│  │   - Create new child mothers                         │  │
│  │   - Distribute text across mothers                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   RENDERING LAYER                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   App.tsx (Canvas Rendering)                         │  │
│  │   - Line 9018: N-split overflow calculation          │  │
│  │   - Line 17030: Comp-trans region rendering          │  │
│  │   - Line 17112: Multi-line region rendering          │  │
│  │   - Line 18134: Child region text rendering (PDF)    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    PDF GENERATION LAYER                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   OrderHistoryTab.tsx (Order Management)             │  │
│  │   - Line 641: previewOrderPDF()                      │  │
│  │   - Line 1102: order2preview()                       │  │
│  │   - Creates iframe with autoGeneratePDF flag         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Component Structure

### File: NewCompTransDialog.tsx

**Location**: `ai-coordinate-viewer/src/components/NewCompTransDialog.tsx`

#### Key State Variables

```typescript
// Line 279-291: Tricky Height Management
const [trickyHeightMm, setTrickyHeightMm] = useState(() => {
  const saved = localStorage.getItem('trickyHeightMm');
  return saved ? parseFloat(saved) : 2; // Default: 2mm safety buffer
});

// Purpose: Prevents text from being clipped at bottom edge
// Why needed: Font baseline positioning requires extra space
// User adjustable: Yes (stored in localStorage)
```

```typescript
// Line 293-305: Tricky Width Management
const [trickyWidthMm, setTrickyWidthMm] = useState(() => {
  const saved = localStorage.getItem('trickyWidthMm');
  return saved ? parseFloat(saved) : 2; // Default: 2mm safety buffer
});

// Purpose: Prevents text from being clipped at right edge
// Why needed: Character width variations and kerning
// User adjustable: Yes (stored in localStorage)
```

#### Key Functions

**1. detectOverflowAndSplitN() - Lines 542-788**

**Purpose**: Detects if text overflows and calculates N-split distribution

**Input Parameters**:
- `generatedText`: Full 18-language composition text
- `lineHeightMm`: Calculated line height in mm
- `paddingTopMm`: Top padding
- `paddingBottomMm`: Bottom padding

**Algorithm**:
```typescript
// Step 1: Calculate usable height (Line 602-603)
const usableHeightMm = regionHeight
                      - effectivePadding.top
                      - effectivePadding.bottom
                      - trickyHeightMm; // ← Safety buffer

// Step 2: Calculate maximum lines per mother (Line 606)
const maxLinesPerMother = Math.floor(usableHeightMm / lineHeightMm);

// Step 3: Split text into lines (Line 620)
const allLines = generatedText.split('\n').filter(line => line.trim());

// Step 4: Check if overflow occurs (Line 634)
if (allLines.length <= maxLinesPerMother) {
  // ✅ No overflow - fits in one region
  return {
    overflowDetected: false,
    splits: [generatedText]
  };
}

// Step 5: Calculate total mothers needed (Line 647)
const totalMothersNeeded = Math.ceil(allLines.length / maxLinesPerMother);

// Step 6: Distribute lines across mothers (Line 650-678)
const splits: string[] = [];
for (let i = 0; i < totalMothersNeeded; i++) {
  const startIdx = i * maxLinesPerMother;
  const endIdx = Math.min((i + 1) * maxLinesPerMother, allLines.length);
  const motherLines = allLines.slice(startIdx, endIdx);
  splits.push(motherLines.join('\n'));
}

// Step 7: Return result (Line 744)
return {
  overflowDetected: true,
  totalMothersNeeded,
  splits,
  linesPerMother: maxLinesPerMother,
  totalLines: allLines.length
};
```

**Example Calculation**:
```
Given:
  - Region height: 50mm
  - Padding top: 2mm
  - Padding bottom: 2mm
  - Tricky height: 2mm
  - Line height: 5mm
  - Total lines: 30

Calculation:
  usableHeightMm = 50 - 2 - 2 - 2 = 44mm
  maxLinesPerMother = floor(44 / 5) = 8 lines
  totalMothersNeeded = ceil(30 / 8) = 4 mothers

Result:
  Mother 1: Lines 1-8   (8 lines)
  Mother 2: Lines 9-16  (8 lines)
  Mother 3: Lines 17-24 (8 lines)
  Mother 4: Lines 25-30 (6 lines)
```

---

**2. handle2in1() - Lines 2794-3970 (1175 lines)**

**Purpose**: Universal handler for the 2in1 button - saves and generates split

**COMPLETE STEP-BY-STEP FLOW**:

### Phase 1: Source Detection (Lines 2794-2856)

```typescript
// Line 2802: Detect if source is a region or slice
let isRegionSource = false;
let isSliceSource = false;
let sourceRegionId = '';
let sourceSliceId = '';

// Line 2818: Check if editing region content
if (editingContent && editingContent.regionId) {
  isRegionSource = true;
  sourceRegionId = editingContent.regionId;
}

// Line 2835: Check if editing slice content
if (editingContent && editingContent.type === 'slice-content') {
  isSliceSource = true;
  sourceSliceId = editingContent.sliceId || '';
}
```

**Decision Tree**:
```
Is editingContent present?
├─ YES: Check type
│   ├─ Has regionId? → REGION SOURCE
│   └─ Has sliceId?  → SLICE SOURCE
└─ NO: Invalid state, show error
```

---

### Phase 2: Remove Existing Child Mothers (Lines 2858-2980)

**Purpose**: Clean up any previously created child mothers before creating new ones

```typescript
// Line 2865: Find the source mother object
const sourceMother = canvasData.objects.find((obj: any) =>
  obj.type?.includes('mother') &&
  obj.regions?.some((r: any) => r.id === sourceRegionId)
);

// Line 2890: Get child mothers array
const childMothers = sourceMother.childMothers || [];

// Line 2905: Remove each child mother
for (const childMotherId of childMothers) {
  // Find child mother object
  const childMotherObj = canvasData.objects.find((obj: any) =>
    obj.id === childMotherId
  );

  // Remove from canvas
  canvasData.objects = canvasData.objects.filter((obj: any) =>
    obj.id !== childMotherId
  );

  console.log(`🗑️ Removed child mother: ${childMotherId}`);
}

// Line 2960: Clear childMothers array
sourceMother.childMothers = [];
```

**Visual Flow**:
```
BEFORE:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Mother 1    │────▶│  Child 1     │────▶│  Child 2     │
│ (Source)     │     │ (Old)        │     │ (Old)        │
└──────────────┘     └──────────────┘     └──────────────┘

AFTER:
┌──────────────┐
│  Mother 1    │
│ (Source)     │
│ childMothers:│
│    []        │
└──────────────┘
```

---

### Phase 3: Calculate N-Split (Lines 2982-3120)

```typescript
// Line 2990: Call detectOverflowAndSplitN
const splitResult = detectOverflowAndSplitN(
  generatedText,
  lineHeightMm,
  effectivePadding.top,
  effectivePadding.bottom
);

// Line 3005: Check result
if (!splitResult.overflowDetected) {
  // ✅ NO OVERFLOW - Single region only
  console.log('✅ No overflow detected, saving to single region');

  // Save to source region
  updateRegionContent(sourceRegionId, {
    newCompTransConfig: newCompTransConfig,
    content: { text: generatedText }
  });

  // Close dialog
  onSave(newCompTransConfig);
  return;
}

// Line 3040: OVERFLOW DETECTED - Proceed with N-split
console.log(`🔄 Overflow detected: Need ${splitResult.totalMothersNeeded} mothers`);
console.log(`📊 Split details:`, {
  totalLines: splitResult.totalLines,
  linesPerMother: splitResult.linesPerMother,
  splits: splitResult.splits.length
});
```

**Decision Point**:
```
detectOverflowAndSplitN() returns:
├─ overflowDetected: false
│   → Save to single region
│   → Close dialog
│   → END
│
└─ overflowDetected: true
    → Continue to Phase 4 (Create child mothers)
    → totalMothersNeeded: N
    → splits: [split1, split2, ..., splitN]
```

---

### Phase 4: Save Split 1 to Source Region (Lines 3122-3195)

```typescript
// Line 3135: Get first split text
const split1Text = splitResult.splits[0];

// Line 3145: Create config for split 1
const split1Config = {
  ...newCompTransConfig,
  textContent: {
    ...newCompTransConfig.textContent,
    generatedText: split1Text,
    originalText: split1Text
  }
};

// Line 3170: Save to source region
updateRegionContent(sourceRegionId, {
  newCompTransConfig: split1Config,
  content: { text: split1Text }
});

console.log(`✅ Split 1 saved to source region: ${sourceRegionId}`);
console.log(`📝 Split 1 text length: ${split1Text.length} characters`);
```

**Example**:
```
Total splits: 4
Split 1: "50% Cotton\nalgodón\ncoton\ncotton\n..." (Lines 1-8)
  ↓
Saved to: Mother 1 (Source Region)
```

---

### Phase 5: Create Child Mothers (Lines 3197-3580)

**Purpose**: Create (N-1) child mothers for remaining splits

```typescript
// Line 3210: Calculate number of child mothers needed
const childMothersNeeded = splitResult.totalMothersNeeded - 1;

// Line 3225: Get source mother properties
const sourceMother = canvasData.objects.find((obj: any) =>
  obj.type?.includes('mother') &&
  obj.regions?.some((r: any) => r.id === sourceRegionId)
);

const sourceMotherWidth = sourceMother.width;
const sourceMotherHeight = sourceMother.height;
const sourceMotherLeft = sourceMother.left;
const sourceMotherTop = sourceMother.top;

// Line 3260: Calculate starting position for first child mother
let nextMotherTop = sourceMotherTop + sourceMotherHeight + 10; // 10mm gap

// Line 3280: Loop to create child mothers
const createdChildMotherIds: string[] = [];

for (let i = 0; i < childMothersNeeded; i++) {
  const childMotherIndex = i + 2; // Child 1 = Split 2

  // Line 3295: Generate unique child mother ID
  const childMotherId = `${sourceMother.id}_child_${Date.now()}_${i}`;

  // Line 3310: Create child mother object
  const childMotherObj = {
    id: childMotherId,
    type: 'mother',
    left: sourceMotherLeft,
    top: nextMotherTop,
    width: sourceMotherWidth,
    height: sourceMotherHeight,
    fill: 'transparent',
    stroke: '#e74c3c',
    strokeWidth: 2,
    strokeDashArray: [5, 5], // Dashed border
    selectable: true,
    hasControls: true,
    hasBorders: true,
    lockRotation: true,
    parentMotherId: sourceMother.id, // ← Link to parent
    childMotherNumber: childMotherIndex,
    regions: [{
      id: `${childMotherId}_region_0`,
      left: 0,
      top: 0,
      width: sourceMotherWidth,
      height: sourceMotherHeight,
      fill: 'transparent',
      stroke: '#3498db',
      strokeWidth: 1,
      contents: [] // Will be populated later
    }]
  };

  // Line 3420: Add to canvas
  canvasData.objects.push(childMotherObj);
  createdChildMotherIds.push(childMotherId);

  // Line 3445: Update position for next child mother
  nextMotherTop += sourceMotherHeight + 10; // Stack vertically

  console.log(`✅ Created child mother ${childMotherIndex}: ${childMotherId}`);
}

// Line 3480: Update source mother with child references
sourceMother.childMothers = createdChildMotherIds;

console.log(`✅ Created ${childMothersNeeded} child mothers`);
console.log(`📋 Child mother IDs:`, createdChildMotherIds);
```

**Visual Result**:
```
┌──────────────────┐
│  Mother 1        │  ← Source (Split 1)
│  (Original)      │
└──────────────────┘
        ↓ 10mm gap
┌──────────────────┐
│  Mother 1 Child 1│  ← Split 2
│  (Created)       │
└──────────────────┘
        ↓ 10mm gap
┌──────────────────┐
│  Mother 1 Child 2│  ← Split 3
│  (Created)       │
└──────────────────┘
        ↓ 10mm gap
┌──────────────────┐
│  Mother 1 Child 3│  ← Split 4
│  (Created)       │
└──────────────────┘
```

---

### Phase 6: Distribute Text Across Child Mothers (Lines 3582-3820)

```typescript
// Line 3595: Loop through created child mothers
for (let i = 0; i < createdChildMotherIds.length; i++) {
  const childMotherId = createdChildMotherIds[i];
  const splitIndex = i + 1; // Skip split 0 (already saved to source)
  const splitText = splitResult.splits[splitIndex];

  // Line 3615: Find child mother object
  const childMotherObj = canvasData.objects.find((obj: any) =>
    obj.id === childMotherId
  );

  // Line 3635: Get child mother's region
  const childRegion = childMotherObj.regions[0];
  const childRegionId = childRegion.id;

  // Line 3655: Create content for this split
  const contentId = `${childRegionId}_content_0`;

  // Line 3670: Create comp-trans config for this split
  const splitConfig = {
    ...newCompTransConfig,
    textContent: {
      ...newCompTransConfig.textContent,
      generatedText: splitText,
      originalText: splitText
    }
  };

  // Line 3700: Create content object
  const contentObj = {
    id: contentId,
    type: 'new-comp-trans',
    regionId: childRegionId,
    newCompTransConfig: splitConfig,
    layout: {
      horizontalAlign: 'left',
      verticalAlign: 'top',
      padding: effectivePadding
    },
    typography: {
      fontFamily: newCompTransConfig.textContent?.fontFamily || 'Arial',
      fontSize: newCompTransConfig.textContent?.fontSize || 12,
      fontColor: newCompTransConfig.textContent?.fontColor || '#000000'
    },
    content: {
      text: splitText
    }
  };

  // Line 3760: Add content to child region
  childRegion.contents = [contentObj];

  console.log(`✅ Split ${splitIndex + 1} distributed to child mother ${i + 1}`);
  console.log(`📝 Text length: ${splitText.length} characters`);
}
```

**Distribution Example**:
```
Total splits: 4
Split 1 → Mother 1 (Source)         - Lines 1-8
Split 2 → Mother 1 Child 1          - Lines 9-16
Split 3 → Mother 1 Child 2          - Lines 17-24
Split 4 → Mother 1 Child 3          - Lines 25-30
```

---

### Phase 7: CHECK-BASED Verification (Lines 3822-3950)

**Purpose**: Verify asynchronous operations completed successfully

```typescript
// Line 3835: Set verification flags
let verificationAttempts = 0;
const maxAttempts = 10;
const checkInterval = 200; // ms

// Line 3850: Start verification loop
const verifyCreation = setInterval(() => {
  verificationAttempts++;

  // Line 3865: Check if all child mothers exist
  let allChildrenExist = true;

  for (const childId of createdChildMotherIds) {
    const exists = canvasData.objects.some((obj: any) =>
      obj.id === childId
    );

    if (!exists) {
      allChildrenExist = false;
      console.warn(`⚠️ Child mother not found: ${childId}`);
      break;
    }
  }

  // Line 3900: Success condition
  if (allChildrenExist) {
    clearInterval(verifyCreation);
    console.log(`✅ Verification successful after ${verificationAttempts} attempts`);

    // Trigger canvas refresh
    if (onSave) {
      onSave(newCompTransConfig);
    }

    return;
  }

  // Line 3930: Max attempts reached
  if (verificationAttempts >= maxAttempts) {
    clearInterval(verifyCreation);
    console.error(`❌ Verification failed after ${maxAttempts} attempts`);
    alert('Warning: Some child mothers may not have been created properly');
    return;
  }

  console.log(`🔍 Verification attempt ${verificationAttempts}/${maxAttempts}...`);

}, checkInterval);
```

**Verification Timeline**:
```
T=0ms:    Create child mothers
T=200ms:  Check #1 - Verify existence
T=400ms:  Check #2 - Verify existence
T=600ms:  Check #3 - Verify existence
...
T=2000ms: Check #10 (max) - Final attempt

If found: ✅ Success, trigger refresh
If not found: ❌ Show warning
```

---

### Phase 8: Final Cleanup & Refresh (Lines 3952-3970)

```typescript
// Line 3955: Save canvas data
localStorage.setItem('canvas_data', JSON.stringify(canvasData));

// Line 3960: Close dialog
onSave(newCompTransConfig);

// Line 3965: Log completion
console.log('🎉 2in1 Button: Complete!');
console.log('📊 Summary:', {
  totalMothers: splitResult.totalMothersNeeded,
  sourceMotherText: splitResult.splits[0].substring(0, 50) + '...',
  childMothersCreated: createdChildMotherIds.length,
  textDistributed: true
});
```

---

## 4. Line-by-Line Flow

### Complete 2in1 Button Execution Flow

```
USER CLICKS 2in1 BUTTON
        ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 1: Source Detection (Lines 2794-2856)              │
│ - Determine if region or slice source                    │
│ - Get source ID and parent mother                        │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 2: Remove Old Children (Lines 2858-2980)           │
│ - Find existing child mothers                            │
│ - Remove from canvas                                      │
│ - Clear childMothers array                               │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 3: Calculate N-Split (Lines 2982-3120)             │
│ - Call detectOverflowAndSplitN()                         │
│ - Get usableHeightMm (region - padding - trickyHeight)  │
│ - Calculate maxLinesPerMother                            │
│ - Split text into N chunks                               │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ Decision: Overflow Detected?                              │
│ ├─ NO:  Save to single region → Close dialog → END      │
│ └─ YES: Continue to Phase 4                              │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 4: Save Split 1 (Lines 3122-3195)                  │
│ - Get first split text                                    │
│ - Create config with split 1 text                        │
│ - Save to source region                                   │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 5: Create Child Mothers (Lines 3197-3580)          │
│ - Calculate childMothersNeeded (N-1)                     │
│ - Get source mother dimensions                            │
│ - Loop: Create child mother objects                      │
│   - Position vertically below parent (10mm gap)          │
│   - Add dashed red border                                │
│   - Set parentMotherId link                              │
│   - Add to canvas                                         │
│ - Update source mother childMothers array                │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 6: Distribute Text (Lines 3582-3820)               │
│ - Loop through child mothers                             │
│   - Get corresponding split text                         │
│   - Get child region ID                                   │
│   - Create content object with split config              │
│   - Add content to child region                          │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 7: Verification (Lines 3822-3950)                  │
│ - Set up CHECK-BASED polling                             │
│ - Verify all child mothers exist (max 10 attempts)       │
│ - Wait 200ms between checks                              │
│ - Success: Trigger refresh                               │
│ - Failure: Show warning                                   │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 8: Final Cleanup (Lines 3952-3970)                 │
│ - Save canvas data to localStorage                        │
│ - Close dialog                                            │
│ - Log completion summary                                  │
└───────────────────────────────────────────────────────────┘
        ↓
    ✅ COMPLETE
```

---

## 5. Height Calculation System

### The Tricky Height Problem

**Problem**: Text rendered at the bottom edge of a region can be clipped due to font baseline positioning.

**Solution**: Subtract a safety buffer (trickyHeightMm) from available height.

### Height Calculation Formula

```typescript
// Location: NewCompTransDialog.tsx, Line 602-603
const usableHeightMm = regionHeight
                      - effectivePadding.top
                      - effectivePadding.bottom
                      - trickyHeightMm;
```

### Visual Explanation

```
┌─────────────────────────────────────────┐
│  Region (Total Height: 50mm)            │
│                                         │
│  ┌─── Padding Top: 2mm ───────────┐   │
│  │                                  │   │
│  │  ┌─── Usable Space ──────────┐ │   │
│  │  │                            │ │   │
│  │  │  Text Line 1               │ │   │
│  │  │  Text Line 2               │ │   │
│  │  │  Text Line 3               │ │   │
│  │  │  ...                       │ │   │
│  │  │                            │ │   │
│  │  └────────────────────────────┘ │   │
│  │  ┌─ Tricky Height: 2mm ───────┐│   │
│  │  │ (Safety buffer for         ││   │
│  │  │  baseline positioning)     ││   │
│  │  └────────────────────────────┘│   │
│  │                                  │   │
│  └─── Padding Bottom: 2mm ────────┘   │
│                                         │
└─────────────────────────────────────────┘

Calculation:
usableHeightMm = 50 - 2 - 2 - 2 = 44mm
```

### Why Tricky Height is Needed

**Font Baseline Offset**:
- Fonts render from a baseline, not from the top
- Descenders (like 'g', 'y', 'p') extend below the baseline
- Without buffer, descenders get clipped

**Example Without Tricky Height**:
```
┌──────────────────┐
│  Text line       │ ← OK
│  Text lineg      │ ← 'g' descender clipped! ❌
└──────────────────┘
   ↑ Bottom edge
```

**Example With Tricky Height (2mm)**:
```
┌──────────────────┐
│  Text line       │ ← OK
│  Text lineg      │ ← 'g' descender visible ✅
│  [2mm buffer]    │
└──────────────────┘
   ↑ Bottom edge
```

### Tricky Height in Canvas Rendering

**Location**: App.tsx, Lines 9015-9020 (EDITED)

**BEFORE (Missing trickyHeight)**:
```typescript
const availableHeightPx = Math.max(0,
  regionHeightPx - paddingTopPx - paddingBottomPx
);
```

**AFTER (With trickyHeight)**:
```typescript
// Line 9015-9018: Add trickyHeightPx
const trickyHeightMm = parseFloat(localStorage.getItem('trickyHeightMm') || '2');
const trickyHeightPx = trickyHeightMm * 3.779527559; // mm to px conversion

const availableHeightPx = Math.max(0,
  regionHeightPx - paddingTopPx - paddingBottomPx - trickyHeightPx
);
```

### Conversion Factor: mm to px

```typescript
// Conversion: 1mm = 3.779527559 pixels (at 96 DPI)
const MM_TO_PX = 3.779527559;

// Example: 2mm tricky height
const trickyHeightPx = 2 * 3.779527559 = 7.559 pixels
```

---

## 6. N-Split Algorithm

### Algorithm Details

**Input**:
- `generatedText`: Full text string with `\n` line breaks
- `lineHeightMm`: Height of one line (e.g., 5mm)
- `usableHeightMm`: Available height after subtracting padding and tricky height

**Output**:
- `overflowDetected`: Boolean
- `totalMothersNeeded`: Number of mothers required
- `splits`: Array of text chunks
- `linesPerMother`: Maximum lines per mother
- `totalLines`: Total number of lines

### Step-by-Step Example

**Scenario**:
```
Input:
  - Material: 50% Cotton, 30% Polyester, 20% Elastane
  - Languages: 18
  - Separator: " - "
  - Total text lines: 30 lines
  - Region height: 50mm
  - Padding: 2mm top, 2mm bottom
  - Tricky height: 2mm
  - Line height: 5mm
```

**Step 1: Calculate Usable Height**
```typescript
usableHeightMm = 50 - 2 - 2 - 2 = 44mm
```

**Step 2: Calculate Max Lines Per Mother**
```typescript
maxLinesPerMother = floor(44 / 5) = 8 lines
```

**Step 3: Check Overflow**
```typescript
totalLines = 30
if (30 <= 8) {
  // No overflow
} else {
  // Overflow detected ✅
}
```

**Step 4: Calculate Total Mothers Needed**
```typescript
totalMothersNeeded = ceil(30 / 8) = 4 mothers
```

**Step 5: Split Text**
```typescript
allLines = text.split('\n') // 30 lines

Split 1 (Mother 1): lines[0..7]   = 8 lines
Split 2 (Child 1):  lines[8..15]  = 8 lines
Split 3 (Child 2):  lines[16..23] = 8 lines
Split 4 (Child 3):  lines[24..29] = 6 lines
```

**Result**:
```javascript
{
  overflowDetected: true,
  totalMothersNeeded: 4,
  splits: [
    "50% algodón - coton - cotton - algodão - katoen - cotone - ΒΑΜΒΑΚΙ - コットン\n\n30% poliéster - polyester - ...",
    "... (lines 9-16) ...",
    "... (lines 17-24) ...",
    "... (lines 25-30) ..."
  ],
  linesPerMother: 8,
  totalLines: 30
}
```

### Edge Cases

**Case 1: Exactly Fits (No Overflow)**
```
totalLines = 8
maxLinesPerMother = 8
Result: overflowDetected = false (no child mothers needed)
```

**Case 2: One Extra Line**
```
totalLines = 9
maxLinesPerMother = 8
Result: totalMothersNeeded = 2 (1 child mother created)
```

**Case 3: Uneven Distribution**
```
totalLines = 30
maxLinesPerMother = 7
Result: totalMothersNeeded = 5
  - Mothers 1-4: 7 lines each
  - Mother 5: 2 lines (partial)
```

---

## 7. Canvas Rendering

### Rendering Flow in App.tsx

The canvas rendering system reads the saved composition data and renders it visually.

**Key Locations in App.tsx**:

1. **Line 9015-9020**: N-split overflow calculation
2. **Line 17024-17030**: Comp-trans region rendering
3. **Line 17103-17112**: Multi-line region rendering
4. **Line 18122-18134**: Child region text rendering (PDF generation path)

---

### Location 1: N-Split Overflow Calculation (Line 9015)

**Purpose**: Calculate if text will overflow on canvas

**Code**:
```typescript
// Line 9015-9020 (EDITED)
const trickyHeightMm = parseFloat(localStorage.getItem('trickyHeightMm') || '2');
const trickyHeightPx = trickyHeightMm * 3.779527559;

const availableHeightPx = Math.max(0,
  regionHeightPx - paddingTopPx - paddingBottomPx - trickyHeightPx
);
```

**Why Important**: Must match the calculation in NewCompTransDialog to prevent mismatch.

---

### Location 2: Comp-Trans Region Rendering (Line 17030)

**Purpose**: Render composition translation text on canvas

**Code**:
```typescript
// Line 17024-17035 (EDITED)
if (content.type === 'new-comp-trans') {
  const trickyHeightMm = parseFloat(localStorage.getItem('trickyHeightMm') || '2');
  const trickyHeightPx = trickyHeightMm * 3.779527559;

  const availableHeightPx = Math.max(0,
    regionHeightPx - paddingTopPx - paddingBottomPx - trickyHeightPx
  );

  // Render text using SVG
  renderCompTransText(content, availableHeightPx);
}
```

---

### Location 3: Multi-Line Region Rendering (Line 17112)

**Purpose**: Render multi-line text content

**Code**:
```typescript
// Line 17103-17115 (EDITED)
if (content.type === 'new-multi-line') {
  const trickyHeightMm = parseFloat(localStorage.getItem('trickyHeightMm') || '2');
  const trickyHeightPx = trickyHeightMm * 3.779527559;

  const availableHeightPx = Math.max(0,
    regionHeightPx - paddingTopPx - paddingBottomPx - trickyHeightPx
  );

  renderMultiLineText(content, availableHeightPx);
}
```

---

### Location 4: Child Region Text Rendering (Line 18134)

**Purpose**: Render text in child mothers (PDF generation path)

**Code**:
```typescript
// Line 18122-18145 (EDITED)
// This is the critical path for PDF generation
if (content.type === 'new-comp-trans' && childRegion) {
  const trickyHeightMm = parseFloat(localStorage.getItem('trickyHeightMm') || '2');
  const trickyHeightPx = trickyHeightMm * 3.779527559;

  const availableHeightPx = Math.max(0,
    childRegionHeightPx - paddingTopPx - paddingBottomPx - trickyHeightPx
  );

  // Render child mother text
  renderChildText(content, availableHeightPx);
}
```

**Why Critical**: This code path is used when generating PDF previews from Order History.

---

### Text Rendering System

**SVG-Based Rendering**:
```typescript
// Example from App.tsx
const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
textElement.setAttribute('x', `${left}px`);
textElement.setAttribute('y', `${top + baselineOffset}px`);
textElement.setAttribute('font-family', fontFamily);
textElement.setAttribute('font-size', `${fontSize}px`);
textElement.setAttribute('fill', fontColor);
textElement.textContent = lineText;

svgContainer.appendChild(textElement);
```

**Baseline Offset Calculation**:
```typescript
// Baseline offset = 80% of font size
const baselineOffset = fontSize * 0.8;

// Example: fontSize = 12px
// baselineOffset = 12 * 0.8 = 9.6px
```

---

## 8. PDF Generation

### PDF Generation Flow

```
ORDER HISTORY TAB
      ↓
User clicks "Preview Artwork" button
      ↓
┌─────────────────────────────────────────────┐
│ OrderHistoryTab.tsx - Line 1102             │
│ order2preview(order)                        │
│ - Load layout from localStorage             │
│ - Save order data to sessionStorage         │
└─────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────┐
│ Create Hidden Iframe                        │
│ - URL: /create_zero?orderPreview=true&      │
│        autoGeneratePDF=true&onlyPreview=true│
│ - Position: off-screen (-9999px)            │
└─────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────┐
│ App.tsx Loads in Iframe                     │
│ - Reads sessionStorage order data           │
│ - Applies order variables to layout         │
│ - Renders canvas with order data            │
└─────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────┐
│ Canvas Rendering (App.tsx Lines 17024+)    │
│ - Render composition translation regions    │
│ - Render child mother regions               │
│ - Calculate availableHeightPx with          │
│   trickyHeightPx subtracted                 │
└─────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────┐
│ Auto PDF Generation                         │
│ - Wait for canvas render complete           │
│ - Convert canvas to image                   │
│ - Create PDF from image                     │
│ - Send PDF data via postMessage             │
└─────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────┐
│ OrderHistoryTab Receives PDF                │
│ - Catch postMessage event                   │
│ - Create blob from PDF data                 │
│ - Trigger download                          │
│ - Clean up iframe                           │
└─────────────────────────────────────────────┘
      ↓
  ✅ PDF Downloaded
```

### Code Details

**OrderHistoryTab.tsx - Line 1102**:
```typescript
const order2preview = async (order: Order) => {
  console.log('🖨️ Generating PDF preview for order:', order);

  // Show loading modal
  setIsGeneratingPDF(true);

  // Load layout from localStorage
  const storageKey = `project_${order.projectSlug}_layouts`;
  const savedLayouts = localStorage.getItem(storageKey);
  const layout = JSON.parse(savedLayouts).find(l => l.id === order.layoutId);

  // Save order data to sessionStorage
  const orderPreviewData = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    projectSlug: order.projectSlug,
    layoutId: order.layoutId,
    orderLines: order.orderLines, // Multi-line format
    variableData: order.variableData // Old format fallback
  };

  sessionStorage.setItem('__order_preview_data__', JSON.stringify(orderPreviewData));

  // Create hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '1920px';
  iframe.style.height = '1080px';
  iframe.style.opacity = '0';

  // Build URL with flags
  const masterFileId = layout.canvasData?.masterFileId || '';
  const canvasUrl = `/create_zero?context=projects&projectSlug=${order.projectSlug}&masterFileId=${masterFileId}&layoutId=${order.layoutId}&orderPreview=true&autoGeneratePDF=true&onlyPreview=true`;

  // Listen for PDF completion
  const messageHandler = (event: MessageEvent) => {
    if (event.data.type === 'PDF_PAGE_GENERATED') {
      console.log('✅ PDF generated successfully');

      // Download PDF
      const pdfData = event.data.pdfData;
      const blob = dataURItoBlob(pdfData);
      downloadBlob(blob, `Order_${order.orderNumber}.pdf`);

      // Clean up
      window.removeEventListener('message', messageHandler);
      document.body.removeChild(iframe);
      setIsGeneratingPDF(false);
    }
  };

  window.addEventListener('message', messageHandler);

  // Load iframe
  iframe.src = canvasUrl;
  document.body.appendChild(iframe);
};
```

**App.tsx - Auto PDF Generation**:
```typescript
// Check if autoGeneratePDF flag is set
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const autoGeneratePDF = urlParams.get('autoGeneratePDF') === 'true';

  if (autoGeneratePDF) {
    // Wait for canvas render
    setTimeout(() => {
      generatePDFFromCanvas();
    }, 2000); // 2 second delay
  }
}, []);

const generatePDFFromCanvas = () => {
  // Get canvas element
  const canvas = document.getElementById('main-canvas');

  // Convert to image
  const dataURL = canvas.toDataURL('image/png');

  // Create PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [canvasWidth, canvasHeight]
  });

  pdf.addImage(dataURL, 'PNG', 0, 0, canvasWidth, canvasHeight);

  // Send to parent window
  window.parent.postMessage({
    type: 'PDF_PAGE_GENERATED',
    pdfData: pdf.output('datauristring')
  }, '*');
};
```

---

## 9. Troubleshooting

### Issue: Missing Lines in PDF Preview

**Symptom**: Text displays correctly in layout editor, but lines are missing in Order History PDF preview.

**Root Cause Analysis**:

1. **Height Calculation Mismatch**:
   - NewCompTransDialog calculates split using `usableHeightMm = height - padding - trickyHeight`
   - App.tsx (before fix) calculated without trickyHeight
   - Result: Canvas thinks more lines fit than split calculation

2. **Example**:
   ```
   NewCompTransDialog:
     usableHeightMm = 50 - 2 - 2 - 2 = 44mm
     maxLines = floor(44 / 5) = 8 lines

   App.tsx (before fix):
     availableHeightPx = (50 - 2 - 2) * 3.78 = 173.88px
     maxLines = floor(173.88 / (5 * 3.78)) = 9 lines ❌

   Mismatch: Dialog says 8 lines, canvas tries to fit 9 lines
   Result: Last line gets clipped
   ```

**Fix Applied**:
```typescript
// Added to 4 locations in App.tsx
const trickyHeightMm = parseFloat(localStorage.getItem('trickyHeightMm') || '2');
const trickyHeightPx = trickyHeightMm * 3.779527559;
const availableHeightPx = Math.max(0,
  regionHeightPx - paddingTopPx - paddingBottomPx - trickyHeightPx
);
```

**Verification Steps**:

1. **Check localStorage**:
   ```javascript
   console.log('Tricky Height:', localStorage.getItem('trickyHeightMm'));
   // Should output: "2"
   ```

2. **Check Dialog Calculation**:
   ```javascript
   // In NewCompTransDialog, line 602
   console.log('Usable Height (Dialog):', usableHeightMm);
   // Example output: 44mm
   ```

3. **Check Canvas Calculation**:
   ```javascript
   // In App.tsx, line 9020
   console.log('Available Height (Canvas):', availableHeightPx);
   // Should match: 44mm * 3.78 = 166.32px
   ```

4. **Compare Max Lines**:
   ```javascript
   // Dialog
   const dialogMaxLines = Math.floor(usableHeightMm / lineHeightMm);

   // Canvas
   const canvasMaxLines = Math.floor(availableHeightPx / (lineHeightMm * 3.78));

   console.log('Max Lines Match:', dialogMaxLines === canvasMaxLines);
   // Should output: true
   ```

---

### Issue: Text Clipping at Bottom

**Symptom**: Last line of text has descenders (g, y, p) clipped.

**Solution**: Increase tricky height

```javascript
// Adjust tricky height in dialog
localStorage.setItem('trickyHeightMm', '3'); // Increase from 2mm to 3mm
```

**Calculation Impact**:
```
Before (2mm tricky height):
  usableHeightMm = 50 - 2 - 2 - 2 = 44mm
  maxLines = floor(44 / 5) = 8 lines

After (3mm tricky height):
  usableHeightMm = 50 - 2 - 2 - 3 = 43mm
  maxLines = floor(43 / 5) = 8 lines (same, but more buffer)
```

---

### Issue: Too Many Child Mothers Created

**Symptom**: More child mothers than expected.

**Diagnosis**:
```javascript
// Check split calculation
const splitResult = detectOverflowAndSplitN(...);
console.log('Total Mothers Needed:', splitResult.totalMothersNeeded);
console.log('Lines Per Mother:', splitResult.linesPerMother);
console.log('Total Lines:', splitResult.totalLines);
```

**Common Causes**:
1. Line height too small
2. Region height too small
3. Padding too large
4. Tricky height too large

---

### Issue: Child Mothers Not Appearing

**Symptom**: 2in1 completes but child mothers don't render.

**Diagnosis**:
```javascript
// Check verification
// In handle2in1, line 3865
console.log('Child Mothers Created:', createdChildMotherIds);
console.log('Verification Attempts:', verificationAttempts);
```

**Solutions**:
1. Increase verification attempts (default: 10)
2. Increase check interval (default: 200ms)
3. Check canvas refresh is triggered
4. Check localStorage is not full

---

### Debugging Checklist

- [ ] Check localStorage tricky height: `localStorage.getItem('trickyHeightMm')`
- [ ] Verify dialog calculation: Log `usableHeightMm` in NewCompTransDialog
- [ ] Verify canvas calculation: Log `availableHeightPx` in App.tsx (4 locations)
- [ ] Check split result: Log `splitResult` object
- [ ] Verify child mothers created: Log `createdChildMotherIds`
- [ ] Check verification success: Log verification attempts
- [ ] Inspect canvas data: `localStorage.getItem('canvas_data')`
- [ ] Check PDF generation flags: URL params `autoGeneratePDF`, `onlyPreview`
- [ ] Monitor console for errors during PDF generation
- [ ] Test with simple text first (1-2 materials, 18 languages)

---

## 10. Code Reference

### Quick Reference Table

| Feature | File | Line(s) | Function/Section |
|---------|------|---------|------------------|
| 2in1 Button Handler | NewCompTransDialog.tsx | 2794-3970 | `handle2in1()` |
| N-Split Detection | NewCompTransDialog.tsx | 542-788 | `detectOverflowAndSplitN()` |
| Tricky Height State | NewCompTransDialog.tsx | 279-291 | State initialization |
| Tricky Width State | NewCompTransDialog.tsx | 293-305 | State initialization |
| Canvas N-Split Calc | App.tsx | 9015-9020 | Overflow detection |
| Comp-Trans Rendering | App.tsx | 17024-17035 | Region rendering |
| Multi-Line Rendering | App.tsx | 17103-17115 | Region rendering |
| Child Region Rendering | App.tsx | 18122-18145 | PDF path rendering |
| PDF Preview Generation | OrderHistoryTab.tsx | 1102-1407 | `order2preview()` |
| PDF Order Preview | OrderHistoryTab.tsx | 641-1099 | `previewOrderPDF()` |

---

### Key Constants

```typescript
// Conversion factors
const MM_TO_PX = 3.779527559; // 1mm = 3.78px at 96 DPI

// Default safety margins
const DEFAULT_TRICKY_HEIGHT_MM = 2; // Bottom buffer
const DEFAULT_TRICKY_WIDTH_MM = 2;  // Right buffer

// Baseline offset factor
const BASELINE_OFFSET_FACTOR = 0.8; // 80% of font size

// Child mother gap
const CHILD_MOTHER_GAP_MM = 10; // Vertical spacing between mothers

// Verification settings
const MAX_VERIFICATION_ATTEMPTS = 10;
const VERIFICATION_CHECK_INTERVAL_MS = 200;
```

---

### Material Translations Array

```typescript
// 18 Languages: ES, FR, EN, PT, DU, IT, GR, JA, DE, DA, SL, CH, KO, ID, AR, GA, CA, BS
const materialTranslations = {
  'Cotton': ['algodón', 'coton', 'cotton', 'algodão', 'katoen', 'cotone', 'ΒΑΜΒΑΚΙ', 'コットン', 'baumwolle', 'bomuld', 'bombaž', '棉', '면', 'katun', 'قطن', 'algodón', 'cotó', 'kotoia'],
  'Polyester': ['poliéster', 'polyester', 'polyester', 'poliéster', 'polyester', 'poliestere', 'ΠΟΛΥΕΣΤΕΡΑΣ', 'ポリエステル', 'polyester', 'polyester', 'poliester', '聚酯纤维', '폴리에스터', 'poliester', 'بوليستير', 'poliéster', 'polièster', 'poliesterra'],
  'Elastane': ['elastano', 'élasthanne', 'elastane', 'elastano', 'elastaan', 'elastan', 'ΕΛΑΣΤΑΝΗ', 'エラスタン', 'elastan', 'elastan', 'elastan', '氨纶', '엘라스탄', 'elastan', 'إيلاستان', 'elastano', 'elastà', 'elastanoa']
};
```

---

## Appendix A: Visual Diagrams

### Mother-Child Relationship

```
┌─────────────────────────────────────────────────────────┐
│  Mother 1 (Source)                                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Region 0                                         │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  Content: new-comp-trans                    │ │ │
│  │  │  Text: Split 1 (Lines 1-8)                  │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│  childMothers: ['child_1', 'child_2', 'child_3']       │
└─────────────────────────────────────────────────────────┘
                        ↓ 10mm gap
┌─────────────────────────────────────────────────────────┐
│  Mother 1 Child 1                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Region 0                                         │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  Content: new-comp-trans                    │ │ │
│  │  │  Text: Split 2 (Lines 9-16)                 │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│  parentMotherId: 'mother_1'                            │
│  childMotherNumber: 2                                  │
└─────────────────────────────────────────────────────────┘
                        ↓ 10mm gap
┌─────────────────────────────────────────────────────────┐
│  Mother 1 Child 2                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Region 0                                         │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  Content: new-comp-trans                    │ │ │
│  │  │  Text: Split 3 (Lines 17-24)                │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│  parentMotherId: 'mother_1'                            │
│  childMotherNumber: 3                                  │
└─────────────────────────────────────────────────────────┘
                        ↓ 10mm gap
┌─────────────────────────────────────────────────────────┐
│  Mother 1 Child 3                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Region 0                                         │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │  Content: new-comp-trans                    │ │ │
│  │  │  Text: Split 4 (Lines 25-30)                │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│  parentMotherId: 'mother_1'                            │
│  childMotherNumber: 4                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Appendix B: Testing Guide

### Test Case 1: Single Region (No Overflow)

**Setup**:
- Material: 50% Cotton
- Languages: 18
- Region height: 50mm
- Expected lines: 4

**Expected Result**:
- No overflow detected
- Text saved to source region only
- No child mothers created

**Verification**:
```javascript
const sourceMother = canvasData.objects.find(obj => obj.id === 'mother_1');
console.log('Child Mothers:', sourceMother.childMothers.length);
// Expected: 0
```

---

### Test Case 2: Two Region Split

**Setup**:
- Material: 50% Cotton, 50% Polyester
- Languages: 18
- Region height: 30mm
- Expected lines: 12 (6 per mother)

**Expected Result**:
- Overflow detected
- 2 mothers total (1 source + 1 child)
- Split 1: Lines 1-6
- Split 2: Lines 7-12

**Verification**:
```javascript
const sourceMother = canvasData.objects.find(obj => obj.id === 'mother_1');
console.log('Child Mothers:', sourceMother.childMothers.length);
// Expected: 1

const childMother = canvasData.objects.find(obj => obj.id === sourceMother.childMothers[0]);
console.log('Child Mother Exists:', !!childMother);
// Expected: true
```

---

### Test Case 3: Four Region Split

**Setup**:
- Material: 50% Cotton, 30% Polyester, 20% Elastane
- Languages: 18
- Region height: 20mm
- Expected lines: 30 (8 per mother, last has 6)

**Expected Result**:
- Overflow detected
- 4 mothers total (1 source + 3 children)
- Split 1: Lines 1-8
- Split 2: Lines 9-16
- Split 3: Lines 17-24
- Split 4: Lines 25-30

**Verification**:
```javascript
const sourceMother = canvasData.objects.find(obj => obj.id === 'mother_1');
console.log('Child Mothers:', sourceMother.childMothers.length);
// Expected: 3

// Check each child mother
sourceMother.childMothers.forEach((childId, index) => {
  const child = canvasData.objects.find(obj => obj.id === childId);
  const content = child.regions[0].contents[0];
  const lines = content.content.text.split('\n').length;
  console.log(`Child ${index + 1} lines:`, lines);
});
// Expected: 8, 8, 6
```

---

## Conclusion

The 2in1 Button is a sophisticated system that seamlessly handles composition translation overflow by automatically splitting text across multiple regions. The key to its success is the precise height calculation that accounts for padding, font baseline positioning (tricky height), and accurate line counting.

**Critical Success Factors**:
1. **Consistent Height Calculation**: Dialog and canvas must use identical formulas
2. **Tricky Height Buffer**: Prevents text clipping at region boundaries
3. **Accurate Line Counting**: Split calculation must match rendering capacity
4. **Robust Verification**: CHECK-BASED system ensures asynchronous operations complete
5. **Proper Child Mother Management**: Clean removal of old children before creating new ones

**Known Limitations**:
- Currently optimized for left-to-right languages
- Assumes consistent line height across all text
- Child mothers positioned vertically only
- Maximum 10 verification attempts

**Future Enhancements**:
- Support for right-to-left languages
- Dynamic line height adjustment
- Horizontal child mother positioning option
- Improved verification with promise-based async/await

---

**Document Version**: 2.9.128
**Last Updated**: 2025-10-11
**Author**: AI Assistant
**Purpose**: Comprehensive technical documentation for 2in1 button feature presentation
