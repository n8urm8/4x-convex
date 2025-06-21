import { Id } from './_generated/dataModel';
import { MutationCtx, QueryCtx } from './_generated/server';

export const getAdminUser = async (ctx: MutationCtx | QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error('User must be authenticated.');
  }

  const id = identity.subject.split('|')[0];
  let user = await ctx.db.get(id as Id<'users'>);

  if (!user) {
    user = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', identity.subject))
      .unique();
  }

  if (!user) {
    throw new Error('User not found.');
  }

  if (user.role !== 'admin') {
    throw new Error('User is not authorized to perform this action.');
  }

  return user;
};
