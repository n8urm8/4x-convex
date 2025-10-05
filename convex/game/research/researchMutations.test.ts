import { convexTest } from 'convex-test';
import { beforeEach, describe, expect, test } from 'vitest';
import { api, internal } from '../../_generated/api';
import { Doc } from '../../_generated/dataModel';
import schema from '../../schema';
import { RESEARCH_CATEGORIES } from './research.schema';

describe('Research Mutations', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let t: any;
  let adminUser: Partial<Doc<'users'>>;

  const testDefinition = {
    name: 'Test Research',
    tier: 1,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Test Effect',
    unlocks: ['Test Unlock'],
    description: 'A test research definition.'
  };

  beforeEach(async () => {
    adminUser = {
      subject: `test-admin|${Math.random().toString(36).substring(2)}`,
      name: 'Test Admin',
      username: 'testadmin',
      role: 'admin',
      nova: 1000,
      minerals: 1000,
      volatiles: 1000
    };
    t = convexTest(schema).withIdentity(adminUser);
    // Seed the admin user for the tests
    // @ts-expect-error figure this out later
    await t.run(async (ctx) => ctx.db.insert('users', adminUser));
  });

  describe('adminCreateResearchDefinition', () => {
    test('should create a new research definition successfully', async () => {
      const result = await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        testDefinition
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string'); // Returns the new ID

      const newDef = await t.query(
        api.game.research.researchQueries.adminGetResearchDefinitionByName,
        { name: 'Test Research' }
      );
      expect(newDef).not.toBeNull();
      expect(newDef?.name).toBe(testDefinition.name);
    });

    test('should throw an error if a definition with the same name already exists', async () => {
      await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        testDefinition
      );

      await expect(
        t.mutation(
          internal.game.research.researchMutations
            .adminCreateResearchDefinition,
          testDefinition
        )
      ).rejects.toThrow(
        `Research definition with name '${testDefinition.name}' already exists.`
      );
    });
  });

  describe('adminUpdateResearchDefinition', () => {
    test('should update an existing research definition successfully', async () => {
      const researchId = await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        testDefinition
      );

      const updates = {
        tier: 2,
        description: 'Updated description.'
      };

      await t.mutation(
        internal.game.research.researchMutations.adminUpdateResearchDefinition,
        { id: researchId, updates }
      );

      const updatedDef = await t.query(
        api.game.research.researchQueries.adminGetResearchDefinitionById,
        { id: researchId }
      );
      expect(updatedDef?.tier).toBe(2);
      expect(updatedDef?.description).toBe('Updated description.');
    });

    test('should throw an error if updating to a name that already exists', async () => {
      await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        { ...testDefinition, name: 'Another Research' }
      );
      const researchIdToUpdate = await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        testDefinition
      );

      const updates = { name: 'Another Research' };

      await expect(
        t.mutation(
          internal.game.research.researchMutations
            .adminUpdateResearchDefinition,
          { id: researchIdToUpdate, updates }
        )
      ).rejects.toThrow(
        "Another research definition with name 'Another Research' already exists."
      );
    });
  });

  describe('adminDeleteResearchDefinition', () => {
    test('should delete an existing research definition successfully', async () => {
      const researchId = await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        testDefinition
      );

      const result = await t.mutation(
        internal.game.research.researchMutations.adminDeleteResearchDefinition,
        { id: researchId }
      );
      expect(result.success).toBe(true);

      const deletedDef = await t.query(
        api.game.research.researchQueries.adminGetResearchDefinitionById,
        { id: researchId }
      );
      expect(deletedDef).toBeNull();
    });

    test('should throw an error if trying to delete a non-existent definition', async () => {
      // Create a real ID and then delete it to ensure it's a valid but non-existent ID
      const researchId = await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        testDefinition
      );
      await t.mutation(
        internal.game.research.researchMutations.adminDeleteResearchDefinition,
        { id: researchId }
      );

      await expect(
        t.mutation(
          internal.game.research.researchMutations
            .adminDeleteResearchDefinition,
          { id: researchId }
        )
      ).rejects.toThrow(
        `Research definition with id '${researchId}' not found.`
      );
    });
  });

  describe('startResearch', () => {
    let regularUser: Partial<Doc<'users'>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let regularUserT: any;

    beforeEach(async () => {
      regularUser = {
        subject: `test-user|${Math.random().toString(36).substring(2)}`,
        name: 'Test User',
        username: 'testuser',
        role: 'user',
        nova: 1000,
        minerals: 1000,
        volatiles: 1000
      };
      regularUserT = convexTest(schema).withIdentity(regularUser);
      // @ts-expect-error figure this out later
      await regularUserT.run(async (ctx) => ctx.db.insert('users', regularUser));
    });

    test('should allow research of tier 1 technologies', async () => {
      const tier1Tech = await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        {
          name: 'Tier 1 Defense Tech',
          tier: 1,
          category: RESEARCH_CATEGORIES.DEFENSE,
          primaryEffect: 'Basic defense',
          description: 'A basic defense technology.'
        }
      );

      const result = await regularUserT.mutation(
        api.game.research.researchMutations.startResearch,
        { researchId: tier1Tech }
      );

      expect(result.success).toBe(true);
      expect(result.finishesAt).toBeDefined();
    });

    test('should block research of tier 2 technologies when tier 1 is not complete', async () => {
      // Create tier 1 and tier 2 defense technologies
      await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        {
          name: 'Tier 1 Defense Tech',
          tier: 1,
          category: RESEARCH_CATEGORIES.DEFENSE,
          primaryEffect: 'Basic defense',
          description: 'A basic defense technology.'
        }
      );

      const tier2Tech = await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        {
          name: 'Tier 2 Defense Tech',
          tier: 2,
          category: RESEARCH_CATEGORIES.DEFENSE,
          primaryEffect: 'Advanced defense',
          description: 'An advanced defense technology.'
        }
      );

      await expect(
        regularUserT.mutation(
          api.game.research.researchMutations.startResearch,
          { researchId: tier2Tech }
        )
      ).rejects.toThrow(/You must complete all Tier 1 Defense technologies first/);
    });

    test('should allow research of tier 2 technologies when all tier 1 in category is complete', async () => {
      // Create and research a tier 1 defense technology
      const tier1Tech = await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        {
          name: 'Tier 1 Defense Tech',
          tier: 1,
          category: RESEARCH_CATEGORIES.DEFENSE,
          primaryEffect: 'Basic defense',
          description: 'A basic defense technology.'
        }
      );

      // Start and complete tier 1 research
      await regularUserT.mutation(
        api.game.research.researchMutations.startResearch,
        { researchId: tier1Tech }
      );
      
      // Manually complete the research by adding it to playerTechnologies
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = await regularUserT.run(async (ctx: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await ctx.db.query('users').filter((q: any) => q.eq(q.field('username'), 'testuser')).first();
        return user?._id;
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await regularUserT.run(async (ctx: any) => {
        await ctx.db.insert('playerTechnologies', {
          userId,
          researchDefinitionId: tier1Tech,
          researchedAt: Date.now()
        });
        await ctx.db.patch(userId, {
          researchingId: undefined,
          researchFinishesAt: undefined
        });
      });

      // Create tier 2 technology
      const tier2Tech = await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        {
          name: 'Tier 2 Defense Tech',
          tier: 2,
          category: RESEARCH_CATEGORIES.DEFENSE,
          primaryEffect: 'Advanced defense',
          description: 'An advanced defense technology.'
        }
      );

      // Should now be able to research tier 2
      const result = await regularUserT.mutation(
        api.game.research.researchMutations.startResearch,
        { researchId: tier2Tech }
      );

      expect(result.success).toBe(true);
      expect(result.finishesAt).toBeDefined();
    });

    test('should not block research across different categories', async () => {
      // Create tier 1 defense and tier 2 ships technologies
      await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        {
          name: 'Tier 1 Defense Tech',
          tier: 1,
          category: RESEARCH_CATEGORIES.DEFENSE,
          primaryEffect: 'Basic defense',
          description: 'A basic defense technology.'
        }
      );

      const tier2ShipsTech = await t.mutation(
        internal.game.research.researchMutations.adminCreateResearchDefinition,
        {
          name: 'Tier 2 Ships Tech',
          tier: 2,
          category: RESEARCH_CATEGORIES.SHIPS,
          primaryEffect: 'Advanced ships',
          description: 'An advanced ships technology.'
        }
      );

      // Should be able to research tier 2 ships even though tier 1 defense is not complete
      // (because they're different categories)
      const result = await regularUserT.mutation(
        api.game.research.researchMutations.startResearch,
        { researchId: tier2ShipsTech }
      );

      expect(result.success).toBe(true);
      expect(result.finishesAt).toBeDefined();
    });
  });
});
