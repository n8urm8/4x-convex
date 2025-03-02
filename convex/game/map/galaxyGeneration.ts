import { mutation, query } from '@cvx/_generated/server';
import { v } from 'convex/values';

// Constants for generation
const GALAXY_SIZE = 10; // 10x10 galaxy grid
const SECTOR_SIZE = 100; // 100x100 system grid within each sector
const SYSTEM_SIZE = 9; // 9x9 planet grid within each system

// Galaxy shape parameters
const GALAXY_CENTER_DENSITY = 0.7; // Maximum density at galaxy center (0-1)
const GALAXY_EDGE_DENSITY = 0.05; // Minimum density at galaxy edge (0-1)
const GALAXY_DENSITY_FALLOFF = 1.5; // Controls how quickly density drops off (higher = sharper falloff)
const GALAXY_SPIRAL_FACTOR = 0.5; // How pronounced spiral arms are (0 = no spirals, 1 = strong spirals)
const GALAXY_SPIRAL_ARMS = 2; // Number of spiral arms

// Star types with weights
const STAR_TYPES = [
  { type: 'Yellow Dwarf', weight: 40, color: '#FFD700' },
  { type: 'Red Dwarf', weight: 30, color: '#FF4500' },
  { type: 'Blue Giant', weight: 5, color: '#1E90FF' },
  { type: 'White Dwarf', weight: 10, color: '#F8F8FF' },
  { type: 'Neutron Star', weight: 2, color: '#E6E6FA' },
  { type: 'Red Giant', weight: 8, color: '#B22222' },
  { type: 'Binary System', weight: 5, color: '#FFD700' }
];

// Helper function to generate weighted random selection
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function weightedRandomSelect(items: any[]) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  return items[0]; // Fallback
}

// Initialize a new galaxy
export const createGalaxy = mutation({
  args: {
    groupId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Get the highest galaxy number so far
    const galaxies = await ctx.db.query('galaxies').collect();
    const nextNumber =
      galaxies.length > 0 ? Math.max(...galaxies.map((g) => g.number)) + 1 : 0;

    // Create the new galaxy
    const galaxyId = await ctx.db.insert('galaxies', {
      number: nextNumber,
      groupId: args.groupId ?? 'default'
    });

    // Create all galaxy sectors (10x10 grid)
    for (let x = 0; x < GALAXY_SIZE; x++) {
      for (let y = 0; y < GALAXY_SIZE; y++) {
        await ctx.db.insert('galaxySectors', {
          galaxyId,
          sectorX: x,
          sectorY: y
        });
      }
    }

    return {
      message: `Galaxy ${nextNumber} created with ${GALAXY_SIZE * GALAXY_SIZE} sectors`,
      galaxyId
    };
  }
});

// Calculate density at a specific point in the galaxy
function calculateDensityAtPosition(galaxyX: number, galaxyY: number) {
  // Normalize coordinates to be centered at (0,0) with range -1 to 1
  const normalizedX = (galaxyX / GALAXY_SIZE) * 2 - 1;
  const normalizedY = (galaxyY / GALAXY_SIZE) * 2 - 1;

  // Calculate distance from center (0-1 range where 1 is corner)
  const distanceFromCenter = Math.sqrt(
    normalizedX * normalizedX + normalizedY * normalizedY
  );
  const normalizedDistance = Math.min(distanceFromCenter, 1);

  // Calculate base density based on distance from center
  let density =
    GALAXY_CENTER_DENSITY *
      Math.pow(1 - normalizedDistance, GALAXY_DENSITY_FALLOFF) +
    GALAXY_EDGE_DENSITY;

  // Optional: Add spiral arm effect
  if (GALAXY_SPIRAL_FACTOR > 0) {
    // Convert to polar coordinates
    const angle = Math.atan2(normalizedY, normalizedX);

    // Calculate spiral arm effect (higher near arms)
    const armAngle = angle * GALAXY_SPIRAL_ARMS;
    const spiralPhase = Math.cos(armAngle - 3 * normalizedDistance);

    // Apply spiral effect more strongly toward edges
    const spiralModifier =
      GALAXY_SPIRAL_FACTOR * normalizedDistance * Math.pow(spiralPhase, 2);
    density = density * (1 + spiralModifier);
  }

  // Ensure density stays within bounds
  return Math.max(
    GALAXY_EDGE_DENSITY,
    Math.min(GALAXY_CENTER_DENSITY, density)
  );
}

// Generate star systems for a specific sector with realistic distribution
export const generateSectorSystems = mutation({
  args: {
    sectorId: v.id('galaxySectors'),
    densityMultiplier: v.optional(v.number()) // Optional modifier to global density
  },
  handler: async (ctx, args) => {
    // Get the sector
    const sector = await ctx.db.get(args.sectorId);
    if (!sector) {
      throw new Error('Sector not found');
    }

    // Also get the galaxy to know overall context
    const galaxy = await ctx.db.get(sector.galaxyId);
    if (!galaxy) {
      throw new Error('Galaxy not found');
    }

    // Check if we've already generated systems for this sector
    const existingSystems = await ctx.db
      .query('starSystems')
      .withIndex('by_sector', (q) => q.eq('galaxySectorId', args.sectorId))
      .collect();

    if (existingSystems.length > 0) {
      return { message: 'Star systems already generated for this sector' };
    }

    // Calculate the base density for this sector
    const baseDensity = calculateDensityAtPosition(
      sector.sectorX,
      sector.sectorY
    );

    // Apply optional density multiplier
    const adjustedDensity = baseDensity * (args.densityMultiplier ?? 1);

    // Calculate number of systems to create
    const maxSystems = SECTOR_SIZE * SECTOR_SIZE * adjustedDensity;
    const numSystems = Math.min(Math.floor(maxSystems), 2000); // Cap at 2000 for performance

    // Track positions to avoid duplicates
    const positions = new Set();
    const systemIds = [];

    // Generate star systems
    for (let i = 0; i < numSystems; i++) {
      // Find an unoccupied position
      let systemX, systemY;
      let attempts = 0;

      do {
        systemX = Math.floor(Math.random() * SECTOR_SIZE);
        systemY = Math.floor(Math.random() * SECTOR_SIZE);
        attempts++;

        // Avoid infinite loops if sector gets too crowded
        if (attempts > 100) break;
      } while (positions.has(`${systemX},${systemY}`));

      // Skip if we couldn't find a free position
      if (attempts > 100 && positions.has(`${systemX},${systemY}`)) continue;

      positions.add(`${systemX},${systemY}`);

      // Determine star type with weighting
      const starInfo = weightedRandomSelect(STAR_TYPES);

      const systemId = await ctx.db.insert('starSystems', {
        galaxySectorId: args.sectorId,
        systemX,
        systemY,
        starType: starInfo.type,
        starSize: 0.5 + Math.random() * 2.5, // Random size 0.5-3.0
        starColor: starInfo.color
      });

      systemIds.push(systemId);
    }

    return {
      message: `Generated ${systemIds.length} star systems in sector (${sector.sectorX},${sector.sectorY})`,
      calculatedDensity: baseDensity
    };
  }
});

// Generate planets in a star system with realistic distribution
export const generateSystemPlanets = mutation({
  args: {
    systemId: v.id('starSystems'),
    planetCount: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Get the star system
    const system = await ctx.db.get(args.systemId);
    if (!system) {
      throw new Error('Star system not found');
    }

    // Check if we've already generated planets for this system
    const existingPlanets = await ctx.db
      .query('systemPlanets')
      .withIndex('by_system', (q) => q.eq('starSystemId', args.systemId))
      .collect();

    if (existingPlanets.length > 0) {
      return { message: 'Planets already generated for this system' };
    }

    // Get all planet types
    const planetTypes = await ctx.db.query('planetTypes').collect();
    if (!planetTypes.length) {
      throw new Error('No planet types defined');
    }

    // Determine how many planets based on star type
    // Large stars tend to have more planets
    let basePlanetCount;
    if (system.starType === 'Blue Giant' || system.starType === 'Red Giant') {
      basePlanetCount = 3 + Math.floor(Math.random() * 6); // 3-8 planets
    } else if (system.starType === 'Neutron Star') {
      basePlanetCount = 1 + Math.floor(Math.random() * 3); // 1-3 planets
    } else {
      basePlanetCount = 2 + Math.floor(Math.random() * 5); // 2-6 planets
    }

    // Use specified count if provided
    const numPlanets = args.planetCount ?? basePlanetCount;

    // Star is at the center (4,4)
    const starX = Math.floor(SYSTEM_SIZE / 2);
    const starY = Math.floor(SYSTEM_SIZE / 2);

    // Generate planets
    const planetIds = [];
    const occupiedPositions = new Set([`${starX},${starY}`]); // Mark star position as occupied

    // Sort planets by distance from star (inner to outer)
    const planetSlots = [];
    for (let i = 0; i < numPlanets; i++) {
      // Distance increases as we go outward
      // Small chance of having very close planets
      const distanceFromStar =
        i === 0 && Math.random() < 0.2
          ? 1
          : 1 + Math.floor(((i * 2.5) / numPlanets) * 3);

      // Bounded to max distance of 3 (our system size is 9x9)
      const boundedDistance = Math.min(3, distanceFromStar);

      planetSlots.push(boundedDistance);
    }

    // Create planets at calculated distances
    for (let i = 0; i < planetSlots.length; i++) {
      const distanceFromStar = planetSlots[i];

      // Select planet types more appropriate for this distance
      let possibleTypes;
      if (distanceFromStar === 1) {
        // Inner planets more likely to be rocky/hot
        possibleTypes = planetTypes.filter((p) =>
          ['Inner System', 'Exotic'].includes(p.category)
        );
      } else if (distanceFromStar === 3) {
        // Outer planets more likely to be gas/ice giants
        possibleTypes = planetTypes.filter((p) =>
          ['Outer System', 'Exotic', 'Dwarf Planet/Asteroid Belt'].includes(
            p.category
          )
        );
      } else {
        // Middle distance can be any type
        possibleTypes = planetTypes;
      }

      // If filtering resulted in empty array, use all planet types
      if (possibleTypes.length === 0) {
        possibleTypes = planetTypes;
      }

      // Select random type from filtered list
      const planetType =
        possibleTypes[Math.floor(Math.random() * possibleTypes.length)];

      // Find a position for the planet that hasn't been occupied
      let planetX, planetY;
      let attempts = 0;

      do {
        // Random angle around star
        const angle = Math.random() * 2 * Math.PI;
        // Position based on distance from star
        planetX = starX + Math.round(Math.cos(angle) * distanceFromStar);
        planetY = starY + Math.round(Math.sin(angle) * distanceFromStar);

        // Ensure within bounds
        planetX = Math.max(0, Math.min(SYSTEM_SIZE - 1, planetX));
        planetY = Math.max(0, Math.min(SYSTEM_SIZE - 1, planetY));

        attempts++;
        // Avoid infinite loops
        if (attempts > 20) break;
      } while (occupiedPositions.has(`${planetX},${planetY}`));

      // Skip if we couldn't find a position
      if (attempts > 20 && occupiedPositions.has(`${planetX},${planetY}`))
        continue;

      // Mark this position as occupied
      occupiedPositions.add(`${planetX},${planetY}`);

      const planetId = await ctx.db.insert('systemPlanets', {
        starSystemId: args.systemId,
        planetTypeId: planetType._id,
        planetX,
        planetY
      });

      planetIds.push(planetId);
    }

    return {
      message: `Generated ${planetIds.length} planets in star system`
    };
  }
});

// Generate all systems for all sectors in a galaxy
export const generateAllGalaxySystems = mutation({
  args: {
    galaxyId: v.id('galaxies'),
    densityMultiplier: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Get all sectors for this galaxy
    const sectors = await ctx.db
      .query('galaxySectors')
      .withIndex('by_galaxy', (q) => q.eq('galaxyId', args.galaxyId))
      .collect();

    // Track how many systems we create
    let totalSystems = 0;

    // Generate systems for each sector
    for (const sector of sectors) {
      // Check if we've already generated systems
      const existingSystems = await ctx.db
        .query('starSystems')
        .withIndex('by_sector', (q) => q.eq('galaxySectorId', sector._id))
        .collect();

      if (existingSystems.length > 0) {
        continue; // Skip if already generated
      }

      // Calculate density based on position in galaxy
      const baseDensity = calculateDensityAtPosition(
        sector.sectorX,
        sector.sectorY
      );
      const adjustedDensity = baseDensity * (args.densityMultiplier ?? 1);

      // Calculate number of systems
      const maxSystems = SECTOR_SIZE * SECTOR_SIZE * adjustedDensity;
      const numSystems = Math.min(Math.floor(maxSystems), 2000);

      // Skip empty sectors (possible at very edges with low density)
      if (numSystems === 0) continue;

      // Generate the systems
      const positions = new Set();
      let systemsCreated = 0;

      // Create the star systems
      for (let i = 0; i < numSystems; i++) {
        // Random position
        let systemX, systemY;
        let attempts = 0;

        do {
          systemX = Math.floor(Math.random() * SECTOR_SIZE);
          systemY = Math.floor(Math.random() * SECTOR_SIZE);
          attempts++;
          if (attempts > 50) break;
        } while (positions.has(`${systemX},${systemY}`));

        if (attempts > 50 && positions.has(`${systemX},${systemY}`)) continue;

        positions.add(`${systemX},${systemY}`);

        // Determine star type
        const starInfo = weightedRandomSelect(STAR_TYPES);

        await ctx.db.insert('starSystems', {
          galaxySectorId: sector._id,
          systemX,
          systemY,
          starType: starInfo.type,
          starSize: 0.5 + Math.random() * 2.5,
          starColor: starInfo.color
        });

        systemsCreated++;
      }

      totalSystems += systemsCreated;
    }

    return {
      message: `Generated ${totalSystems} star systems across the galaxy`
    };
  }
});

// Query to get galaxy density map
export const getGalaxyDensityMap = query({
  args: { galaxyId: v.id('galaxies') },
  handler: async (ctx, args) => {
    // Get all sectors for this galaxy
    const sectors = await ctx.db
      .query('galaxySectors')
      .withIndex('by_galaxy', (q) => q.eq('galaxyId', args.galaxyId))
      .collect();

    // Calculate density for each sector
    const densityMap = sectors.map((sector) => {
      const density = calculateDensityAtPosition(
        sector.sectorX,
        sector.sectorY
      );
      return {
        sectorX: sector.sectorX,
        sectorY: sector.sectorY,
        density
      };
    });

    return densityMap;
  }
});
