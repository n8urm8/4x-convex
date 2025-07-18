// src/game/bases/structureQueries.ts
import { v } from 'convex/values';
import { internalQuery, query } from '../../_generated/server';
import { structureCategoryValidator } from './bases.schema';
import { getAuthedUser } from '@cvx/utils';

// Get all structure definitions
export const getAllStructureDefinitions = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('structureDefinitions').collect();
  }
});

// Get structure definitions by category
export const getStructuresByCategory = query({
  args: {
    category: structureCategoryValidator
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('structureDefinitions')
      .withIndex('by_category', (q) => q.eq('category', args.category))
      .collect();
  }
});

// Get a specific structure definition by ID
export const getStructureById = query({
  args: {
    structureId: v.id('structureDefinitions')
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.structureId);
  }
});

// Get structure requirements by structure ID
export const getStructureRequirements = query({
  args: {
    structureId: v.id('structureDefinitions')
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('structureRequirements')
      .withIndex('by_structure', (q) => q.eq('structureId', args.structureId))
      .collect();
  }
});

// Get all structures for a base
export const getBaseStructures = query({
  args: {
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('baseStructures')
      .withIndex('by_base', (q) => q.eq('baseId', args.baseId))
      .collect();
  }
});

// Get detailed information about structures in a base (including definition data)
export const getDetailedBaseStructures = query({
  args: {
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args) => {
    // Check user authentication
    let user = null;
    try {
      user = await getAuthedUser(ctx);
    } catch (e) {
      // User not authenticated, continue as anonymous
    }

    // Get the base to check for ownership
    const base = await ctx.db.get(args.baseId);
    if (!base) {
      // Base not found, return empty array as no structures can be found.
      return [];
    }

    const isOwner = user && base.userId === user._id;

    // Get all structures in this base
    const baseStructures = await ctx.db
      .query('baseStructures')
      .withIndex('by_base', (q) => q.eq('baseId', args.baseId))
      .collect();

    // For each structure, get its definition
    const structuresWithDetails = await Promise.all(
      baseStructures.map(async (structure) => {
        const definition = await ctx.db.get(structure.structureDefId);
        if (isOwner) {
          return {
            ...structure,
            definition
          };
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const {
            upgrading, // still useful to know if it's upgrading, just not the details
            upgradeCompleteTime,
            upgradeLevel,
            upgradeNovaCost,
            ...publicStructureData
          } = structure;
          return {
            ...publicStructureData,
            upgrading, // explicitly include upgrading status
            definition
          };
        }
      })
    );

    return structuresWithDetails;
  }
});

// Get structures that are currently upgrading in a base
export const getUpgradingStructures = query({
  args: {
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await getAuthedUser(ctx);
    } catch (e) {
      return []; // Not authenticated, no upgrading structures to see.
    }

    const base = await ctx.db.get(args.baseId);
    if (!base) {
      return [];
    }

    const isOwner = user && base.userId === user._id;

    if (!isOwner) {
      return [];
    }

    return await ctx.db
      .query('baseStructures')
      .withIndex('by_upgrading', (q) =>
        q.eq('baseId', args.baseId).eq('upgrading', true)
      )
      .collect();
  }
});

// Get available structures that can be built in a base (not already built)
export const getAvailableStructures = query({
  args: {
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args) => {
    // Get all structure definitions
    const allStructures = await ctx.db.query('structureDefinitions').collect();

    // Get all structures currently in the base
    const baseStructures = await ctx.db
      .query('baseStructures')
      .withIndex('by_base', (q) => q.eq('baseId', args.baseId))
      .collect();

    // Get the base for space/energy information
    const base = await ctx.db.get(args.baseId);
    if (!base) {
      throw new Error('Base not found');
    }

    // Create a map of structure definition IDs that are already built
    const builtStructureIds = new Set(
      baseStructures.map((structure) => structure.structureDefId)
    );

    // Filter out structures that are already built
    // And check if the base has enough space/energy to build
    const availableStructures = allStructures.filter((structure) => {
      // Check if it's already built
      if (builtStructureIds.has(structure._id)) {
        return false;
      }

      // Check if base has enough space and energy
      const hasEnoughSpace =
        base.totalSpace - base.usedSpace >= structure.baseSpaceCost;
      const hasEnoughEnergy =
        base.totalEnergy - base.usedEnergy >= structure.baseEnergyCost;

      return hasEnoughSpace && hasEnoughEnergy;
    });

    return availableStructures;
  }
});

// Get structures that can be upgraded in a base
export const getUpgradableStructures = query({
  args: {
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args) => {
    // Get base structures
    const baseStructures = await ctx.db
      .query('baseStructures')
      .withIndex('by_base', (q) => q.eq('baseId', args.baseId))
      .collect();

    // For each structure, check if it can be upgraded
    const upgradableStructures = await Promise.all(
      baseStructures.map(async (structure) => {
        // Get the structure definition
        const definition = await ctx.db.get(structure.structureDefId);

        // Check if it's at max level or already upgrading
        const isAtMaxLevel = definition?.maxLevel
          ? structure.level >= definition.maxLevel
          : false;
        const isUpgrading = structure.upgrading;

        // Include the structure if it can be upgraded
        if (!isAtMaxLevel && !isUpgrading) {
          return {
            ...structure,
            definition
          };
        }
        return null;
      })
    );

    // Filter out null values and return the upgradable structures
    return upgradableStructures.filter(Boolean);
  }
});

// Get building costs for a new structure
export const getStructureBuildCost = query({
  args: {
    structureId: v.id('structureDefinitions'),
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args) => {
    // Get the structure definition
    const structure = await ctx.db.get(args.structureId);
    if (!structure) {
      throw new Error('Structure definition not found');
    }

    // Get the base to check for construction bonuses
    const base = await ctx.db.get(args.baseId);
    if (!base) {
      throw new Error('Base not found');
    }

    // Calculate nova cost with construction bonuses
    const buildTimeReduction = base.buildTimeReduction; // % reduction
    const novaCost = structure.baseNovaCost;

    return {
      spaceCost: structure.baseSpaceCost,
      energyCost: structure.baseEnergyCost,
      novaCost: novaCost,
      buildTimeReduction: buildTimeReduction,
      // Calculate estimated build time (in milliseconds)
      // Base time is 1 hour per 1000 nova cost
      estimatedBuildTime: Math.round(
        3600000 * (novaCost / 1000) * (1 - buildTimeReduction / 100)
      )
    };
  }
});

// Get upgrade costs for an existing structure
export const getStructureUpgradeCost = query({
  args: {
    structureId: v.id('baseStructures')
  },
  handler: async (ctx, args) => {
    // Get the base structure
    const structure = await ctx.db.get(args.structureId);
    if (!structure) {
      throw new Error('Structure not found');
    }

    // Get the structure definition
    const definition = await ctx.db.get(structure.structureDefId);
    if (!definition) {
      throw new Error('Structure definition not found');
    }

    // Get the base to check for construction bonuses
    const base = await ctx.db.get(structure.baseId);
    if (!base) {
      throw new Error('Base not found');
    }

    // Calculate costs based on current level
    const level = structure.level;
    const nextLevel = level + 1;

    // Nova cost increases by 50% per level
    const novaCost = Math.round(definition.baseNovaCost * (1 + level * 0.5));

    // Space and energy costs stay the same
    const spaceCost = structure.spaceCost;
    const energyCost = structure.energyCost;

    // Calculate build time reduction from base
    const buildTimeReduction = base.buildTimeReduction; // % reduction

    return {
      currentLevel: level,
      nextLevel: nextLevel,
      spaceCost: spaceCost,
      energyCost: energyCost,
      novaCost: novaCost,
      buildTimeReduction: buildTimeReduction,
      // Calculate estimated upgrade time (in milliseconds)
      // Base time is 1 hour per 1000 nova cost, increasing with level
      estimatedUpgradeTime: Math.round(
        3600000 *
          (novaCost / 1000) *
          (1 + level * 0.2) *
          (1 - buildTimeReduction / 100)
      )
    };
  }
});

// Get a structure's effects at a specific level
export const getStructureEffectsAtLevel = query({
  args: {
    structureId: v.id('structureDefinitions'),
    level: v.number()
  },
  handler: async (ctx, args) => {
    // Get the structure definition
    const structure = await ctx.db.get(args.structureId);
    if (!structure) {
      throw new Error('Structure definition not found');
    }

    // Get the base effects
    const effects = structure.effects || {};
    const level = args.level;

    // Calculate effects at the specified level
    // For level 1, it's just the base effects
    // For levels > 1, each effect scales based on the effect value
    const effectsAtLevel: Record<string, number> = {};

    Object.entries(effects).forEach(([key, value]) => {
      if (typeof value === 'number') {
        // For level 1, use the base value
        if (level === 1) {
          effectsAtLevel[key] = value;
        } else {
          // For higher levels, calculate based on level
          // Each level after 1 adds the effect value again
          effectsAtLevel[key] = value * level;
        }
      }
    });

    return {
      level,
      effects: effectsAtLevel
    };
  }
});

export const getPlayerBasesOverview = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);

    if (!user) {
      return [];
    }

    const playerBases = await ctx.db
      .query('playerBases')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const basesWithDetails = await Promise.all(
      playerBases.map(async (base) => {
        // Get upgrading structures
        const upgradingStructures = await ctx.db
          .query('baseStructures')
          .withIndex('by_upgrading', (q) =>
            q.eq('baseId', base._id).eq('upgrading', true)
          )
          .collect();

        // Get planet information
        const planet = await ctx.db.get(base.planetId);
        let planetType = null;
        
        if (planet) {
          planetType = await ctx.db.get(planet.planetTypeId);
        }

        return {
          ...base,
          upgradingStructures,
          planet,
          planetType
        };
      })
    );

    return basesWithDetails;
  }
});

// Get all player bases
export const getPlayerBases = query({
  args: {
    userId: v.id('users')
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('playerBases')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
  }
});

// Get a specific base by ID
export const getBaseById = query({
  args: {
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.baseId);
  }
});

// Get full details for a specific base, for the base detail page
export const getBaseDetails = query({
  args: {
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await getAuthedUser(ctx);
    } catch (e) {
      // Not authenticated or user not found.
      return null;
    }

    const base = await ctx.db.get(args.baseId);
    if (!base) {
      // Base not found
      return null;
    }

    // Check for ownership
    if (base.userId !== user._id) {
      // Not the owner, return null as they shouldn't see details
      return null;
    }

    // Get all structures in this base
    const baseStructures = await ctx.db
      .query('baseStructures')
      .withIndex('by_base', (q) => q.eq('baseId', args.baseId))
      .collect();

    // For each structure, get its definition
    const structuresWithDetails = await Promise.all(
      baseStructures.map(async (structure) => {
        const definition = await ctx.db.get(structure.structureDefId);
        return {
          ...structure,
          definition
        };
      })
    );

    return {
      ...base,
      structures: structuresWithDetails
    };
  }
});

// Get bases on a specific planet
export const getBaseOnPlanet = query({
  args: {
    planetId: v.id('systemPlanets')
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('playerBases')
      .withIndex('by_planet', (q) => q.eq('planetId', args.planetId))
      .first();
  }
});

// --- Admin CRUD Queries for Structure Definitions ---

export const adminGetStructureDefinitionById = internalQuery({
  args: { id: v.id('structureDefinitions') },
  handler: async (ctx, args) => {
    // TODO: Add admin authentication check here
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity || !isAdmin(identity.subject)) { // isAdmin would be a helper
    //   throw new Error('User is not authorized to access structure definitions.');
    // }
    return await ctx.db.get(args.id);
  }
});

export const adminGetAllStructureDefinitions = internalQuery({
  args: {},
  handler: async (ctx) => {
    // TODO: Add admin authentication check here
    return await ctx.db.query('structureDefinitions').collect();
  }
});

export const adminGetStructureDefinitionByName = internalQuery({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // TODO: Add admin authentication check here
    const structureDef = await ctx.db
      .query('structureDefinitions')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique();
    return structureDef;
  }
});
