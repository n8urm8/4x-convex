/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from 'convex/values';
import { getAdminUser, getAuthedUser } from '../../utils';
import { query } from '../../_generated/server';

async function loadCostsForCode(ctx: any, code: string): Promise<Record<string, number>> {
  const rows: Array<{ resource: string; amount: number }> = await ctx.db
    .query('resourceCosts')
    .withIndex('by_owner', (q: any) => q.eq('ownerType', 'technology').eq('ownerCode', code))
    .collect();
  const costs: Record<string, number> = {};
  for (const row of rows) costs[row.resource] = row.amount;
  return costs;
}

export const listResearchDefinitions = query({
  args: {},
  handler: async (ctx) => {
    await getAdminUser(ctx);
    const defs = await ctx.db.query('researchDefinitions').collect();
    const enriched = [] as Array<any>;
    for (const def of defs) {
      const costs = await loadCostsForCode(ctx, def.code);
      enriched.push({ ...def, costs });
    }
    return enriched;
  }
});

export const adminGetResearchDefinitionById = query({
  args: { id: v.id('researchDefinitions') },
  handler: async (ctx, args) => {
    await getAdminUser(ctx);
    const def = await ctx.db.get(args.id);
    if (!def) return null;
    const costs = await loadCostsForCode(ctx, def.code);
    return { ...def, costs };
  }
});

export const adminGetResearchDefinitionByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await getAdminUser(ctx);
    const researchDef = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique();
    if (!researchDef) return null;
    const costs = await loadCostsForCode(ctx, researchDef.code);
    return { ...researchDef, costs };
  }
});

export const getPlayerTechnologies = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    const allResearch = await ctx.db.query('researchDefinitions').collect();
    const playerResearched = await ctx.db
      .query('playerTechnologies')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();
    const playerResearchedIds = new Set(playerResearched.map((r) => r.researchDefinitionId));
    const technologies = [] as Array<any>;
    for (const tech of allResearch) {
      const costs = await loadCostsForCode(ctx, tech.code);
      technologies.push({
        ...tech,
        isResearched: playerResearchedIds.has(tech._id),
        costs
      });
    }
    return {
      technologies,
      researchingId: user.researchingId,
      researchFinishesAt: user.researchFinishesAt
    };
  }
});

