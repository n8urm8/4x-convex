// convex/game/map/systemMutations.ts
import { v } from 'convex/values';
import { mutation } from '../../_generated/server';

export const discoverSystem = mutation({
  args: {
    systemId: v.id('sectorSystems')
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User must be authenticated to discover a system.');
    }
    const user = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', identity.subject))
      .unique();

    if (!user) {
      // Depending on app logic, you might auto-create a user here,
      // or throw if a user record is expected to exist.
      throw new Error(
        `User record not found for subject: ${identity.subject}. Please ensure user exists.`
      );
    }
    const userDocumentId = user._id; // This is the actual Id<'users'>

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
    console.log(`System ${args.systemId} discovered by ${userDocumentId}`);
    return { success: true, message: 'System discovered.' };
  }
});
