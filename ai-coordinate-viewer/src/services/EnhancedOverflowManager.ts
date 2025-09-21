/**
 * Enhanced Overflow Manager
 * 
 * Integrates the Dynamic Mother Relationship Manager with the existing overflow system
 * to provide comprehensive overflow management for new-comp-trans content type.
 */

import { DynamicMotherRelationshipManager, MotherRelationship } from './DynamicMotherRelationshipManager';

export interface OverflowConfig {
  contentType: string;
  regionId: string;
  motherId: string;
  originalText: string;
  capacityLimit: number;
  fontConfig: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
  };
  dimensionConfig: {
    width: number;
    height: number;
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
}

export interface OverflowResult {
  hasOverflow: boolean;
  originalText: string;
  overflowText: string;
  motherCount: number;
  textDistribution: string[];
  childMotherIds: string[];
}

export interface RegionStrategy {
  targetRegion: 'adjacent' | 'opposite' | 'diagonal' | 'corner';
  layoutHint: 'same-side' | 'different-side' | 'systematic-distribution' | 'standard-overflow';
  priority: 'balanced-distribution' | 'quadrant-distribution' | 'maximum-spread' | 'simple-overflow';
}

export class EnhancedOverflowManager {
  private relationshipManager: DynamicMotherRelationshipManager;
  private onMotherCreated?: (motherId: string, config: any) => Promise<void>;
  private onMotherDeleted?: (motherId: string) => Promise<void>;
  private onContentUpdated?: (motherId: string, content: string) => Promise<void>;
  private onRegionUpdated?: (regionId: string, contents: any[]) => void;

  constructor(
    onMotherCreated?: (motherId: string, config: any) => Promise<void>,
    onMotherDeleted?: (motherId: string) => Promise<void>,
    onContentUpdated?: (motherId: string, content: string) => Promise<void>,
    onRegionUpdated?: (regionId: string, contents: any[]) => void
  ) {
    this.onMotherCreated = onMotherCreated;
    this.onMotherDeleted = onMotherDeleted;
    this.onContentUpdated = onContentUpdated;
    this.onRegionUpdated = onRegionUpdated;

    // Initialize relationship manager with callbacks
    this.relationshipManager = new DynamicMotherRelationshipManager(
      this.handleMotherCreation.bind(this),
      this.handleMotherDeletion.bind(this),
      this.handleContentUpdate.bind(this)
    );
  }

  /**
   * Main overflow processing function for new-comp-trans content
   */
  async processOverflow(config: OverflowConfig): Promise<OverflowResult> {
    console.log(`🌊 ENHANCED OVERFLOW PROCESSING: Starting for ${config.contentType}`);
    console.log(`📝 Original text length: ${config.originalText.length} characters`);

    // Step 1: Calculate actual capacity based on dimensions and font
    const actualCapacity = this.calculateTextCapacity(config);
    console.log(`📐 Calculated capacity: ${actualCapacity} characters`);

    // Step 2: Check if overflow is needed
    if (config.originalText.length <= actualCapacity) {
      console.log(`✅ No overflow needed - content fits in original mother`);
      return {
        hasOverflow: false,
        originalText: config.originalText,
        overflowText: '',
        motherCount: 1,
        textDistribution: [config.originalText],
        childMotherIds: []
      };
    }

    // Step 3: Check for existing relationship and handle cascade deletion
    const existingRelationship = this.relationshipManager.getRelationship(config.motherId);
    if (existingRelationship) {
      console.log(`🗑️ Existing relationship found - triggering cascade deletion`);
      await this.relationshipManager.cascadeDeleteChildren(config.motherId);
    }

    // Step 4: Perform intelligent text splitting
    const textChunks = this.intelligentSplit(config.originalText, actualCapacity);
    console.log(`📊 Text split into ${textChunks.length} chunks`);

    // Step 5: ENHANCED - Handle multi-mother scenarios (3+ mothers)
    const childMotherIds: string[] = [];
    if (textChunks.length > 2) {
      console.log(`🏗️ MULTI-MOTHER SCENARIO: ${textChunks.length} mothers needed`);

      // Create mothers across different regions for better layout
      for (let i = 1; i < textChunks.length; i++) {
        const childMotherId = await this.createMultiRegionChildMother(config, i, textChunks.length);
        if (childMotherId) {
          childMotherIds.push(childMotherId);
        }
      }
    } else {
      // Standard 2-mother scenario
      for (let i = 1; i < textChunks.length; i++) {
        const childMotherId = await this.createChildMother(config, i);
        if (childMotherId) {
          childMotherIds.push(childMotherId);
        }
      }
    }

    // Step 6: Update content in all mothers
    await this.distributeContent(config.motherId, childMotherIds, textChunks);

    // Step 7: Establish new relationship
    this.relationshipManager.establishRelationship(
      config.motherId,
      childMotherIds,
      config.contentType,
      config.originalText,
      textChunks
    );

    console.log(`✅ ENHANCED OVERFLOW PROCESSING completed: ${textChunks.length} mothers total`);

    return {
      hasOverflow: true,
      originalText: textChunks[0],
      overflowText: textChunks.slice(1).join(' '),
      motherCount: textChunks.length,
      textDistribution: textChunks,
      childMotherIds
    };
  }

  /**
   * Handle content changes in original mother
   */
  async handleContentChange(
    motherId: string,
    oldContent: string,
    newContent: string,
    config: OverflowConfig
  ): Promise<void> {
    console.log(`🔄 CONTENT CHANGE DETECTED for mother ${motherId}`);

    // Check if this triggers overflow change
    const hasOverflowChange = this.relationshipManager.detectOverflowChange(
      motherId,
      oldContent,
      newContent
    );

    if (hasOverflowChange) {
      console.log(`⚠️ Overflow change detected - triggering chain management`);
      
      // Update config with new content
      const updatedConfig = { ...config, originalText: newContent };
      
      // Process the overflow with new content
      await this.processOverflow(updatedConfig);
    }
  }

  /**
   * Calculate text capacity based on dimensions and font configuration
   */
  private calculateTextCapacity(config: OverflowConfig): number {
    const { dimensionConfig, fontConfig } = config;
    
    // Calculate available area
    const availableWidth = dimensionConfig.width - dimensionConfig.margins.left - dimensionConfig.margins.right;
    const availableHeight = dimensionConfig.height - dimensionConfig.margins.top - dimensionConfig.margins.bottom;
    
    // Estimate characters per line based on font size and available width
    const avgCharWidth = fontConfig.fontSize * 0.6; // Rough estimate for Arial
    const charsPerLine = Math.floor(availableWidth / avgCharWidth);
    
    // Calculate number of lines that fit
    const lineHeight = fontConfig.fontSize * fontConfig.lineHeight;
    const maxLines = Math.floor(availableHeight / lineHeight);
    
    // Total capacity with some buffer for safety
    const totalCapacity = Math.floor((charsPerLine * maxLines) * 0.9); // 90% safety margin
    
    console.log(`📐 Capacity calculation: ${charsPerLine} chars/line × ${maxLines} lines = ${totalCapacity} chars`);
    
    return totalCapacity;
  }

  /**
   * Intelligent text splitting with word boundary preservation
   */
  private intelligentSplit(text: string, capacity: number): string[] {
    const chunks: string[] = [];
    let remainingText = text;
    
    while (remainingText.length > 0) {
      if (remainingText.length <= capacity) {
        chunks.push(remainingText);
        break;
      }
      
      // Find optimal split point
      let splitPoint = this.findOptimalSplitPoint(remainingText, capacity);
      
      chunks.push(remainingText.substring(0, splitPoint).trim());
      remainingText = remainingText.substring(splitPoint).trim();
    }
    
    return chunks;
  }

  /**
   * Find optimal split point to avoid single-word lines
   */
  private findOptimalSplitPoint(text: string, capacity: number): number {
    // Look for sentence boundaries first
    for (let i = capacity; i >= capacity * 0.7; i--) {
      if (text[i] === '.' || text[i] === '!' || text[i] === '?') {
        return i + 1;
      }
    }
    
    // Look for word boundaries
    for (let i = capacity; i >= capacity * 0.8; i--) {
      if (text[i] === ' ' || text[i] === '\n') {
        return i;
      }
    }
    
    // Look for punctuation
    for (let i = capacity; i >= capacity * 0.85; i--) {
      if (text[i] === ',' || text[i] === ';' || text[i] === ':') {
        return i + 1;
      }
    }
    
    // Fallback to capacity limit
    return capacity;
  }

  /**
   * Create child mother for overflow content
   */
  private async createChildMother(config: OverflowConfig, childIndex: number): Promise<string | null> {
    // Convert 1 -> A, 2 -> B, ... 26 -> Z, 27 -> AA, etc.
    const toLetters = (num: number): string => {
      let n = num;
      let result = '';
      while (n > 0) {
        const rem = (n - 1) % 26;
        result = String.fromCharCode(65 + rem) + result;
        n = Math.floor((n - 1) / 26);
      }
      return result;
    };
    const letter = toLetters(childIndex);
    const childMotherId = `${config.motherId}${letter}`;
    
    try {
      if (this.onMotherCreated) {
        await this.onMotherCreated(childMotherId, {
          id: childMotherId,
          name: `${childMotherId}`,
          type: 'mother',
          contentType: config.contentType,
          dimensions: config.dimensionConfig,
          fontConfig: config.fontConfig
        });
        
        console.log(`✅ Created child mother: ${childMotherId}`);
        return childMotherId;
      }
    } catch (error) {
      console.error(`❌ Failed to create child mother ${childMotherId}:`, error);
    }
    
    return null;
  }

  /**
   * Create child mother with multi-region support for 3+ mother scenarios
   */
  private async createMultiRegionChildMother(
    config: OverflowConfig,
    childIndex: number,
    totalMothers: number
  ): Promise<string | null> {
    // Convert index to letter suffix
    const toLetters = (num: number): string => {
      let n = num;
      let result = '';
      while (n > 0) {
        const rem = (n - 1) % 26;
        result = String.fromCharCode(65 + rem) + result;
        n = Math.floor((n - 1) / 26);
      }
      return result;
    };
    const letter = toLetters(childIndex);
    const childMotherId = `${config.motherId}${letter}`;

    // Determine optimal region placement strategy
    const regionStrategy = this.determineRegionStrategy(config, childIndex, totalMothers);

    try {
      if (this.onMotherCreated) {
        await this.onMotherCreated(childMotherId, {
          id: childMotherId,
          name: `${childMotherId}`,
          type: 'mother',
          contentType: config.contentType,
          dimensions: config.dimensionConfig,
          fontConfig: config.fontConfig,
          multiRegionConfig: {
            childIndex,
            totalMothers,
            regionStrategy,
            preferredRegion: regionStrategy.targetRegion,
            layoutHint: regionStrategy.layoutHint
          }
        });
        console.log(`✅ Created multi-region child mother: ${childMotherId} in ${regionStrategy.targetRegion}`);
        return childMotherId;
      }
    } catch (error) {
      console.error(`❌ Failed to create multi-region child mother ${childMotherId}:`, error);
    }

    return null;
  }

  /**
   * Determine optimal region placement strategy for multi-mother scenarios
   */
  private determineRegionStrategy(
    config: OverflowConfig,
    childIndex: number,
    totalMothers: number
  ): RegionStrategy {
    console.log(`🎯 Determining region strategy for child ${childIndex} of ${totalMothers} total mothers`);

    // Strategy based on number of mothers needed
    if (totalMothers === 3) {
      // 3 mothers: Original + 2 children
      return {
        targetRegion: childIndex === 1 ? 'adjacent' : 'opposite',
        layoutHint: childIndex === 1 ? 'same-side' : 'different-side',
        priority: 'balanced-distribution'
      };
    } else if (totalMothers === 4) {
      // 4 mothers: Original + 3 children
      const strategies: Array<'adjacent' | 'opposite' | 'diagonal'> = ['adjacent', 'opposite', 'diagonal'];
      return {
        targetRegion: strategies[(childIndex - 1) % strategies.length],
        layoutHint: childIndex <= 2 ? 'same-side' : 'different-side',
        priority: 'quadrant-distribution'
      };
    } else if (totalMothers >= 5) {
      // 5+ mothers: Use systematic distribution
      const regionCycle: Array<'adjacent' | 'opposite' | 'diagonal' | 'corner'> = ['adjacent', 'opposite', 'diagonal', 'corner'];
      return {
        targetRegion: regionCycle[(childIndex - 1) % regionCycle.length],
        layoutHint: 'systematic-distribution',
        priority: 'maximum-spread'
      };
    }

    // Fallback for 2 mothers (shouldn't reach here, but safety)
    return {
      targetRegion: 'adjacent',
      layoutHint: 'standard-overflow',
      priority: 'simple-overflow'
    };
  }

  /**
   * Distribute content across all mothers in the chain
   */
  private async distributeContent(
    masterId: string,
    childIds: string[],
    textChunks: string[]
  ): Promise<void> {
    console.log(`📤 DISTRIBUTING CONTENT across ${textChunks.length} mothers`);
    
    // Update master mother with first chunk
    if (this.onContentUpdated) {
      await this.onContentUpdated(masterId, textChunks[0]);
      console.log(`✅ Updated master mother: ${masterId}`);
    }
    
    // Update child mothers with remaining chunks
    for (let i = 0; i < childIds.length; i++) {
      if (this.onContentUpdated && textChunks[i + 1]) {
        await this.onContentUpdated(childIds[i], textChunks[i + 1]);
        console.log(`✅ Updated child mother: ${childIds[i]}`);
      }
    }
  }

  /**
   * Callback handlers for relationship manager
   */
  private async handleMotherCreation(motherId: string, config: any): Promise<void> {
    if (this.onMotherCreated) {
      await this.onMotherCreated(motherId, config);
    }
  }

  private async handleMotherDeletion(motherId: string): Promise<void> {
    if (this.onMotherDeleted) {
      await this.onMotherDeleted(motherId);
    }
  }

  private async handleContentUpdate(motherId: string, content: string): Promise<void> {
    if (this.onContentUpdated) {
      await this.onContentUpdated(motherId, content);
    }
  }

  /**
   * Public API methods
   */
  getRelationship(masterId: string): MotherRelationship | null {
    return this.relationshipManager.getRelationship(masterId);
  }

  getAllRelationships() {
    return this.relationshipManager.getAllRelationships();
  }

  async clearAllRelationships(): Promise<void> {
    // Get all relationships and cascade delete their children
    const relationships = this.relationshipManager.getAllRelationships();

    // Convert Map to array for iteration compatibility
    const relationshipEntries = Array.from(relationships.entries());
    for (const [masterId] of relationshipEntries) {
      await this.relationshipManager.cascadeDeleteChildren(masterId);
    }

    this.relationshipManager.clearAllRelationships();
  }

  exportState() {
    return this.relationshipManager.exportState();
  }

  importState(state: any) {
    this.relationshipManager.importState(state);
  }
}
