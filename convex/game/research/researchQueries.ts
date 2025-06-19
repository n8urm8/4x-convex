import { v } from 'convex/values';
import { getAdminUser } from '../../utils';
import { query } from '../../_generated/server';

/**
 * Get all research definitions.
 * Used for seeding checks and potentially for admin panels or full listings.
 */
export const listResearchDefinitions = query({
  args: {},
  handler: async (ctx) => {
    await getAdminUser(ctx);
    return await ctx.db.query('researchDefinitions').collect();
  },
});

// --- Admin CRUD Queries for Research Definitions ---

export const adminGetResearchDefinitionById = query({
  args: { id: v.id('researchDefinitions') },
  handler: async (ctx, args) => {
    await getAdminUser(ctx);
    return await ctx.db.get(args.id);
  },
});

export const adminGetResearchDefinitionByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await getAdminUser(ctx);
    const researchDef = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique();
    return researchDef;
  },
});

