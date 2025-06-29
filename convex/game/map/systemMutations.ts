// convex/game/map/systemMutations.ts
import { v } from 'convex/values';
import { getAuthedUser } from '@cvx/utils';
import { mutation } from '../../_generated/server';
import { api } from '../../_generated/api';

export const discoverSystem = mutation({
  args: {
    systemId: v.id('sectorSystems')
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    // Patch the user with the subject if it's missing
    if (!user.subject) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        // This should be unreachable if getAuthedUser succeeded.
        throw new Error('Unauthenticated user');
      }
      await ctx.db.patch(user._id, { subject: identity.subject });
    }

    const userDocumentId = user._id;

    const system = await ctx.db.get(args.systemId);
    if (!system) {
      throw new Error('System not found');
    }

    if (system.exploredBy) {
      if (system.exploredBy === userDocumentId) {
        // Already explored by the same user.
        return { success: false, message: 'System already explored by you.' };
      }
      // Explored by someone else.
      return { success: false, message: 'System already explored.' };
    }

    await ctx.db.patch(args.systemId, { exploredBy: userDocumentId });
    await ctx.scheduler.runAfter(
      0,
      api.game.map.galaxyGeneration.generateSystemPlanets,
      {
        systemId: args.systemId
      }
    );
    console.log(`System ${args.systemId} discovered by ${userDocumentId}`);
    return { success: true, message: 'System discovered.' };
  }
});
