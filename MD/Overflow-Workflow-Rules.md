# Overflow Workflow Rules & Guidelines

## Overview
The overflow system allows text content to automatically flow from one region to another when the first region becomes full. This creates a chain of connected content blocks.

## Core Concepts

### Terminology
- **Initiator**: The first content block in an overflow chain (sequence #1)
- **Connector**: Subsequent content blocks that receive overflow text (sequence #2, #3, etc.)
- **Chain**: A sequence of connected content blocks of the same type
- **Content Type**: The type of content (line-text, translation-paragraph, etc.) that determines chain grouping

### Chain Structure
- Each content type has its own separate chain
- Chains are stored as arrays of content IDs in sequence order
- Position in chain determines sequence number (1-based)
- Only content of the same type can be in the same chain

## State Management

### Overflow Settings
- `overflowSettings`: Map<contentId, boolean> - tracks which content has overflow enabled
- `overflowChains`: Map<contentType, string[]> - tracks chain sequences per content type

### Role Detection
```typescript
getOverflowRole(contentId): 'initiator' | 'connector' | 'none'
```
- Searches ALL chains to find the content
- Returns 'initiator' if content is first in any chain
- Returns 'connector' if content is elsewhere in any chain
- Returns 'none' if content is not in any chain

### Sequence Numbers
```typescript
getOverflowNumber(contentId): number
```
- Returns 1-based position in chain (1, 2, 3, ...)
- Returns 0 if overflow not enabled or content not in chain
- Used for overlay number display

## Dialog Behavior

### Opening Dialog
When opening UniversalContentDialog for existing content:

1. **Check explicit overflow setting first**:
   ```typescript
   let initialState = isOverflowEnabled(contentId);
   ```

2. **Fallback to chain membership**:
   ```typescript
   if (!initialState && getOverflowRole) {
     const role = getOverflowRole(contentId);
     if (role === 'initiator' || role === 'connector') {
       initialState = true;
     }
   }
   ```

3. **Set local toggle state**:
   ```typescript
   setLocalOverflowEnabled(initialState);
   ```

### Saving Content
When saving content with overflow enabled:

1. **Preserve content ID**: Always maintain original ID to preserve chain integrity
2. **Update overflow setting**: Call `onOverflowToggle(contentId, regionId, localOverflowEnabled)`
3. **Trigger redistribution**: For initiators/connectors, call `recalculateOverflowChain(initiatorId)`

## Chain Operations

### Adding to Chain
```typescript
addToOverflowChain(contentId, regionId)
```
- Determines content type from ID
- Migrates existing chains if content type key changes
- Adds content to end of appropriate chain
- Auto-connects to create sequence

### Removing from Chain
```typescript
removeFromOverflowChain(contentId)
```
- **CRITICAL**: Currently clears content text - this is problematic
- Removes content from chain
- Triggers recalculation for remaining chain members
- Should preserve text when removing (future improvement)

### Redistribution Algorithm
```typescript
recalculateOverflowChain(masterContentId, originalTextOverride?)
```

**Process**:
1. **Clear all connectors** (preserves initiator text)
2. **Get original text** from initiator
3. **Sequential distribution**:
   - Calculate capacity for each region/slice
   - Fill regions in chain order
   - Move overflow to next position
   - Continue until all text placed or chain exhausted

**Capacity Calculation**:
- Based on region dimensions, font size, line height
- Accounts for padding and text area constraints
- Uses text measurement for accurate fitting

## Critical Rules & Safeguards

### Content Preservation
1. **Never clear initiator text** during redistribution
2. **Preserve original content ID** when editing to maintain chain integrity
3. **Abort redistribution** if target regions cannot be resolved
4. **Don't pre-clear** content before redistribution

### Dialog State Consistency
1. **Initialize toggle from actual state** (settings + chain membership)
2. **Maintain stable checkbox state** through open/save cycles
3. **Handle missing settings gracefully** by checking chain membership

### Chain Integrity
1. **Content type consistency** - only same types in same chain
2. **Sequence order preservation** - maintain array order for numbering
3. **Automatic cleanup** when content deleted
4. **Migration support** for content type changes

### Error Handling
1. **Missing regions/slices**: Stop redistribution, preserve originals
2. **Invalid chain state**: Log errors, don't crash
3. **Content type mismatches**: Auto-migrate or create new chains
4. **Capacity calculation failures**: Fall back to basic estimates

## UI Display Rules

### Sequence Number Overlays
- Show large numbers (1, 2, 3...) when `showOverflowNumbers` is true
- Only display for content with overflow enabled
- Font size scales with region size
- Positioned at region center

### Toggle State
- Checkbox reflects actual overflow state
- Initiators and connectors show as enabled
- New content defaults to disabled
- State persists through dialog cycles

## Known Issues & Future Improvements

### Current Problems
1. **Text clearing on disable**: `removeFromOverflowChain` clears text unnecessarily
2. **No undo for chain operations**: Once removed, content is lost
3. **Limited error recovery**: Some edge cases not handled gracefully

### Recommended Improvements
1. **Preserve text when disabling overflow**
2. **Add undo/redo for chain operations**
3. **Better error messages for capacity issues**
4. **Visual chain connection indicators**
5. **Bulk chain operations (select multiple, chain together)**

## Testing Scenarios

### Basic Flow
1. Create content in region A
2. Enable overflow
3. Create content in region B of same type
4. Enable overflow (should auto-connect)
5. Edit region A content to exceed capacity
6. Verify overflow appears in region B

### Edge Cases
1. Delete connector in middle of chain
2. Change content type of chain member
3. Disable overflow on initiator
4. Edit connector content directly
5. Save with invalid target regions

### State Persistence
1. Save/load project with overflow chains
2. Refresh browser during overflow operation
3. Switch between projects with different chains
4. Import/export with overflow data

## Version History
- **V2.6.83**: Fixed dialog initialization to check chain membership
- **V2.6.84**: Fixed font scaling to preserve layout during zoom
- **Current**: Stable overflow workflow with known limitations

---

*This document reflects the current implementation as of V2.6.84. Rules may evolve as the system is improved.*
