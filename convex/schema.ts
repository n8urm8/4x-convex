import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { Infer, v } from 'convex/values';

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
    role: v.optional(roleValidator)
  })
    .index('email', ['email'])
    .index('customerId', ['customerId']),

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
    sectorX: v.number(), // 0-9 x coordinate in galaxy
    sectorY: v.number() // 0-9 y coordinate in galaxy
  })
    .index('by_galaxy', ['galaxyId'])
    .index('by_coordinates', ['galaxyId', 'sectorX', 'sectorY']),

  // Star systems (within the 100x100 grid in each sector)
  starSystems: defineTable({
    galaxySectorId: v.id('galaxySectors'), // Parent sector
    systemX: v.number(), // 0-99 x coordinate within sector
    systemY: v.number(), // 0-99 y coordinate within sector
    starType: v.string(), // E.g., "Yellow Dwarf", "Red Giant", "Neutron Star"
    starSize: v.number(), // Size/mass of the star
    starColor: v.string() // Color representation
  })
    .index('by_sector', ['galaxySectorId'])
    .index('by_coordinates', ['galaxySectorId', 'systemX', 'systemY']),

  // Planets (within the 9x9 grid in each star system)
  systemPlanets: defineTable({
    starSystemId: v.id('starSystems'), // Parent star system
    planetTypeId: v.id('planetTypes'), // Reference to planet type
    planetX: v.number(), // 0-8 x coordinate within system (star is at 4,4)
    planetY: v.number() // 0-8 y coordinate within system
  })
    .index('by_system', ['starSystemId'])
    .index('by_coordinates', ['starSystemId', 'planetX', 'planetY'])
    .index('by_type', ['planetTypeId']),

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
    .index('stripeId', ['stripeId'])
});

export default schema;
