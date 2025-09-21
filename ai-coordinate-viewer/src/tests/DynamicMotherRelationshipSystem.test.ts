/**
 * Test suite for Dynamic Mother Relationship System
 * 
 * Tests the core functionality of master-child relationships,
 * cascade deletion, and dynamic re-rendering.
 */

import { DynamicMotherRelationshipManager } from '../services/DynamicMotherRelationshipManager';
import { EnhancedOverflowManager, OverflowConfig } from '../services/EnhancedOverflowManager';

describe('Dynamic Mother Relationship System', () => {
  let relationshipManager: DynamicMotherRelationshipManager;
  let enhancedOverflowManager: EnhancedOverflowManager;
  let createdMothers: string[] = [];
  let deletedMothers: string[] = [];
  let updatedContent: Map<string, string> = new Map();

  beforeEach(() => {
    // Reset test state
    createdMothers = [];
    deletedMothers = [];
    updatedContent = new Map();

    // Mock callbacks
    const onMotherCreated = async (motherId: string, config: any) => {
      createdMothers.push(motherId);
      console.log(`Mock: Created mother ${motherId}`);
    };

    const onMotherDeleted = async (motherId: string) => {
      deletedMothers.push(motherId);
      console.log(`Mock: Deleted mother ${motherId}`);
    };

    const onContentUpdated = async (motherId: string, content: string) => {
      updatedContent.set(motherId, content);
      console.log(`Mock: Updated content in ${motherId}: ${content.substring(0, 50)}...`);
    };

    // Initialize managers
    relationshipManager = new DynamicMotherRelationshipManager(
      onMotherCreated,
      onMotherDeleted,
      onContentUpdated
    );

    enhancedOverflowManager = new EnhancedOverflowManager(
      onMotherCreated,
      onMotherDeleted,
      onContentUpdated
    );
  });

  describe('Master-Child Relationship Logic', () => {
    test('should establish relationship when overflow occurs', () => {
      const masterId = 'mother_1';
    const childIds = ['mother_1A', 'mother_1B'];
      const originalText = 'This is a long composition text that requires overflow handling...';
      const textDistribution = ['First part', 'Second part', 'Third part'];

      relationshipManager.establishRelationship(
        masterId,
        childIds,
        'new-comp-trans',
        originalText,
        textDistribution
      );

      const relationship = relationshipManager.getRelationship(masterId);
      expect(relationship).toBeDefined();
      expect(relationship?.masterId).toBe(masterId);
      expect(relationship?.childIds).toEqual(childIds);
      expect(relationship?.contentType).toBe('new-comp-trans');
    });

    test('should track multiple relationships independently', () => {
      // Establish first relationship
      relationshipManager.establishRelationship(
        'mother_1',
        ['mother_1A'],
        'new-comp-trans',
        'Text 1',
        ['Text 1']
      );

      // Establish second relationship
      relationshipManager.establishRelationship(
        'mother_2',
        ['mother_2A', 'mother_2B'],
        'new-comp-trans',
        'Text 2',
        ['Text 2 part 1', 'Text 2 part 2', 'Text 2 part 3']
      );

      const relationships = relationshipManager.getAllRelationships();
      expect(relationships.size).toBe(2);
      expect(relationships.has('mother_1')).toBe(true);
      expect(relationships.has('mother_2')).toBe(true);
    });
  });

  describe('Cascade Deletion', () => {
    test('should delete all child mothers when master content changes', async () => {
      const masterId = 'mother_1';
    const childIds = ['mother_1A', 'mother_1B'];

      // Establish relationship
      relationshipManager.establishRelationship(
        masterId,
        childIds,
        'new-comp-trans',
        'Original text',
        ['Part 1', 'Part 2', 'Part 3']
      );

      // Trigger cascade deletion
      await relationshipManager.cascadeDeleteChildren(masterId);

      // Verify all children were deleted
      expect(deletedMothers).toEqual(childIds);
      expect(relationshipManager.getRelationship(masterId)).toBeNull();
    });

    test('should handle cascade deletion for non-existent relationship gracefully', async () => {
      await relationshipManager.cascadeDeleteChildren('non_existent_mother');
      expect(deletedMothers).toEqual([]);
    });
  });

  describe('Overflow Detection', () => {
    test('should detect content changes that affect overflow', () => {
      const masterId = 'mother_1';
      
      // Establish relationship
      relationshipManager.establishRelationship(
        masterId,
        ['child_1'],
        'new-comp-trans',
        'Original text',
        ['Original text']
      );

      // Test overflow change detection
      const hasChange = relationshipManager.detectOverflowChange(
        masterId,
        'Original text',
        'New longer text that requires different overflow handling'
      );

      expect(hasChange).toBe(true);
    });

    test('should not detect overflow change when no relationship exists', () => {
      const hasChange = relationshipManager.detectOverflowChange(
        'non_existent_mother',
        'Old text',
        'New text'
      );

      expect(hasChange).toBe(false);
    });

    test('should not detect overflow change when content is identical', () => {
      const masterId = 'mother_1';
      
      relationshipManager.establishRelationship(
        masterId,
        ['child_1'],
        'new-comp-trans',
        'Same text',
        ['Same text']
      );

      const hasChange = relationshipManager.detectOverflowChange(
        masterId,
        'Same text',
        'Same text'
      );

      expect(hasChange).toBe(false);
    });
  });

  describe('Enhanced Overflow Processing', () => {
    test('should process overflow correctly for new content', async () => {
      const overflowConfig: OverflowConfig = {
        contentType: 'new-comp-trans',
        regionId: 'region_1',
        motherId: 'mother_1',
        originalText: 'This is a very long composition text that definitely needs to overflow into multiple mother labels because it exceeds the capacity of a single label.',
        capacityLimit: 50, // Small capacity to force overflow
        fontConfig: {
          fontSize: 12,
          fontFamily: 'Arial',
          lineHeight: 1.5
        },
        dimensionConfig: {
          width: 100,
          height: 50,
          margins: {
            top: 2,
            bottom: 2,
            left: 2,
            right: 2
          }
        }
      };

      const result = await enhancedOverflowManager.processOverflow(overflowConfig);

      expect(result.hasOverflow).toBe(true);
      expect(result.motherCount).toBeGreaterThan(1);
      expect(result.textDistribution.length).toBeGreaterThan(1);
      expect(createdMothers.length).toBeGreaterThan(0);
    });

    test('should handle content that fits in single mother', async () => {
      const overflowConfig: OverflowConfig = {
        contentType: 'new-comp-trans',
        regionId: 'region_1',
        motherId: 'mother_1',
        originalText: 'Short text',
        capacityLimit: 1000, // Large capacity
        fontConfig: {
          fontSize: 12,
          fontFamily: 'Arial',
          lineHeight: 1.5
        },
        dimensionConfig: {
          width: 200,
          height: 100,
          margins: {
            top: 2,
            bottom: 2,
            left: 2,
            right: 2
          }
        }
      };

      const result = await enhancedOverflowManager.processOverflow(overflowConfig);

      expect(result.hasOverflow).toBe(false);
      expect(result.motherCount).toBe(1);
      expect(result.textDistribution).toEqual(['Short text']);
      expect(createdMothers.length).toBe(0);
    });
  });

  describe('State Persistence', () => {
    test('should export and import state correctly', () => {
      // Establish some relationships
      relationshipManager.establishRelationship(
        'mother_1',
        ['child_1', 'child_2'],
        'new-comp-trans',
        'Text 1',
        ['Part 1', 'Part 2', 'Part 3']
      );

      // Export state
      const exportedState = relationshipManager.exportState();
      expect(exportedState.relationships).toBeDefined();
      expect(exportedState.chainMetadata).toBeDefined();

      // Create new manager and import state
      const newManager = new DynamicMotherRelationshipManager();
      newManager.importState(exportedState);

      // Verify state was imported correctly
      const importedRelationship = newManager.getRelationship('mother_1');
      expect(importedRelationship).toBeDefined();
      expect(importedRelationship?.childIds).toEqual(['child_1', 'child_2']);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors in mother creation gracefully', async () => {
      const failingOverflowManager = new EnhancedOverflowManager(
        async (motherId: string) => {
          throw new Error('Mother creation failed');
        }
      );

      const overflowConfig: OverflowConfig = {
        contentType: 'new-comp-trans',
        regionId: 'region_1',
        motherId: 'mother_1',
        originalText: 'Long text that needs overflow',
        capacityLimit: 10,
        fontConfig: { fontSize: 12, fontFamily: 'Arial', lineHeight: 1.5 },
        dimensionConfig: {
          width: 50,
          height: 30,
          margins: { top: 2, bottom: 2, left: 2, right: 2 }
        }
      };

      // Should not throw error, but handle gracefully
      const result = await failingOverflowManager.processOverflow(overflowConfig);
      expect(result).toBeDefined();
    });
  });
});
