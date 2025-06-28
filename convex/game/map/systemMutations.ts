// convex/game/map/systemMutations.ts
import { v } from 'convex/values';
import { auth } from '../../auth';
import { mutation } from '../../_generated/server';
import { api } from '../../_generated/api';

export const discoverSystem = mutation({
  args: {
    systemId: v.id('sectorSystems')
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User must be authenticated to discover a system.');
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Could not get user ID from auth.');
    }

    const user = await ctx.db.get(userId);

    if (!user) {
      throw new Error(`User record not found for id: ${userId}.`);
    }

    // Patch the user with the subject if it's missing
    if (!user.subject) {
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
