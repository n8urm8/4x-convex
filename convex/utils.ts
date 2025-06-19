import { Id } from './_generated/dataModel';
import { MutationCtx, QueryCtx } from './_generated/server';

export const getAdminUser = async (ctx: MutationCtx | QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error('User must be authenticated.');
  }

  const userId = identity.subject.split('|')[0];

  // query user where _id matches userId
  const user = await ctx.db.get(userId as Id<'users'>);

  if (!user) {
    throw new Error('User not found.');
  }

  if (user.role !== 'admin') {
    throw new Error('User is not authorized to perform this action.');
  }

  return user;
};
