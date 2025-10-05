import { v } from 'convex/values';
import { internalMutation, mutation } from '../../_generated/server';
import { internal } from '../../_generated/api';
import { Doc, Id } from '../../_generated/dataModel';
import { getAdminUser, getAuthedUser } from '../../utils';
import {
  researchDefinitions,
  researchDefinitionSchema
} from './research.schema';

// --- Public Admin Mutations for Research Definitions ---

export const createResearchDefinition = mutation({
  args: researchDefinitionSchema,
  handler: async (ctx, args): Promise<Id<'researchDefinitions'>> => {
    await getAdminUser(ctx);
    return await ctx.runMutation(
      internal.game.research.researchMutations.adminCreateResearchDefinition,
      args
    );
  }
});

export const updateResearchDefinition = mutation({
  args: {
    id: v.id('researchDefinitions'),
    updates: v.object(
      Object.fromEntries(
        Object.entries(researchDefinitionSchema).map(([key, val]) => [
          key,
          v.optional(val)
        ])
      )
    )
  },
  handler: async (ctx, args): Promise<Doc<'researchDefinitions'> | null> => {
    await getAdminUser(ctx);
    return await ctx.runMutation(
      internal.game.research.researchMutations.adminUpdateResearchDefinition,
      args
    );
  }
});

export const deleteResearchDefinition = mutation({
  args: { id: v.id('researchDefinitions') },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; deletedId: Id<'researchDefinitions'> }> => {
    await getAdminUser(ctx);
    return await ctx.runMutation(
      internal.game.research.researchMutations.adminDeleteResearchDefinition,
      args
    );
  }
});

// --- Internal Admin CRUD for Research Definitions ---

export const adminCreateResearchDefinition = internalMutation({
  args: researchDefinitionSchema, // Use the full validator for creation args
  handler: async (ctx, args) => {
    // Admin check is done by the public wrapper

    const existing = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique();

    if (existing) {
      throw new Error(
        `Research definition with name '${args.name}' already exists.`
      );
    }
    return await ctx.db.insert('researchDefinitions', args);
  }
});

export const adminUpdateResearchDefinition = internalMutation({
  args: {
    id: v.id('researchDefinitions'),
    updates: v.object(
      Object.fromEntries(
        Object.entries(researchDefinitions.validator.fields).map(
          ([key, val]) => [key, v.optional(val)]
        )
      )
    )
  },
  handler: async (ctx, { id, updates }) => {
    // Admin check is done by the public wrapper

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Research definition with id '${id}' not found.`);
    }

    // Prevent changing the name if it's part of updates and already exists elsewhere
    if (
      updates.name &&
      typeof updates.name === 'string' &&
      updates.name !== existing.name
    ) {
      const conflicting = await ctx.db
        .query('researchDefinitions')
        .withIndex('by_name', (q) => q.eq('name', updates.name as string))
        .unique();
      if (conflicting && conflicting._id !== id) {
        throw new Error(
          `Another research definition with name '${updates.name}' already exists.`
        );
      }
    }

    await ctx.db.patch(id, updates as Partial<Doc<'researchDefinitions'>>);
    return await ctx.db.get(id);
  }
});

export const adminDeleteResearchDefinition = internalMutation({
  args: { id: v.id('researchDefinitions') },
  handler: async (ctx, { id }) => {
    // Admin check is done by the public wrapper

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Research definition with id '${id}' not found.`);
    }

    // TODO: Consider implications of deleting a research definition
    // e.g., what happens to structures or other game elements that require it?

    await ctx.db.delete(id);
    return { success: true, deletedId: id };
  }
});

export const seedResearchDefinitions = internalMutation({
  handler: async (ctx) => {
    const researchDefinitionsToSeed = [
      {
        name: 'Basic Propulsion',
        category: 'Ships' as const,
        tier: 1,
        description: 'Fundamental principles of sublight travel.',
        primaryEffect: 'Unlocks basic ship engines.',
        unlocks: ['ship_engine_1']
      },
      {
        name: 'Spacecraft Design',
        category: 'Ships' as const,
        tier: 1,
        description: 'Enables construction of basic shipyards.',
        primaryEffect: 'Unlocks Shipyard structure.',
        unlocks: ['shipyard']
      },
      {
        name: 'Basic Construction',
        category: 'Structures' as const,
        tier: 1,
        description: 'Enables construction of basic structures.',
        primaryEffect: 'Unlocks Construction Yard.',
        unlocks: ['construction_yard']
      }
    ];

    let seededCount = 0;
    for (const def of researchDefinitionsToSeed) {
      const existing = await ctx.db
        .query('researchDefinitions')
        .withIndex('by_name', (q) => q.eq('name', def.name))
        .unique();

      if (!existing) {
        await ctx.db.insert('researchDefinitions', def);
        seededCount++;
      }
    }
    return `Seeded ${seededCount} research definitions.`;
  }
});

export const startResearch = mutation({
  args: {
    researchId: v.id('researchDefinitions')
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    if (user.researchingId) {
      throw new Error('You are already researching a technology.');
    }

    const researchDefinition = await ctx.db.get(args.researchId);
    if (!researchDefinition) {
      throw new Error('Research definition not found.');
    }

    const alreadyResearched = await ctx.db
      .query('playerTechnologies')
      .withIndex('by_user_research', (q) =>
        q.eq('userId', user._id).eq('researchDefinitionId', args.researchId)
      )
      .first();

    if (alreadyResearched) {
      throw new Error('You have already researched this technology.');
    }

    // Check tier requirements: For tier > 1, all previous tier techs in the same category must be researched
    if (researchDefinition.tier > 1) {
      const previousTier = researchDefinition.tier - 1;
      
      // Get all technologies from the previous tier in the same category
      const previousTierTechs = await ctx.db
        .query('researchDefinitions')
        .withIndex('by_tier', (q) => q.eq('tier', previousTier))
        .collect();
      
      const previousTierTechsInCategory = previousTierTechs.filter(
        (tech) => tech.category === researchDefinition.category
      );

      if (previousTierTechsInCategory.length > 0) {
        // Get all technologies researched by the player
        const playerResearched = await ctx.db
          .query('playerTechnologies')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .collect();
        
        const playerResearchedIds = new Set(
          playerResearched.map((tech) => tech.researchDefinitionId)
        );

        // Check if all previous tier techs in the same category are researched
        const unresearchedPreviousTierTechs = previousTierTechsInCategory.filter(
          (tech) => !playerResearchedIds.has(tech._id)
        );

        if (unresearchedPreviousTierTechs.length > 0) {
          const techNames = unresearchedPreviousTierTechs.map((tech) => tech.name).join(', ');
          throw new Error(
            `You must complete all Tier ${previousTier} ${researchDefinition.category} technologies first. Missing: ${techNames}`
          );
        }
      }
    }

    // Check for costs and prerequisites
    const novaCost = researchDefinition.novaCost ?? 0;
    const mineralCost = researchDefinition.mineralCost ?? 0;
    const volatileCost = researchDefinition.volatileCost ?? 0;

    if (
      (user.nova ?? 0) < novaCost ||
      (user.minerals ?? 0) < mineralCost ||
      (user.volatiles ?? 0) < volatileCost
    ) {
      throw new Error('Insufficient resources to start research.');
    }

    if (researchDefinition.prerequisites) {
      const playerResearched = await ctx.db
        .query('playerTechnologies')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
      const playerResearchedIds = new Set(
        playerResearched.map((tech) => tech.researchDefinitionId)
      );
      for (const prereqId of researchDefinition.prerequisites) {
        if (!playerResearchedIds.has(prereqId)) {
          throw new Error('Prerequisite research not completed.');
        }
      }
    }

    const researchTime = 60 * 5; // 5 minutes for now
    const finishesAt = Date.now() + researchTime * 1000;

    await ctx.db.patch(user._id, {
      researchingId: args.researchId,
      researchFinishesAt: finishesAt,
      nova: user.nova ?? 0 - novaCost,
      minerals: user.minerals ?? 0 - mineralCost,
      volatiles: user.volatiles ?? 0 - volatileCost
    });

    return { success: true, finishesAt };
  }
});

export const completeResearch = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);

    if (!user.researchingId || !user.researchFinishesAt) {
      throw new Error('You are not currently researching anything.');
    }

    if (Date.now() < user.researchFinishesAt) {
      throw new Error('Research is not yet complete.');
    }

    await ctx.db.insert('playerTechnologies', {
      userId: user._id,
      researchDefinitionId: user.researchingId,
      researchedAt: Date.now()
    });

    await ctx.db.patch(user._id, {
      researchingId: undefined,
      researchFinishesAt: undefined
    });

    return { success: true };
  }
});

// Check if user's current research is complete and auto-complete it
export const checkCompletedResearch = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);

    if (!user.researchingId || !user.researchFinishesAt) {
      return { completed: false, message: 'No research in progress' };
    }

    if (Date.now() < user.researchFinishesAt) {
      const timeRemaining = user.researchFinishesAt - Date.now();
      return { completed: false, message: `Research completes in ${Math.ceil(timeRemaining / 1000)} seconds` };
    }

    // Research is complete, auto-complete it
    await ctx.db.insert('playerTechnologies', {
      userId: user._id,
      researchDefinitionId: user.researchingId,
      researchedAt: Date.now()
    });

    const researchDef = await ctx.db.get(user.researchingId);
    const researchName = researchDef?.name || 'Unknown Research';

    await ctx.db.patch(user._id, {
      researchingId: undefined,
      researchFinishesAt: undefined
    });

    console.log(`Auto-completed research: ${researchName} for user ${user._id}`);
    return { completed: true, message: `Research '${researchName}' completed!`, researchName };
  }
});
