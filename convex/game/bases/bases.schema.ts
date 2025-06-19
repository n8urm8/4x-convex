// bases.schema.ts
import { defineTable } from 'convex/server';
import { v, Infer } from 'convex/values';

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
  effects: v.string(), // Effects of the structure
  upgradeBenefits: v.string(), // Benefits of upgrading the structure
  researchRequirementName: v.string(), // Name of the research required
  damage: v.optional(v.number()), // Damage output
  defense: v.optional(v.number()), // Defensive value
  shielding: v.optional(v.number()), // Shielding value
  imageUrl: v.optional(v.string()) // Optional image URL for the structure
})

  .index('by_category', ['category'])
  .index('by_name', ['name']);

// For seeding purposes, a plain TypeScript type matching the structureDefinitions fields
export type StructureDefinitionSeed = {
  name: string;
  category: Infer<typeof structureCategoryValidator>;
  description: string;
  baseSpaceCost: number;
  baseEnergyCost: number;
  baseNovaCost: number;
  maxLevel?: number;
  effects: string;
  upgradeBenefits: string;
  researchRequirementName: string;
  damage?: number;
  defense?: number;
  shielding?: number;
  imageUrl?: string;
};

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