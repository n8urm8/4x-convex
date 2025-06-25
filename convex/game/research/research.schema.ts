import { defineTable } from 'convex/server';
import { v, Infer } from 'convex/values';

export const RESEARCH_CATEGORIES = {
  STRUCTURES: 'Structures',
  SHIPS: 'Ships',
  WEAPONS: 'Weapons',
  DEFENSE: 'Defense'
} as const;

export const researchCategoryValidator = v.union(
  v.literal(RESEARCH_CATEGORIES.STRUCTURES),
  v.literal(RESEARCH_CATEGORIES.SHIPS),
  v.literal(RESEARCH_CATEGORIES.WEAPONS),
  v.literal(RESEARCH_CATEGORIES.DEFENSE)
);

export type ResearchCategory = Infer<typeof researchCategoryValidator>;

export const researchDefinitionSchema = {
  name: v.string(), // Unique identifier for the research technology
  tier: v.number(),
  category: researchCategoryValidator,
  primaryEffect: v.string(),
  unlocks: v.optional(v.array(v.string())), // Names of structures, ships, or other technologies unlocked
  description: v.optional(v.string()), // Optional detailed description
  novaCost: v.optional(v.number()),
  mineralCost: v.optional(v.number()),
  volatileCost: v.optional(v.number()),
  prerequisites: v.optional(v.array(v.id('researchDefinitions'))), // For tech tree dependencies
};

export const researchDefinitions = defineTable(researchDefinitionSchema)
  .index('by_name', ['name']) // For unique lookups and linking
  .index('by_tier', ['tier'])
  .index('by_category', ['category']);

// Type helper for seeding data, ensuring it matches the schema structure.
// Partial<Omit<...>> allows for optional _id and _creationTime during seeding.
export type ResearchDefinitionSeed = Partial<Omit<Infer<typeof researchDefinitions.validator>, '_id' | '_creationTime'>> & {
  name: string;
  tier: number;
  category: ResearchCategory;
  primaryEffect: string;
  unlocks?: string[];
  description?: string;
};
