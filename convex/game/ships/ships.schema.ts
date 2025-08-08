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
  name: v.string(), // Auto-generated as "Fleet XXX"
  fleetNumber: v.number(), // Sequential number for naming
  
  // Fleet type and location
  isBaseFleet: v.boolean(), // Base fleets don't count against max fleet limit
  baseId: v.optional(v.id('playerBases')), // If this is a base fleet, which base
  
  // Location information
  currentSystemId: v.id('sectorSystems'), // Current location of the fleet
  currentGalaxyNumber: v.number(), // Denormalized for easier querying
  currentSectorX: v.number(),
  currentSectorY: v.number(),
  currentSystemX: v.number(),
  currentSystemY: v.number(),
  
  // Movement information
  status: v.string(), // 'idle', 'moving', 'in-combat', 'destroyed'
  destinationSystemId: v.optional(v.id('sectorSystems')),
  destinationGalaxyNumber: v.optional(v.number()),
  destinationSectorX: v.optional(v.number()),
  destinationSectorY: v.optional(v.number()),
  destinationSystemX: v.optional(v.number()),
  destinationSystemY: v.optional(v.number()),
  arrivalTime: v.optional(v.number()), // When the fleet will arrive at destination
  
  // Fleet stats (calculated from ships)
  totalDamage: v.number(),
  totalDefense: v.number(),
  totalShielding: v.number(),
  totalHealth: v.number(),
  maxHealth: v.number(),
  fleetSpeed: v.number(), // Determined by slowest ship
  
  // Fleet capacity
  currentCapacity: v.number(), // Sum of all ship fleet capacity costs
  maxCapacity: v.number(), // Base capacity + bonuses from research/structures
  
  // Meta information
  createdAt: v.number(),
  lastUpdated: v.number()
})
  .index('byUserId', ['userId'])
  .index('byCurrentSystem', ['currentSystemId'])
  .index('byCurrentLocation', ['currentGalaxyNumber', 'currentSectorX', 'currentSectorY'])
  .index('byStatus', ['status'])
  .index('byUserAndStatus', ['userId', 'status'])
  .index('byBase', ['baseId'])
  .index('byUserAndFleetType', ['userId', 'isBaseFleet']);
