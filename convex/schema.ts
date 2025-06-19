import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { Infer, v } from 'convex/values';
import { baseStructures, playerBases, structureDefinitions, structureRequirements } from './game/bases/bases.schema';
import { researchDefinitions } from './game/research/research.schema';

export const CURRENCIES = {
  USD: 'usd',
  EUR: 'eur'
} as const;
export const currencyValidator = v.union(
  v.literal(CURRENCIES.USD),
  v.literal(CURRENCIES.EUR)
);
export type Currency = Infer<typeof currencyValidator>;

export const INTERVALS = {
  MONTH: 'month',
  YEAR: 'year'
} as const;
export const intervalValidator = v.union(
  v.literal(INTERVALS.MONTH),
  v.literal(INTERVALS.YEAR)
);
export type Interval = Infer<typeof intervalValidator>;

export const PLANS = {
  FREE: 'free',
  PRO: 'pro'
} as const;
export const planKeyValidator = v.union(
  v.literal(PLANS.FREE),
  v.literal(PLANS.PRO)
);
export type PlanKey = Infer<typeof planKeyValidator>;

const priceValidator = v.object({
  stripeId: v.string(),
  amount: v.number()
});
const pricesValidator = v.object({
  [CURRENCIES.USD]: priceValidator,
  [CURRENCIES.EUR]: priceValidator
});

const roleValidator = v.union(
  v.literal('user'),
  v.literal('mod'),
  v.literal('admin')
);

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    imageId: v.optional(v.id('_storage')),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    customerId: v.optional(v.string()),
    role: v.optional(roleValidator),
    subject: v.optional(v.string()),
  })
    .index('email', ['email'])
    .index('customerId', ['customerId'])
    .index('by_subject', ['subject']),

  // Planet Types table
  planetTypes: defineTable({
    name: v.string(),
    category: v.string(),
    habitable: v.boolean(),
    space: v.number(),
    energy: v.number(),
    minerals: v.number(),
    volatiles: v.number(),
    description: v.string(),
    imageUrl: v.optional(v.string())
  }),

  // Galaxies table
  galaxies: defineTable({
    number: v.number(), // Starting at 0
    groupId: v.string() // For future galaxy grouping
  })
    .index('by_number', ['number'])
    .index('by_group', ['groupId']),

  // Galaxy sectors (10x10 grid)
  galaxySectors: defineTable({
    galaxyId: v.id('galaxies'), // Parent galaxy
    galaxyNumber: v.number(), // Duplicate of galaxy.number for easier querying
    sectorX: v.number(), // 0-9 x coordinate in galaxy
    sectorY: v.number() // 0-9 y coordinate in galaxy
  })
    .index('by_galaxy', ['galaxyId'])
    .index('by_coordinates', ['galaxyId', 'sectorX', 'sectorY'])
    .index('by_galaxy_number', ['galaxyNumber']) // New index for direct lookups
    .index('by_number_coordinates', ['galaxyNumber', 'sectorX', 'sectorY']), // New index for lookups by number+coordinates

  // Star systems (within the 25x25 grid in each sector)
  sectorSystems: defineTable({
    galaxySectorId: v.id('galaxySectors'), // Parent sector
    galaxyNumber: v.number(), // Denormalized from parent galaxy
    sectorX: v.number(), // Denormalized from parent sector
    sectorY: v.number(), // Denormalized from parent sector
    systemX: v.number(), // 0-99 x coordinate within sector
    systemY: v.number(), // 0-99 y coordinate within sector
    starType: v.string(), // E.g., "Yellow Dwarf", "Red Giant", "Neutron Star"
    starSize: v.number(), // Size/mass of the star
    starColor: v.string(), // Color representation
    exploredBy: v.optional(v.id('users')) // User who first explored this system
  })
    .index('by_sector', ['galaxySectorId'])
    .index('by_coordinates', ['galaxySectorId', 'systemX', 'systemY'])
    .index('by_galaxy_sector_coordinates', [
      'galaxyNumber',
      'sectorX',
      'sectorY'
    ]) // Direct lookup by galaxy/sector
    .index('by_absolute_coordinates', [
      'galaxyNumber',
      'sectorX',
      'sectorY',
      'systemX',
      'systemY'
    ]), // Lookup by full coordinates

  // Planets (within the 9x9 grid in each star system)
  systemPlanets: defineTable({
    sectorSystemId: v.id('sectorSystems'), // Parent star system
    galaxyNumber: v.number(), // Denormalized from parent galaxy
    sectorX: v.number(), // Denormalized from parent sector
    sectorY: v.number(), // Denormalized from parent sector
    systemX: v.number(), // Denormalized from parent system
    systemY: v.number(), // Denormalized from parent system
    planetTypeId: v.id('planetTypes'), // Reference to planet type
    planetX: v.number(), // 0-8 x coordinate within system (star is at 4,4)
    planetY: v.number() // 0-8 y coordinate within system
  })
    .index('by_system', ['sectorSystemId'])
    .index('by_coordinates', ['sectorSystemId', 'planetX', 'planetY'])
    .index('by_type', ['planetTypeId'])
    .index('by_system_coordinates', [
      'galaxyNumber',
      'sectorX',
      'sectorY',
      'systemX',
      'systemY'
    ]) // Direct lookup by system coordinates
    .index('by_absolute_coordinates', [
      'galaxyNumber',
      'sectorX',
      'sectorY',
      'systemX',
      'systemY',
      'planetX',
      'planetY'
    ]), // Lookup by full coordinates

  plans: defineTable({
    key: planKeyValidator,
    stripeId: v.string(),
    name: v.string(),
    description: v.string(),
    prices: v.object({
      [INTERVALS.MONTH]: pricesValidator,
      [INTERVALS.YEAR]: pricesValidator
    })
  })
    .index('key', ['key'])
    .index('stripeId', ['stripeId']),

  subscriptions: defineTable({
    userId: v.id('users'),
    planId: v.id('plans'),
    priceStripeId: v.string(),
    stripeId: v.string(),
    currency: currencyValidator,
    interval: intervalValidator,
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean()
  })
    .index('userId', ['userId'])
    .index('stripeId', ['stripeId']),

      // Include your base schema tables
  structureDefinitions,
  structureRequirements,
  playerBases,
  baseStructures,

  // Research definitions
  researchDefinitions,

});

export default schema;
