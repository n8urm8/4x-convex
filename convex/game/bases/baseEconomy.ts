import { QueryCtx, MutationCtx } from '../../_generated/server';
import { Id } from '../../_generated/dataModel';

export async function countPlayerBases(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
): Promise<number> {
  const bases = await ctx.db
    .query('playerBases')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();
  return bases.length;
}
