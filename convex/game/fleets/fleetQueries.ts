import { v } from 'convex/values';
import { getAuthedUser } from '@cvx/utils';
import { query } from '../../_generated/server';
import { FLEET_STATUS } from './fleetActions';

// Get all fleets for the current user
export const getUserFleets = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);

    const fleets = await ctx.db
      .query('fleets')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .filter((q) => q.neq(q.field('status'), FLEET_STATUS.DESTROYED))
      .collect();

    // Enrich fleets with system information and ship counts
    const enrichedFleets = await Promise.all(
      fleets.map(async (fleet) => {
        // Get current system info
        const currentSystem = await ctx.db.get(fleet.currentSystemId);
        
        // Get destination system info if moving
        let destinationSystem = null;
        if (fleet.destinationSystemId) {
          destinationSystem = await ctx.db.get(fleet.destinationSystemId);
        }

        // Get ship count and details
        const ships = await ctx.db
          .query('playerShips')
          .withIndex('byFleetId', (q) => q.eq('fleetId', fleet._id))
          .collect();

        // Get ship blueprints for additional info
        const shipsWithBlueprints = await Promise.all(
          ships.map(async (ship) => {
            const blueprint = await ctx.db
              .query('shipBlueprints')
              .withIndex('byId', (q) => q.eq('id', ship.blueprintId))
              .unique();
            return {
              ...ship,
              blueprint
            };
          })
        );

        return {
          ...fleet,
          currentSystem,
          destinationSystem,
          ships: shipsWithBlueprints,
          shipCount: ships.length
        };
      })
    );

    return enrichedFleets;
  }
});

// Get fleets in a specific system (visible to all users)
export const getFleetsInSystem = query({
  args: {
    systemId: v.id('sectorSystems')
  },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await getAuthedUser(ctx);
    } catch (e) {
      // Anonymous users can still see fleets but with limited info
      user = null;
    }

    const fleets = await ctx.db
      .query('fleets')
      .withIndex('byCurrentSystem', (q) => q.eq('currentSystemId', args.systemId))
      .filter((q) => q.neq(q.field('status'), FLEET_STATUS.DESTROYED))
      .collect();

    // Enrich with limited information
    const enrichedFleets = await Promise.all(
      fleets.map(async (fleet) => {
        // Get fleet owner info
        const owner = await ctx.db.get(fleet.userId);
        
        // Get ship count
        const ships = await ctx.db
          .query('playerShips')
          .withIndex('byFleetId', (q) => q.eq('fleetId', fleet._id))
          .collect();

        // Return different levels of detail based on ownership
        if (user && fleet.userId === user._id) {
          // Full details for own fleets
          const shipsWithBlueprints = await Promise.all(
            ships.map(async (ship) => {
              const blueprint = await ctx.db
                .query('shipBlueprints')
                .withIndex('byId', (q) => q.eq('id', ship.blueprintId))
                .unique();
              return {
                ...ship,
                blueprint
              };
            })
          );

          return {
            ...fleet,
            owner: owner?.username || 'Unknown',
            isOwnFleet: true,
            ships: shipsWithBlueprints,
            shipCount: ships.length
          };
        } else {
          // Limited details for other players' fleets
          return {
            _id: fleet._id,
            name: fleet.name,
            userId: fleet.userId,
            owner: owner?.username || 'Unknown',
            status: fleet.status,
            shipCount: ships.length,
            isOwnFleet: false,
            // Hide exact stats for other players
            approximatePower: Math.floor((fleet.totalDamage + fleet.totalDefense) / 10) * 10
          };
        }
      })
    );

    return enrichedFleets;
  }
});

// Get detailed information about a specific fleet
export const getFleetDetails = query({
  args: {
    fleetId: v.id('fleets')
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    const fleet = await ctx.db.get(args.fleetId);
    if (!fleet) {
      throw new Error('Fleet not found');
    }

    // Only allow viewing own fleets in detail
    if (fleet.userId !== user._id) {
      throw new Error('You can only view details of your own fleets');
    }

    // Get current system info
    const currentSystem = await ctx.db.get(fleet.currentSystemId);
    
    // Get destination system info if moving
    let destinationSystem = null;
    if (fleet.destinationSystemId) {
      destinationSystem = await ctx.db.get(fleet.destinationSystemId);
    }

    // Get ships with full details
    const ships = await ctx.db
      .query('playerShips')
      .withIndex('byFleetId', (q) => q.eq('fleetId', args.fleetId))
      .collect();

    const shipsWithBlueprints = await Promise.all(
      ships.map(async (ship) => {
        const blueprint = await ctx.db
          .query('shipBlueprints')
          .withIndex('byId', (q) => q.eq('id', ship.blueprintId))
          .unique();
        return {
          ...ship,
          blueprint
        };
      })
    );

    return {
      ...fleet,
      currentSystem,
      destinationSystem,
      ships: shipsWithBlueprints
    };
  }
});

// Get user's fleet limits and current status
export const getFleetLimits = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);

    // Get user's bases count
    const userBases = await ctx.db
      .query('playerBases')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    // Get user's current fleets count (base and mobile separately)
    const allFleets = await ctx.db
      .query('fleets')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .filter((q) => q.neq(q.field('status'), FLEET_STATUS.DESTROYED))
      .collect();

    const baseFleets = allFleets.filter(fleet => fleet.isBaseFleet);
    const mobileFleets = allFleets.filter(fleet => !fleet.isBaseFleet);

    // Calculate max mobile fleets: bases + 1 + research bonus (placeholder for future research)
    const researchBonus = 0; // TODO: Implement research bonus
    const maxMobileFleets = userBases.length + 1 + researchBonus;

    return {
      totalFleets: allFleets.length,
      baseFleets: baseFleets.length,
      mobileFleets: mobileFleets.length,
      maxMobileFleets,
      canCreateMoreMobile: mobileFleets.length < maxMobileFleets,
      basesCount: userBases.length,
      researchBonus
    };
  }
});

// Get ships available for fleet assignment (ships not currently in any fleet)
export const getAvailableShips = query({
  args: {
    baseId: v.optional(v.id('playerBases'))
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    let shipsQuery = ctx.db
      .query('playerShips')
      .withIndex('byUserId', (q) => q.eq('userId', user._id));

    // Filter by base if specified
    if (args.baseId) {
      shipsQuery = shipsQuery.filter((q) => q.eq(q.field('baseId'), args.baseId));
    }

    const ships = await shipsQuery.collect();

    // Filter out ships already in fleets
    const availableShips = ships.filter(ship => !ship.fleetId);

    // Enrich with blueprint information
    const shipsWithBlueprints = await Promise.all(
      availableShips.map(async (ship) => {
        const blueprint = await ctx.db
          .query('shipBlueprints')
          .withIndex('byId', (q) => q.eq('id', ship.blueprintId))
          .unique();
        
        // Get base information
        const base = await ctx.db.get(ship.baseId);
        
        return {
          ...ship,
          blueprint,
          base
        };
      })
    );

    return shipsWithBlueprints;
  }
});

// Get fleets that are currently moving and their arrival times
export const getMovingFleets = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);

    const movingFleets = await ctx.db
      .query('fleets')
      .withIndex('byUserAndStatus', (q) => 
        q.eq('userId', user._id).eq('status', FLEET_STATUS.MOVING)
      )
      .collect();

    // Enrich with system information
    const enrichedFleets = await Promise.all(
      movingFleets.map(async (fleet) => {
        const currentSystem = await ctx.db.get(fleet.currentSystemId);
        const destinationSystem = fleet.destinationSystemId 
          ? await ctx.db.get(fleet.destinationSystemId)
          : null;

        const timeRemaining = fleet.arrivalTime 
          ? Math.max(0, fleet.arrivalTime - Date.now())
          : 0;

        return {
          ...fleet,
          currentSystem,
          destinationSystem,
          timeRemaining,
          canComplete: timeRemaining === 0
        };
      })
    );

    return enrichedFleets;
  }
});

// Get combat-capable fleets in a system (for attack interface)
export const getCombatTargets = query({
  args: {
    systemId: v.id('sectorSystems')
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);

    const fleets = await ctx.db
      .query('fleets')
      .withIndex('byCurrentSystem', (q) => q.eq('currentSystemId', args.systemId))
      .filter((q) => 
        q.and(
          q.neq(q.field('userId'), user._id), // Not own fleets
          q.neq(q.field('status'), FLEET_STATUS.DESTROYED), // Not destroyed
          q.neq(q.field('status'), FLEET_STATUS.IN_COMBAT), // Not already in combat
          q.gt(q.field('totalDamage'), 0) // Has combat capability
        )
      )
      .collect();

    // Enrich with owner information
    const enrichedFleets = await Promise.all(
      fleets.map(async (fleet) => {
        const owner = await ctx.db.get(fleet.userId);
        
        return {
          _id: fleet._id,
          name: fleet.name,
          owner: owner?.username || 'Unknown',
          status: fleet.status,
          shipCount: await ctx.db
            .query('playerShips')
            .withIndex('byFleetId', (q) => q.eq('fleetId', fleet._id))
            .collect()
            .then(ships => ships.length),
          approximatePower: Math.floor((fleet.totalDamage + fleet.totalDefense) / 10) * 10
        };
      })
    );

    return enrichedFleets;
  }
});
