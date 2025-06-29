import { v } from 'convex/values';
import { getAuthedUser } from '@cvx/utils';
import { internalMutation, mutation, query } from '../../_generated/server';
import { shipBlueprintsData } from './shipBlueprints';

// ======================================================
// =========== INTERNAL SEEDING FUNCTIONS ===============
// ======================================================

export const seedShipBlueprints = internalMutation({
  handler: async (ctx) => {
    for (const blueprint of shipBlueprintsData) {
      const existing = await ctx.db
        .query('shipBlueprints')
        .withIndex('byId', (q) => q.eq('id', blueprint.id))
        .unique();

      if (!existing) {
        await ctx.db.insert('shipBlueprints', blueprint);
      }
    }
    console.log('Ship blueprints seeded successfully.');
  }
});

// ======================================================
// =================== PUBLIC ACTIONS ===================
// ======================================================

export const buildShip = mutation({
  args: {
    shipBlueprintId: v.string(),
    baseId: v.id('playerBases'),
    quantity: v.number()
  },
  handler: async (ctx, { shipBlueprintId, baseId, quantity }) => {
    const user = await getAuthedUser(ctx);

    // 1. Get the ship blueprint
    const blueprint = await ctx.db
      .query('shipBlueprints')
      .withIndex('byId', (q) => q.eq('id', shipBlueprintId))
      .unique();

    if (!blueprint) {
      throw new Error('Ship blueprint not found.');
    }

    // 2. Check player resources
    const totalCost = blueprint.novaCost * quantity;

    if (user.nova < totalCost) {
      throw new Error('Insufficient nova to build ship(s).');
    }

    // 3. Check for required structure at the base
    const requiredStructureDef = await ctx.db
      .query('structureDefinitions')
      .withIndex('by_name', (q) => q.eq('name', blueprint.requiredStructure))
      .unique();

    if (!requiredStructureDef) {
      throw new Error(
        `Required structure definition '${blueprint.requiredStructure}' not found.`
      );
    }

    const hasStructure = await ctx.db
      .query('baseStructures')
      .withIndex('by_structure_type', (q) =>
        q.eq('baseId', baseId).eq('structureDefId', requiredStructureDef._id)
      )
      .first();

    if (!hasStructure) {
      throw new Error(
        `Required structure '${blueprint.requiredStructure}' not found at base '${baseId}'.`
      );
    }

    // 4. Check for required technology
    const requiredTechDef = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_name', (q) => q.eq('name', blueprint.requiredTechnology))
      .unique();

    if (!requiredTechDef) {
      throw new Error(
        `Required technology definition '${blueprint.requiredTechnology}' not found.`
      );
    }

    const hasTechnology = await ctx.db
      .query('playerTechnologies')
      .withIndex('by_user_research', (q) =>
        q
          .eq('userId', user._id)
          .eq('researchDefinitionId', requiredTechDef._id)
      )
      .first();

    if (!hasTechnology) {
      throw new Error(
        `Required technology '${blueprint.requiredTechnology}' not researched.`
      );
    }

    // 5. All checks passed, proceed with building
    await ctx.db.patch(user._id, {
      nova: user.nova - totalCost
    });

    for (let i = 0; i < quantity; i++) {
      await ctx.db.insert('playerShips', {
        userId: user._id,
        blueprintId: blueprint.id,
        baseId: baseId,
        damage: blueprint.damage,
        defense: blueprint.defense,
        shielding: blueprint.shielding,
        currentHealth: blueprint.defense // Start with full health
      });
    }

    return {
      success: true,
      message: `${quantity}x ${blueprint.name}(s) added to build queue.`
    };
  }
});

// ======================================================
// ==================== PUBLIC QUERIES ==================
// ======================================================

export const getShipBlueprints = query({
  handler: async (ctx) => {
    return await ctx.db.query('shipBlueprints').collect();
  }
});

export const getPlayerShips = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('playerShips')
      .withIndex('byUserId', (q) => q.eq('userId', userId))
      .collect();
  }
});
