// bases.schema.ts
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// Available structure categories
export const STRUCTURE_CATEGORIES = {
  HABITAT: 'habitat',
  CONSTRUCTION: 'construction',
  PRODUCTION: 'production',
  RESEARCH: 'research',
  ECONOMIC: 'economic',
  DEFENSE: 'defense',
  UTILITY: 'utility',
  SPECIAL: 'special'
} as const;

export const structureCategoryValidator = v.union(
  v.literal(STRUCTURE_CATEGORIES.HABITAT),
  v.literal(STRUCTURE_CATEGORIES.CONSTRUCTION),
  v.literal(STRUCTURE_CATEGORIES.PRODUCTION),
  v.literal(STRUCTURE_CATEGORIES.RESEARCH),
  v.literal(STRUCTURE_CATEGORIES.ECONOMIC),
  v.literal(STRUCTURE_CATEGORIES.DEFENSE),
  v.literal(STRUCTURE_CATEGORIES.UTILITY),
  v.literal(STRUCTURE_CATEGORIES.SPECIAL)
);

// Structure tables
export const structureDefinitions = defineTable({
  name: v.string(), // Name of the structure
  category: structureCategoryValidator, // Type of structure
  description: v.string(), // Description of what it does
  baseSpaceCost: v.number(), // Base space cost
  baseEnergyCost: v.number(), // Base energy cost (negative means it produces energy)
  baseNovaCost: v.number(), // Base cost in nova currency
  maxLevel: v.optional(v.number()), // Maximum level (if any)

  // Effects per level
  effects: v.optional(
    v.object({
      space: v.optional(v.number()), // Additional space provided per level
      energy: v.optional(v.number()), // Additional energy provided per level
      minerals: v.optional(v.number()), // Additional minerals provided per level
      volatiles: v.optional(v.number()), // Additional volatiles provided per level
      research: v.optional(v.number()), // Research points per cycle per level
      novaPerCycle: v.optional(v.number()), // Nova generated per cycle per level
      buildTimeReduction: v.optional(v.number()), // % reduction in build time per level
      shipProductionSpeed: v.optional(v.number()), // % increase in ship production per level
      defense: v.optional(v.number()), // Defense strength per level
      damage: v.optional(v.number()), // Damage capability per level
      shielding: v.optional(v.number()), // Shielding strength per level
      allProductionBonus: v.optional(v.number()), // % bonus to all production per level
      researchSpeed: v.optional(v.number()), // % increase in research speed per level
      baseDefense: v.optional(v.number()) // % increase in base defense per level
    })
  )
})
  .index('by_category', ['category'])
  .index('by_name', ['name']);

// Research requirements for structures
export const structureRequirements = defineTable({
  structureId: v.id('structureDefinitions'), // The structure that has requirements
  requirementName: v.string(), // Name of the research technology required
  requirementTier: v.number() // Tier level (1-5)
})
  .index('by_structure', ['structureId'])
  .index('by_requirement', ['requirementName']);

// Player bases table
export const playerBases = defineTable({
  userId: v.id('users'), // Owner of the base
  name: v.string(), // Name of the base

  // Location information
  galaxyNumber: v.number(),
  sectorX: v.number(),
  sectorY: v.number(),
  systemX: v.number(),
  systemY: v.number(),
  planetX: v.number(),
  planetY: v.number(),

  // Reference to the planet
  planetId: v.id('systemPlanets'),

  // Base stats
  totalSpace: v.number(), // Total space available
  usedSpace: v.number(), // Space currently used
  totalEnergy: v.number(), // Total energy available
  usedEnergy: v.number(), // Energy currently used

  // Resources per cycle
  researchPerCycle: v.number(),
  novaPerCycle: v.number(),
  mineralsPerCycle: v.number(),
  volatilesPerCycle: v.number(),

  // Base bonuses
  buildTimeReduction: v.number(), // % reduction in build time
  shipProductionSpeed: v.number(), // % increase in ship production
  defenseBonus: v.number(), // % increase in defense
  allProductionBonus: v.number(), // % bonus to all production
  researchSpeed: v.number(), // % increase in research speed

  // Meta information
  createdAt: v.number(), // When the base was established
  lastUpdated: v.number() // Last time the base was updated
})
  .index('by_user', ['userId'])
  .index('by_planet', ['planetId'])
  .index('by_location', [
    'galaxyNumber',
    'sectorX',
    'sectorY',
    'systemX',
    'systemY',
    'planetX',
    'planetY'
  ]);

// Structures built in bases
export const baseStructures = defineTable({
  baseId: v.id('playerBases'), // The base this structure belongs to
  structureDefId: v.id('structureDefinitions'), // Reference to structure definition
  level: v.number(), // Current level of the structure

  // Current costs
  spaceCost: v.number(), // Current space cost
  energyCost: v.number(), // Current energy cost

  // Upgrade information
  upgrading: v.boolean(), // Whether it's currently being upgraded
  upgradeCompleteTime: v.optional(v.number()), // When the upgrade completes
  upgradeLevel: v.optional(v.number()), // Level it's upgrading to
  upgradeNovaCost: v.optional(v.number()), // Nova cost for the upgrade

  // Current effects (calculated based on level and structure definition)
  currentEffects: v.optional(
    v.object({
      space: v.optional(v.number()),
      energy: v.optional(v.number()),
      minerals: v.optional(v.number()),
      volatiles: v.optional(v.number()),
      research: v.optional(v.number()),
      novaPerCycle: v.optional(v.number()),
      buildTimeReduction: v.optional(v.number()),
      shipProductionSpeed: v.optional(v.number()),
      defense: v.optional(v.number()),
      damage: v.optional(v.number()),
      shielding: v.optional(v.number()),
      allProductionBonus: v.optional(v.number()),
      researchSpeed: v.optional(v.number()),
      baseDefense: v.optional(v.number())
    })
  )
})
  .index('by_base', ['baseId'])
  .index('by_structure_type', ['baseId', 'structureDefId'])
  .index('by_upgrading', ['baseId', 'upgrading']);