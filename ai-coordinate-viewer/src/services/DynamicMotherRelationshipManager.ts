/**
 * Dynamic Mother Label Relationship System for Text Overflow Management
 * 
 * This service manages master-child relationships between mother labels,
 * handles cascade deletion, and provides dynamic re-rendering capabilities
 * for new-comp-trans content type overflow scenarios.
 */

export interface MotherRelationship {
  masterId: string;           // Original mother label ID
  childIds: string[];         // Array of child mother IDs created from overflow
  contentType: string;        // Content type (e.g., 'new-comp-trans')
  createdAt: Date;           // When the relationship was established
  lastUpdated: Date;         // Last time the relationship was modified
}

export interface OverflowChainMetadata {
  originalText: string;       // Original text that caused the overflow
  splitPoints: number[];      // Character positions where splits occurred
  capacityLimits: number[];   // Maximum capacity for each mother in the chain
  textDistribution: string[]; // Text content for each mother in the chain
}

export class DynamicMotherRelationshipManager {
  private relationships: Map<string, MotherRelationship> = new Map();
  private chainMetadata: Map<string, OverflowChainMetadata> = new Map();
  private onMotherCreated?: (motherId: string, config: any) => Promise<void>;
  private onMotherDeleted?: (motherId: string) => Promise<void>;
  private onContentUpdated?: (motherId: string, content: string) => Promise<void>;

  constructor(
    onMotherCreated?: (motherId: string, config: any) => Promise<void>,
    onMotherDeleted?: (motherId: string) => Promise<void>,
    onContentUpdated?: (motherId: string, content: string) => Promise<void>
  ) {
    this.onMotherCreated = onMotherCreated;
    this.onMotherDeleted = onMotherDeleted;
    this.onContentUpdated = onContentUpdated;
  }

  /**
   * Core Relationship Logic: Establish master-child relationship
   */
  establishRelationship(
    masterId: string, 
    childIds: string[], 
    contentType: string,
    originalText: string,
    textDistribution: string[]
  ): void {
    console.log(`🔗 Establishing master-child relationship: ${masterId} -> [${childIds.join(', ')}]`);
    
    const relationship: MotherRelationship = {
      masterId,
      childIds,
      contentType,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    const metadata: OverflowChainMetadata = {
      originalText,
      splitPoints: this.calculateSplitPoints(textDistribution),
      capacityLimits: [], // Will be calculated based on actual mother dimensions
      textDistribution
    };

    this.relationships.set(masterId, relationship);
    this.chainMetadata.set(masterId, metadata);

    console.log(`✅ Relationship established for ${contentType} content`);
  }

  /**
   * Cascade Deletion: When original mother content changes, delete ALL child mothers
   */
  async cascadeDeleteChildren(masterId: string): Promise<void> {
    console.log(`🗑️ CASCADE DELETION: Starting for master ${masterId}`);
    
    const relationship = this.relationships.get(masterId);
    if (!relationship) {
      console.log(`⚠️ No relationship found for master ${masterId}`);
      return;
    }

    console.log(`🗑️ Deleting ${relationship.childIds.length} child mothers: [${relationship.childIds.join(', ')}]`);

    // Delete all child mothers
    for (const childId of relationship.childIds) {
      try {
        if (this.onMotherDeleted) {
          await this.onMotherDeleted(childId);
          console.log(`✅ Deleted child mother: ${childId}`);
        }
      } catch (error) {
        console.error(`❌ Failed to delete child mother ${childId}:`, error);
      }
    }

    // Clean up relationship data
    this.relationships.delete(masterId);
    this.chainMetadata.delete(masterId);

    console.log(`✅ CASCADE DELETION completed for master ${masterId}`);
  }

  /**
   * Dynamic Re-rendering: After deletion, re-process updated content
   */
  async dynamicRerender(
    masterId: string,
    newContent: string,
    masterConfig: any,
    capacityCalculator: (config: any) => number
  ): Promise<string[]> {
    console.log(`🔄 DYNAMIC RE-RENDERING: Starting for master ${masterId}`);
    console.log(`📝 New content length: ${newContent.length} characters`);

    // Step 1: Calculate master capacity
    const masterCapacity = capacityCalculator(masterConfig);
    console.log(`📐 Master capacity: ${masterCapacity} characters`);

    // Step 2: Check if overflow is needed
    if (newContent.length <= masterCapacity) {
      console.log(`✅ No overflow needed - content fits in master`);
      return [newContent]; // All content fits in master
    }

    // Step 3: Split content intelligently
    const textChunks = this.intelligentTextSplit(newContent, masterCapacity);
    console.log(`📊 Content split into ${textChunks.length} chunks`);

    // Step 4: Create child mothers for overflow chunks
    const childIds: string[] = [];
    for (let i = 1; i < textChunks.length; i++) {
      const childId = `${masterId}_child_${i}`;
      
      try {
        if (this.onMotherCreated) {
          await this.onMotherCreated(childId, {
            ...masterConfig,
            id: childId,
            name: `${masterConfig.name}_Child_${i}`
          });
          childIds.push(childId);
          console.log(`✅ Created child mother: ${childId}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create child mother ${childId}:`, error);
      }
    }

    // Step 5: Update content in all mothers
    for (let i = 0; i < textChunks.length; i++) {
      const motherId = i === 0 ? masterId : childIds[i - 1];
      
      try {
        if (this.onContentUpdated) {
          await this.onContentUpdated(motherId, textChunks[i]);
          console.log(`✅ Updated content in mother: ${motherId}`);
        }
      } catch (error) {
        console.error(`❌ Failed to update content in mother ${motherId}:`, error);
      }
    }

    // Step 6: Establish new relationship
    if (childIds.length > 0) {
      this.establishRelationship(masterId, childIds, 'new-comp-trans', newContent, textChunks);
    }

    console.log(`✅ DYNAMIC RE-RENDERING completed: ${textChunks.length} mothers total`);
    return textChunks;
  }

  /**
   * Overflow Detection: Monitor original mother for content changes
   */
  detectOverflowChange(masterId: string, oldContent: string, newContent: string): boolean {
    const hasContentChanged = oldContent !== newContent;
    const hasRelationship = this.relationships.has(masterId);
    
    if (hasContentChanged && hasRelationship) {
      console.log(`⚠️ OVERFLOW CHANGE DETECTED for master ${masterId}`);
      console.log(`📝 Content changed: ${oldContent.length} -> ${newContent.length} characters`);
      return true;
    }
    
    return false;
  }

  /**
   * Chain Management: Handle scenarios with varying mother requirements
   */
  async handleChainManagement(
    masterId: string,
    newContent: string,
    masterConfig: any,
    capacityCalculator: (config: any) => number
  ): Promise<void> {
    console.log(`⛓️ CHAIN MANAGEMENT: Processing for master ${masterId}`);

    // Step 1: Cascade delete existing children
    await this.cascadeDeleteChildren(masterId);

    // Step 2: Dynamic re-render with new content
    const textChunks = await this.dynamicRerender(masterId, newContent, masterConfig, capacityCalculator);

    console.log(`✅ CHAIN MANAGEMENT completed: ${textChunks.length} mothers in chain`);
  }

  /**
   * Relationship Tracking: Maintain data structure for mother relationships
   */
  getRelationship(masterId: string): MotherRelationship | null {
    return this.relationships.get(masterId) || null;
  }

  getAllRelationships(): Map<string, MotherRelationship> {
    return new Map(this.relationships);
  }

  getChainMetadata(masterId: string): OverflowChainMetadata | null {
    return this.chainMetadata.get(masterId) || null;
  }

  /**
   * Utility Methods
   */
  private calculateSplitPoints(textDistribution: string[]): number[] {
    const splitPoints: number[] = [];
    let currentPosition = 0;
    
    for (let i = 0; i < textDistribution.length - 1; i++) {
      currentPosition += textDistribution[i].length;
      splitPoints.push(currentPosition);
    }
    
    return splitPoints;
  }

  private intelligentTextSplit(text: string, capacity: number): string[] {
    const chunks: string[] = [];
    let remainingText = text;
    
    while (remainingText.length > 0) {
      if (remainingText.length <= capacity) {
        chunks.push(remainingText);
        break;
      }
      
      // Find the best split point (prefer word boundaries)
      let splitPoint = capacity;
      const searchStart = Math.max(0, capacity - 50); // Look back up to 50 chars
      
      for (let i = capacity; i >= searchStart; i--) {
        if (remainingText[i] === ' ' || remainingText[i] === '\n') {
          splitPoint = i;
          break;
        }
      }
      
      chunks.push(remainingText.substring(0, splitPoint).trim());
      remainingText = remainingText.substring(splitPoint).trim();
    }
    
    return chunks;
  }

  /**
   * Cleanup and Reset
   */
  clearAllRelationships(): void {
    console.log(`🧹 Clearing all mother relationships`);
    this.relationships.clear();
    this.chainMetadata.clear();
  }

  /**
   * Export/Import for persistence
   */
  exportState(): any {
    return {
      relationships: Object.fromEntries(this.relationships),
      chainMetadata: Object.fromEntries(this.chainMetadata)
    };
  }

  importState(state: any): void {
    if (state.relationships) {
      this.relationships = new Map(Object.entries(state.relationships));
    }
    if (state.chainMetadata) {
      this.chainMetadata = new Map(Object.entries(state.chainMetadata));
    }
  }
}
