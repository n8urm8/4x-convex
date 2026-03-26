import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/** FIFO research jobs waiting while another technology is in progress. */
export const playerResearchQueue = defineTable({
  userId: v.id('users'),
  researchDefinitionId: v.id('researchDefinitions'),
  queuedAt: v.number(),
})
  .index('by_user_queued', ['userId', 'queuedAt']);
