import { v } from 'convex/values';
import type { MutationCtx } from '../../_generated/server';
import { internalMutation, mutation } from '../../_generated/server';
import { internal } from '../../_generated/api';
import { Doc, Id } from '../../_generated/dataModel';
import { getAdminUser, getAuthedUser } from '../../utils';
import { assertDevGameTools } from '../../devTools';
import {
  RESEARCH_DURATION_MS,
  researchDefinitions,
  researchDefinitionSchema,
} from './research.schema';
import { 
  hasEnoughResources, 
  deductResources, 
  loadResourceCosts 
} from '../resources/resourceHelpers';

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

    const slug = (name: string) =>
      name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

    let seededCount = 0;
    for (const def of researchDefinitionsToSeed) {
      const existing = await ctx.db
        .query('researchDefinitions')
        .withIndex('by_name', (q) => q.eq('name', def.name))
        .unique();

      if (!existing) {
        await ctx.db.insert('researchDefinitions', {
          code: slug(def.name),
            ...def
        });
        seededCount++;
      }
    }
    return `Seeded ${seededCount} research definitions.`;
  }
});

async function validateResearchEligible(
  ctx: MutationCtx,
  userId: Id<'users'>,
  researchDefinitionId: Id<'researchDefinitions'>
): Promise<Doc<'researchDefinitions'>> {
  const researchDefinition = await ctx.db.get(researchDefinitionId);
  if (!researchDefinition) {
    throw new Error('Research definition not found.');
  }

  const alreadyResearched = await ctx.db
    .query('playerTechnologies')
    .withIndex('by_user_research', (q) =>
      q.eq('userId', userId).eq('researchDefinitionId', researchDefinitionId)
    )
    .first();

  if (alreadyResearched) {
    throw new Error('You have already researched this technology.');
  }

  if (researchDefinition.tier > 1) {
    const previousTier = researchDefinition.tier - 1;
    const previousTierTechs = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_tier', (q) => q.eq('tier', previousTier))
      .collect();
    const previousTierTechsInCategory = previousTierTechs.filter(
      (tech) => tech.category === researchDefinition.category
    );
    if (previousTierTechsInCategory.length > 0) {
      const playerResearched = await ctx.db
        .query('playerTechnologies')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect();
      const playerResearchedIds = new Set(
        playerResearched.map((tech) => tech.researchDefinitionId)
      );
      const unresearchedPreviousTierTechs = previousTierTechsInCategory.filter(
        (tech) => !playerResearchedIds.has(tech._id)
      );
      if (unresearchedPreviousTierTechs.length > 0) {
        const techNames = unresearchedPreviousTierTechs
          .map((tech) => tech.name)
          .join(', ');
        throw new Error(
          `You must complete all Tier ${previousTier} ${researchDefinition.category} technologies first. Missing: ${techNames}`
        );
      }
    }
  }

  if (researchDefinition.prerequisites) {
    const playerResearched = await ctx.db
      .query('playerTechnologies')
      .withIndex('by_user', (q) => q.eq('userId', userId))
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

  return researchDefinition;
}

async function beginResearchSession(
  ctx: MutationCtx,
  userId: Id<'users'>,
  researchDefinitionId: Id<'researchDefinitions'>
): Promise<{ finishesAt: number }> {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error('User not found');
  }
  if (user.researchingId) {
    throw new Error('You are already researching a technology.');
  }

  const researchDefinition = await validateResearchEligible(
    ctx,
    userId,
    researchDefinitionId
  );

  const costs = await loadResourceCosts(ctx, 'technology', researchDefinition.code);
  const check = await hasEnoughResources(ctx, userId, costs);
  if (!check.hasEnough) {
    const missingList = Object.entries(check.missing)
      .map(([code, amount]) => `${code}: ${amount}`)
      .join(', ');
    throw new Error(`Insufficient resources. Missing: ${missingList}`);
  }

  await deductResources(ctx, userId, costs);

  const finishesAt = Date.now() + RESEARCH_DURATION_MS;
  await ctx.db.patch(userId, {
    researchingId: researchDefinitionId,
    researchFinishesAt: finishesAt,
  });

  return { finishesAt };
}

async function assertCanEnqueueResearch(
  ctx: MutationCtx,
  user: Doc<'users'>,
  researchDefinitionId: Id<'researchDefinitions'>
): Promise<void> {
  const researchDefinition = await ctx.db.get(researchDefinitionId);
  if (!researchDefinition) {
    throw new Error('Research definition not found.');
  }

  const alreadyResearched = await ctx.db
    .query('playerTechnologies')
    .withIndex('by_user_research', (q) =>
      q.eq('userId', user._id).eq('researchDefinitionId', researchDefinitionId)
    )
    .first();

  if (alreadyResearched) {
    throw new Error('You have already researched this technology.');
  }

  if (user.researchingId === researchDefinitionId) {
    throw new Error('This technology is already being researched.');
  }

  const queued = await ctx.db
    .query('playerResearchQueue')
    .withIndex('by_user_queued', (q) => q.eq('userId', user._id))
    .collect();

  if (queued.some((r) => r.researchDefinitionId === researchDefinitionId)) {
    throw new Error('This technology is already in your research queue.');
  }
}

async function processNextResearchQueue(
  ctx: MutationCtx,
  userId: Id<'users'>
): Promise<void> {
  while (true) {
    const user = await ctx.db.get(userId);
    if (!user || user.researchingId) {
      return;
    }

    const next = await ctx.db
      .query('playerResearchQueue')
      .withIndex('by_user_queued', (q) => q.eq('userId', userId))
      .order('asc')
      .first();

    if (!next) {
      return;
    }

    await ctx.db.delete(next._id);

    try {
      await beginResearchSession(ctx, userId, next.researchDefinitionId);
      return;
    } catch {
      // Drop failed head and try the next entry (same pattern as structure queue).
    }
  }
}

export const startResearch = mutation({
  args: {
    researchId: v.id('researchDefinitions'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    if (user.researchingId) {
      await assertCanEnqueueResearch(ctx, user, args.researchId);
      await ctx.db.insert('playerResearchQueue', {
        userId: user._id,
        researchDefinitionId: args.researchId,
        queuedAt: Date.now(),
      });
      return { success: true as const, queued: true as const };
    }

    const { finishesAt } = await beginResearchSession(
      ctx,
      user._id,
      args.researchId
    );
    return {
      success: true as const,
      finishesAt,
      queued: false as const,
    };
  },
});

export const removeFromResearchQueue = mutation({
  args: {
    queueEntryId: v.id('playerResearchQueue'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    const row = await ctx.db.get(args.queueEntryId);
    if (!row) {
      throw new Error('Queue entry not found');
    }
    if (row.userId !== user._id) {
      throw new Error('Not authorized');
    }
    await ctx.db.delete(args.queueEntryId);
    return { success: true as const };
  },
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

    await processNextResearchQueue(ctx, user._id);

    return { success: true };
  }
});

/** Finishes the active research immediately, ignoring the scheduled finish time. */
export const instantCompleteResearch = mutation({
  args: {},
  handler: async (ctx) => {
    assertDevGameTools();
    const user = await getAuthedUser(ctx);

    if (!user.researchingId) {
      throw new Error('You are not currently researching anything.');
    }

    await ctx.db.insert('playerTechnologies', {
      userId: user._id,
      researchDefinitionId: user.researchingId,
      researchedAt: Date.now(),
    });

    await ctx.db.patch(user._id, {
      researchingId: undefined,
      researchFinishesAt: undefined,
    });

    await processNextResearchQueue(ctx, user._id);

    return { success: true };
  },
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

    await processNextResearchQueue(ctx, user._id);

    console.log(`Auto-completed research: ${researchName} for user ${user._id}`);
    return { completed: true, message: `Research '${researchName}' completed!`, researchName };
  }
});
