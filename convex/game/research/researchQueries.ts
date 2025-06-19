import { v } from 'convex/values';
import { internalQuery } from '../../_generated/server';

/**
 * Get all research definitions.
 * Used for seeding checks and potentially for admin panels or full listings.
 */
export const adminGetAllResearchDefinitions = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('researchDefinitions').collect();
  },
});

// --- Admin CRUD Queries for Research Definitions ---

export const adminGetResearchDefinitionById = internalQuery({
  args: { id: v.id('researchDefinitions') },
  handler: async (ctx, args) => {
    // TODO: Add admin authentication check here
    return await ctx.db.get(args.id);
  },
});

export const adminGetResearchDefinitionByName = internalQuery({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // TODO: Add admin authentication check here
    const researchDef = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique();
    return researchDef;
  },
});

