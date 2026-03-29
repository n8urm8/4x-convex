import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/** FIFO ship production jobs waiting while another ship is being built. */
export const playerShipQueue = defineTable({
  userId: v.id('users'),
  baseId: v.id('playerBases'),
  shipBlueprintId: v.string(), // From shipBlueprints.id
  quantity: v.number(),
  queuedAt: v.number(),
})
  .index('by_user_queued', ['userId', 'queuedAt'])
  .index('by_base_queued', ['baseId', 'queuedAt']);