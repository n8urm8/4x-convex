import { api, internal } from '@cvx/_generated/api';
import { internalAction, internalMutation } from '@cvx/_generated/server';
import { v } from 'convex/values';
import schema, {
  CURRENCIES,
  Currency,
  Interval,
  INTERVALS,
  PlanKey,
  PLANS
} from '@cvx/schema';
import { stripe } from '@cvx/stripe';
import { asyncMap } from 'convex-helpers';
import { ERRORS } from '~/errors'; // v is now imported above with Doc
import { planetTypesSeedData } from './seed/planetTypesSeed';
import { researchSeedData } from './seed/researchSeed';
import { resourceCostSeedData } from './seed/resourceCostSeed';
import { structuresSeedData } from './seed/structuresSeed.reorganized';
import { resourceDefinitionsSeedData } from './seed/resourceDefinitionsSeed';
// ResearchCategory import removed as ResearchDefinitionDoc is removed

const seedProducts = [
  {
    key: PLANS.FREE,
    name: 'Free',
    description: 'Start with the basics, upgrade anytime.',
    prices: {
      [INTERVALS.MONTH]: {
        [CURRENCIES.USD]: 0,
        [CURRENCIES.EUR]: 0
      },
      [INTERVALS.YEAR]: {
        [CURRENCIES.USD]: 0,
        [CURRENCIES.EUR]: 0
      }
    }
  },
  {
    key: PLANS.PRO,
    name: 'Pro',
    description: 'Access to all features and unlimited projects.',
    prices: {
      [INTERVALS.MONTH]: {
        [CURRENCIES.USD]: 1990,
        [CURRENCIES.EUR]: 1990
      },
      [INTERVALS.YEAR]: {
        [CURRENCIES.USD]: 19990,
        [CURRENCIES.EUR]: 19990
      }
    }
  }
];

export const insertSeedPlan = internalMutation({
  args: schema.tables.plans.validator,
  handler: async (ctx, args) => {
    await ctx.db.insert('plans', {
      stripeId: args.stripeId,
      key: args.key,
      name: args.name,
      description: args.description,
      prices: args.prices
    });
  }
});

// Seed Planet types
export const insertPlanetType = internalMutation({
  args: schema.tables.planetTypes.validator,
  handler: async (ctx, args) => {
    return await ctx.db.insert('planetTypes', {
      name: args.name,
      category: args.category,
      habitable: args.habitable,
      space: args.space,
      energy: args.energy,
      minerals: args.minerals,
      volatiles: args.volatiles,
      description: args.description,
      imageUrl: args.imageUrl
    });
  }
});

// Seed Structures
export const insertStructure = internalMutation({
  args: schema.tables.structureDefinitions.validator,
  handler: async (ctx, args) => {
    return await ctx.db.insert('structureDefinitions', args);
  }
});

// Seed Research Definitions
export const insertResearchDefinition = internalMutation({
  args: schema.tables.researchDefinitions.validator,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique();

    if (existing) {
      console.log(`🔬 Research '${args.name}' already exists. Skipping.`);
      return existing._id;
    }
    console.log(`🔬 Seeding research: ${args.name}`);
    return await ctx.db.insert('researchDefinitions', args);
  }
});

// Seed resource costs for technologies (idempotent)
export const seedResourceCosts = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (!resourceCostSeedData.length) return;
    const firstCode = researchSeedData[0]?.code;
    if (firstCode) {
      const existing = await ctx.db
        .query('resourceCosts')
        .withIndex('by_owner', (q) =>
          q.eq('ownerType', 'technology').eq('ownerCode', firstCode)
        )
        .first();
      if (existing) {
        console.log('💰 Skipping Resource Cost seeding - already present.');
        return;
      }
    }
    console.log('💰 Seeding Resource Costs for technologies...');
    for (const cost of resourceCostSeedData) {
      await ctx.db.insert('resourceCosts', cost);
    }
    console.info(`💰 ${resourceCostSeedData.length} Resource Cost rows seeded.`);
  }
});

export const seedResourceDefinitions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingResourceDefinitions = await ctx.db
      .query('resourceDefinitions')
      .collect();

    if (existingResourceDefinitions.length > 0) {
      console.log(
        '🔋 Skipping Resource Definitions seeding - definitions already exist.'
      );
      return;
    }

    console.log('🔋 Seeding Resource Definitions...');
    for (const resource of resourceDefinitionsSeedData) {
      await ctx.db.insert('resourceDefinitions', resource);
    }
    console.info(
      `🔋 ${resourceDefinitionsSeedData.length} Resource Definitions have been successfully seeded.`
    );
  }
});

export default internalAction({
  args: {},
  returns: v.null(),
  /**
   * Planet Types.
   */
  handler: async (ctx) => {
    const existingPlanetTypes = await ctx.runQuery(
      api.game.map.galaxyQueries.getAllPlanetTypes,
      {}
    );

    if (existingPlanetTypes && existingPlanetTypes.length > 0) {
      console.log('🏃‍♂️ Skipping Planet Types seeding - types already exist.');
    } else {
      console.log('🪐 Seeding Planet Types...');

      // Seed all planet types
      await asyncMap(planetTypesSeedData, async (planetType) => {
        await ctx.runMutation(internal.init.insertPlanetType, planetType);
      });

      console.info(
        `🪐 ${planetTypesSeedData.length} Planet Types have been successfully seeded.`
      );
    }

    /**
     * Resource Definitions
     */
    await ctx.runMutation(internal.init.seedResourceDefinitions, {});

    // (Resource costs now seeded after research definitions to ensure codes exist.)

    /**
     * Structures.
     */
    const existingStructures = await ctx.runQuery(
      internal.game.bases.baseQueries.getAllStructureDefinitionsInternal, // Path to be created/moved
      {}
    );

    if (existingStructures && existingStructures.length > 0) {
      console.log(
        '🏗️ Skipping Structure Definitions seeding - definitions already exist.'
      );
    } else {
      console.log('🛠️ Seeding Structure Definitions...');

      await asyncMap(structuresSeedData, async (structure) => {
        await ctx.runMutation(internal.init.insertStructure, structure);
      });

      console.info(
        `🏗️ ${structuresSeedData.length} Structure Definitions have been successfully seeded.`
      );
    }

    /**
     * Research Definitions.
     */
    // TODO: Create internal.game.research.researchQueries.getAllResearchDefinitions
    // For now, we assume it will exist. If seeding runs before it's created, this might cause an error
    // or simply always re-seed if the query path is invalid and returns nothing.
    let existingResearchDefinitions: unknown[] = [];
    try {
      existingResearchDefinitions = await ctx.runQuery(
        api.game.research.researchQueries.listResearchDefinitions,
        {}
      );
    } catch (e) {
      console.warn(
        "Warning: Couldn't query existing research definitions. This might be due to the query not existing yet. Proceeding with seeding check, assuming no definitions exist.",
        e
      );
      // existingResearchDefinitions is already initialized to [] so no change needed here on error
    }

  // Seed resource costs after research definitions to ensure referenced codes exist.
  await ctx.runMutation(internal.init.seedResourceCosts, {});

    if (existingResearchDefinitions && existingResearchDefinitions.length > 0) {
      console.log(
        '🔬 Skipping Research Definitions seeding - definitions already exist.'
      );
    } else {
      console.log('🧪 Seeding Research Definitions...');

      await asyncMap(researchSeedData, async (research) => {
        await ctx.runMutation(internal.init.insertResearchDefinition, research); // Using 'as any' temporarily if types don't align perfectly due to Partial in seed type
      });

      console.info(
        `🧪 ${researchSeedData.length} Research Definitions have been successfully seeded.`
      );
    }

    /**
     * Stripe Products.
     */
    const products = await stripe.products.list({
      limit: 1
    });
    if (products?.data?.length) {
      console.info('🏃‍♂️ Skipping Stripe products creation and seeding.');
      return;
    }

    const seededProducts = await asyncMap(seedProducts, async (product) => {
      // Format prices to match Stripe's API.
      const pricesByInterval = Object.entries(product.prices).flatMap(
        ([interval, price]) => {
          return Object.entries(price).map(([currency, amount]) => ({
            interval,
            currency,
            amount
          }));
        }
      );

      // Create Stripe product.
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description
      });

      // Create Stripe price for the current product.
      const stripePrices = await Promise.all(
        pricesByInterval.map((price) => {
          return stripe.prices.create({
            product: stripeProduct.id,
            currency: price.currency ?? 'usd',
            unit_amount: price.amount ?? 0,
            tax_behavior: 'inclusive',
            recurring: {
              interval: (price.interval as Interval) ?? INTERVALS.MONTH
            }
          });
        })
      );

      const getPrice = (currency: Currency, interval: Interval) => {
        const price = stripePrices.find(
          (price) =>
            price.currency === currency &&
            price.recurring?.interval === interval
        );
        if (!price) {
          throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG);
        }
        return { stripeId: price.id, amount: price.unit_amount || 0 };
      };

      await ctx.runMutation(internal.init.insertSeedPlan, {
        stripeId: stripeProduct.id,
        key: product.key as PlanKey,
        name: product.name,
        description: product.description,
        prices: {
          [INTERVALS.MONTH]: {
            [CURRENCIES.USD]: getPrice(CURRENCIES.USD, INTERVALS.MONTH),
            [CURRENCIES.EUR]: getPrice(CURRENCIES.EUR, INTERVALS.MONTH)
          },
          [INTERVALS.YEAR]: {
            [CURRENCIES.USD]: getPrice(CURRENCIES.USD, INTERVALS.YEAR),
            [CURRENCIES.EUR]: getPrice(CURRENCIES.EUR, INTERVALS.YEAR)
          }
        }
      });

      return {
        key: product.key,
        product: stripeProduct.id,
        prices: stripePrices.map((price) => price.id)
      };
    });
    console.info(`📦 Stripe Products has been successfully created.`);

    // Configure Customer Portal.
    await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Organization Name - Customer Portal'
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ['address', 'shipping', 'tax_id', 'email']
        },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
          proration_behavior: 'always_invoice',
          products: seededProducts
            .filter(({ key }) => key !== PLANS.FREE)
            .map(({ product, prices }) => ({ product, prices }))
        }
      }
    });

    console.info(`👒 Stripe Customer Portal has been successfully configured.`);
    console.info(
      '🎉 Visit: https://dashboard.stripe.com/test/products to see your products.'
    );

    return null;
  }
});
