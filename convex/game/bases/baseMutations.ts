// src/game/bases/structureMutations.ts
import { mutation } from '../../_generated/server';
import { QueryCtx, MutationCtx } from '../../_generated/server';
import { v } from 'convex/values';
import { Doc, Id } from '../../_generated/dataModel';
import { api } from '../../_generated/api';
import { getAdminUser, getAuthedUser } from '../../utils';
import { structureDefinitions, STRUCTURE_CATEGORIES } from './bases.schema';
import { 
  getPlayerResourceAmount,
  modifyPlayerResource 
} from '../resources/resourceHelpers';
import { assertDevGameTools } from '../../devTools';
import {
  BASE_ENERGY,
  BASE_SPACE,
  effectiveNovaPerHourFromBase,
} from './constants';
import { countPlayerBases } from './baseEconomy';
import {
  parseStructureEffectsField,
  scaleParsedEffectsForLevel,
} from './structureEffects';

// Helper to get user and check base ownership
const checkBaseOwnership = async (ctx: MutationCtx | QueryCtx, baseId: Id<'playerBases'>) => {
  const user = await getAuthedUser(ctx);

  const base = await ctx.db.get(baseId);
  if (!base) {
    throw new Error('Base not found.');
  }

  if (base.userId !== user._id) {
    throw new Error('User does not have permission to modify this base.');
  }

  return { user, base };
};

async function hasActiveStructureWorkOnBase(
  ctx: MutationCtx,
  baseId: Id<'playerBases'>
): Promise<boolean> {
  const active = await ctx.db
    .query('baseStructures')
    .withIndex('by_upgrading', (q) => q.eq('baseId', baseId).eq('upgrading', true))
    .first();
  return active !== null;
}

async function sumQueuedBuildFootprintExcluding(
  ctx: MutationCtx,
  baseId: Id<'playerBases'>,
  excludeQueueEntryId?: Id<'baseStructureBuildQueue'>
): Promise<{ space: number; energy: number }> {
  const rows = await ctx.db
    .query('baseStructureBuildQueue')
    .withIndex('by_base_queued', (q) => q.eq('baseId', baseId))
    .collect();

  let space = 0;
  let energy = 0;
  for (const row of rows) {
    if (excludeQueueEntryId && row._id === excludeQueueEntryId) continue;
    if (row.kind !== 'build' || !row.structureDefId) continue;
    const def = await ctx.db.get(row.structureDefId);
    if (def) {
      space += def.baseSpaceCost;
      energy += def.baseEnergyCost;
    }
  }
  return { space, energy };
}

async function queueHasPendingBuildForDef(
  ctx: MutationCtx,
  baseId: Id<'playerBases'>,
  structureDefId: Id<'structureDefinitions'>
): Promise<boolean> {
  const rows = await ctx.db
    .query('baseStructureBuildQueue')
    .withIndex('by_base_queued', (q) => q.eq('baseId', baseId))
    .collect();
  return rows.some(
    (r) => r.kind === 'build' && r.structureDefId === structureDefId
  );
}

async function queueHasPendingUpgradeForStructure(
  ctx: MutationCtx,
  baseId: Id<'playerBases'>,
  structureId: Id<'baseStructures'>
): Promise<boolean> {
  const rows = await ctx.db
    .query('baseStructureBuildQueue')
    .withIndex('by_base_queued', (q) => q.eq('baseId', baseId))
    .collect();
  return rows.some(
    (r) => r.kind === 'upgrade' && r.structureId === structureId
  );
}

/** Validates research / prereq / duplicate build; not space or queue footprint. */
async function validateNewBuildPrerequisites(
  ctx: MutationCtx,
  userId: Id<'users'>,
  base: Doc<'playerBases'>,
  structureDefId: Id<'structureDefinitions'>
): Promise<Doc<'structureDefinitions'>> {
  const structureDef = await ctx.db.get(structureDefId);
  if (!structureDef) {
    throw new Error('Structure definition not found');
  }

  const existingStructure = await ctx.db
    .query('baseStructures')
    .withIndex('by_structure_type', (q) =>
      q.eq('baseId', base._id).eq('structureDefId', structureDefId)
    )
    .first();

  if (existingStructure) {
    throw new Error('This structure is already built in this base');
  }

  if (structureDef.researchRequirementName) {
    const requirementName = structureDef.researchRequirementName;
    const requiredResearch = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_name', (q) => q.eq('name', requirementName))
      .unique();

    if (requiredResearch) {
      const playerResearch = await ctx.db
        .query('playerTechnologies')
        .withIndex('by_user_research', (q) =>
          q.eq('userId', userId).eq('researchDefinitionId', requiredResearch._id)
        )
        .first();

      if (!playerResearch) {
        throw new Error(
          `Cannot build: Research '${requirementName}' is required. Complete this research first.`
        );
      }
    } else {
      throw new Error(
        `Cannot build: Required research '${requirementName}' not found in database.`
      );
    }
  }

  if (structureDef.requiredStructureName && structureDef.requiredStructureLevel) {
    const requiredStructureName = structureDef.requiredStructureName;
    const requiredStructureLevel = structureDef.requiredStructureLevel;

    const requiredStructureDef = await ctx.db
      .query('structureDefinitions')
      .withIndex('by_name', (q) => q.eq('name', requiredStructureName))
      .unique();

    if (!requiredStructureDef) {
      throw new Error(
        `Cannot build: Required structure '${requiredStructureName}' not found.`
      );
    }

    const prerequisiteStructure = await ctx.db
      .query('baseStructures')
      .withIndex('by_structure_type', (q) =>
        q.eq('baseId', base._id).eq('structureDefId', requiredStructureDef._id)
      )
      .first();

    if (!prerequisiteStructure) {
      throw new Error(
        `Cannot build: Requires '${requiredStructureName}' to be built first.`
      );
    }

    if (prerequisiteStructure.level < requiredStructureLevel) {
      throw new Error(
        `Cannot build: Requires '${requiredStructureName}' to be at least level ${requiredStructureLevel} (currently level ${prerequisiteStructure.level}).`
      );
    }
  }

  return structureDef;
}

function assertSpaceAndEnergyForBuild(
  base: Doc<'playerBases'>,
  structureDef: Doc<'structureDefinitions'>,
  queuedFootprint: { space: number; energy: number }
) {
  if (
    base.usedSpace + queuedFootprint.space + structureDef.baseSpaceCost >
    base.totalSpace
  ) {
    throw new Error('Not enough space available in the base');
  }

  if (
    base.usedEnergy + queuedFootprint.energy + structureDef.baseEnergyCost >
    base.totalEnergy
  ) {
    throw new Error('Not enough energy available in the base');
  }
}

async function executeStructureBuildStart(
  ctx: MutationCtx,
  base: Doc<'playerBases'>,
  structureDef: Doc<'structureDefinitions'>
): Promise<{ structureId: Id<'baseStructures'>; buildCompleteTime: number }> {
  const buildTimeReduction = base.buildTimeReduction;
  const novaCost = structureDef.baseNovaCost;
  const buildTime = Math.round(
    (3600000 * (novaCost / 1000)) * (1 - buildTimeReduction / 100)
  );
  const buildCompleteTime = Date.now() + buildTime;

  const structureId = await ctx.db.insert('baseStructures', {
    baseId: base._id,
    structureDefId: structureDef._id,
    level: 0,
    spaceCost: structureDef.baseSpaceCost,
    energyCost: structureDef.baseEnergyCost,
    upgrading: true,
    upgradeCompleteTime: buildCompleteTime,
    upgradeLevel: 1,
    upgradeNovaCost: novaCost,
    currentEffects: {},
  });

  await ctx.db.patch(base._id, {
    usedSpace: base.usedSpace + structureDef.baseSpaceCost,
    usedEnergy: base.usedEnergy + structureDef.baseEnergyCost,
    lastUpdated: Date.now(),
  });

  return { structureId, buildCompleteTime };
}

async function tryExecuteQueuedBuild(
  ctx: MutationCtx,
  baseId: Id<'playerBases'>,
  userId: Id<'users'>,
  structureDefId: Id<'structureDefinitions'>
): Promise<boolean> {
  const base = await ctx.db.get(baseId);
  if (!base) return false;

  let structureDef: Doc<'structureDefinitions'>;
  try {
    structureDef = await validateNewBuildPrerequisites(
      ctx,
      userId,
      base,
      structureDefId
    );
  } catch {
    return false;
  }

  // Queued items do not reserve space/energy; validate only current base + this build.
  try {
    assertSpaceAndEnergyForBuild(base, structureDef, { space: 0, energy: 0 });
  } catch {
    return false;
  }

  await executeStructureBuildStart(ctx, base, structureDef);
  return true;
}

async function tryExecuteQueuedUpgrade(
  ctx: MutationCtx,
  baseId: Id<'playerBases'>,
  userId: Id<'users'>,
  structureId: Id<'baseStructures'>
): Promise<boolean> {
  const base = await ctx.db.get(baseId);
  if (!base) return false;

  const structure = await ctx.db.get(structureId);
  if (!structure || structure.baseId !== baseId) return false;
  if (structure.upgrading) return false;

  const structureDef = await ctx.db.get(structure.structureDefId);
  if (!structureDef) return false;

  const nextLevel = structure.level + 1;
  if (structureDef.maxLevel && nextLevel > structureDef.maxLevel) return false;

  if (structureDef.researchRequirementName) {
    const requirementName = structureDef.researchRequirementName;
    const requiredResearch = await ctx.db
      .query('researchDefinitions')
      .withIndex('by_name', (q) => q.eq('name', requirementName))
      .unique();

    if (requiredResearch) {
      const playerResearch = await ctx.db
        .query('playerTechnologies')
        .withIndex('by_user_research', (q) =>
          q.eq('userId', userId).eq('researchDefinitionId', requiredResearch._id)
        )
        .first();

      if (!playerResearch) return false;
    }
  }

  const upgradeNovaCost = structureDef.baseNovaCost * nextLevel;
  const upgradeEnergyCost = structureDef.baseEnergyCost * nextLevel;

  const currentNova = await getPlayerResourceAmount(ctx, userId, 'nova');
  if (currentNova < upgradeNovaCost) return false;

  if (base.totalEnergy < base.usedEnergy + upgradeEnergyCost) return false;

  await modifyPlayerResource(ctx, userId, 'nova', -upgradeNovaCost);
  await ctx.db.patch(base._id, {
    usedEnergy: base.usedEnergy + upgradeEnergyCost,
    lastUpdated: Date.now(),
  });

  const upgradeTime = 1000 * 60 * 5 * nextLevel;
  const upgradeCompleteTime = Date.now() + upgradeTime;

  await ctx.db.patch(structure._id, {
    upgrading: true,
    upgradeLevel: nextLevel,
    upgradeCompleteTime,
    upgradeNovaCost: upgradeNovaCost,
  });

  return true;
}

/** Starts the next queued build/upgrade when nothing is upgrading on this base. */
async function processNextStructureQueue(
  ctx: MutationCtx,
  baseId: Id<'playerBases'>
): Promise<void> {
  if (await hasActiveStructureWorkOnBase(ctx, baseId)) return;

  const base0 = await ctx.db.get(baseId);
  if (!base0) return;
  const userId = base0.userId;

  while (true) {
    if (await hasActiveStructureWorkOnBase(ctx, baseId)) return;

    const next = await ctx.db
      .query('baseStructureBuildQueue')
      .withIndex('by_base_queued', (q) => q.eq('baseId', baseId))
      .order('asc')
      .first();

    if (!next) return;

    let started = false;
    if (next.kind === 'build' && next.structureDefId) {
      started = await tryExecuteQueuedBuild(
        ctx,
        baseId,
        userId,
        next.structureDefId
      );
    } else if (next.kind === 'upgrade' && next.structureId) {
      started = await tryExecuteQueuedUpgrade(
        ctx,
        baseId,
        userId,
        next.structureId
      );
    }

    await ctx.db.delete(next._id);

    if (started) return;
  }
}

// Create a new base on a planet
export const createBase = mutation({
  args: {
    planetId: v.id('systemPlanets'),
    name: v.string(),
    galaxyNumber: v.number(),
    sectorX: v.number(),
    sectorY: v.number(),
    systemX: v.number(),
    systemY: v.number(),
    planetX: v.number(),
    planetY: v.number()
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    const userId = user._id;

    // Get the planet to check if it's habitable
    const planet = await ctx.db.get(args.planetId);
    if (!planet) {
      throw new Error("Planet not found");
    }
    
    // Get planet type to check if it's habitable
    const planetType = await ctx.db.get(planet.planetTypeId);
    if (!planetType) {
      throw new Error("Planet type not found");
    }
    
    if (!planetType.habitable) {
      throw new Error("Cannot build a base on a non-habitable planet");
    }
    
    // Get existing bases for this user to check if they've reached the limit
    const userBases = await ctx.db
      .query('playerBases')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    
   
    const maxBases = 10; // Simple rule for now
    
    if (userBases.length >= maxBases) {
      throw new Error(`You have reached your limit of ${maxBases} bases`);
    }
    
    // Check if there's already a base on this planet
    const existingBaseOnPlanet = await ctx.db
      .query('playerBases')
      .withIndex('by_planet', (q) => q.eq('planetId', args.planetId))
      .first();
    
    if (existingBaseOnPlanet) {
      if (existingBaseOnPlanet.userId === userId) {
        throw new Error('User already has a base on this planet.');
      }
      throw new Error('A base already exists on this planet.');
    }
    
    // All bases start with shared base capacity; planet type adds on top
    const initialSpace = BASE_SPACE + (planetType.space || 0);
    const initialEnergy = BASE_ENERGY + (planetType.energy || 0);
    const initialMinerals = 2 + (planetType.minerals || 0);
    const initialVolatiles = 1 + (planetType.volatiles || 0);
    
    // Create the base
    const baseId = await ctx.db.insert('playerBases', {
      userId: userId, // Use server-derived userId
      name: args.name,
      galaxyNumber: args.galaxyNumber,
      sectorX: args.sectorX,
      sectorY: args.sectorY,
      systemX: args.systemX,
      systemY: args.systemY,
      planetX: args.planetX,
      planetY: args.planetY,
      planetId: args.planetId,
      
      // Initialize base stats
      totalSpace: initialSpace,
      usedSpace: 0,
      totalEnergy: initialEnergy,
      usedEnergy: 0,
      
      // Initialize resources per cycle
      researchPerCycle: 1,
      novaPerCycle: 5,
      mineralsPerCycle: initialMinerals,
      volatilesPerCycle: initialVolatiles,
      
      // Initialize bonuses
      buildTimeReduction: 0,
      shipProductionSpeed: 0,
      defenseBonus: 0,
      allProductionBonus: 0,
      researchSpeed: 0,
      
      // Meta information
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });
    
    return { baseId };
  }
});

// Build a new structure in a base
export const buildStructure = mutation({
  args: {
    baseId: v.id('playerBases'),
    structureDefId: v.id('structureDefinitions')
  },
  handler: async (ctx, args) => {
    const { user, base } = await checkBaseOwnership(ctx, args.baseId);

    const structureDefBare = await ctx.db.get(args.structureDefId);
    if (!structureDefBare) {
      throw new Error('Structure definition not found');
    }

    const existingStructure = await ctx.db
      .query('baseStructures')
      .withIndex('by_structure_type', (q) =>
        q.eq('baseId', args.baseId).eq('structureDefId', args.structureDefId)
      )
      .first();
    if (existingStructure) {
      throw new Error('This structure is already built in this base');
    }

    if (
      await queueHasPendingBuildForDef(ctx, args.baseId, args.structureDefId)
    ) {
      throw new Error('This structure is already in the build queue.');
    }

    if (await hasActiveStructureWorkOnBase(ctx, args.baseId)) {
      await ctx.db.insert('baseStructureBuildQueue', {
        baseId: args.baseId,
        userId: user._id,
        queuedAt: Date.now(),
        kind: 'build',
        structureDefId: args.structureDefId,
      });
      return { queued: true as const };
    }

    const structureDef = await validateNewBuildPrerequisites(
      ctx,
      user._id,
      base,
      args.structureDefId
    );
    const fp = await sumQueuedBuildFootprintExcluding(ctx, args.baseId);
    assertSpaceAndEnergyForBuild(base, structureDef, fp);

    return await executeStructureBuildStart(ctx, base, structureDef);
  }
});

// Helper function to calculate structure effects at a given level
function calculateStructureEffects(structureDef: Doc<"structureDefinitions">, level: number) {
  const baseEffects = parseStructureEffectsField(structureDef.effects ?? '');
  return scaleParsedEffectsForLevel(baseEffects, level);
}

// Complete a structure build or upgrade
export const completeStructureUpgrade = mutation({
  args: {
    structureId: v.id('baseStructures')
  },
  handler: async (ctx, args) => {
    // Get the structure
    const structure = await ctx.db.get(args.structureId);
    if (!structure) {
      throw new Error("Structure not found");
    }
    
    if (!structure.upgrading) {
      throw new Error("Structure is not being built or upgraded");
    }
    
    // Check if the upgrade time has completed
    if (structure.upgradeCompleteTime && structure.upgradeCompleteTime > Date.now()) {
      throw new Error("Structure build/upgrade not yet complete");
    }
    
    // Get the structure definition
    const structureDef = await ctx.db.get(structure.structureDefId);
    if (!structureDef) {
      throw new Error("Structure definition not found");
    }
    
    // Get the base and ensure ownership (also implicitly checks if base is null)
    const { base } = await checkBaseOwnership(ctx, structure.baseId);
    
    // Calculate the effects at the new level
    const newLevel = structure.upgradeLevel || (structure.level + 1);
    const newEffects = calculateStructureEffects(structureDef, newLevel);
    
    // Complete the upgrade
    await ctx.db.patch(args.structureId, {
      level: newLevel,
      upgrading: false,
      upgradeCompleteTime: undefined,
      upgradeLevel: undefined,
      upgradeNovaCost: undefined,
      currentEffects: newEffects
    });
    
    // Calculate the changes in base stats
    const oldEffects = structure.currentEffects || {};
    
    // For first build (level 0 to 1)
    if (structure.level === 0) {
      // Update base stats with the new structure's effects
      await ctx.db.patch(structure.baseId, {
        // Add effects to the base
        totalSpace: base.totalSpace + (newEffects.space || 0),
        totalEnergy: base.totalEnergy + (newEffects.energy || 0),
        researchPerCycle: base.researchPerCycle + (newEffects.research || 0),
        novaPerCycle: base.novaPerCycle + (newEffects.novaPerCycle || 0),
        mineralsPerCycle: base.mineralsPerCycle + (newEffects.minerals || 0),
        volatilesPerCycle: base.volatilesPerCycle + (newEffects.volatiles || 0),
        buildTimeReduction: base.buildTimeReduction + (newEffects.buildTimeReduction || 0),
        shipProductionSpeed: base.shipProductionSpeed + (newEffects.shipProductionSpeed || 0),
        defenseBonus: base.defenseBonus + (newEffects.baseDefense || 0),
        allProductionBonus: base.allProductionBonus + (newEffects.allProductionBonus || 0),
        researchSpeed: base.researchSpeed + (newEffects.researchSpeed || 0),
        lastUpdated: Date.now()
      });
    } else {
      // For upgrades, calculate differences in effects
      const spaceDiff = (newEffects.space || 0) - (oldEffects.space || 0);
      const energyDiff = (newEffects.energy || 0) - (oldEffects.energy || 0);
      const researchDiff = (newEffects.research || 0) - (oldEffects.research || 0);
      const novaDiff = (newEffects.novaPerCycle || 0) - (oldEffects.novaPerCycle || 0);
      const mineralsDiff = (newEffects.minerals || 0) - (oldEffects.minerals || 0);
      const volatilesDiff = (newEffects.volatiles || 0) - (oldEffects.volatiles || 0);
      const buildTimeDiff = (newEffects.buildTimeReduction || 0) - (oldEffects.buildTimeReduction || 0);
      const shipProdDiff = (newEffects.shipProductionSpeed || 0) - (oldEffects.shipProductionSpeed || 0);
      const defenseDiff = (newEffects.baseDefense || 0) - (oldEffects.baseDefense || 0);
      const allProdDiff = (newEffects.allProductionBonus || 0) - (oldEffects.allProductionBonus || 0);
      const researchSpeedDiff = (newEffects.researchSpeed || 0) - (oldEffects.researchSpeed || 0);
      
      // Update the base with the differences
      await ctx.db.patch(structure.baseId, {
        totalSpace: base.totalSpace + spaceDiff,
        totalEnergy: base.totalEnergy + energyDiff,
        researchPerCycle: base.researchPerCycle + researchDiff,
        novaPerCycle: base.novaPerCycle + novaDiff,
        mineralsPerCycle: base.mineralsPerCycle + mineralsDiff,
        volatilesPerCycle: base.volatilesPerCycle + volatilesDiff,
        buildTimeReduction: base.buildTimeReduction + buildTimeDiff,
        shipProductionSpeed: base.shipProductionSpeed + shipProdDiff,
        defenseBonus: base.defenseBonus + defenseDiff,
        allProductionBonus: base.allProductionBonus + allProdDiff,
        researchSpeed: base.researchSpeed + researchSpeedDiff,
        lastUpdated: Date.now()
      });
    }

    await processNextStructureQueue(ctx, structure.baseId);

    return { success: true, newLevel };
  }
});

// Start upgrading a structure
export const startStructureUpgrade = mutation({
  args: {
    structureId: v.id('baseStructures')
  },
  handler: async (ctx, args) => {
    const structure = await ctx.db.get(args.structureId);
    if (!structure) {
      throw new Error('Structure not found');
    }
    const { user, base } = await checkBaseOwnership(ctx, structure.baseId);

    if (structure.upgrading) {
      throw new Error('Structure is already upgrading.');
    }

    const structureDef = await ctx.db.get(structure.structureDefId);
    if (!structureDef) {
      throw new Error('Structure definition not found.');
    }

    const nextLevel = structure.level + 1;

    if (structureDef.maxLevel && nextLevel > structureDef.maxLevel) {
      throw new Error('This structure is already at its maximum level.');
    }

    if (
      await queueHasPendingUpgradeForStructure(
        ctx,
        structure.baseId,
        structure._id
      )
    ) {
      throw new Error('An upgrade for this structure is already queued.');
    }

    const queueBusy = await hasActiveStructureWorkOnBase(ctx, structure.baseId);

    if (queueBusy) {
      await ctx.db.insert('baseStructureBuildQueue', {
        baseId: structure.baseId,
        userId: user._id,
        queuedAt: Date.now(),
        kind: 'upgrade',
        structureId: structure._id,
      });
      return { queued: true as const };
    }

    if (structureDef.researchRequirementName) {
      const requirementName = structureDef.researchRequirementName;
      const requiredResearch = await ctx.db
        .query('researchDefinitions')
        .withIndex('by_name', (q) => q.eq('name', requirementName))
        .unique();

      if (requiredResearch) {
        const playerResearch = await ctx.db
          .query('playerTechnologies')
          .withIndex('by_user_research', (q) =>
            q
              .eq('userId', user._id)
              .eq('researchDefinitionId', requiredResearch._id)
          )
          .first();

        if (!playerResearch) {
          throw new Error(`Research '${requirementName}' is required.`);
        }
      }
    }

    const upgradeNovaCost = structureDef.baseNovaCost * nextLevel;
    const upgradeEnergyCost = structureDef.baseEnergyCost * nextLevel;

    const currentNova = await getPlayerResourceAmount(ctx, user._id, 'nova');
    if (currentNova < upgradeNovaCost) {
      throw new Error('Insufficient Nova for upgrade.');
    }

    if (base.totalEnergy < base.usedEnergy + upgradeEnergyCost) {
      throw new Error('Insufficient energy capacity for this upgrade.');
    }

    await modifyPlayerResource(ctx, user._id, 'nova', -upgradeNovaCost);

    await ctx.db.patch(base._id, {
      usedEnergy: base.usedEnergy + upgradeEnergyCost,
      lastUpdated: Date.now(),
    });

    const upgradeTime = 1000 * 60 * 5 * nextLevel;
    const upgradeCompleteTime = Date.now() + upgradeTime;

    await ctx.db.patch(structure._id, {
      upgrading: true,
      upgradeLevel: nextLevel,
      upgradeCompleteTime: upgradeCompleteTime,
      upgradeNovaCost: upgradeNovaCost,
    });

    return { success: true as const, upgradeCompleteTime };
  }
});

// Cancel a structure upgrade
export const cancelStructureUpgrade = mutation({
  args: {
    structureId: v.id('baseStructures')
  },
  handler: async (ctx, args) => {
    // Get the structure
    const structure = await ctx.db.get(args.structureId);
    if (!structure) {
      throw new Error("Structure not found");
    }
    
    await checkBaseOwnership(ctx, structure.baseId);

    if (!structure.upgrading) {
      throw new Error("Structure is not being upgraded");
    }

    const base = await ctx.db.get(structure.baseId);
    if (!base) {
      throw new Error("Base not found");
    }

    const structureDef = await ctx.db.get(structure.structureDefId);

    // Refund upgrade costs (nova + reserved energy) for in-progress level-ups
    if (
      structure.level > 0 &&
      structureDef &&
      structure.upgradeLevel != null
    ) {
      const energyReserved =
        structureDef.baseEnergyCost * structure.upgradeLevel;
      if (structure.upgradeNovaCost != null && structure.upgradeNovaCost > 0) {
        await modifyPlayerResource(
          ctx,
          base.userId,
          "nova",
          structure.upgradeNovaCost
        );
      }
      await ctx.db.patch(structure.baseId, {
        usedEnergy: Math.max(0, base.usedEnergy - energyReserved),
        lastUpdated: Date.now(),
      });
    }

    // Clear upgrading state
    await ctx.db.patch(args.structureId, {
      upgrading: false,
      upgradeCompleteTime: undefined,
      upgradeLevel: undefined,
      upgradeNovaCost: undefined,
    });

    // New build (level 0): refund reserved space/energy and remove placeholder row
    if (structure.level === 0) {
      await ctx.db.patch(structure.baseId, {
        usedSpace: Math.max(0, base.usedSpace - structure.spaceCost),
        usedEnergy: Math.max(0, base.usedEnergy - structure.energyCost),
        lastUpdated: Date.now(),
      });
      await ctx.db.delete(args.structureId);
    }

    await processNextStructureQueue(ctx, structure.baseId);

    return { success: true };
  }
});

export const removeFromStructureBuildQueue = mutation({
  args: {
    queueEntryId: v.id("baseStructureBuildQueue"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.queueEntryId);
    if (!row) {
      throw new Error("Queue entry not found");
    }
    await checkBaseOwnership(ctx, row.baseId);
    await ctx.db.delete(args.queueEntryId);
    return { success: true as const };
  },
});

// Demolish a structure
export const demolishStructure = mutation({
  args: {
    structureId: v.id('baseStructures')
  },
  handler: async (ctx, args) => {
    // Get the structure
    const structure = await ctx.db.get(args.structureId);
    if (!structure) {
      throw new Error("Structure not found");
    }
    
    const { base } = await checkBaseOwnership(ctx, structure.baseId);

    // Can't demolish a structure that's being upgraded
    if (structure.upgrading) {
      throw new Error("Cannot demolish a structure that is being upgraded");
    } 
    
    // Get structure effects to remove from the base
    const effects = structure.currentEffects || {};
    
    // Update the base to remove structure effects and costs
    await ctx.db.patch(structure.baseId, {
      usedSpace: base.usedSpace - structure.spaceCost,
      usedEnergy: base.usedEnergy - structure.energyCost,
      totalSpace: base.totalSpace - (effects.space || 0), 
      totalEnergy: base.totalEnergy - (effects.energy || 0), 
      researchPerCycle: base.researchPerCycle - (effects.research || 0),
      novaPerCycle: base.novaPerCycle - (effects.novaPerCycle || 0),
      mineralsPerCycle: base.mineralsPerCycle - (effects.minerals || 0),
      volatilesPerCycle: base.volatilesPerCycle - (effects.volatiles || 0),
      buildTimeReduction: base.buildTimeReduction - (effects.buildTimeReduction || 0),
      shipProductionSpeed: base.shipProductionSpeed - (effects.shipProductionSpeed || 0),
      defenseBonus: base.defenseBonus - (effects.baseDefense || 0),
      allProductionBonus: base.allProductionBonus - (effects.allProductionBonus || 0),
      researchSpeed: base.researchSpeed - (effects.researchSpeed || 0),
      lastUpdated: Date.now()
    });
    
    // Delete the structure
    await ctx.db.delete(args.structureId);
    
    return { success: true };
  }
});

export const renameBase = mutation({
  args: {
    baseId: v.id('playerBases'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await checkBaseOwnership(ctx, args.baseId);

    await ctx.db.patch(args.baseId, { 
      name: args.name,
      lastUpdated: Date.now()
    });
    return { success: true };
  },
});

// Abandon a base
export const abandonBase = mutation({
    args: {
        baseId: v.id('playerBases'),
    },
    handler: async (ctx, args) => {
        await checkBaseOwnership(ctx, args.baseId);

        const queueItems = await ctx.db
            .query('baseStructureBuildQueue')
            .withIndex('by_base_queued', (q) => q.eq('baseId', args.baseId))
            .collect();
        for (const row of queueItems) {
            await ctx.db.delete(row._id);
        }

        // Find all structures in the base and delete them
        const baseStructures = await ctx.db
            .query('baseStructures')
            .withIndex('by_base', (q) => q.eq('baseId', args.baseId))
            .collect();
        
        for (const structure of baseStructures) {
          await ctx.db.delete(structure._id);
        }
        
        // Delete the base
        await ctx.db.delete(args.baseId);
        
        return { success: true };
  }
});

// Rush complete a structure build/upgrade with nova
export const rushComplete = mutation({
  args: {
    structureId: v.id('baseStructures')
  },
  handler: async (ctx, args): Promise<{ success: boolean; newLevel: number; }> => {
    const structure = await ctx.db.get(args.structureId);
    if (!structure) {
      throw new Error("Structure not found");
    }

    await checkBaseOwnership(ctx, structure.baseId);
    
    if (!structure.upgrading) {
      throw new Error("Structure is not being built or upgraded");
    }
    
    // Calculate the remaining time
    const remaining = structure.upgradeCompleteTime ? structure.upgradeCompleteTime - Date.now() : 0;
    if (remaining <= 0) {
      // Already complete, just finish it
      return await ctx.runMutation(api.game.bases.baseMutations.completeStructureUpgrade, { structureId: args.structureId });
    }
    
    // TODO: Check if player has enough nova currency to rush
    // This would require a user resources/currency system
    
    // Complete the structure immediately
    return await ctx.runMutation(api.game.bases.baseMutations.completeStructureUpgrade, { structureId: args.structureId });
  }
});

/** Skips the build timer and applies completion for all in-progress structures at the base in the given scope (non-defense tab vs defenses tab). */
export const instantCompleteUpgradingStructures = mutation({
  args: {
    baseId: v.id('playerBases'),
    scope: v.union(v.literal('non_defense'), v.literal('defense')),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    completedCount: number;
    completed: { structureId: Id<'baseStructures'>; newLevel: number }[];
  }> => {
    assertDevGameTools();
    await checkBaseOwnership(ctx, args.baseId);

    const upgrading = await ctx.db
      .query('baseStructures')
      .withIndex('by_upgrading', (q) =>
        q.eq('baseId', args.baseId).eq('upgrading', true)
      )
      .collect();

    const completed: { structureId: Id<'baseStructures'>; newLevel: number }[] = [];

    for (const structure of upgrading) {
      const def = await ctx.db.get(structure.structureDefId);
      if (!def) continue;
      const isDefense = def.category === STRUCTURE_CATEGORIES.DEFENSE;
      if (args.scope === 'defense' && !isDefense) continue;
      if (args.scope === 'non_defense' && isDefense) continue;

      await ctx.db.patch(structure._id, {
        upgradeCompleteTime: Date.now() - 1,
      });
      const result = await ctx.runMutation(
        api.game.bases.baseMutations.completeStructureUpgrade,
        { structureId: structure._id }
      );
      completed.push({ structureId: structure._id, newLevel: result.newLevel });
    }

    return { completedCount: completed.length, completed };
  },
});

// Collect resources from a base
export const collectBaseResources = mutation({
  args: {
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args) => {
    // Get the base and check ownership
    const { base } = await checkBaseOwnership(ctx, args.baseId);
    
    // Calculate time since last update
    const now = Date.now();
    const timeSinceUpdate = now - base.lastUpdated;
    
    // Convert to hours
    const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60);
    
    // Cap at a maximum of 24 hours to prevent excessive accumulation
    const hoursToCollect = Math.min(hoursSinceUpdate, 24);

    const empireBaseCount = await countPlayerBases(ctx, base.userId);
    const novaRatePerHour = effectiveNovaPerHourFromBase(
      base.novaPerCycle,
      empireBaseCount
    );

    // Calculate resources generated
    const novaGenerated = Math.floor(novaRatePerHour * hoursToCollect);
    const researchGenerated = Math.floor(base.researchPerCycle * hoursToCollect);
    const mineralsGenerated = Math.floor(base.mineralsPerCycle * hoursToCollect);
    const volatilesGenerated = Math.floor(base.volatilesPerCycle * hoursToCollect);
    
    // Apply production bonus if any
    const productionBonus = base.allProductionBonus / 100; // Convert percent to multiplier
    const totalNova = Math.floor(novaGenerated * (1 + productionBonus));
    
    // TODO: Add resources to player's account
    // This would require a user resources system
    
    // Update the base's last updated time
    await ctx.db.patch(args.baseId, {
      lastUpdated: now
    });
    
    return {
      nova: totalNova,
      research: researchGenerated,
      minerals: mineralsGenerated,
      volatiles: volatilesGenerated
    };
  }
});

// Check for completed structure upgrades
export const checkCompletedUpgrades = mutation({
  args: {
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args): Promise<{ completedStructures: { structureId: Id<'baseStructures'>; newLevel: number }[] }> => {
    await checkBaseOwnership(ctx, args.baseId);

    // Get all upgrading structures for this base
    const upgradingStructures = await ctx.db
      .query('baseStructures')
      .withIndex('by_upgrading', (q) => 
        q.eq('baseId', args.baseId).eq('upgrading', true)
      )
      .collect();
    
    const now = Date.now();
    const completedStructures: { structureId: Id<'baseStructures'>; newLevel: number }[] = [];
    
    console.log(`Checking ${upgradingStructures.length} upgrading structures at ${new Date(now).toISOString()}`);
    
    // Check each structure if it's complete
    for (const structure of upgradingStructures) {
      const timeRemaining = structure.upgradeCompleteTime ? structure.upgradeCompleteTime - now : 0;
      console.log(`Structure ${structure._id}: upgradeCompleteTime=${structure.upgradeCompleteTime}, now=${now}, timeRemaining=${timeRemaining}ms`);
      
      if (structure.upgradeCompleteTime && structure.upgradeCompleteTime <= now) {
        console.log(`Completing upgrade for structure ${structure._id}`);
        // Complete the upgrade
        const result = await ctx.runMutation(api.game.bases.baseMutations.completeStructureUpgrade, { structureId: structure._id });
        completedStructures.push({
          structureId: structure._id,
          newLevel: result.newLevel
        });
        console.log(`Completed upgrade for structure ${structure._id} to level ${result.newLevel}`);
      }
    }
    
    console.log(`Completed ${completedStructures.length} structure upgrades`);
    return { completedStructures };
  }
});

// --- Admin CRUD for Structure Definitions ---

export const adminCreateStructureDefinition = mutation({
  args: structureDefinitions.validator, // Use the full validator for creation args
  handler: async (ctx, args) => {
    await getAdminUser(ctx);


    const existing = await ctx.db
      .query('structureDefinitions')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique();

    if (existing) {
      throw new Error(`Structure definition with name '${args.name}' already exists.`);
    }

    return await ctx.db.insert('structureDefinitions', args);
  },
});

export const adminUpdateStructureDefinition = mutation({
  args: {
    id: v.id('structureDefinitions'),
    updates: v.object(
      // Create an object where each field from structureDefinitions.validator.fields is optional.
      // This allows for partial updates.
      Object.fromEntries(
        Object.entries(structureDefinitions.validator.fields).map(([key, value]) => [
          key, v.optional(value)
        ])
      ) as Record<keyof typeof structureDefinitions.validator.fields, ReturnType<typeof v.optional>>
      // The 'as Record<...>' provides a more specific type than 'any' for the resulting validator object,
      // though Convex's v.object typing is inherently somewhat dynamic here.
      // For the handler, args.updates will be correctly typed as Partial<Infer<typeof structureDefinitions.validator>>.
    ),
  },
  handler: async (ctx, { id, updates }) => {
    await getAdminUser(ctx);

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Structure definition with id '${id}' not found.`);
    }

    // Prevent changing the name if it's part of updates and already exists elsewhere
    if (updates.name && typeof updates.name === 'string' && updates.name !== existing.name) {
      const conflicting = await ctx.db
        .query('structureDefinitions')
        .withIndex('by_name', (q) => q.eq('name', updates.name as string))
        .unique();
      if (conflicting && conflicting._id !== id) {
        throw new Error(`Another structure definition with name '${updates.name}' already exists.`);
      }
    }

    await ctx.db.patch(id, updates as Partial<Doc<'structureDefinitions'>>);
    return await ctx.db.get(id);
  },
});

export const adminDeleteStructureDefinition = mutation({
  args: { id: v.id('structureDefinitions') },
  handler: async (ctx, { id }) => {
    await getAdminUser(ctx);

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Structure definition with id '${id}' not found.`);
    }

    // TODO: Consider implications of deleting a structure definition
    // e.g., what happens to existing player structures of this type?
    // Or prevent deletion if in use.

    await ctx.db.delete(id);
    return { success: true, deletedId: id };
  },
});