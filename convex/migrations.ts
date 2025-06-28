import { internalMutation } from './_generated/server';

export const addDefaultResourcesToUsers = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    let count = 0;
    for (const user of users) {
      if (user.minerals === undefined || user.nova === undefined || user.volatiles === undefined) {
        await ctx.db.patch(user._id, {
          minerals: user.minerals ?? 0,
          nova: user.nova ?? 0,
          volatiles: user.volatiles ?? 0,
        });
        count++;
      }
    }
    return `Updated ${count} users with default resource values.`;
  },
});
