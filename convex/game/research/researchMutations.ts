import { v } from 'convex/values';
import { internalMutation } from '../../_generated/server';
import { Doc } from '../../_generated/dataModel';
import { researchDefinitions } from './research.schema';

// --- Admin CRUD for Research Definitions ---

export const adminCreateResearchDefinition = internalMutation({
  args: researchDefinitions.validator, // Use the full validator for creation args
  handler: async (ctx, args) => {
    // TODO: Add admin authentication check here
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity || !isAdmin(identity.subject)) { // isAdmin would be a helper
    //   throw new Error('User is not authorized to create research definitions.');
    // }

    const existing = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique();

    if (existing) {
      throw new Error(`Research definition with name '${args.name}' already exists.`);
    }
    return await ctx.db.insert('researchDefinitions', args);
  },
});

export const adminUpdateResearchDefinition = internalMutation({
  args: {
    id: v.id('researchDefinitions'),
    updates: v.object(
      // Create an object where each field from researchDefinitions.validator.fields is optional.
      // This allows for partial updates.
      Object.fromEntries(
        Object.entries(researchDefinitions.validator.fields).map(([key, val]) => [
          key, v.optional(val)
        ])
      ) as Partial<typeof researchDefinitions.validator.fields>
      // The 'as Partial<...>' provides a more specific type for the resulting validator object.
      // Convex's v.object typing is inherently somewhat dynamic here.
      // In the handler, args.updates will be correctly typed as Partial<Infer<typeof researchDefinitions.validator>>.
    ),
  },
  handler: async (ctx, { id, updates }) => {
    // TODO: Add admin authentication check here

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Research definition with id '${id}' not found.`);
    }

    // Prevent changing the name if it's part of updates and already exists elsewhere
    if (updates.name && typeof updates.name === 'string' && updates.name !== existing.name) {
      const conflicting = await ctx.db
        .query('researchDefinitions')
        .withIndex('by_name', (q) => q.eq('name', updates.name as string))
        .unique();
      if (conflicting && conflicting._id !== id) {
        throw new Error(`Another research definition with name '${updates.name}' already exists.`);
      }
    }

    await ctx.db.patch(id, updates as Partial<Doc<'researchDefinitions'>>);
    return await ctx.db.get(id);
  },
});

export const adminDeleteResearchDefinition = internalMutation({
  args: { id: v.id('researchDefinitions') },
  handler: async (ctx, { id }) => {
    // TODO: Add admin authentication check here

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Research definition with id '${id}' not found.`);
    }

    // TODO: Consider implications of deleting a research definition
    // e.g., what happens to structures or other game elements that require it?

    await ctx.db.delete(id);
    return { success: true, deletedId: id };
  },
});
