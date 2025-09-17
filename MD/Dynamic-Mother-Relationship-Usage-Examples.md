# Dynamic Mother Relationship System - Usage Examples

## Overview

This document provides practical examples of how the Dynamic Mother Label Relationship System works in real-world scenarios for `new-comp-trans` content type.

## Example 1: Initial Overflow Creation

### Scenario
User creates a new composition translation with long text that exceeds the capacity of a single mother label.

### Input
```typescript
const longCompositionText = `
70% lino - lin - linen - linho - linnen - lino - ΛΙΝΑΡΙ - リネン - leinen - hør - lan - 亚麻 - 린넨 - linen - كتان - liño - lli - lihoaren

10% poliéster - polyester - polyester - poliéster - polyester - poliestere - ΠΟΛΥΕΣΤΕΡΑΣ - ポリエステル - polyester - polyester - poliester - 聚酯纤维 - 폴리에스터 - poliester - بوليستير - poliéster - polièster - poliesterra

10% viscosa - viscose - viscose - viscose - viscose - viscosa - ΒΙΣΚΟΖΗ - ビスコース - viskose - viskose - viskoza - 粘胶纤维 - 비스코스 - viskosa - فيسكوز - viscosa - viscosa - biskosea

5% elastano - élasthanne - elastane - elastano - elastaan - elastan - ΕΛΑΣΤΑΝΗ - エラスタン - elastan - elastan - elastan - 氨纶 - 엘라스탄 - elastan - إيلاستان - elastano - elastà - elastanoa

4% algodón - coton - cotton - algodão - katoen - cotone - ΒΑΜΒΑΚΙ - コットン - baumwolle - bomuld - bombaž - 棉 - 면 - katun - قطن - algodón - cotó - kotoia

1% nailon - nylon - nylon - nylon (so p/o Brasil poliamida) - nylon - nailon - ΝΑΪΛΟΝ - ナイロン - nylon - nylon - najlon - 锦纶 - 나일론 - nilon - نايلون - nailon - niló - nylona
`;
```

### Process
1. **User saves new-comp-trans content** in NewCompTransDialog
2. **System detects overflow** (text length > capacity)
3. **Enhanced overflow processing** triggered automatically
4. **Dynamic capacity calculation** based on mother dimensions
5. **Intelligent text splitting** preserves word boundaries
6. **Child mothers created** automatically
7. **Master-child relationship established**

### Result
```
Original Mother (Master): 30 lines (FULL capacity)
Child Mother 1: 20 lines (remaining content)
Relationship: Master → [Child_1]
Status: ✅ Original # > Child # (30 > 20)
```

## Example 2: Content Change with Existing Overflow

### Scenario
User modifies existing composition translation that already has child mothers.

### Before Change
```
Master Mother: "70% cotton, 20% polyester, 10% elastane..." (30 lines)
Child Mother 1: "Additional care instructions..." (15 lines)
Relationship: Master → [Child_1]
```

### User Action
User updates the composition text to a shorter version:
```typescript
const shorterText = "100% cotton - algodón - coton - cotone - ΒΑΜΒΑΚΙ";
```

### Process
1. **Content change detected** by enhanced overflow system
2. **Cascade deletion triggered** → Child Mother 1 deleted
3. **Dynamic re-rendering** with new shorter text
4. **Capacity check** → New text fits in master only
5. **No new children created** → Master stands alone
6. **Relationship cleanup** → No relationships remain

### Result
```
Master Mother: "100% cotton - algodón - coton - cotone - ΒΑΜΒΑΚΙ" (5 lines)
Child Mothers: None (deleted)
Relationship: None
Status: ✅ No overflow needed
```

## Example 3: Content Expansion Requiring More Mothers

### Scenario
User expands existing composition with additional materials and translations.

### Before Change
```
Master Mother: "70% cotton..." (25 lines)
Child Mother 1: "Care instructions..." (20 lines)
Relationship: Master → [Child_1]
```

### User Action
User adds extensive material breakdown with multiple languages:
```typescript
const expandedText = `
[Original content] + 
Additional materials: 5% spandex, 3% modal, 2% bamboo fiber...
[Multiple language translations for each material]
[Extended care instructions in 15 languages]
[Sustainability information]
[Manufacturing details]
`;
```

### Process
1. **Content change detected** → Existing relationship found
2. **Cascade deletion** → Child Mother 1 deleted
3. **Dynamic re-rendering** with expanded text
4. **Capacity calculation** → Requires 3 mothers total
5. **New children created** → Child Mother 1, Child Mother 2
6. **Content distribution** across all mothers
7. **New relationship established**

### Result
```
Master Mother: [First 30 lines] (FULL capacity)
Child Mother 1: [Next 30 lines] (FULL capacity)  
Child Mother 2: [Remaining 15 lines] (partial)
Relationship: Master → [Child_1, Child_2]
Status: ✅ Master # ≥ Child # (30 ≥ 30 ≥ 15)
```

## Example 4: Complex Multi-Language Composition

### Scenario
Fashion brand needs composition labels in 20+ languages with care symbols.

### Input Configuration
```typescript
const overflowConfig = {
  contentType: 'new-comp-trans',
  regionId: 'comp_region_1',
  motherId: 'Mother_3',
  originalText: multiLanguageComposition, // 2000+ characters
  fontConfig: {
    fontSize: 10, // Small font for more content
    fontFamily: 'Arial',
    lineHeight: 1.2 // Tight line spacing
  },
  dimensionConfig: {
    width: 40, // mm
    height: 30, // mm  
    margins: { top: 2, bottom: 2, left: 2, right: 2 }
  }
};
```

### Capacity Calculation
```
Available area: 36mm × 26mm (after margins)
Characters per line: ~25 (based on 10px font)
Lines per mother: ~17 (based on 1.2 line height)
Total capacity per mother: ~425 characters
Required mothers: 2000 ÷ 425 = ~5 mothers
```

### Process & Result
```
Master Mother: Lines 1-17 (425 chars) - FULL
Child Mother 1: Lines 18-34 (425 chars) - FULL
Child Mother 2: Lines 35-51 (425 chars) - FULL  
Child Mother 3: Lines 52-68 (425 chars) - FULL
Child Mother 4: Lines 69-75 (300 chars) - PARTIAL
```

## Example 5: Error Handling and Recovery

### Scenario
System encounters errors during mother creation but handles gracefully.

### Error Conditions
1. **Mother creation fails** → Continue with available mothers
2. **Region not found** → Log error, preserve existing content
3. **Capacity calculation fails** → Use fallback estimates
4. **Content update fails** → Preserve original content

### Recovery Process
```typescript
try {
  const result = await enhancedOverflowManager.processOverflow(config);
  console.log('✅ Overflow processed successfully');
} catch (error) {
  console.error('❌ Overflow processing failed:', error);
  // Fallback to basic overflow or single mother
  // Preserve user content
  // Show user-friendly error message
}
```

## Integration with NewCompTransDialog

### Enhanced Save Process
```typescript
const handleNewCompTransSave = async (config: NewCompTransConfig) => {
  // ... existing save logic ...
  
  // Extract text content
  const textContent = config.textContent?.generatedText || 'Default text';
  
  // Check for content changes (editing mode)
  if (editingContent && textContent !== oldText) {
    console.log('🔄 Content changed - triggering enhanced overflow');
    
    // Trigger enhanced overflow handling
    await handleEnhancedOverflow(
      editingContent.id,
      regionId,
      motherObject.name,
      textContent,
      oldText // For change detection
    );
  }
  
  // Check for new content overflow (creation mode)
  else if (!editingContent && textContent.length > threshold) {
    console.log('🌊 New content may require overflow');
    
    await handleEnhancedOverflow(
      newContent.id,
      regionId,
      motherObject.name,
      textContent
    );
  }
};
```

## State Persistence

### Save State
```typescript
const projectState = {
  // ... existing state ...
  enhancedOverflowState: enhancedOverflowManager.exportState()
};
```

### Restore State
```typescript
if (projectState.enhancedOverflowState) {
  enhancedOverflowManager.importState(projectState.enhancedOverflowState);
  console.log('✅ Enhanced overflow relationships restored');
}
```

## Performance Considerations

### Optimization Strategies
1. **Debounced content changes** → Prevent excessive re-rendering
2. **Cached capacity calculations** → Avoid repeated calculations  
3. **Batch mother operations** → Group creation/deletion
4. **Lazy relationship creation** → Only when overflow detected

### Memory Management
```typescript
// Automatic cleanup of orphaned relationships
enhancedOverflowManager.clearAllRelationships();

// Periodic garbage collection
setInterval(() => {
  enhancedOverflowManager.cleanupOrphanedRelationships();
}, 300000); // Every 5 minutes
```

## Best Practices

### 1. Content Validation
- Validate text content before processing
- Check for minimum/maximum length limits
- Sanitize input to prevent injection

### 2. Error Handling
- Always wrap overflow operations in try-catch
- Provide fallback mechanisms
- Log errors for debugging

### 3. User Experience
- Show loading indicators during processing
- Provide clear feedback on overflow status
- Allow manual override of automatic decisions

### 4. Testing
- Test with various text lengths
- Test content change scenarios
- Test error conditions
- Verify state persistence

---

*These examples demonstrate the robust capabilities of the Dynamic Mother Relationship System in handling complex text overflow scenarios while maintaining optimal user experience and system reliability.*
