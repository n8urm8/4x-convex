import { v } from 'convex/values';
import { mutation } from '../../_generated/server';
import { getAuthedUser } from '../../utils';
import { assertDevGameTools } from '../../devTools';
import {
  getPlayerResourceAmount,
  modifyPlayerResource,
} from '../resources/resourceHelpers';

const devResourceCode = v.union(
  v.literal('nova'),
  v.literal('mineral'),
  v.literal('volatile')
);

export const devGrantResources = mutation({
  args: {
    resourceCode: devResourceCode,
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertDevGameTools();
    const user = await getAuthedUser(ctx);
    const amount = args.amount ?? 1000;
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      throw new Error('Invalid amount');
    }
    await modifyPlayerResource(ctx, user._id, args.resourceCode, amount);
    const newAmount = await getPlayerResourceAmount(
      ctx,
      user._id,
      args.resourceCode
    );
    return { resourceCode: args.resourceCode, added: amount, newAmount };
  },
});
