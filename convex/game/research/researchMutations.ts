import { v } from 'convex/values';
import { internalMutation, mutation } from '../../_generated/server';
import { internal } from '../../_generated/api';
import { Doc, Id } from '../../_generated/dataModel';
import { getAdminUser } from '../../utils';
import { researchDefinitions, researchDefinitionSchema } from './research.schema';

// --- Public Admin Mutations for Research Definitions ---

export const createResearchDefinition = mutation({
  args: researchDefinitionSchema,
  handler: async (ctx, args): Promise<Id<'researchDefinitions'>> => {
    await getAdminUser(ctx);
    return await ctx.runMutation(internal.game.research.researchMutations.adminCreateResearchDefinition, args);
  },
});

export const updateResearchDefinition = mutation({
  args: {
    id: v.id('researchDefinitions'),
    updates: v.object(
      Object.fromEntries(
        Object.entries(researchDefinitionSchema).map(([key, val]) => [
          key,
          v.optional(val),
        ]),
      ),
    ),
  },
  handler: async (ctx, args): Promise<Doc<'researchDefinitions'> | null> => {
    await getAdminUser(ctx);
    return await ctx.runMutation(internal.game.research.researchMutations.adminUpdateResearchDefinition, args);
  },
});

export const deleteResearchDefinition = mutation({
  args: { id: v.id('researchDefinitions') },
  handler: async (ctx, args): Promise<{ success: boolean; deletedId: Id<'researchDefinitions'> }> => {
    await getAdminUser(ctx);
    return await ctx.runMutation(internal.game.research.researchMutations.adminDeleteResearchDefinition, args);
  },
});

// --- Internal Admin CRUD for Research Definitions ---

export const adminCreateResearchDefinition = internalMutation({
  args: researchDefinitionSchema, // Use the full validator for creation args
  handler: async (ctx, args) => {
    // Admin check is done by the public wrapper


    const existing = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique();

    if (existing) {
      throw new Error(`Research definition with name '${args.name}' already exists.`);
    }
    return await ctx.db.insert('researchDefinitions', args);
  },
});

export const adminUpdateResearchDefinition = internalMutation({
  args: {
    id: v.id('researchDefinitions'),
    updates: v.object(
      Object.fromEntries(
        Object.entries(researchDefinitions.validator.fields).map(([key, val]) => [
          key,
          v.optional(val),
        ]),
      ),
    ),
  },
  handler: async (ctx, { id, updates }) => {
    // Admin check is done by the public wrapper

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Research definition with id '${id}' not found.`);
    }

    // Prevent changing the name if it's part of updates and already exists elsewhere
    if (updates.name && typeof updates.name === 'string' && updates.name !== existing.name) {
      const conflicting = await ctx.db
        .query('researchDefinitions')
        .withIndex('by_name', (q) => q.eq('name', updates.name as string))
        .unique();
      if (conflicting && conflicting._id !== id) {
        throw new Error(`Another research definition with name '${updates.name}' already exists.`);
      }
    }

    await ctx.db.patch(id, updates as Partial<Doc<'researchDefinitions'>>);
    return await ctx.db.get(id);
  },
});

export const adminDeleteResearchDefinition = internalMutation({
  args: { id: v.id('researchDefinitions') },
  handler: async (ctx, { id }) => {
    // Admin check is done by the public wrapper

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Research definition with id '${id}' not found.`);
    }

    // TODO: Consider implications of deleting a research definition
    // e.g., what happens to structures or other game elements that require it?

    await ctx.db.delete(id);
    return { success: true, deletedId: id };
  },
});

export const seedResearchDefinitions = internalMutation({
  handler: async (ctx) => {
    const researchDefinitionsToSeed = [
      {
        name: 'Basic Propulsion',
        category: 'Ships' as const,
        tier: 1,
        description: 'Fundamental principles of sublight travel.',
        primaryEffect: 'Unlocks basic ship engines.',
        unlocks: ['ship_engine_1'],
      },
      {
        name: 'Spacecraft Design',
        category: 'Ships' as const,
        tier: 1,
        description: 'Enables construction of basic shipyards.',
        primaryEffect: 'Unlocks Shipyard structure.',
        unlocks: ['shipyard'],
      },
      {
        name: 'Basic Construction',
        category: 'Structures' as const,
        tier: 1,
        description: 'Enables construction of basic structures.',
        primaryEffect: 'Unlocks Construction Yard.',
        unlocks: ['construction_yard'],
      },
    ];

    let seededCount = 0;
    for (const def of researchDefinitionsToSeed) {
      const existing = await ctx.db
        .query('researchDefinitions')
        .withIndex('by_name', (q) => q.eq('name', def.name))
        .unique();

      if (!existing) {
        await ctx.db.insert('researchDefinitions', def);
        seededCount++;
      }
    }
    return `Seeded ${seededCount} research definitions.`;
  },
});
