import { v } from 'convex/values';
import { getAuthedUser } from '@cvx/utils';
import { internalMutation, mutation, query } from '../../_generated/server';
import { shipBlueprintsData } from './shipBlueprints';

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

export const seedShipBlueprints = internalMutation({
  handler: async (ctx) => {
    for (const blueprint of shipBlueprintsData) {
      const existing = await ctx.db
        .query('shipBlueprints')
        .withIndex('byId', (q) => q.eq('id', blueprint.id))
        .unique();

      if (!existing) {
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

    if (user.nova < totalCost) {
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

    // 5. All checks passed, proceed with building
    await ctx.db.patch(user._id, {
      nova: user.nova - totalCost
    });

    // 6. Find or create base fleet for this base
    let baseFleet = await ctx.db
      .query('fleets')
      .withIndex('byBase', (q: any) => q.eq('baseId', baseId))
      .filter((q: any) => q.eq(q.field('isBaseFleet'), true))
      .first();

    if (!baseFleet) {
      // Create a new base fleet
      const fleetNumber = await getNextFleetNumber(ctx, user._id);
      const base = await ctx.db.get(baseId);
      if (!base) {
        throw new Error('Base not found when creating fleet');
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
        throw new Error('System not found for base location');
      }

      const baseFleetId = await ctx.db.insert('fleets', {
        userId: user._id,
        name: `Fleet ${fleetNumber}`,
        fleetNumber,
        isBaseFleet: true,
        baseId: baseId,
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

    // 7. Create ships and assign to base fleet
    for (let i = 0; i < quantity; i++) {
      await ctx.db.insert('playerShips', {
        userId: user._id,
        blueprintId: blueprint.id,
        baseId: baseId,
        fleetId: baseFleet!._id,
        damage: blueprint.damage,
        defense: blueprint.defense,
        shielding: blueprint.shielding,
        currentHealth: blueprint.defense // Start with full health
      });
    }

    // 8. Recalculate base fleet stats
    if (baseFleet) {
      const stats = await calculateFleetStats(ctx, baseFleet._id);
      await ctx.db.patch(baseFleet._id, {
        ...stats,
        lastUpdated: Date.now()
      });
    }

    return {
      success: true,
      message: `${quantity}x ${blueprint.name}(s) built and assigned to ${baseFleet!.name}.`
    };
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
    
    // Combine blueprints with requirement checks
    const blueprintsWithRequirements = blueprints.map(blueprint => {
      // Check structure requirement
      const requiredStructureDef = structureDefsMap.get(blueprint.requiredStructure);
      const hasRequiredStructure = requiredStructureDef ? 
        baseStructureDefsMap.has(requiredStructureDef._id) : false;
      
      // Check technology requirement
      const requiredTechDef = researchDefsMap.get(blueprint.requiredTechnology);
      const hasRequiredTechnology = requiredTechDef ? 
        playerResearchedIds.has(requiredTechDef._id) : false;
      
      // Check resource requirements
      const hasEnoughNova = user.nova >= blueprint.novaCost;
      
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
        canBuild
      };
    });
    
    return {
      blueprints: blueprintsWithRequirements,
      playerResources: {
        nova: user.nova,
        minerals: user.minerals,
        volatiles: user.volatiles
      }
    };
  }
});
