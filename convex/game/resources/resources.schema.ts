import { defineTable } from 'convex/server';
import { v, Infer } from 'convex/values';

/**
 * Resource Categories
 * - CURRENCY: Primary currencies used for transactions (Nova)
 * - MATERIAL: Physical materials used in construction (Minerals, Volatiles)
 * - ENERGY: Power-related resources
 * - RESEARCH: Research points or knowledge
 * - SPECIAL: Unique or rare resources
 */
export const RESOURCE_CATEGORIES = {
  CURRENCY: 'currency',
  MATERIAL: 'material',
  ENERGY: 'energy',
  RESEARCH: 'research',
  SPECIAL: 'special',
} as const;

export const resourceCategoryValidator = v.union(
  v.literal(RESOURCE_CATEGORIES.CURRENCY),
  v.literal(RESOURCE_CATEGORIES.MATERIAL),
  v.literal(RESOURCE_CATEGORIES.ENERGY),
  v.literal(RESOURCE_CATEGORIES.RESEARCH),
  v.literal(RESOURCE_CATEGORIES.SPECIAL)
);

export type ResourceCategory = Infer<typeof resourceCategoryValidator>;

/**
 * Storage Types determine where/how resources are stored
 * - GLOBAL: Stored on user document (empire-wide)
 * - BASE: Stored per base (local production/storage)
 * - FLEET: Stored with fleets (cargo)
 */
export const STORAGE_TYPES = {
  GLOBAL: 'global',
  BASE: 'base',
  FLEET: 'fleet',
} as const;

export const storageTypeValidator = v.union(
  v.literal(STORAGE_TYPES.GLOBAL),
  v.literal(STORAGE_TYPES.BASE),
  v.literal(STORAGE_TYPES.FLEET)
);

export type StorageType = Infer<typeof storageTypeValidator>;

/**
 * Resource Definitions Table
 * Defines all available resource types in the game
 */
export const resourceDefinitionsSchema = {
  // Unique code for the resource (used in code references)
  code: v.string(),
  
  // Display name
  name: v.string(),
  
  // Resource category
  category: resourceCategoryValidator,
  
  // Where this resource is stored
  storageType: storageTypeValidator,
  
  // User-facing description
  description: v.string(),
  
  // Display properties
  displayOrder: v.number(), // Order in UI displays
  icon: v.optional(v.string()), // Icon name or path
  color: v.optional(v.string()), // Color for UI (hex code)
  
  // Gameplay properties
  isVisible: v.boolean(), // Show in UI?
  isTradeable: v.boolean(), // Can be traded between players?
  hasProductionRate: v.boolean(), // Does this resource have per-cycle production?
  hasStorage: v.boolean(), // Does this resource have storage limits?
  
  // Storage limits (if applicable)
  baseStorageLimit: v.optional(v.number()), // Default storage capacity
  
  // Legacy field mapping (for migration compatibility)
  legacyFieldName: v.optional(v.string()), // e.g., "nova", "minerals", "volatiles"
};

export const resourceDefinitions = defineTable(resourceDefinitionsSchema)
  .index('by_code', ['code'])
  .index('by_category', ['category'])
  .index('by_storage_type', ['storageType'])
  .index('by_display_order', ['displayOrder'])
  .index('by_legacy_field', ['legacyFieldName']);

export type ResourceDefinition = Infer<typeof resourceDefinitions.validator>;
export type ResourceDefinitionSeed = Omit<ResourceDefinition, '_id' | '_creationTime'>;

/**
 * Player Resources Table (for global resources)
 * Tracks player's global resource amounts
 */
export const playerResourcesSchema = {
  userId: v.id('users'),
  resourceDefinitionId: v.id('resourceDefinitions'),
  amount: v.number(),
  storageCapacity: v.optional(v.number()), // Current storage limit (can be upgraded)
  productionRate: v.optional(v.number()), // Current production per cycle
  lastUpdated: v.number(), // Timestamp of last update
};

export const playerResources = defineTable(playerResourcesSchema)
  .index('by_user', ['userId'])
  .index('by_user_resource', ['userId', 'resourceDefinitionId']);

export type PlayerResource = Infer<typeof playerResources.validator>;

/**
 * Base Resources Table (for base-specific resources)
 * Tracks resources stored at individual bases
 */
export const baseResourcesSchema = {
  baseId: v.id('playerBases'),
  resourceDefinitionId: v.id('resourceDefinitions'),
  amount: v.number(),
  storageCapacity: v.optional(v.number()),
  productionRate: v.optional(v.number()),
  lastUpdated: v.number(),
};

export const baseResources = defineTable(baseResourcesSchema)
  .index('by_base', ['baseId'])
  .index('by_base_resource', ['baseId', 'resourceDefinitionId']);

export type BaseResource = Infer<typeof baseResources.validator>;
