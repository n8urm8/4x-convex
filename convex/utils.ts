import { MutationCtx, QueryCtx } from './_generated/server';
import { Id } from './_generated/dataModel';

export const getAuthedUser = async (ctx: MutationCtx | QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error('User must be authenticated.');
  }

  const user = await ctx.db.get(identity.subject.split('|')[0] as Id<'users'>);

  if (!user) {
    const userBySubject = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', identity.subject))
      .unique();
    if (userBySubject) {
      return userBySubject;
    } else {
      throw new Error('User not found.');
    }
  }
  return user;
};

export const getAdminUser = async (ctx: MutationCtx | QueryCtx) => {
  const user = await getAuthedUser(ctx);

  if (user.role !== 'admin') {
    throw new Error('User is not authorized to perform this action.');
  }

  return user;
};
