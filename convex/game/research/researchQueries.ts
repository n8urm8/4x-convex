import { v } from 'convex/values';
import { getAdminUser, getAuthedUser } from '../../utils';
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

export const getPlayerTechnologies = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);

    // 1. Get all research definitions
    const allResearch = await ctx.db.query('researchDefinitions').collect();

    // 2. Get all technologies researched by the player
    const playerResearched = await ctx.db
      .query('playerTechnologies')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const playerResearchedIds = new Set(
      playerResearched.map((r) => r.researchDefinitionId)
    );

    // 3. Combine the data
    const technologies = allResearch.map((tech) => ({
      ...tech,
      isResearched: playerResearchedIds.has(tech._id),
    }));

    return {
      technologies,
      researchingId: user.researchingId,
      researchFinishesAt: user.researchFinishesAt,
    };
  },
});

