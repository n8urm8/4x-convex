// galaxyQueries.ts (in your Convex functions directory)
import { query } from '@cvx/_generated/server';
import { v } from 'convex/values';

// Get all planet types
export const getAllPlanetTypes = query({
  handler: async (ctx) => {
    return await ctx.db.query('planetTypes').collect();
  }
});

// Get planet types by category
export const getPlanetTypesByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query('planetTypes').collect();
  }
});

// Get all galaxies
export const getAllGalaxies = query({
  handler: async (ctx) => {
    return await ctx.db.query('galaxies').collect();
  }
});

// Get a galaxy by number
export const getGalaxyByNumber = query({
  args: { number: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('galaxies')
      .withIndex('by_number', (q) => q.eq('number', args.number))
      .first();
  }
});

// Get sectors for a galaxy
export const getGalaxySectors = query({
  args: { galaxyId: v.id('galaxies') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('galaxySectors')
      .withIndex('by_galaxy', (q) => q.eq('galaxyId', args.galaxyId))
      .collect();
  }
});

// Get a specific sector by coordinates
export const getSectorByCoordinates = query({
  args: {
    galaxyId: v.id('galaxies'),
    sectorX: v.number(),
    sectorY: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('galaxySectors')
      .withIndex('by_coordinates', (q) =>
        q
          .eq('galaxyId', args.galaxyId)
          .eq('sectorX', args.sectorX)
          .eq('sectorY', args.sectorY)
      )
      .first();
  }
});

// Get star systems for a sector
export const getSectorSystems = query({
  args: { sectorId: v.id('galaxySectors') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('starSystems')
      .withIndex('by_sector', (q) => q.eq('galaxySectorId', args.sectorId))
      .collect();
  }
});

// Get a specific star system by coordinates within a sector
export const getStarSystemByCoordinates = query({
  args: {
    sectorId: v.id('galaxySectors'),
    systemX: v.number(),
    systemY: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('starSystems')
      .withIndex('by_coordinates', (q) =>
        q
          .eq('galaxySectorId', args.sectorId)
          .eq('systemX', args.systemX)
          .eq('systemY', args.systemY)
      )
      .first();
  }
});

// Get planets for a star system
export const getSystemPlanets = query({
  args: { systemId: v.id('starSystems') },
  handler: async (ctx, args) => {
    const planets = await ctx.db
      .query('systemPlanets')
      .withIndex('by_system', (q) => q.eq('starSystemId', args.systemId))
      .collect();

    // Enrich with planet type information
    const enrichedPlanets = await Promise.all(
      planets.map(async (planet) => {
        const planetType = await ctx.db.get(planet.planetTypeId);
        return {
          ...planet,
          type: planetType
        };
      })
    );

    return enrichedPlanets;
  }
});

// Get a specific planet by coordinates within a system
export const getPlanetByCoordinates = query({
  args: {
    systemId: v.id('starSystems'),
    planetX: v.number(),
    planetY: v.number()
  },
  handler: async (ctx, args) => {
    const planet = await ctx.db
      .query('systemPlanets')
      .withIndex('by_coordinates', (q) =>
        q
          .eq('starSystemId', args.systemId)
          .eq('planetX', args.planetX)
          .eq('planetY', args.planetY)
      )
      .first();

    if (planet) {
      const planetType = await ctx.db.get(planet.planetTypeId);
      return {
        ...planet,
        type: planetType
      };
    }

    return null;
  }
});

// Get all planets of a specific type
export const getPlanetsByType = query({
  args: { planetTypeId: v.id('planetTypes') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('systemPlanets')
      .withIndex('by_type', (q) => q.eq('planetTypeId', args.planetTypeId))
      .collect();
  }
});
