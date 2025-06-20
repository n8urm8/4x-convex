import { v } from 'convex/values';
import { internalMutation, mutation } from '../../_generated/server';
import { getAdminUser } from '../../utils';
import { structureCategoryValidator } from './bases.schema';
import { Doc, Id } from '../../_generated/dataModel';
import { internal } from '@cvx/_generated/api';

// --- Internal Admin Mutations for Structure Definitions ---

export const adminCreateStructureDefinition = internalMutation({
  args: {
    name: v.string(),
    category: structureCategoryValidator,
    description: v.string(),
    baseSpaceCost: v.number(),
    baseEnergyCost: v.number(),
    baseNovaCost: v.number(),
    maxLevel: v.optional(v.number()),
    effects: v.string(),
    upgradeBenefits: v.string(),
    researchRequirementName: v.string(),
    damage: v.optional(v.number()),
    defense: v.optional(v.number()),
    shielding: v.optional(v.number()),
    imageUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await getAdminUser(ctx);
    const structureId = await ctx.db.insert('structureDefinitions', args);
    return structureId;
  }
});

// --- Public Mutations (Admin-Protected) for Structure Definitions ---

export const createStructureDefinition = mutation({
  args: {
    name: v.string(),
    category: structureCategoryValidator,
    description: v.string(),
    baseSpaceCost: v.number(),
    baseEnergyCost: v.number(),
    baseNovaCost: v.number(),
    maxLevel: v.optional(v.number()),
    effects: v.string(),
    upgradeBenefits: v.string(),
    researchRequirementName: v.string(),
    damage: v.optional(v.number()),
    defense: v.optional(v.number()),
    shielding: v.optional(v.number()),
    imageUrl: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<Id<'structureDefinitions'>> => {
    // Admin check is implicitly handled by calling the internal mutation
    // which itself calls getAdminUser.
    // However, for clarity and explicit auth at the public boundary, we can call it here too.
    await getAdminUser(ctx);
    return await ctx.runMutation(
      internal.game.bases.structureMutations.adminCreateStructureDefinition,
      args
    );
  }
});

export const adminUpdateStructureDefinition = internalMutation({
  args: {
    id: v.id('structureDefinitions'),
    updates: v.object({
      name: v.optional(v.string()),
      category: v.optional(structureCategoryValidator),
      description: v.optional(v.string()),
      baseSpaceCost: v.optional(v.number()),
      baseEnergyCost: v.optional(v.number()),
      baseNovaCost: v.optional(v.number()),
      maxLevel: v.optional(v.number()),
      effects: v.optional(v.string()),
      upgradeBenefits: v.optional(v.string()),
      researchRequirementName: v.optional(v.string()),
      damage: v.optional(v.number()),
      defense: v.optional(v.number()),
      shielding: v.optional(v.number()),
      imageUrl: v.optional(v.string())
    })
  },
  handler: async (ctx, args) => {
    await getAdminUser(ctx);
    await ctx.db.patch(args.id, args.updates);
    return await ctx.db.get(args.id);
  }
});

export const updateStructureDefinition = mutation({
  args: {
    id: v.id('structureDefinitions'),
    updates: v.object({
      name: v.optional(v.string()),
      category: v.optional(structureCategoryValidator),
      description: v.optional(v.string()),
      baseSpaceCost: v.optional(v.number()),
      baseEnergyCost: v.optional(v.number()),
      baseNovaCost: v.optional(v.number()),
      maxLevel: v.optional(v.number()),
      effects: v.optional(v.string()),
      upgradeBenefits: v.optional(v.string()),
      researchRequirementName: v.optional(v.string()),
      damage: v.optional(v.number()),
      defense: v.optional(v.number()),
      shielding: v.optional(v.number()),
      imageUrl: v.optional(v.string())
    })
  },
  handler: async (ctx, args): Promise<Doc<'structureDefinitions'> | null> => {
    await getAdminUser(ctx);
    return await ctx.runMutation(
      internal.game.bases.structureMutations.adminUpdateStructureDefinition,
      args
    );
  }
});

export const adminDeleteStructureDefinition = internalMutation({
  args: { id: v.id('structureDefinitions') },
  handler: async (ctx, args) => {
    await getAdminUser(ctx);
    // Optional: Check if the structure is in use before deleting, or handle cascading deletes.
    await ctx.db.delete(args.id);
    return args.id; // Return the ID of the deleted document
  }
});

export const deleteStructureDefinition = mutation({
  args: { id: v.id('structureDefinitions') },
  handler: async (ctx, args): Promise<Id<'structureDefinitions'>> => {
    await getAdminUser(ctx);
    return await ctx.runMutation(
      internal.game.bases.structureMutations.adminDeleteStructureDefinition,
      args
    );
  }
});

export const seedStructureDefinitions = internalMutation({
  handler: async (ctx) => {
    const structuresToSeed = [
      {
        name: 'Shipyard',
        category: 'production' as const,
        description: 'Constructs basic ships.',
        baseSpaceCost: 10,
        baseEnergyCost: 5,
        baseNovaCost: 500,
        researchRequirementName: 'Spacecraft Design',
        effects: 'Unlocks Basic Ships',
        upgradeBenefits: '=+10% Ship Production Speed per level',
        maxLevel: 10,
      },
      {
        name: 'Construction Yard',
        category: 'construction' as const,
        description: 'Reduces build times for structures and ships.',
        baseSpaceCost: 8,
        baseEnergyCost: 3,
        baseNovaCost: 400,
        researchRequirementName: 'Basic Construction',
        effects: '-10% Build Time',
        upgradeBenefits: '-5% Build Time per level',
        maxLevel: 10,
      },
    ];

    let seededCount = 0;
    for (const def of structuresToSeed) {
      const existing = await ctx.db
        .query('structureDefinitions')
        .withIndex('by_name', (q) => q.eq('name', def.name))
        .unique();

      if (!existing) {
        await ctx.db.insert('structureDefinitions', def);
        seededCount++;
      }
    }
    return `Seeded ${seededCount} structure definitions.`;
  },
});
