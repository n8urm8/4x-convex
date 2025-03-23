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
        category: 'habitable'
      });
      await ctx.db.insert('planetTypes', {
        name: 'Gas Giant',
        category: 'uninhabitable'
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
    expect(habitableTypes).toHaveLength(1);
    expect(habitableTypes[0].name).toBe('Terrestrial');
  });

  test('galaxy and sector queries', async () => {
    const t = convexTest(schema);

    // Seed test data
    await t.run(async (ctx) => {
      const galaxy = await ctx.db.insert('galaxies', {
        number: 1,
        name: 'Milky Way'
      });
      await ctx.db.insert('galaxies', { number: 2, name: 'Andromeda' });
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
    expect(galaxy?.name).toBe('Milky Way');

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
        category: 'habitable'
      });
      const galaxy = await ctx.db.insert('galaxies', {
        number: 1,
        name: 'Milky Way'
      });
      const sector = await ctx.db.insert('galaxySectors', {
        galaxyId: galaxy,
        sectorX: 1,
        sectorY: 1
      });
      const system = await ctx.db.insert('starSystems', {
        galaxySectorId: sector,
        systemX: 1,
        systemY: 1
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

    // Test getSystemPlanets
    const planets = await t.query(api.game.map.galaxyQueries.getSystemPlanets, {
      systemId: system!._id
    });
    expect(planets).toHaveLength(1);
    expect(planets[0].type).toBeTruthy();

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
  });
});
