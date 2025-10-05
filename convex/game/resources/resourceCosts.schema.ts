import { defineTable } from 'convex/server';
import { v, Infer } from 'convex/values';

export const RESOURCE_TYPES = {
  NOVA: 'nova',
  VOLATILE: 'volatile',
  MINERAL: 'mineral',
  // Add more resources as needed
} as const;

export const resourceTypeValidator = v.union(
  v.literal(RESOURCE_TYPES.NOVA),
  v.literal(RESOURCE_TYPES.VOLATILE),
  v.literal(RESOURCE_TYPES.MINERAL)
  // Add more literals for new resources
);

export type ResourceType = Infer<typeof resourceTypeValidator>;

export const resourceCostSchema = {
  ownerType: v.string(), // e.g., 'technology', 'ship', 'building'
  ownerCode: v.string(), // e.g., 'defense1', 'scout', 'hab_dome'
  resource: resourceTypeValidator,
  amount: v.number(),
};

export const resourceCosts = defineTable(resourceCostSchema)
  .index('by_owner', ['ownerType', 'ownerCode'])
  .index('by_resource', ['resource']);

export type ResourceCostSeed = Infer<typeof resourceCosts.validator>;
