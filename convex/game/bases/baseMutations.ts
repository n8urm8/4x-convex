// src/game/bases/structureMutations.ts
import { mutation } from '../../_generated/server';
import { v } from 'convex/values';
import { Doc, Id } from '../../_generated/dataModel';
import { api } from '../../_generated/api';

// Create a new base on a planet
export const createBase = mutation({
  args: {
    userId: v.id('users'),
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
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
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
      throw new Error("There is already a base on this planet");
    }
    
    // Calculate initial base stats based on planet type
    const initialSpace = 20 + (planetType.space || 0);
    const initialEnergy = 10 + (planetType.energy || 0);
    const initialMinerals = 2 + (planetType.minerals || 0);
    const initialVolatiles = 1 + (planetType.volatiles || 0);
    
    // Create the base
    const baseId = await ctx.db.insert('playerBases', {
      userId: args.userId,
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
    // Get the base
    const base = await ctx.db.get(args.baseId);
    if (!base) {
      throw new Error("Base not found");
    }
    
    // Get the structure definition
    const structureDef = await ctx.db.get(args.structureDefId);
    if (!structureDef) {
      throw new Error("Structure definition not found");
    }
    
    // Check if the structure is already built in this base
    const existingStructure = await ctx.db
      .query('baseStructures')
      .withIndex('by_structure_type', (q) => 
        q.eq('baseId', args.baseId).eq('structureDefId', args.structureDefId)
      )
      .first();
    
    if (existingStructure) {
      throw new Error("This structure is already built in this base");
    }
    
    // Check if base has enough space and energy
    if (base.totalSpace - base.usedSpace < structureDef.baseSpaceCost) {
      throw new Error("Not enough space available in the base");
    }
    
    if (base.totalEnergy - base.usedEnergy < structureDef.baseEnergyCost) {
      throw new Error("Not enough energy available in the base");
    }
    
    // TODO: Implement logic to check requirements against player's tech and resources
    // This would depend on your research system implementation
    
    // Calculate build time based on nova cost and base bonuses
    const buildTimeReduction = base.buildTimeReduction; // % reduction
    const novaCost = structureDef.baseNovaCost;
    const buildTime = Math.round(
      (3600000 * (novaCost / 1000)) * (1 - buildTimeReduction / 100)
    ); // 1 hour per 1000 nova cost, reduced by buildTimeReduction
    
    const buildCompleteTime = Date.now() + buildTime;
    
    // Start the build
    const structureId = await ctx.db.insert('baseStructures', {
      baseId: args.baseId,
      structureDefId: args.structureDefId,
      level: 0, // Start at level 0 while building
      spaceCost: structureDef.baseSpaceCost,
      energyCost: structureDef.baseEnergyCost,
      upgrading: true, // Initial build is treated as an upgrade from 0 to 1
      upgradeCompleteTime: buildCompleteTime,
      upgradeLevel: 1,
      upgradeNovaCost: novaCost,
      // No current effects yet (building)
      currentEffects: {}
    });
    
    // Update base stats for the space and energy usage
    await ctx.db.patch(args.baseId, {
      usedSpace: base.usedSpace + structureDef.baseSpaceCost,
      usedEnergy: base.usedEnergy + structureDef.baseEnergyCost,
      lastUpdated: Date.now()
    });
    
    return { 
      structureId,
      buildCompleteTime
    };
  }
});

// Helper function to calculate structure effects at a given level
function calculateStructureEffects(structureDef: Doc<"structureDefinitions">, level: number) {
  const effects = structureDef.effects || {};
  const effectsAtLevel: Record<string, number> = {};
  
  Object.entries(effects).forEach(([key, value]) => {
    if (typeof value === 'number') {
      // For level 1, use the base value
      if (level === 1) {
        effectsAtLevel[key] = value;
      } else {
        // For higher levels, calculate based on level
        effectsAtLevel[key] = value * level;
      }
    }
  });
  
  return effectsAtLevel;
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
    
    // Get the base
    const base = await ctx.db.get(structure.baseId);
    if (!base) {
      throw new Error("Base not found");
    }
    
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
    
    return { success: true, newLevel };
  }
});

// Start upgrading a structure
export const startStructureUpgrade = mutation({
  args: {
    structureId: v.id('baseStructures')
  },
  handler: async (ctx, args) => {
    // Get the structure
    const structure = await ctx.db.get(args.structureId);
    if (!structure) {
      throw new Error("Structure not found");
    }
    
    if (structure.upgrading) {
      throw new Error("Structure is already being upgraded");
    }
    
    // Get the structure definition
    const structureDef = await ctx.db.get(structure.structureDefId);
    if (!structureDef) {
      throw new Error("Structure definition not found");
    }
    
    // Check if already at max level
    if (structureDef.maxLevel && structure.level >= structureDef.maxLevel) {
      throw new Error("Structure already at maximum level");
    }
    
    // Get the base
    const base = await ctx.db.get(structure.baseId);
    if (!base) {
      throw new Error("Base not found");
    }
    
    // Calculate upgrade cost based on current level
    const level = structure.level;
    const nextLevel = level + 1;
    
    // Nova cost increases by 50% per level
    const novaCost = Math.round(structureDef.baseNovaCost * (1 + (level * 0.5)));
    
    // Calculate upgrade time based on nova cost and base bonuses
    const buildTimeReduction = base.buildTimeReduction; // % reduction
    const upgradeTime = Math.round(
      (3600000 * (novaCost / 1000) * (1 + (level * 0.2))) * (1 - buildTimeReduction / 100)
    ); // Base time is 1 hour per 1000 nova cost, increasing with level
    
    const upgradeCompleteTime = Date.now() + upgradeTime;
    
    // Start the upgrade
    await ctx.db.patch(args.structureId, {
      upgrading: true,
      upgradeCompleteTime,
      upgradeLevel: nextLevel,
      upgradeNovaCost: novaCost
    });
    
    return { 
      upgradeCompleteTime,
      newLevel: nextLevel,
      novaCost
    };
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
    
    if (!structure.upgrading) {
      throw new Error("Structure is not being upgraded");
    }
    
    // Cancel the upgrade
    await ctx.db.patch(args.structureId, {
      upgrading: false,
      upgradeCompleteTime: undefined,
      upgradeLevel: undefined,
      upgradeNovaCost: undefined
    });
    
    // If it's a new building (level 0), destroy it and free up resources
    if (structure.level === 0) {
      // Get the base
      const base = await ctx.db.get(structure.baseId);
      if (base) {
        // Free up the space and energy
        await ctx.db.patch(structure.baseId, {
          usedSpace: base.usedSpace - structure.spaceCost,
          usedEnergy: base.usedEnergy - structure.energyCost,
          lastUpdated: Date.now()
        });
      }
      
      // Delete the structure
      await ctx.db.delete(args.structureId);
    }
    
    return { success: true };
  }
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
    
    // Can't demolish a structure that's being upgraded
    if (structure.upgrading) {
      throw new Error("Cannot demolish a structure that is being upgraded");
    }
    
    // Get the base
    const base = await ctx.db.get(structure.baseId);
    if (!base) {
      throw new Error("Base not found");
    }
    
    // Get structure effects to remove from the base
    const effects = structure.currentEffects || {};
    
    // Update the base to remove structure effects
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

// Rename a base
export const renameBase = mutation({
  args: {
    baseId: v.id('playerBases'),
    name: v.string()
  },
  handler: async (ctx, args) => {
    // Get the base
    const base = await ctx.db.get(args.baseId);
    if (!base) {
      throw new Error("Base not found");
    }
    
    // Update the base name
    await ctx.db.patch(args.baseId, {
      name: args.name,
      lastUpdated: Date.now()
    });
    
    return { success: true };
  }
});

// Abandon a base
export const abandonBase = mutation({
  args: {
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args) => {
    // Get the base
    const base = await ctx.db.get(args.baseId);
    if (!base) {
      throw new Error("Base not found");
    }
    
    // Delete all structures in the base
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
    // Get the structure
    const structure = await ctx.db.get(args.structureId);
    if (!structure) {
      throw new Error("Structure not found");
    }
    
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

// Collect resources from a base
export const collectBaseResources = mutation({
  args: {
    baseId: v.id('playerBases')
  },
  handler: async (ctx, args) => {
    // Get the base
    const base = await ctx.db.get(args.baseId);
    if (!base) {
      throw new Error("Base not found");
    }
    
    // Calculate time since last update
    const now = Date.now();
    const timeSinceUpdate = now - base.lastUpdated;
    
    // Convert to hours
    const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60);
    
    // Cap at a maximum of 24 hours to prevent excessive accumulation
    const hoursToCollect = Math.min(hoursSinceUpdate, 24);
    
    // Calculate resources generated
    const novaGenerated = Math.floor(base.novaPerCycle * hoursToCollect);
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
    // Get all upgrading structures for this base
    const upgradingStructures = await ctx.db
      .query('baseStructures')
      .withIndex('by_upgrading', (q) => 
        q.eq('baseId', args.baseId).eq('upgrading', true)
      )
      .collect();
    
    const now = Date.now();
        const completedStructures: { structureId: Id<'baseStructures'>; newLevel: number }[] = [];
    
    // Check each structure if it's complete
    for (const structure of upgradingStructures) {
      if (structure.upgradeCompleteTime && structure.upgradeCompleteTime <= now) {
        // Complete the upgrade
        const result = await ctx.runMutation(api.game.bases.baseMutations.completeStructureUpgrade, { structureId: structure._id });
        completedStructures.push({
          structureId: structure._id,
          newLevel: result.newLevel
        });
      }
    }
    
    return { completedStructures };
  }
});