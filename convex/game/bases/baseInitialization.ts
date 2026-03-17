// convex/game/bases/baseInitialization.ts
import { v } from 'convex/values';
import { internalMutation, MutationCtx, mutation } from '../../_generated/server';
import { Id } from '../../_generated/dataModel';
import { getAuthedUser } from '../../utils';
import { BASE_ENERGY, BASE_SPACE } from './constants';

const SYSTEM_SIZE = 9;

/**
 * Calculate weighted random selection favoring the center of the galaxy.
 * Uses a normal distribution centered at 4.5 (middle of 0-9 range)
 */
function selectWeightedCoordinate(): number {
  const center = 4.5;
  const stdDev = 2.0;
  
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  
  // Convert to our range (0-9) with center bias
  let coord = center + z0 * stdDev;
  
  // Clamp to valid range and round
  coord = Math.max(0, Math.min(9, Math.round(coord)));
  
  return coord;
}

/**
 * Score a planet based on its suitability for a starting base.
 * Higher scores are better.
 */
function scorePlanet(planet: {
  type: {
    habitable: boolean;
    space: number;
    energy: number;
    minerals: number;
    volatiles: number;
  } | null;
}): number {
  if (!planet.type || !planet.type.habitable) {
    return -1; // Not habitable
  }
  
  // Weight factors for starting base
  const spaceWeight = 3;
  const energyWeight = 2;
  const mineralsWeight = 1.5;
  const volatilesWeight = 1;
  
  const score = 
    planet.type.space * spaceWeight +
    planet.type.energy * energyWeight +
    planet.type.minerals * mineralsWeight +
    planet.type.volatiles * volatilesWeight;
  
  return score;
}

/**
 * Generate planets for a system inline (helper function)
 */
async function generatePlanetsForSystem(
  ctx: MutationCtx,
  systemId: Id<'sectorSystems'>
): Promise<void> {
  const system = await ctx.db.get(systemId);
  if (!system) {
    throw new Error('Star system not found');
  }

  // Get all planet types
  const planetTypes = await ctx.db.query('planetTypes').collect();
  if (!planetTypes.length) {
    console.error('No planet types defined');
    return;
  }

  // Determine how many planets based on star type
  let basePlanetCount;
  if (system.starType === 'Blue Giant' || system.starType === 'Red Giant') {
    basePlanetCount = 3 + Math.floor(Math.random() * 6);
  } else if (system.starType === 'Neutron Star') {
    basePlanetCount = 1 + Math.floor(Math.random() * 3);
  } else {
    basePlanetCount = 2 + Math.floor(Math.random() * 5);
  }

  const numPlanets = basePlanetCount;
  const starX = Math.floor(SYSTEM_SIZE / 2);
  const starY = Math.floor(SYSTEM_SIZE / 2);
  const occupiedPositions = new Set([`${starX},${starY}`]);

  // Generate planet slots at different distances
  const planetSlots = [];
  for (let i = 0; i < numPlanets; i++) {
    const distanceFromStar =
      i === 0 && Math.random() < 0.2
        ? 1
        : 1 + Math.floor(((i * 2.5) / numPlanets) * 3);
    const boundedDistance = Math.min(3, distanceFromStar);
    planetSlots.push(boundedDistance);
  }

  // Create planets at calculated distances
  for (let i = 0; i < planetSlots.length; i++) {
    const distanceFromStar = planetSlots[i];

    // Select planet types based on distance
    let possibleTypes;
    if (distanceFromStar === 1) {
      possibleTypes = planetTypes.filter((p) =>
        ['Inner System', 'Exotic'].includes(p.category)
      );
    } else if (distanceFromStar === 3) {
      possibleTypes = planetTypes.filter((p) =>
        ['Outer System', 'Exotic', 'Dwarf Planet/Asteroid Belt'].includes(p.category)
      );
    } else {
      possibleTypes = planetTypes;
    }

    if (possibleTypes.length === 0) {
      possibleTypes = planetTypes;
    }

    const planetType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];

    // Find a position for the planet
    let planetX, planetY;
    let attempts = 0;

    do {
      const angle = Math.random() * 2 * Math.PI;
      planetX = starX + Math.round(Math.cos(angle) * distanceFromStar);
      planetY = starY + Math.round(Math.sin(angle) * distanceFromStar);

      planetX = Math.max(0, Math.min(SYSTEM_SIZE - 1, planetX));
      planetY = Math.max(0, Math.min(SYSTEM_SIZE - 1, planetY));

      attempts++;
      if (attempts > 20) break;
    } while (occupiedPositions.has(`${planetX},${planetY}`));

    if (attempts > 20 && occupiedPositions.has(`${planetX},${planetY}`)) {
      continue;
    }

    occupiedPositions.add(`${planetX},${planetY}`);

    await ctx.db.insert('systemPlanets', {
      sectorSystemId: systemId,
      planetTypeId: planetType._id,
      planetX,
      planetY,
      galaxyNumber: system.galaxyNumber,
      sectorX: system.sectorX,
      sectorY: system.sectorY,
      systemX: system.systemX,
      systemY: system.systemY
    });
  }
}

/**
 * Helper to create a base on a specific planet
 */
async function createBaseOnPlanet(
  ctx: MutationCtx,
  userId: Id<'users'>,
  planet: any
) {
  const planetType = planet.type;
  
  // Base capacity all bases start with; planet type adds on top
  const totalSpace = BASE_SPACE + (planetType.space ?? 0);
  const totalEnergy = BASE_ENERGY + (planetType.energy ?? 0);

  // Create the base
  const baseId = await ctx.db.insert('playerBases', {
    userId,
    planetId: planet._id,
    name: 'Home Base',
    galaxyNumber: planet.galaxyNumber,
    sectorX: planet.sectorX,
    sectorY: planet.sectorY,
    systemX: planet.systemX,
    systemY: planet.systemY,
    planetX: planet.planetX,
    planetY: planet.planetY,
    totalSpace,
    usedSpace: 0,
    totalEnergy,
    usedEnergy: 0,
    researchPerCycle: 0,
    novaPerCycle: 0,
    mineralsPerCycle: 0,
    volatilesPerCycle: 0,
    buildTimeReduction: 0,
    shipProductionSpeed: 0,
    defenseBonus: 0,
    allProductionBonus: 0,
    researchSpeed: 0,
    createdAt: Date.now(),
    lastUpdated: Date.now()
  });

  console.log('[createStartingBase] Base created successfully:', baseId);

  return {
    success: true as const,
    baseId,
    galaxyNumber: planet.galaxyNumber,
    sectorX: planet.sectorX,
    sectorY: planet.sectorY,
    systemX: planet.systemX,
    systemY: planet.systemY,
    planetX: planet.planetX,
    planetY: planet.planetY
  };
}

/**
 * Internal helper function containing the core logic to create a starting base.
 * Extracted to avoid circular reference issues when called from both
 * internal and public mutations.
 */
async function createStartingBaseLogic(
  ctx: MutationCtx,
  userId: Id<'users'>
): Promise<
  | { success: true; baseId: Id<'playerBases'>; galaxyNumber: number; sectorX: number; sectorY: number; systemX: number; systemY: number; planetX: number; planetY: number }
  | { success: false; error: string }
> {
  console.log('[createStartingBase] Starting for userId:', userId);
  
  const galaxy = await ctx.db
    .query('galaxies')
    .withIndex('by_number')
    .first();
  
  if (!galaxy) {
    console.error('[createStartingBase] No galaxy found');
    return { success: false as const, error: 'No galaxy found' };
  }

  console.log('[createStartingBase] Found galaxy:', galaxy._id);

  const sectorX = selectWeightedCoordinate();
  const sectorY = selectWeightedCoordinate();
  
  console.log('[createStartingBase] Selected sector:', sectorX, sectorY);
  
  const sector = await ctx.db
    .query('galaxySectors')
    .withIndex('by_number_coordinates', (q) =>
      q.eq('galaxyNumber', galaxy.number).eq('sectorX', sectorX).eq('sectorY', sectorY)
    )
    .first();
  
  if (!sector) {
    console.error('[createStartingBase] Sector not found');
    return { success: false as const, error: `Sector not found at ${sectorX},${sectorY}` };
  }

  const systems = await ctx.db
    .query('sectorSystems')
    .withIndex('by_sector', (q) => q.eq('galaxySectorId', sector._id))
    .collect();
  
  console.log('[createStartingBase] Found', systems.length, 'systems');
  
  if (systems.length === 0) {
    return { success: false as const, error: 'No systems found in sector' };
  }

  let availableSystems = systems.filter(s => !s.exploredBy);
  if (availableSystems.length === 0) {
    availableSystems = systems;
  }

  let selectedSystem = null;
  let attempts = 0;
  while (!selectedSystem && attempts < 10) {
    const systemX = selectWeightedCoordinate() * 10;
    const systemY = selectWeightedCoordinate() * 10;
    
    let closestSystem = null;
    let minDistance = Infinity;
    
    for (const system of availableSystems) {
      const distance = Math.sqrt(
        Math.pow(system.systemX - systemX, 2) +
        Math.pow(system.systemY - systemY, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestSystem = system;
      }
    }
    
    selectedSystem = closestSystem;
    attempts++;
  }

  if (!selectedSystem) {
    return { success: false as const, error: 'Could not select system' };
  }

  console.log('[createStartingBase] Selected system:', selectedSystem._id);

  if (!selectedSystem.exploredBy) {
    await ctx.db.patch(selectedSystem._id, { exploredBy: userId });
    
    const existingPlanets = await ctx.db
      .query('systemPlanets')
      .withIndex('by_system', (q) => q.eq('sectorSystemId', selectedSystem._id))
      .collect();
    
    if (existingPlanets.length === 0) {
      await generatePlanetsForSystem(ctx, selectedSystem._id);
    }
  }

  const planets = await ctx.db
    .query('systemPlanets')
    .withIndex('by_system', (q) => q.eq('sectorSystemId', selectedSystem._id))
    .collect();
  
  console.log('[createStartingBase] Found', planets.length, 'planets');
  
  if (planets.length === 0) {
    return { success: false as const, error: 'No planets found' };
  }

  const enrichedPlanets = await Promise.all(
    planets.map(async (planet) => {
      const planetType = await ctx.db.get(planet.planetTypeId);
      return {
        ...planet,
        type: planetType,
        score: scorePlanet({ type: planetType })
      };
    })
  );

  const habitablePlanets = enrichedPlanets.filter(p => p.score > 0);
  
  console.log('[createStartingBase] Found', habitablePlanets.length, 'habitable planets');
  
  if (habitablePlanets.length === 0) {
    return { success: false as const, error: 'No habitable planets' };
  }

  habitablePlanets.sort((a, b) => b.score - a.score);
  const bestPlanet = habitablePlanets[0];

  console.log('[createStartingBase] Best planet:', bestPlanet.type?.name);

  const existingBase = await ctx.db
    .query('playerBases')
    .withIndex('by_planet', (q) => q.eq('planetId', bestPlanet._id))
    .first();
  
  if (existingBase) {
    if (habitablePlanets.length > 1) {
      const secondBest = habitablePlanets[1];
      const secondCheck = await ctx.db
        .query('playerBases')
        .withIndex('by_planet', (q) => q.eq('planetId', secondBest._id))
        .first();
      
      if (!secondCheck) {
        return await createBaseOnPlanet(ctx, userId, secondBest);
      }
    }
    
    return { success: false as const, error: 'All planets have bases' };
  }

  return await createBaseOnPlanet(ctx, userId, bestPlanet);
}

/**
 * Internal mutation to create a starting base for a new user.
 * Selects a random sector and system weighted towards the center,
 * explores it if necessary, and creates a base on the best planet.
 */
export const createStartingBase = internalMutation({
  args: {
    userId: v.id('users')
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      baseId: v.id('playerBases'),
      galaxyNumber: v.number(),
      sectorX: v.number(),
      sectorY: v.number(),
      systemX: v.number(),
      systemY: v.number(),
      planetX: v.number(),
      planetY: v.number()
    }),
    v.object({
      success: v.literal(false),
      error: v.string()
    })
  ),
  handler: async (ctx, args) => {
    return await createStartingBaseLogic(ctx, args.userId);
  }
});

/**
 * Public mutation to manually create a starting base for the current user.
 * Useful for fixing accounts that didn't get a base created automatically.
 */
export const createMyStartingBase = mutation({
  args: {},
  returns: v.union(
    v.object({
      success: v.literal(true),
      baseId: v.id('playerBases'),
      galaxyNumber: v.number(),
      sectorX: v.number(),
      sectorY: v.number(),
      systemX: v.number(),
      systemY: v.number(),
      planetX: v.number(),
      planetY: v.number()
    }),
    v.object({
      success: v.literal(false),
      error: v.string()
    })
  ),
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    
    // Check if user already has a base
    const existingBases = await ctx.db
      .query('playerBases')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();
    
    if (existingBases.length > 0) {
      return {
        success: false as const,
        error: 'User already has a base'
      };
    }
    
    // Call the shared helper function
    return await createStartingBaseLogic(ctx, user._id);
  }
});
