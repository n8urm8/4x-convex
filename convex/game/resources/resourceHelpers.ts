/**
 * Resource Management Utilities
 * Helper functions for working with the resource system
 */

import { QueryCtx, MutationCtx } from '../../_generated/server';
import { Id } from '../../_generated/dataModel';

/**
 * Get a resource definition by code
 */
export async function getResourceByCode(
  ctx: QueryCtx | MutationCtx,
  code: string
) {
  return await ctx.db
    .query('resourceDefinitions')
    .withIndex('by_code', (q) => q.eq('code', code))
    .unique();
}

/**
 * Get all visible resources ordered by display order
 */
export async function getVisibleResources(ctx: QueryCtx | MutationCtx) {
  const resources = await ctx.db
    .query('resourceDefinitions')
    .filter((q) => q.eq(q.field('isVisible'), true))
    .collect();
  
  return resources.sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get player's resource amount from playerResources table
 */
export async function getPlayerResourceAmount(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  resourceCode: string
): Promise<number> {
  const resourceDef = await getResourceByCode(ctx, resourceCode);
  if (!resourceDef) return 0;

  const playerResource = await ctx.db
    .query('playerResources')
    .withIndex('by_user_resource', (q) => 
      q.eq('userId', userId).eq('resourceDefinitionId', resourceDef._id)
    )
    .unique();

  return playerResource ? playerResource.amount : 0;
}

/**
 * Get all player resources as a map (code -> amount)
 */
export async function getPlayerResourcesMap(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};

  // Get all resource definitions
  const allResources = await ctx.db.query('resourceDefinitions').collect();

  for (const resourceDef of allResources) {
    const playerResource = await ctx.db
      .query('playerResources')
      .withIndex('by_user_resource', (q) => 
        q.eq('userId', userId).eq('resourceDefinitionId', resourceDef._id)
      )
      .unique();

    result[resourceDef.code] = playerResource ? playerResource.amount : 0;
  }

  return result;
}

/**
 * Update player resource amount
 */
export async function updatePlayerResource(
  ctx: MutationCtx,
  userId: Id<'users'>,
  resourceCode: string,
  amount: number
): Promise<void> {
  const resourceDef = await getResourceByCode(ctx, resourceCode);
  if (!resourceDef) {
    throw new Error(`Resource not found: ${resourceCode}`);
  }

  const playerResource = await ctx.db
    .query('playerResources')
    .withIndex('by_user_resource', (q) => 
      q.eq('userId', userId).eq('resourceDefinitionId', resourceDef._id)
    )
    .unique();

  if (playerResource) {
    // Update existing resource
    await ctx.db.patch(playerResource._id, {
      amount,
      lastUpdated: Date.now(),
    });
  } else {
    // Create new playerResource entry
    await ctx.db.insert('playerResources', {
      userId,
      resourceDefinitionId: resourceDef._id,
      amount,
      lastUpdated: Date.now(),
    });
  }
}

/**
 * Add/subtract from player resource
 */
export async function modifyPlayerResource(
  ctx: MutationCtx,
  userId: Id<'users'>,
  resourceCode: string,
  delta: number
): Promise<number> {
  const current = await getPlayerResourceAmount(ctx, userId, resourceCode);
  const newAmount = current + delta;
  
  if (newAmount < 0) {
    throw new Error(`Insufficient ${resourceCode}: has ${current}, needs ${Math.abs(delta)}`);
  }
  
  await updatePlayerResource(ctx, userId, resourceCode, newAmount);
  return newAmount;
}

/**
 * Check if player has enough resources for costs
 */
export async function hasEnoughResources(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  costs: Record<string, number>
): Promise<{ hasEnough: boolean; missing: Record<string, number> }> {
  const missing: Record<string, number> = {};
  
  for (const [resourceCode, required] of Object.entries(costs)) {
    const current = await getPlayerResourceAmount(ctx, userId, resourceCode);
    if (current < required) {
      missing[resourceCode] = required - current;
    }
  }
  
  return {
    hasEnough: Object.keys(missing).length === 0,
    missing,
  };
}

/**
 * Deduct resources from player (atomic operation)
 */
export async function deductResources(
  ctx: MutationCtx,
  userId: Id<'users'>,
  costs: Record<string, number>
): Promise<void> {
  // First check if player has enough
  const check = await hasEnoughResources(ctx, userId, costs);
  if (!check.hasEnough) {
    const missingList = Object.entries(check.missing)
      .map(([code, amount]) => `${code}: ${amount}`)
      .join(', ');
    throw new Error(`Insufficient resources. Missing: ${missingList}`);
  }
  
  // Deduct all resources
  for (const [resourceCode, amount] of Object.entries(costs)) {
    await modifyPlayerResource(ctx, userId, resourceCode, -amount);
  }
}

/**
 * Convert legacy resource costs to new format
 * Used for backward compatibility with existing cost structures
 */
export function convertLegacyCosts(costs: {
  nova?: number;
  minerals?: number;
  volatiles?: number;
}): Record<string, number> {
  const result: Record<string, number> = {};
  
  if (costs.nova) result.nova = costs.nova;
  if (costs.minerals) result.mineral = costs.minerals;
  if (costs.volatiles) result.volatile = costs.volatiles;
  
  return result;
}

/**
 * Load costs from resourceCosts table and convert to map
 */
export async function loadResourceCosts(
  ctx: QueryCtx | MutationCtx,
  ownerType: string,
  ownerCode: string
): Promise<Record<string, number>> {
  const costRows = await ctx.db
    .query('resourceCosts')
    .withIndex('by_owner', (q) => 
      q.eq('ownerType', ownerType).eq('ownerCode', ownerCode)
    )
    .collect();
  
  const costs: Record<string, number> = {};
  for (const row of costRows) {
    costs[row.resource] = row.amount;
  }
  
  return costs;
}
