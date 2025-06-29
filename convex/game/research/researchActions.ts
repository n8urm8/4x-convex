import { getAuthedUser } from '@cvx/utils';
import { mutation } from '../../_generated/server';
import { v } from 'convex/values';

export const researchTechnology = mutation({
  args: {
    researchDefinitionId: v.id('researchDefinitions'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    const userId = user._id;

    // 1. Verify the research definition exists
    const researchDef = await ctx.db.get(args.researchDefinitionId);
    if (!researchDef) {
      throw new Error(`Research definition with ID ${args.researchDefinitionId} not found.`);
    }

    // 2. Check if the player has already researched this technology
    const existingResearch = await ctx.db
      .query('playerTechnologies')
      .withIndex('by_user_research', (q) =>
        q.eq('userId', userId).eq('researchDefinitionId', args.researchDefinitionId)
      )
      .first();

    if (existingResearch) {
      throw new Error(`Player has already researched ${researchDef.name}.`);
    }

    // 3. (Future: Check costs, prerequisites, etc.)

    // 4. Add the technology to playerTechnologies
    const playerTechnologyId = await ctx.db.insert('playerTechnologies', {
      userId: userId,
      researchDefinitionId: args.researchDefinitionId,
      researchedAt: Date.now(), // Optional: timestamp for when it was researched
    });

    console.log(`Player ${userId} researched ${researchDef.name}`);
    return { playerTechnologyId };
  },
});
