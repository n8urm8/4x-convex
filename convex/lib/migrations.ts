import { internalMutation } from '../_generated/server';

export const addResourceFieldsToUsers = internalMutation(async (ctx) => {
  const users = await ctx.db.query('users').collect();

  for (const user of users) {
    if (user.nova === undefined || user.minerals === undefined || user.volatiles === undefined) {
        await ctx.db.patch(user._id, {
            nova: user.nova ?? 0,
            minerals: user.minerals ?? 0,
            volatiles: user.volatiles ?? 0,
        });
    }
  }
});
