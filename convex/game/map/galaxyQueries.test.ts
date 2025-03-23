import { api } from '@cvx/_generated/api';
import schema from '@cvx/schema';
import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';

describe('Galaxy Queries', () => {
  test('planet types queries', async () => {
    const t = convexTest(schema);

    // Seed test data
    await t.run(async (ctx) => {
      await ctx.db.insert('planetTypes', {
        name: 'Terrestrial',
        category: 'habitable',
        habitable: true,
        space: 5,
        energy: 3,
        minerals: 4,
        volatiles: 2,
        description: 'Earth-like planet suitable for colonization'
      });
      await ctx.db.insert('planetTypes', {
        name: 'Gas Giant',
        category: 'uninhabitable',
        habitable: false,
        space: 0,
        energy: 1,
        minerals: 0,
        volatiles: 8,
        description: 'Massive gas planet unsuitable for colonization'
      });
    });

    // Test getAllPlanetTypes
    const allTypes = await t.query(
      api.game.map.galaxyQueries.getAllPlanetTypes
    );
    expect(allTypes).toHaveLength(2);

    // Test getPlanetTypesByCategory
    const habitableTypes = await t.query(
      api.game.map.galaxyQueries.getPlanetTypesByCategory,
      { category: 'habitable' }
    );
    expect(habitableTypes).toHaveLength(2);
    expect(habitableTypes[0].name).toBe('Terrestrial');
  });

  test('galaxy and sector queries', async () => {
    const t = convexTest(schema);

    // Seed test data
    await t.run(async (ctx) => {
      const galaxy = await ctx.db.insert('galaxies', {
        number: 1,
        groupId: 'alpha-quadrant'
      });
      await ctx.db.insert('galaxies', {
        number: 2,
        groupId: 'beta-quadrant'
      });
      await ctx.db.insert('galaxySectors', {
        galaxyId: galaxy,
        sectorX: 1,
        sectorY: 1
      });
    });

    // Test getAllGalaxies
    const allGalaxies = await t.query(
      api.game.map.galaxyQueries.getAllGalaxies
    );
    expect(allGalaxies).toHaveLength(2);

    // Test getGalaxyByNumber
    const galaxy = await t.query(api.game.map.galaxyQueries.getGalaxyByNumber, {
      number: 1
    });
    expect(galaxy?.number).toBe(1);
    expect(galaxy?.groupId).toBe('alpha-quadrant');

    // Test getGalaxySectors
    const sectors = await t.query(api.game.map.galaxyQueries.getGalaxySectors, {
      galaxyId: galaxy!._id
    });
    expect(sectors).toHaveLength(1);

    // Test getSectorByCoordinates
    const sector = await t.query(
      api.game.map.galaxyQueries.getSectorByCoordinates,
      {
        galaxyId: galaxy!._id,
        sectorX: 1,
        sectorY: 1
      }
    );
    expect(sector).toBeTruthy();
  });

  test('star system and planet queries', async () => {
    const t = convexTest(schema);

    // Seed test data
    await t.run(async (ctx) => {
      const planetType = await ctx.db.insert('planetTypes', {
        name: 'Terrestrial',
        category: 'habitable',
        habitable: true,
        space: 5,
        energy: 3,
        minerals: 4,
        volatiles: 2,
        description: 'Earth-like planet suitable for colonization'
      });

      const galaxy = await ctx.db.insert('galaxies', {
        number: 1,
        groupId: 'alpha-quadrant'
      });

      const sector = await ctx.db.insert('galaxySectors', {
        galaxyId: galaxy,
        sectorX: 1,
        sectorY: 1
      });

      const system = await ctx.db.insert('starSystems', {
        galaxySectorId: sector,
        systemX: 1,
        systemY: 1,
        starType: 'Yellow Dwarf',
        starSize: 1,
        starColor: '#FFD700'
      });

      await ctx.db.insert('systemPlanets', {
        starSystemId: system,
        planetTypeId: planetType,
        planetX: 1,
        planetY: 1
      });
    });

    // Get galaxy and sector IDs for testing
    const galaxy = await t.query(api.game.map.galaxyQueries.getGalaxyByNumber, {
      number: 1
    });
    const sector = await t.query(
      api.game.map.galaxyQueries.getSectorByCoordinates,
      {
        galaxyId: galaxy!._id,
        sectorX: 1,
        sectorY: 1
      }
    );

    // Test getSectorSystems
    const systems = await t.query(api.game.map.galaxyQueries.getSectorSystems, {
      sectorId: sector!._id
    });
    expect(systems).toHaveLength(1);
    expect(systems[0].starType).toBe('Yellow Dwarf');

    // Test getStarSystemByCoordinates
    const system = await t.query(
      api.game.map.galaxyQueries.getStarSystemByCoordinates,
      {
        sectorId: sector!._id,
        systemX: 1,
        systemY: 1
      }
    );
    expect(system).toBeTruthy();
    expect(system?.starType).toBe('Yellow Dwarf');

    // Test getSystemPlanets
    const planets = await t.query(api.game.map.galaxyQueries.getSystemPlanets, {
      systemId: system!._id
    });
    expect(planets).toHaveLength(1);
    expect(planets[0].type).toBeTruthy();
    expect(planets[0].type?.name).toBe('Terrestrial');

    // Test getPlanetByCoordinates
    const planet = await t.query(
      api.game.map.galaxyQueries.getPlanetByCoordinates,
      {
        systemId: system!._id,
        planetX: 1,
        planetY: 1
      }
    );
    expect(planet).toBeTruthy();
    expect(planet?.type).toBeTruthy();
    expect(planet?.type?.name).toBe('Terrestrial');
  });

  test('getPlanetsByType query', async () => {
    const t = convexTest(schema);

    // Seed test data
    await t.run(async (ctx) => {
      const terrestrialType = await ctx.db.insert('planetTypes', {
        name: 'Terrestrial',
        category: 'habitable',
        habitable: true,
        space: 5,
        energy: 3,
        minerals: 4,
        volatiles: 2,
        description: 'Earth-like planet'
      });

      const gasGiantType = await ctx.db.insert('planetTypes', {
        name: 'Gas Giant',
        category: 'uninhabitable',
        habitable: false,
        space: 0,
        energy: 1,
        minerals: 0,
        volatiles: 8,
        description: 'Massive gas planet'
      });

      const galaxy = await ctx.db.insert('galaxies', {
        number: 1,
        groupId: 'alpha-quadrant'
      });

      const sector = await ctx.db.insert('galaxySectors', {
        galaxyId: galaxy,
        sectorX: 1,
        sectorY: 1
      });

      const system = await ctx.db.insert('starSystems', {
        galaxySectorId: sector,
        systemX: 1,
        systemY: 1,
        starType: 'Yellow Dwarf',
        starSize: 1,
        starColor: '#FFD700'
      });

      // Add multiple planets of different types
      await ctx.db.insert('systemPlanets', {
        starSystemId: system,
        planetTypeId: terrestrialType,
        planetX: 1,
        planetY: 1
      });

      await ctx.db.insert('systemPlanets', {
        starSystemId: system,
        planetTypeId: terrestrialType,
        planetX: 2,
        planetY: 2
      });

      await ctx.db.insert('systemPlanets', {
        starSystemId: system,
        planetTypeId: gasGiantType,
        planetX: 3,
        planetY: 3
      });
    });

    // Test getPlanetsByType for terrestrial planets
    const terrestrialPlanets = await t.query(
      api.game.map.galaxyQueries.getPlanetsByType,
      {
        planetTypeId: (await t.run(async (ctx) => {
          return (
            await ctx.db
              .query('planetTypes')
              .filter((q) => q.eq(q.field('name'), 'Terrestrial'))
              .first()
          )?._id;
        }))!
      }
    );

    expect(terrestrialPlanets).toHaveLength(2);

    // Test getPlanetsByType for gas giants
    const gasGiants = await t.query(
      api.game.map.galaxyQueries.getPlanetsByType,
      {
        planetTypeId: (await t.run(async (ctx) => {
          return (
            await ctx.db
              .query('planetTypes')
              .filter((q) => q.eq(q.field('name'), 'Gas Giant'))
              .first()
          )?._id;
        }))!
      }
    );

    expect(gasGiants).toHaveLength(1);
  });
});
