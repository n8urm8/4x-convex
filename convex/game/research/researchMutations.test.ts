import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api } from '../../_generated/api';
import schema from '../../schema';
import { RESEARCH_CATEGORIES } from './research.schema';

describe('Research Mutations', () => {
  const testDefinition = {
    name: 'Test Research',
    tier: 1,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Test Effect',
    unlocks: ['Test Unlock'],
    description: 'A test research definition.',
  };

  describe('adminCreateResearchDefinition', () => {
    test('should create a new research definition successfully', async () => {
      const t = convexTest(schema);
      const result = await t.mutation(api.game.research.researchMutations.adminCreateResearchDefinition, testDefinition);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string'); // Returns the new ID

      const newDef = await t.query(api.game.research.researchQueries.adminGetResearchDefinitionByName, { name: 'Test Research' });
      expect(newDef).not.toBeNull();
      expect(newDef?.name).toBe(testDefinition.name);
    });

    test('should throw an error if a definition with the same name already exists', async () => {
      const t = convexTest(schema);
      await t.mutation(api.game.research.researchMutations.adminCreateResearchDefinition, testDefinition);

      await expect(t.mutation(api.game.research.researchMutations.adminCreateResearchDefinition, testDefinition))
        .rejects.toThrow(`Research definition with name '${testDefinition.name}' already exists.`);
    });
  });

  describe('adminUpdateResearchDefinition', () => {
    test('should update an existing research definition successfully', async () => {
      const t = convexTest(schema);
      const researchId = await t.mutation(api.game.research.researchMutations.adminCreateResearchDefinition, testDefinition);

      const updates = {
        tier: 2,
        description: 'Updated description.',
      };

      await t.mutation(api.game.research.researchMutations.adminUpdateResearchDefinition, { id: researchId, updates });

      const updatedDef = await t.query(api.game.research.researchQueries.adminGetResearchDefinitionById, { id: researchId });
      expect(updatedDef?.tier).toBe(2);
      expect(updatedDef?.description).toBe('Updated description.');
    });

    test('should throw an error if updating to a name that already exists', async () => {
      const t = convexTest(schema);
      await t.mutation(api.game.research.researchMutations.adminCreateResearchDefinition, { ...testDefinition, name: 'Another Research' });
      const researchIdToUpdate = await t.mutation(api.game.research.researchMutations.adminCreateResearchDefinition, testDefinition);

      const updates = { name: 'Another Research' };

      await expect(t.mutation(api.game.research.researchMutations.adminUpdateResearchDefinition, { id: researchIdToUpdate, updates }))
        .rejects.toThrow("Another research definition with name 'Another Research' already exists.");
    });
  });

  describe('adminDeleteResearchDefinition', () => {
    test('should delete an existing research definition successfully', async () => {
      const t = convexTest(schema);
      const researchId = await t.mutation(api.game.research.researchMutations.adminCreateResearchDefinition, testDefinition);

      const result = await t.mutation(api.game.research.researchMutations.adminDeleteResearchDefinition, { id: researchId });
      expect(result.success).toBe(true);

      const deletedDef = await t.query(api.game.research.researchQueries.adminGetResearchDefinitionById, { id: researchId });
      expect(deletedDef).toBeNull();
    });

    test('should throw an error if trying to delete a non-existent definition', async () => {
      const t = convexTest(schema);
      // Create a real ID and then delete it to ensure it's a valid but non-existent ID
      const researchId = await t.mutation(api.game.research.researchMutations.adminCreateResearchDefinition, testDefinition);
      await t.mutation(api.game.research.researchMutations.adminDeleteResearchDefinition, { id: researchId });

      await expect(t.mutation(api.game.research.researchMutations.adminDeleteResearchDefinition, { id: researchId }))
        .rejects.toThrow(`Research definition with id '${researchId}' not found.`);
    });
  });
});
