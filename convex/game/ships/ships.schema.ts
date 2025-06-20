import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const shipBlueprint = {
  id: v.string(), // e.g., "ranger_scout"
  name: v.string(),
  category: v.string(),
  novaCost: v.number(),
  buildTimeCycles: v.number(),
  requiredStructure: v.string(),
  requiredTechnology: v.string(),
  weaponType: v.string(),
  damage: v.number(),
  defense: v.number(),
  shielding: v.number(),
  movementSpeed: v.optional(v.number()),
  specialAbility: v.string(),
  fleetCapacityCost: v.number(),
  fighterCapacityProvided: v.optional(v.number()),
};

export const shipBlueprints = defineTable(shipBlueprint)
  .index('byId', ['id']);

export const playerShips = defineTable({
  userId: v.id('users'),
  blueprintId: v.string(), // From shipBlueprints.id
  baseId: v.id('playerBases'), // Base where the ship was built
  fleetId: v.optional(v.id('fleets')),
  damage: v.number(),
  defense: v.number(),
  shielding: v.number(),
  currentHealth: v.number(),
})
  .index('byUserId', ['userId'])
  .index('byFleetId', ['fleetId']);

export const fleets = defineTable({
  userId: v.id('users'),
  name: v.string(),
  systemId: v.id('sectorSystems'), // Current location of the fleet
  status: v.string(), // e.g., 'idle', 'moving', 'in-combat'
  destinationSystemId: v.optional(v.id('sectorSystems')),
})
  .index('byUserId', ['userId'])
  .index('bySystemId', ['systemId']);
