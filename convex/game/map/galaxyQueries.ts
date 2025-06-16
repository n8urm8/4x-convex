// galaxyQueries.ts (in your Convex functions directory)
import { v } from 'convex/values';
import { internalQuery, query } from '../../_generated/server';

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
  returns: v.array(
    v.object({
      _id: v.id('galaxies'),
      _creationTime: v.number(),
      number: v.number(),
      groupId: v.string()
    })
  ),
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

// return all galaxy sector ids
export const getGalaxySectorIds = internalQuery({
  args: { galaxyId: v.id('galaxies') },
  returns: v.array(v.id('galaxySectors')),
  handler: async (ctx, args) => {
    const sectors = await ctx.db
      .query('galaxySectors')
      .withIndex('by_galaxy', (q) => q.eq('galaxyId', args.galaxyId))
      .collect();

    return sectors.map((sector) => sector._id);
  }
});

// Get sectors for a galaxy
export const getGalaxySectors = query({
  returns: v.array(
    v.object({
      _id: v.id('galaxySectors'),
      _creationTime: v.number(),
      galaxyId: v.id('galaxies'),
      galaxyNumber: v.number(),
      sectorX: v.number(),
      sectorY: v.number()
    })
  ),
  args: { galaxyId: v.id('galaxies') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('galaxySectors')
      .withIndex('by_galaxy', (q) => q.eq('galaxyId', args.galaxyId))
      .collect();
  }
});

// Get a specific sector by coordinates using either galaxyId or galaxy number
export const getSectorByCoordinates = query({
  args: {
    galaxyId: v.optional(v.id('galaxies')),
    galaxyNumber: v.optional(v.number()),
    sectorX: v.number(),
    sectorY: v.number()
  },
  returns: v.union(
    v.object({
      _id: v.id('galaxySectors'),
      _creationTime: v.number(),
      galaxyId: v.id('galaxies'),
      galaxyNumber: v.number(),
      sectorX: v.number(),
      sectorY: v.number()
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    if ('galaxyId' in args) {
      // Query by galaxyId
      return await ctx.db
        .query('galaxySectors')
        .withIndex('by_coordinates', (q) =>
          q
            .eq('galaxyId', args.galaxyId!)
            .eq('sectorX', args.sectorX)
            .eq('sectorY', args.sectorY)
        )
        .first();
    } else {
      // Query directly by galaxyNumber
      return await ctx.db
        .query('galaxySectors')
        .withIndex('by_number_coordinates', (q) =>
          q
            .eq('galaxyNumber', args.galaxyNumber!)
            .eq('sectorX', args.sectorX)
            .eq('sectorY', args.sectorY)
        )
        .first();
    }
  }
});

// Get star systems for a sector
export const getSectorSystems = query({
  returns: v.array(
    v.object({
      _id: v.id('sectorSystems'),
      _creationTime: v.number(),
      galaxySectorId: v.id('galaxySectors'),
      galaxyNumber: v.number(),
      sectorX: v.number(),
      sectorY: v.number(),
      systemX: v.number(),
      systemY: v.number(),
      starType: v.string(),
      starSize: v.number(),
      starColor: v.string()
    })
  ),
  args: { sectorId: v.id('galaxySectors') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sectorSystems')
      .withIndex('by_sector', (q) => q.eq('galaxySectorId', args.sectorId))
      .collect();
  }
});

// Get systems by sector coordinates
export const getSectorSystemsByCoordinates = query({
  args: {
    galaxyNumber: v.number(),
    sectorX: v.number(),
    sectorY: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sectorSystems')
      .withIndex('by_galaxy_sector_coordinates', (q) =>
        q
          .eq('galaxyNumber', args.galaxyNumber)
          .eq('sectorX', args.sectorX)
          .eq('sectorY', args.sectorY)
      )
      .collect();
  }
});

// Get a specific star system by its ID
export const getStarSystemById = query({
  args: { systemId: v.id('sectorSystems') },
  returns: v.union(
    v.object({
      _id: v.id('sectorSystems'),
      _creationTime: v.number(),
      galaxySectorId: v.id('galaxySectors'),
      galaxyNumber: v.number(),
      sectorX: v.number(),
      sectorY: v.number(),
      systemX: v.number(),
      systemY: v.number(),
      starType: v.string(),
      starSize: v.number(),
      starColor: v.string(),
      exploredBy: v.optional(v.id('users')),
      // Add any other fields that are part of the sectorSystems document
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.systemId);
  }
});

// Get a specific star system by coordinates within a sector
export const getStarSystemByCoordinates = query({
  args: {
    galaxyNumber: v.number(),
    sectorX: v.number(),
    sectorY: v.number(),
    systemX: v.number(),
    systemY: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sectorSystems')
      .withIndex('by_absolute_coordinates', (q) =>
        q
          .eq('galaxyNumber', args.galaxyNumber)
          .eq('sectorX', args.sectorX)
          .eq('sectorY', args.sectorY)
          .eq('systemX', args.systemX)
          .eq('systemY', args.systemY)
      )
      .first();
  }
});

// Get planets for a star system
export const getSystemPlanets = query({
  returns: v.array(v.any()),
  args: { systemId: v.id('sectorSystems') },
  handler: async (ctx, args) => {
    const planets = await ctx.db
      .query('systemPlanets')
      .withIndex('by_system', (q) => q.eq('sectorSystemId', args.systemId))
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
    galaxyNumber: v.number(),
    sectorX: v.number(),
    sectorY: v.number(),
    systemX: v.number(),
    systemY: v.number(),
    planetX: v.number(),
    planetY: v.number()
  },
  handler: async (ctx, args) => {
    const planet = await ctx.db
      .query('systemPlanets')
      .withIndex('by_absolute_coordinates', (q) =>
        q
          .eq('galaxyNumber', args.galaxyNumber)
          .eq('sectorX', args.sectorX)
          .eq('sectorY', args.sectorY)
          .eq('systemX', args.systemX)
          .eq('systemY', args.systemY)
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
