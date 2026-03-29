import { v } from 'convex/values';
import { getAuthedUser } from '@cvx/utils';
import { internalMutation, mutation, query } from '../../_generated/server';
import { shipBlueprintsData } from './shipBlueprints';
import { SHIP_BUILD_CYCLE_MS } from './ships.schema';
import { 
  getPlayerResourceAmount,
  modifyPlayerResource 
} from '../resources/resourceHelpers';

// Helper function to calculate fleet stats from ships
async function calculateFleetStats(ctx: any, fleetId: any) {
  const ships = await ctx.db
    .query('playerShips')
    .withIndex('byFleetId', (q: any) => q.eq('fleetId', fleetId))
    .collect();

  if (ships.length === 0) {
    return {
      totalDamage: 0,
      totalDefense: 0,
      totalShielding: 0,
      totalHealth: 0,
      maxHealth: 0,
      currentCapacity: 0,
      fleetSpeed: 0
    };
  }

  let totalDamage = 0;
  let totalDefense = 0;
  let totalShielding = 0;
  let totalHealth = 0;
  let maxHealth = 0;
  let currentCapacity = 0;
  let minSpeed = Infinity;

  // Get ship blueprints to calculate capacity and speed
  for (const ship of ships) {
    totalDamage += ship.damage;
    totalDefense += ship.defense;
    totalShielding += ship.shielding;
    totalHealth += ship.currentHealth;
    maxHealth += ship.defense; // Max health = defense

    // Get blueprint for capacity and speed
    const blueprint = await ctx.db
      .query('shipBlueprints')
      .withIndex('byId', (q: any) => q.eq('id', ship.blueprintId))
      .unique();

    if (blueprint) {
      currentCapacity += blueprint.fleetCapacityCost;
      if (blueprint.movementSpeed && blueprint.movementSpeed < minSpeed) {
        minSpeed = blueprint.movementSpeed;
      }
    }
  }

  return {
    totalDamage,
    totalDefense,
    totalShielding,
    totalHealth,
    maxHealth,
    currentCapacity,
    fleetSpeed: minSpeed === Infinity ? 0 : minSpeed
  };
}

// Helper function to get next fleet number
async function getNextFleetNumber(ctx: any, userId: any) {
  const existingFleets = await ctx.db
    .query('fleets')
    .withIndex('byUserId', (q: any) => q.eq('userId', userId))
    .collect();

  const maxFleetNumber = existingFleets.reduce((max: number, fleet: any) => {
    return Math.max(max, fleet.fleetNumber || 0);
  }, 0);

  return maxFleetNumber + 1;
}

// ======================================================
// =========== INTERNAL SEEDING FUNCTIONS ===============
// ======================================================

/** Inserts or patches all rows from shipBlueprints.ts (by blueprint id). Re-run after seed changes, e.g. `npx convex run internal.game.ships.shipActions.seedShipBlueprints`. */
export const seedShipBlueprints = internalMutation({
  handler: async (ctx) => {
    for (const blueprint of shipBlueprintsData) {
      const existing = await ctx.db
        .query('shipBlueprints')
        .withIndex('byId', (q) => q.eq('id', blueprint.id))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, blueprint);
      } else {
        await ctx.db.insert('shipBlueprints', blueprint);
      }
    }
    console.log('Ship blueprints seeded successfully.');
  }
});

// ======================================================
// =================== PUBLIC ACTIONS ===================
// ======================================================

export const buildShip = mutation({
  args: {
    shipBlueprintId: v.string(),
    baseId: v.id('playerBases'),
    quantity: v.number()
  },
  handler: async (ctx, { shipBlueprintId, baseId, quantity }) => {
    const user = await getAuthedUser(ctx);

    // 1. Get the ship blueprint
    const blueprint = await ctx.db
      .query('shipBlueprints')
      .withIndex('byId', (q) => q.eq('id', shipBlueprintId))
      .unique();

    if (!blueprint) {
      throw new Error('Ship blueprint not found.');
    }

    // 2. Check player resources
    const totalCost = blueprint.novaCost * quantity;

    const currentNova = await getPlayerResourceAmount(ctx, user._id, 'nova');
    if (currentNova < totalCost) {
      throw new Error('Insufficient nova to build ship(s).');
    }

    // 3. Check for required structure at the base
    const requiredStructureDef = await ctx.db
      .query('structureDefinitions')
      .withIndex('by_name', (q) => q.eq('name', blueprint.requiredStructure))
      .unique();

    if (!requiredStructureDef) {
      throw new Error(
        `Required structure definition '${blueprint.requiredStructure}' not found.`
      );
    }

    const hasStructure = await ctx.db
      .query('baseStructures')
      .withIndex('by_structure_type', (q) =>
        q.eq('baseId', baseId).eq('structureDefId', requiredStructureDef._id)
      )
      .first();

    if (!hasStructure) {
      throw new Error(
        `Required structure '${blueprint.requiredStructure}' not found at base '${baseId}'.`
      );
    }

    // 4. Check for required technology
    const requiredTechDef = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_name', (q) => q.eq('name', blueprint.requiredTechnology))
      .unique();

    if (!requiredTechDef) {
      throw new Error(
        `Required technology definition '${blueprint.requiredTechnology}' not found.`
      );
    }

    const hasTechnology = await ctx.db
      .query('playerTechnologies')
      .withIndex('by_user_research', (q) =>
        q
          .eq('userId', user._id)
          .eq('researchDefinitionId', requiredTechDef._id)
      )
      .first();

    if (!hasTechnology) {
      throw new Error(
        `Required technology '${blueprint.requiredTechnology}' not researched.`
      );
    }

    // 5. Check if there's already a ship being built at this base
    const existingBuild = await ctx.db
      .query('playerShipBuilding')
      .withIndex('by_base', (q) => q.eq('baseId', baseId))
      .first();

    // 6. Deduct resources
    await modifyPlayerResource(ctx, user._id, 'nova', -totalCost);

    if (existingBuild) {
      // Add to queue
      await ctx.db.insert('playerShipQueue', {
        userId: user._id,
        baseId: baseId,
        shipBlueprintId: blueprint.id,
        quantity: quantity,
        queuedAt: Date.now(),
      });
      return { success: true, queued: true, shipsQueued: quantity };
    } else {
      // Start building immediately
      const buildDurationMs = blueprint.buildTimeCycles * SHIP_BUILD_CYCLE_MS;
      const finishesAt = Date.now() + buildDurationMs;

      await ctx.db.insert('playerShipBuilding', {
        userId: user._id,
        baseId: baseId,
        shipBlueprintId: blueprint.id,
        quantity: quantity,
        startedAt: Date.now(),
        finishesAt: finishesAt,
      });

      return { success: true, queued: false, buildingStarted: true, finishesAt };
    }
  }
});

// ======================================================
// ============== SHIP BUILD COMPLETION =================
// ======================================================

/** Check and complete finished ship builds, start next in queue. */
export const checkCompletedShipBuilds = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find all completed builds
    const completedBuilds = await ctx.db
      .query('playerShipBuilding')
      .filter((q) => q.lte(q.field('finishesAt'), now))
      .collect();

    let completedCount = 0;

    for (const build of completedBuilds) {
      // Get the blueprint for ship creation
      const blueprint = await ctx.db
        .query('shipBlueprints')
        .withIndex('byId', (q) => q.eq('id', build.shipBlueprintId))
        .unique();

      if (!blueprint) {
        console.error(`Blueprint ${build.shipBlueprintId} not found for completed build`);
        await ctx.db.delete(build._id);
        continue;
      }

      // Find or create base fleet for this base
      let baseFleet = await ctx.db
        .query('fleets')
        .withIndex('byBase', (q: any) => q.eq('baseId', build.baseId))
        .filter((q: any) => q.eq(q.field('isBaseFleet'), true))
        .first();

      if (!baseFleet) {
        // Create a new base fleet
        const fleetNumber = await getNextFleetNumber(ctx, build.userId);
        const base = await ctx.db.get(build.baseId);
        if (!base) {
          console.error(`Base ${build.baseId} not found for completed build`);
          await ctx.db.delete(build._id);
          continue;
        }

        // Get the system for this base location
        const system = await ctx.db
          .query('sectorSystems')
          .withIndex('by_absolute_coordinates', (q: any) =>
            q
              .eq('galaxyNumber', base.galaxyNumber)
              .eq('sectorX', base.sectorX)
              .eq('sectorY', base.sectorY)
              .eq('systemX', base.systemX)
              .eq('systemY', base.systemY)
          )
          .first();

        if (!system) {
          console.error(`System not found for base location`);
          await ctx.db.delete(build._id);
          continue;
        }

        const baseFleetId = await ctx.db.insert('fleets', {
          userId: build.userId,
          name: `Fleet ${fleetNumber}`,
          fleetNumber,
          isBaseFleet: true,
          baseId: build.baseId,
          currentSystemId: system._id,
          currentGalaxyNumber: system.galaxyNumber,
          currentSectorX: system.sectorX,
          currentSectorY: system.sectorY,
          currentSystemX: system.systemX,
          currentSystemY: system.systemY,
          status: 'idle',
          totalDamage: 0,
          totalDefense: 0,
          totalShielding: 0,
          totalHealth: 0,
          maxHealth: 0,
          fleetSpeed: 0,
          currentCapacity: 0,
          maxCapacity: 100, // Base capacity
          createdAt: Date.now(),
          lastUpdated: Date.now()
        });

        baseFleet = await ctx.db.get(baseFleetId);
      }

      // Create the completed ships
      for (let i = 0; i < build.quantity; i++) {
        await ctx.db.insert('playerShips', {
          userId: build.userId,
          blueprintId: blueprint.id,
          baseId: build.baseId,
          fleetId: baseFleet!._id,
          damage: blueprint.damage,
          defense: blueprint.defense,
          shielding: blueprint.shielding,
          currentHealth: blueprint.defense // Start with full health
        });
      }

      // Recalculate base fleet stats
      if (baseFleet) {
        const stats = await calculateFleetStats(ctx, baseFleet._id);
        await ctx.db.patch(baseFleet._id, {
          ...stats,
          lastUpdated: Date.now()
        });
      }

      // Remove the completed build
      await ctx.db.delete(build._id);
      completedCount++;

      // Check if there's a queued build for this base
      const nextInQueue = await ctx.db
        .query('playerShipQueue')
        .withIndex('by_base_queued', (q) => q.eq('baseId', build.baseId))
        .order('asc')
        .first();

      if (nextInQueue) {
        // Get the blueprint for the next build
        const nextBlueprint = await ctx.db
          .query('shipBlueprints')
          .withIndex('byId', (q) => q.eq('id', nextInQueue.shipBlueprintId))
          .unique();

        if (nextBlueprint) {
          // Start the next build
          const buildDurationMs = nextBlueprint.buildTimeCycles * SHIP_BUILD_CYCLE_MS;
          const finishesAt = Date.now() + buildDurationMs;

          await ctx.db.insert('playerShipBuilding', {
            userId: nextInQueue.userId,
            baseId: nextInQueue.baseId,
            shipBlueprintId: nextInQueue.shipBlueprintId,
            quantity: nextInQueue.quantity,
            startedAt: Date.now(),
            finishesAt: finishesAt,
          });

          // Remove from queue
          await ctx.db.delete(nextInQueue._id);
        }
      }
    }

    return `Completed ${completedCount} ship builds.`;
  }
});

/** Remove a queued ship build. */
export const removeQueuedShipBuild = mutation({
  args: { queueEntryId: v.id('playerShipQueue') },
  handler: async (ctx, { queueEntryId }) => {
    const user = await getAuthedUser(ctx);
    
    const queueEntry = await ctx.db.get(queueEntryId);
    if (!queueEntry) {
      throw new Error('Queue entry not found.');
    }
    
    if (queueEntry.userId !== user._id) {
      throw new Error('You do not own this queue entry.');
    }
    
    // Get the blueprint to refund resources
    const blueprint = await ctx.db
      .query('shipBlueprints')
      .withIndex('byId', (q) => q.eq('id', queueEntry.shipBlueprintId))
      .unique();
    
    if (blueprint) {
      const refundAmount = blueprint.novaCost * queueEntry.quantity;
      await modifyPlayerResource(ctx, user._id, 'nova', refundAmount);
    }
    
    await ctx.db.delete(queueEntryId);
    
    return { success: true, refunded: blueprint ? blueprint.novaCost * queueEntry.quantity : 0 };
  }
});

// ======================================================
// ==================== PUBLIC QUERIES ==================
// ======================================================

export const getShipBlueprints = query({
  handler: async (ctx) => {
    return await ctx.db.query('shipBlueprints').collect();
  }
});

export const getPlayerShips = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('playerShips')
      .withIndex('byUserId', (q) => q.eq('userId', userId))
      .collect();
  }
});

// Get ship blueprints with build requirements for a specific base
export const getShipBlueprintsForBase = query({
  args: { baseId: v.id('playerBases') },
  handler: async (ctx, { baseId }) => {
    const user = await getAuthedUser(ctx);
    
    // Get all ship blueprints
    const blueprints = await ctx.db.query('shipBlueprints').collect();
    
    // Get the base to check ownership and available structures
    const base = await ctx.db.get(baseId);
    if (!base) {
      throw new Error('Base not found');
    }
    
    // Check if user owns the base
    if (base.userId !== user._id) {
      throw new Error('You do not own this base');
    }
    
    // Get base structures
    const baseStructures = await ctx.db
      .query('baseStructures')
      .withIndex('by_base', (q) => q.eq('baseId', baseId))
      .collect();
    
    // Get structure definitions for mapping
    const structureDefinitions = await ctx.db.query('structureDefinitions').collect();
    const structureDefsMap = new Map(structureDefinitions.map(def => [def.name, def]));
    const baseStructureDefsMap = new Map(baseStructures.map(bs => [bs.structureDefId, bs]));
    
    // Get player's researched technologies
    const playerTechnologies = await ctx.db
      .query('playerTechnologies')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();
    
    // Get research definitions for mapping
    const researchDefinitions = await ctx.db.query('researchDefinitions').collect();
    const researchDefsMap = new Map(researchDefinitions.map(def => [def.name, def]));
    const playerResearchedIds = new Set(playerTechnologies.map(pt => pt.researchDefinitionId));
    
    // Get ships at this base to count by blueprint
    const shipsAtThisBase = await ctx.db
      .query('playerShips')
      .withIndex('byBaseId', (q) => q.eq('baseId', baseId))
      .collect();
    
    // Filter by user ownership (ships should only belong to the base owner anyway)
    const userShipsAtBase = shipsAtThisBase.filter(ship => ship.userId === user._id);
    const shipCountsByBlueprint = new Map<string, number>();
    
    for (const ship of userShipsAtBase) {
      const currentCount = shipCountsByBlueprint.get(ship.blueprintId) || 0;
      shipCountsByBlueprint.set(ship.blueprintId, currentCount + 1);
    }
    
    // Combine blueprints with requirement checks
    const blueprintsWithRequirements = await Promise.all(blueprints.map(async blueprint => {
      // Check structure requirement
      const requiredStructureDef = structureDefsMap.get(blueprint.requiredStructure);
      const hasRequiredStructure = requiredStructureDef ? 
        baseStructureDefsMap.has(requiredStructureDef._id) : false;
      
      // Check technology requirement
      const requiredTechDef = researchDefsMap.get(blueprint.requiredTechnology);
      const hasRequiredTechnology = requiredTechDef ? 
        playerResearchedIds.has(requiredTechDef._id) : false;
      
      // Check resource requirements
      const currentNova = await getPlayerResourceAmount(ctx, user._id, 'nova');
      const hasEnoughNova = currentNova >= blueprint.novaCost;
      
      const canBuild = hasRequiredStructure && hasRequiredTechnology && hasEnoughNova;
      
      return {
        ...blueprint,
        requirements: {
          structure: {
            name: blueprint.requiredStructure,
            satisfied: hasRequiredStructure
          },
          technology: {
            name: blueprint.requiredTechnology,
            satisfied: hasRequiredTechnology
          },
          resources: {
            nova: blueprint.novaCost,
            satisfied: hasEnoughNova
          }
        },
        canBuild,
        countAtBase: shipCountsByBlueprint.get(blueprint.id) || 0
      };
    }));
    
    // Get all player resources
    const nova = await getPlayerResourceAmount(ctx, user._id, 'nova');
    const minerals = await getPlayerResourceAmount(ctx, user._id, 'mineral');
    const volatiles = await getPlayerResourceAmount(ctx, user._id, 'volatile');
    
    // Get ship build pipeline for this base
    const activeBuild = await ctx.db
      .query('playerShipBuilding')
      .withIndex('by_base', (q) => q.eq('baseId', baseId))
      .first();

    const queuedBuilds = await ctx.db
      .query('playerShipQueue')
      .withIndex('by_base_queued', (q) => q.eq('baseId', baseId))
      .order('asc')
      .collect();

    const shipBuildPipeline = [];

    // Add active build if exists
    if (activeBuild) {
      const activeBlueprint = await ctx.db
        .query('shipBlueprints')
        .withIndex('byId', (q) => q.eq('id', activeBuild.shipBlueprintId))
        .unique();

      if (activeBlueprint) {
        shipBuildPipeline.push({
          entryType: 'active' as const,
          shipName: activeBlueprint.name,
          quantity: activeBuild.quantity,
          finishesAt: activeBuild.finishesAt,
          durationMs: activeBuild.finishesAt - activeBuild.startedAt,
        });
      }
    }

    // Add queued builds
    for (const queuedBuild of queuedBuilds) {
      const queuedBlueprint = await ctx.db
        .query('shipBlueprints')
        .withIndex('byId', (q) => q.eq('id', queuedBuild.shipBlueprintId))
        .unique();

      if (queuedBlueprint) {
        shipBuildPipeline.push({
          entryType: 'queued' as const,
          shipName: queuedBlueprint.name,
          quantity: queuedBuild.quantity,
          durationMs: queuedBlueprint.buildTimeCycles * SHIP_BUILD_CYCLE_MS,
          queueId: queuedBuild._id,
        });
      }
    }

    return {
      blueprints: blueprintsWithRequirements,
      playerResources: {
        nova,
        minerals,
        volatiles
      },
      shipBuildPipeline,
    };
  }
});
