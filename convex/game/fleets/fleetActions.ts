import { v } from 'convex/values';
import { getAuthedUser } from '@cvx/utils';
import { mutation } from '../../_generated/server';
import { Id } from '../../_generated/dataModel';

// Fleet status constants
export const FLEET_STATUS = {
  IDLE: 'idle',
  MOVING: 'moving',
  IN_COMBAT: 'in-combat',
  DESTROYED: 'destroyed'
} as const;

// Base fleet capacity (can be increased by research/structures)
const BASE_FLEET_CAPACITY = 100;

// Helper function to calculate fleet stats from ships
async function calculateFleetStats(ctx: any, fleetId: Id<'fleets'>) {
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
async function getNextFleetNumber(ctx: any, userId: Id<'users'>) {
  const existingFleets = await ctx.db
    .query('fleets')
    .withIndex('byUserId', (q: any) => q.eq('userId', userId))
    .collect();

  const maxFleetNumber = existingFleets.reduce((max: number, fleet: any) => {
    return Math.max(max, fleet.fleetNumber || 0);
  }, 0);

  return maxFleetNumber + 1;
}

// Helper function to check mobile fleet limits (base fleets don't count)
async function checkMobileFleetLimits(ctx: any, userId: Id<'users'>) {
  // Get user's bases count
  const userBases = await ctx.db
    .query('playerBases')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
    .collect();

  // Get user's current mobile fleets count (excluding destroyed and base fleets)
  const currentMobileFleets = await ctx.db
    .query('fleets')
    .withIndex('byUserAndFleetType', (q: any) => q.eq('userId', userId).eq('isBaseFleet', false))
    .filter((q: any) => q.neq(q.field('status'), FLEET_STATUS.DESTROYED))
    .collect();

  // Calculate max mobile fleets: bases + 1 + research bonus (placeholder for future research)
  const researchBonus = 0; // TODO: Implement research bonus
  const maxMobileFleets = userBases.length + 1 + researchBonus;

  return {
    currentMobileFleets: currentMobileFleets.length,
    maxMobileFleets,
    canCreateMore: currentMobileFleets.length < maxMobileFleets
  };
}

// Helper function to calculate movement time
function calculateMovementTime(
  fromX: number, fromY: number, fromSectorX: number, fromSectorY: number, fromGalaxy: number,
  toX: number, toY: number, toSectorX: number, toSectorY: number, toGalaxy: number,
  fleetSpeed: number
): number {
  // Calculate distance between systems
  let distance = 0;

  if (fromGalaxy !== toGalaxy) {
    // Cross-galaxy travel (very expensive)
    distance = 1000;
  } else if (fromSectorX !== toSectorX || fromSectorY !== toSectorY) {
    // Cross-sector travel
    const sectorDistance = Math.sqrt(
      Math.pow(toSectorX - fromSectorX, 2) + Math.pow(toSectorY - fromSectorY, 2)
    );
    distance = sectorDistance * 100 + Math.sqrt(
      Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2)
    );
  } else {
    // Same sector travel
    distance = Math.sqrt(
      Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2)
    );
  }

  // Movement time = distance / speed (minimum 1 minute, maximum based on speed)
  const baseTimeMinutes = Math.max(1, distance / Math.max(1, fleetSpeed));
  return Date.now() + (baseTimeMinutes * 60 * 1000); // Convert to milliseconds
}

// Split ships from an existing fleet into a new mobile fleet
export const splitFleetShips = mutation({
  args: {
    sourceFleetId: v.id('fleets'),
    shipIds: v.array(v.id('playerShips'))
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    // Get the source fleet and verify ownership
    const sourceFleet = await ctx.db.get(args.sourceFleetId);
    if (!sourceFleet) {
      throw new Error('Source fleet not found');
    }
    if (sourceFleet.userId !== user._id) {
      throw new Error('You can only split ships from your own fleets');
    }

    // Check if fleet is in a state that allows modifications
    if (sourceFleet.status === FLEET_STATUS.IN_COMBAT) {
      throw new Error('Cannot split fleet during combat');
    }
    if (sourceFleet.status === FLEET_STATUS.MOVING) {
      throw new Error('Cannot split fleet while moving');
    }

    // Verify ships belong to the source fleet
    for (const shipId of args.shipIds) {
      const ship = await ctx.db.get(shipId);
      if (!ship) {
        throw new Error(`Ship ${shipId} not found`);
      }
      if (ship.userId !== user._id) {
        throw new Error(`You don't own ship ${shipId}`);
      }
      if (ship.fleetId !== args.sourceFleetId) {
        throw new Error(`Ship ${shipId} is not in the source fleet`);
      }
    }

    // Check mobile fleet limits (only if creating a mobile fleet)
    if (!sourceFleet.isBaseFleet) {
      const fleetLimits = await checkMobileFleetLimits(ctx, user._id);
      if (!fleetLimits.canCreateMore) {
        throw new Error(`Mobile fleet limit reached. You can have maximum ${fleetLimits.maxMobileFleets} mobile fleets.`);
      }
    }

    // Create new mobile fleet
    const fleetNumber = await getNextFleetNumber(ctx, user._id);
    const newFleetId = await ctx.db.insert('fleets', {
      userId: user._id,
      name: `Fleet ${fleetNumber}`,
      fleetNumber,
      isBaseFleet: false,
      currentSystemId: sourceFleet.currentSystemId,
      currentGalaxyNumber: sourceFleet.currentGalaxyNumber,
      currentSectorX: sourceFleet.currentSectorX,
      currentSectorY: sourceFleet.currentSectorY,
      currentSystemX: sourceFleet.currentSystemX,
      currentSystemY: sourceFleet.currentSystemY,
      status: FLEET_STATUS.IDLE,
      totalDamage: 0,
      totalDefense: 0,
      totalShielding: 0,
      totalHealth: 0,
      maxHealth: 0,
      fleetSpeed: 0,
      currentCapacity: 0,
      maxCapacity: BASE_FLEET_CAPACITY,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });

    // Move ships to new fleet
    for (const shipId of args.shipIds) {
      await ctx.db.patch(shipId, { fleetId: newFleetId });
    }

    // Recalculate stats for both fleets
    const [sourceStats, newFleetStats] = await Promise.all([
      calculateFleetStats(ctx, args.sourceFleetId),
      calculateFleetStats(ctx, newFleetId)
    ]);

    await Promise.all([
      ctx.db.patch(args.sourceFleetId, {
        ...sourceStats,
        lastUpdated: Date.now()
      }),
      ctx.db.patch(newFleetId, {
        ...newFleetStats,
        lastUpdated: Date.now()
      })
    ]);

    return { 
      newFleetId, 
      message: `Fleet ${fleetNumber} created with ${args.shipIds.length} ships split from source fleet` 
    };
  }
});

// Add ships to a fleet
export const addShipsToFleet = mutation({
  args: {
    fleetId: v.id('fleets'),
    shipIds: v.array(v.id('playerShips'))
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    // Get the fleet and verify ownership
    const fleet = await ctx.db.get(args.fleetId);
    if (!fleet) {
      throw new Error('Fleet not found');
    }
    if (fleet.userId !== user._id) {
      throw new Error('You can only modify your own fleets');
    }

    // Check if fleet is in a state that allows modifications
    if (fleet.status === FLEET_STATUS.IN_COMBAT) {
      throw new Error('Cannot modify fleet composition during combat');
    }
    if (fleet.status === FLEET_STATUS.DESTROYED) {
      throw new Error('Cannot add ships to a destroyed fleet');
    }

    // Verify ships and check capacity
    let additionalCapacity = 0;
    for (const shipId of args.shipIds) {
      const ship = await ctx.db.get(shipId);
      if (!ship) {
        throw new Error(`Ship ${shipId} not found`);
      }
      if (ship.userId !== user._id) {
        throw new Error(`You don't own ship ${shipId}`);
      }
      if (ship.fleetId) {
        throw new Error(`Ship ${shipId} is already assigned to a fleet`);
      }

      // Get blueprint for capacity calculation
      const blueprint = await ctx.db
        .query('shipBlueprints')
        .withIndex('byId', (q) => q.eq('id', ship.blueprintId))
        .unique();
      
      if (blueprint) {
        additionalCapacity += blueprint.fleetCapacityCost;
      }
    }

    // Check capacity limits
    if (fleet.currentCapacity + additionalCapacity > fleet.maxCapacity) {
      throw new Error(`Adding these ships would exceed fleet capacity (${fleet.currentCapacity + additionalCapacity}/${fleet.maxCapacity})`);
    }

    // Add ships to fleet
    for (const shipId of args.shipIds) {
      await ctx.db.patch(shipId, { fleetId: args.fleetId });
    }

    // Recalculate fleet stats
    const stats = await calculateFleetStats(ctx, args.fleetId);
    await ctx.db.patch(args.fleetId, {
      ...stats,
      lastUpdated: Date.now()
    });

    return { message: `${args.shipIds.length} ships added to fleet successfully` };
  }
});

// Remove ships from a fleet
export const removeShipsFromFleet = mutation({
  args: {
    shipIds: v.array(v.id('playerShips'))
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    // Verify ships and get their fleet
    let fleetId: Id<'fleets'> | null = null;
    for (const shipId of args.shipIds) {
      const ship = await ctx.db.get(shipId);
      if (!ship) {
        throw new Error(`Ship ${shipId} not found`);
      }
      if (ship.userId !== user._id) {
        throw new Error(`You don't own ship ${shipId}`);
      }
      if (!ship.fleetId) {
        throw new Error(`Ship ${shipId} is not assigned to any fleet`);
      }

      // Ensure all ships are from the same fleet
      if (fleetId === null) {
        fleetId = ship.fleetId;
      } else if (fleetId !== ship.fleetId) {
        throw new Error('All ships must be from the same fleet');
      }
    }

    if (!fleetId) {
      throw new Error('No valid fleet found');
    }

    // Verify fleet ownership
    const fleet = await ctx.db.get(fleetId);
    if (!fleet || fleet.userId !== user._id) {
      throw new Error('You can only modify your own fleets');
    }

    // Check if fleet is in a state that allows modifications
    if (fleet.status === FLEET_STATUS.IN_COMBAT) {
      throw new Error('Cannot modify fleet composition during combat');
    }

    // Remove ships from fleet
    for (const shipId of args.shipIds) {
      await ctx.db.patch(shipId, { fleetId: undefined });
    }

    // Recalculate fleet stats
    const stats = await calculateFleetStats(ctx, fleetId);
    await ctx.db.patch(fleetId, {
      ...stats,
      lastUpdated: Date.now()
    });

    return { message: `${args.shipIds.length} ships removed from fleet successfully` };
  }
});

// Move fleet to a different system
export const moveFleet = mutation({
  args: {
    fleetId: v.id('fleets'),
    destinationSystemId: v.id('sectorSystems')
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    // Get the fleet and verify ownership
    const fleet = await ctx.db.get(args.fleetId);
    if (!fleet) {
      throw new Error('Fleet not found');
    }
    if (fleet.userId !== user._id) {
      throw new Error('You can only control your own fleets');
    }

    // Check if fleet can move
    if (fleet.status === FLEET_STATUS.IN_COMBAT) {
      throw new Error('Fleet is in combat and cannot move');
    }
    if (fleet.status === FLEET_STATUS.DESTROYED) {
      throw new Error('Destroyed fleets cannot move');
    }
    if (fleet.status === FLEET_STATUS.MOVING) {
      throw new Error('Fleet is already moving');
    }

    // Check if fleet has ships
    if (fleet.fleetSpeed === 0) {
      throw new Error('Fleet has no ships or ships have no movement capability');
    }

    // Get destination system
    const destinationSystem = await ctx.db.get(args.destinationSystemId);
    if (!destinationSystem) {
      throw new Error('Destination system not found');
    }

    // Check if fleet is already at destination
    if (fleet.currentSystemId === args.destinationSystemId) {
      throw new Error('Fleet is already at the destination system');
    }

    // Calculate movement time
    const arrivalTime = calculateMovementTime(
      fleet.currentSystemX, fleet.currentSystemY, 
      fleet.currentSectorX, fleet.currentSectorY, 
      fleet.currentGalaxyNumber,
      destinationSystem.systemX, destinationSystem.systemY,
      destinationSystem.sectorX, destinationSystem.sectorY,
      destinationSystem.galaxyNumber,
      fleet.fleetSpeed
    );

    // Update fleet with movement information
    await ctx.db.patch(args.fleetId, {
      status: FLEET_STATUS.MOVING,
      destinationSystemId: args.destinationSystemId,
      destinationGalaxyNumber: destinationSystem.galaxyNumber,
      destinationSectorX: destinationSystem.sectorX,
      destinationSectorY: destinationSystem.sectorY,
      destinationSystemX: destinationSystem.systemX,
      destinationSystemY: destinationSystem.systemY,
      arrivalTime,
      lastUpdated: Date.now()
    });

    const travelTimeMinutes = Math.round((arrivalTime - Date.now()) / (60 * 1000));
    return { 
      message: `Fleet is now moving to destination. Estimated arrival: ${travelTimeMinutes} minutes`,
      arrivalTime 
    };
  }
});

// Complete fleet movement (called when arrival time is reached)
export const completeFleetMovement = mutation({
  args: {
    fleetId: v.id('fleets')
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    // Get the fleet and verify ownership
    const fleet = await ctx.db.get(args.fleetId);
    if (!fleet) {
      throw new Error('Fleet not found');
    }
    if (fleet.userId !== user._id) {
      throw new Error('You can only control your own fleets');
    }

    // Check if fleet is actually moving and arrival time has passed
    if (fleet.status !== FLEET_STATUS.MOVING) {
      throw new Error('Fleet is not currently moving');
    }
    if (!fleet.arrivalTime || Date.now() < fleet.arrivalTime) {
      throw new Error('Fleet has not yet reached its destination');
    }
    if (!fleet.destinationSystemId) {
      throw new Error('Fleet has no destination');
    }

    // Update fleet location
    await ctx.db.patch(args.fleetId, {
      currentSystemId: fleet.destinationSystemId,
      currentGalaxyNumber: fleet.destinationGalaxyNumber!,
      currentSectorX: fleet.destinationSectorX!,
      currentSectorY: fleet.destinationSectorY!,
      currentSystemX: fleet.destinationSystemX!,
      currentSystemY: fleet.destinationSystemY!,
      status: FLEET_STATUS.IDLE,
      destinationSystemId: undefined,
      destinationGalaxyNumber: undefined,
      destinationSectorX: undefined,
      destinationSectorY: undefined,
      destinationSystemX: undefined,
      destinationSystemY: undefined,
      arrivalTime: undefined,
      lastUpdated: Date.now()
    });

    return { message: 'Fleet has arrived at its destination' };
  }
});

// Attack another fleet
export const attackFleet = mutation({
  args: {
    attackerFleetId: v.id('fleets'),
    defenderFleetId: v.id('fleets')
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    // Get both fleets
    const attackerFleet = await ctx.db.get(args.attackerFleetId);
    const defenderFleet = await ctx.db.get(args.defenderFleetId);

    if (!attackerFleet) {
      throw new Error('Attacker fleet not found');
    }
    if (!defenderFleet) {
      throw new Error('Defender fleet not found');
    }

    // Verify attacker ownership
    if (attackerFleet.userId !== user._id) {
      throw new Error('You can only control your own fleets');
    }

    // Prevent self-attack
    if (defenderFleet.userId === user._id) {
      throw new Error('You cannot attack your own fleets');
    }

    // Check if fleets are in the same system
    if (attackerFleet.currentSystemId !== defenderFleet.currentSystemId) {
      throw new Error('Fleets must be in the same system to engage in combat');
    }

    // Check fleet states
    if (attackerFleet.status !== FLEET_STATUS.IDLE) {
      throw new Error('Attacking fleet must be idle to initiate combat');
    }
    if (defenderFleet.status === FLEET_STATUS.DESTROYED) {
      throw new Error('Cannot attack a destroyed fleet');
    }
    if (defenderFleet.status === FLEET_STATUS.IN_COMBAT) {
      throw new Error('Defender fleet is already in combat');
    }

    // Check if attacker has ships
    if (attackerFleet.totalDamage === 0) {
      throw new Error('Fleet has no combat-capable ships');
    }

    // Simple combat resolution (can be made more complex later)
    // Calculate damage
    const attackerDamage = Math.max(0, attackerFleet.totalDamage - defenderFleet.totalShielding);
    const defenderDamage = Math.max(0, defenderFleet.totalDamage - attackerFleet.totalShielding);

    // Apply damage
    const attackerNewHealth = Math.max(0, attackerFleet.totalHealth - defenderDamage);
    const defenderNewHealth = Math.max(0, defenderFleet.totalHealth - attackerDamage);

    // Determine winner
    const attackerWins = defenderNewHealth <= 0 && attackerNewHealth > 0;
    const defenderWins = attackerNewHealth <= 0 && defenderNewHealth > 0;
    const bothDestroyed = attackerNewHealth <= 0 && defenderNewHealth <= 0;

    // Update fleets based on results
    if (attackerWins) {
      await ctx.db.patch(args.attackerFleetId, {
        totalHealth: attackerNewHealth,
        status: FLEET_STATUS.IDLE,
        lastUpdated: Date.now()
      });
      await ctx.db.patch(args.defenderFleetId, {
        status: FLEET_STATUS.DESTROYED,
        totalHealth: 0,
        lastUpdated: Date.now()
      });

      // TODO: Implement ship destruction/damage logic
      
      return { 
        result: 'victory',
        message: 'Combat complete! Your fleet is victorious!',
        attackerSurvived: true,
        defenderSurvived: false
      };
    } else if (defenderWins) {
      await ctx.db.patch(args.attackerFleetId, {
        status: FLEET_STATUS.DESTROYED,
        totalHealth: 0,
        lastUpdated: Date.now()
      });
      await ctx.db.patch(args.defenderFleetId, {
        totalHealth: defenderNewHealth,
        status: FLEET_STATUS.IDLE,
        lastUpdated: Date.now()
      });

      return { 
        result: 'defeat',
        message: 'Combat complete! Your fleet was destroyed.',
        attackerSurvived: false,
        defenderSurvived: true
      };
    } else if (bothDestroyed) {
      await ctx.db.patch(args.attackerFleetId, {
        status: FLEET_STATUS.DESTROYED,
        totalHealth: 0,
        lastUpdated: Date.now()
      });
      await ctx.db.patch(args.defenderFleetId, {
        status: FLEET_STATUS.DESTROYED,
        totalHealth: 0,
        lastUpdated: Date.now()
      });

      return { 
        result: 'mutual_destruction',
        message: 'Combat complete! Both fleets were destroyed.',
        attackerSurvived: false,
        defenderSurvived: false
      };
    } else {
      // Both survive with damage
      await ctx.db.patch(args.attackerFleetId, {
        totalHealth: attackerNewHealth,
        status: FLEET_STATUS.IDLE,
        lastUpdated: Date.now()
      });
      await ctx.db.patch(args.defenderFleetId, {
        totalHealth: defenderNewHealth,
        status: FLEET_STATUS.IDLE,
        lastUpdated: Date.now()
      });

      return { 
        result: 'stalemate',
        message: 'Combat complete! Both fleets survived with damage.',
        attackerSurvived: true,
        defenderSurvived: true
      };
    }
  }
});

// Disband/delete a fleet
export const disbandFleet = mutation({
  args: {
    fleetId: v.id('fleets')
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    // Get the fleet and verify ownership
    const fleet = await ctx.db.get(args.fleetId);
    if (!fleet) {
      throw new Error('Fleet not found');
    }
    if (fleet.userId !== user._id) {
      throw new Error('You can only disband your own fleets');
    }

    // Check if fleet can be disbanded
    if (fleet.status === FLEET_STATUS.IN_COMBAT) {
      throw new Error('Cannot disband fleet during combat');
    }

    // Remove all ships from the fleet
    const ships = await ctx.db
      .query('playerShips')
      .withIndex('byFleetId', (q) => q.eq('fleetId', args.fleetId))
      .collect();

    for (const ship of ships) {
      await ctx.db.patch(ship._id, { fleetId: undefined });
    }

    // Delete the fleet
    await ctx.db.delete(args.fleetId);

    return { message: `Fleet disbanded. ${ships.length} ships are now unassigned.` };
  }
});
