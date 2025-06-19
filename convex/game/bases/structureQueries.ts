import { query } from '../../_generated/server';
import { getAdminUser } from '../../utils';

/**
 * Get all structure definitions.
 * For admin panel use.
 */
export const listStructureDefinitions = query({
  args: {},
  handler: async (ctx) => {
    await getAdminUser(ctx);
    return await ctx.db.query('structureDefinitions').collect();
  },
});

// Add other admin queries for structures if needed, e.g., getById, getByName
