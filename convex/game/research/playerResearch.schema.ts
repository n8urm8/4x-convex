// convex/game/research/playerResearch.schema.ts
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const playerTechnologies = defineTable({
  userId: v.id('users'),
  researchDefinitionId: v.id('researchDefinitions'), // ID of the researched tech
  researchedAt: v.number(),
})
  .index('by_user_research', ['userId', 'researchDefinitionId']);
