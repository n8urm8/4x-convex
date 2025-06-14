import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api } from '../../_generated/api';
import schema from '../../schema';
import { Doc } from '../../_generated/dataModel';

describe('Galaxy Generation', () => {
  test('createGalaxy creates a new galaxy with sectors', async () => {
    const t = convexTest(schema);

    // Create a galaxy
    const result = await t.mutation(
      api.game.map.galaxyGeneration.createGalaxy,
      {
        groupId: 'test-group'
      }
    );

    expect(result).toBeTruthy();
    expect(result.galaxyId).toBeTruthy();
    expect(result.message).toContain('Galaxy');
    expect(result.message).toContain('created with');
    expect(result.message).toContain('sectors');

    // Verify the galaxy was created
    const galaxy = await t.run(async (ctx) => {
      return await ctx.db.get(result.galaxyId);
    });

    expect(galaxy).toBeTruthy();
    expect(galaxy?.number).toBe(0); // First galaxy should be number 0
    expect(galaxy?.groupId).toBe('test-group');

    // Verify sectors were created (10x10 grid = 100 sectors)
    const sectors = await t.query(api.game.map.galaxyQueries.getGalaxySectors, {
      galaxyId: result.galaxyId
    });

    expect(sectors.length).toBe(100); // 10x10 grid

    // Check for proper coordinates in sectors
    const coordinates = new Set();
    for (const sector of sectors) {
      coordinates.add(`${sector.sectorX},${sector.sectorY}`);

      // Verify sector coordinates are in range
      expect(sector.sectorX).toBeGreaterThanOrEqual(0);
      expect(sector.sectorX).toBeLessThan(10);
      expect(sector.sectorY).toBeGreaterThanOrEqual(0);
      expect(sector.sectorY).toBeLessThan(10);
    }

    // Verify all coordinates are present (0,0 to 9,9)
    expect(coordinates.size).toBe(100);
  });

  test('createGalaxy increments galaxy numbers', async () => {
    const t = convexTest(schema);

    // Create first galaxy
    const result1 = await t.mutation(
      api.game.map.galaxyGeneration.createGalaxy,
      {
        groupId: 'test-group'
      }
    );

    // Create second galaxy
    const result2 = await t.mutation(
      api.game.map.galaxyGeneration.createGalaxy,
      {
        groupId: 'test-group'
      }
    );

    // Verify galaxy numbers increment
    const galaxy1 = await t.run(async (ctx) => {
      return await ctx.db.get(result1.galaxyId);
    });

    const galaxy2 = await t.run(async (ctx) => {
      return await ctx.db.get(result2.galaxyId);
    });

    expect(galaxy1?.number).toBe(0);
    expect(galaxy2?.number).toBe(1);
  });

  test('generateSectorSystems creates appropriate number of systems', async () => {
    const t = convexTest(schema);

    // Create a galaxy and get a sector
    const galaxyResult = await t.mutation(
      api.game.map.galaxyGeneration.createGalaxy,
      {
        groupId: 'test-group'
      }
    );

    const sectors = await t.query(api.game.map.galaxyQueries.getGalaxySectors, {
      galaxyId: galaxyResult.galaxyId
    });

    // Choose center sector (5,5) which should have higher density
        const centerSector = (sectors as Doc<'galaxySectors'>[]).find(
      (s) => s.sectorX === 5 && s.sectorY === 5
    );
    expect(centerSector).toBeTruthy();

    // Generate systems for center sector
    const result = await t.mutation(
      api.game.map.galaxyGeneration.generateSectorSystems,
      {
        sectorId: centerSector!._id,
        densityMultiplier: 0.1 // Lower multiplier for testing
      }
    );

    expect(result).toBeTruthy();
    expect(result.message).toContain('Generated');
    expect(result.message).toContain('star systems');

    // Verify systems were created
    const systems = await t.query(api.game.map.galaxyQueries.getSectorSystems, {
      sectorId: centerSector!._id
    });

    // We should have some systems in the center with even a low multiplier
    expect(systems.length).toBeGreaterThan(0);

    // Check system properties
    for (const system of systems) {
      expect(system.galaxySectorId).toBe(centerSector!._id);
      expect(system.systemX).toBeGreaterThanOrEqual(0);
      expect(system.systemX).toBeLessThan(100);
      expect(system.systemY).toBeGreaterThanOrEqual(0);
      expect(system.systemY).toBeLessThan(100);
      expect(system.starType).toBeTruthy();
      expect(system.starSize).toBeGreaterThan(0);
      expect(system.starColor).toBeTruthy();
    }

    // Verify unique positions
    const positions = new Set();
    for (const system of systems) {
      const position = `${system.systemX},${system.systemY}`;
      positions.add(position);
    }
    expect(positions.size).toBe(systems.length);

    // Test generating systems for same sector again
    const secondResult = await t.mutation(
      api.game.map.galaxyGeneration.generateSectorSystems,
      {
        sectorId: centerSector!._id
      }
    );

    expect(secondResult.message).toContain('already generated');
  });

  test('generateSystemPlanets creates appropriate planets', async () => {
    const t = convexTest(schema);

    // Create planet types
    await t.run(async (ctx) => {
      await ctx.db.insert('planetTypes', {
        name: 'Terrestrial',
        category: 'Inner System',
        habitable: true,
        space: 5,
        energy: 3,
        minerals: 4,
        volatiles: 2,
        description: 'Earth-like planet suitable for colonization'
      });

      await ctx.db.insert('planetTypes', {
        name: 'Gas Giant',
        category: 'Outer System',
        habitable: false,
        space: 0,
        energy: 1,
        minerals: 0,
        volatiles: 8,
        description: 'Massive gas planet unsuitable for colonization'
      });

      await ctx.db.insert('planetTypes', {
        name: 'Exotic',
        category: 'Exotic',
        habitable: false,
        space: 2,
        energy: 5,
        minerals: 2,
        volatiles: 5,
        description: 'Strange exotic planet with unusual properties'
      });
    });

    // Create galaxy, sector, and star system
    const galaxyResult = await t.mutation(
      api.game.map.galaxyGeneration.createGalaxy,
      {
        groupId: 'test-group'
      }
    );

    const sectors = await t.query(api.game.map.galaxyQueries.getGalaxySectors, {
      galaxyId: galaxyResult.galaxyId
    });

    const sectorId = sectors[0]._id;

    // Create a star system manually
    const systemId = await t.run(async (ctx) => {
      return await ctx.db.insert('sectorSystems', {
        galaxySectorId: sectorId,
        systemX: 50,
        systemY: 50,
        starType: 'Yellow Dwarf',
        starSize: 1.0,
        starColor: '#FFD700',
        galaxyNumber: galaxyResult.number,
        sectorX: sectors[0].sectorX,
        sectorY: sectors[0].sectorY
      });
    });

    // Generate planets with specific count for testing
    const planetCount = 5;
    const result = await t.mutation(
      api.game.map.galaxyGeneration.generateSystemPlanets,
      {
        systemId,
        planetCount
      }
    );

    expect(result).toBeTruthy();
    expect(result.message).toContain('Generated');
    expect(result.message).toContain('planets');

    // Verify planets were created
    const planets = await t.query(api.game.map.galaxyQueries.getSystemPlanets, {
      systemId
    });

    expect(planets.length).toBeGreaterThanOrEqual(1);
    expect(planets.length).toBeLessThanOrEqual(planetCount);

    // Check planet properties
    for (const planet of planets) {
      expect(planet.sectorSystemId).toBe(systemId);
      expect(planet.planetTypeId).toBeTruthy();
      expect(planet.planetX).toBeGreaterThanOrEqual(0);
      expect(planet.planetX).toBeLessThan(9);
      expect(planet.planetY).toBeGreaterThanOrEqual(0);
      expect(planet.planetY).toBeLessThan(9);
    }

    // Verify star position is not used (star is at 4,4 in a 9x9 grid)
    const starPosition = '4,4';
        const planetPositions = (planets as Doc<'systemPlanets'>[]).map(
      (p) => `${p.planetX},${p.planetY}`
    );
    expect(planetPositions).not.toContain(starPosition);

    // Test generating planets for same system again
    const secondResult = await t.mutation(
      api.game.map.galaxyGeneration.generateSystemPlanets,
      {
        systemId
      }
    );

    expect(secondResult.message).toContain('already generated');
  });

  test('generateAllGalaxySystems creates systems across the galaxy', async () => {
    const t = convexTest(schema);

    // Create a galaxy
    const galaxyResult = await t.mutation(
      api.game.map.galaxyGeneration.createGalaxy,
      {
        groupId: 'test-group'
      }
    );

    // Generate all systems with lower density for faster test
    const result = await t.action(
      api.game.map.galaxyGeneration.generateAllGalaxySystems,
      {
        galaxyId: galaxyResult.galaxyId,
        densityMultiplier: 0.01 // Very low for testing purposes
      }
    );

    expect(result).toBeTruthy();
    expect(result.message).toContain('Generated');
    expect(result.message).toContain('star systems');

    // Verify some systems were created
    const sectors = await t.query(api.game.map.galaxyQueries.getGalaxySectors, {
      galaxyId: galaxyResult.galaxyId
    });

    let totalSystems = 0;
    let sectorWithSystems = 0;

    for (const sector of sectors) {
      const systems = await t.query(
        api.game.map.galaxyQueries.getSectorSystems,
        {
          sectorId: sector._id
        }
      );

      totalSystems += systems.length;
      if (systems.length > 0) {
        sectorWithSystems++;
      }
    }

    // Should have created some systems
    expect(totalSystems).toBeGreaterThan(0);
    // Should have created systems in multiple sectors
    expect(sectorWithSystems).toBeGreaterThan(0);
  });

  test('getGalaxyDensityMap returns density distribution', async () => {
    const t = convexTest(schema);

    // Create a galaxy
    const galaxyResult = await t.mutation(
      api.game.map.galaxyGeneration.createGalaxy,
      {
        groupId: 'test-group'
      }
    );

    // Get density map
    const densityMap = await t.query(
      api.game.map.galaxyGeneration.getGalaxyDensityMap,
      {
        galaxyId: galaxyResult.galaxyId
      }
    );

    expect(densityMap).toBeTruthy();
    expect(densityMap.length).toBe(100); // 10x10 grid

    // Center should have higher density than edges
    const typedDensityMap = densityMap as {
      sectorX: number;
      sectorY: number;
      density: number;
    }[];
    const centerDensity = typedDensityMap.find(
      (d) => d.sectorX === 5 && d.sectorY === 5
    )?.density;
    const cornerDensity = typedDensityMap.find(
      (d) => d.sectorX === 0 && d.sectorY === 0
    )?.density;

    expect(centerDensity).toBeGreaterThan(cornerDensity!);

    // All densities should be between edge and center values
    for (const point of typedDensityMap) {
      expect(point.density).toBeGreaterThanOrEqual(0.05); // GALAXY_EDGE_DENSITY
      expect(point.density).toBeLessThanOrEqual(0.7); // GALAXY_CENTER_DENSITY
    }
  });

  test('creating a full galaxy with sectors, systems, and planets', async () => {
    const t = convexTest(schema);

    // Create planet types
    await t.run(async (ctx) => {
      await ctx.db.insert('planetTypes', {
        name: 'Terrestrial',
        category: 'Inner System',
        habitable: true,
        space: 5,
        energy: 3,
        minerals: 4,
        volatiles: 2,
        description: 'Earth-like planet suitable for colonization'
      });

      await ctx.db.insert('planetTypes', {
        name: 'Gas Giant',
        category: 'Outer System',
        habitable: false,
        space: 0,
        energy: 1,
        minerals: 0,
        volatiles: 8,
        description: 'Massive gas planet unsuitable for colonization'
      });
    });

    // Step 1: Create a galaxy
    const galaxyResult = await t.mutation(
      api.game.map.galaxyGeneration.createGalaxy,
      {
        groupId: 'complete-test'
      }
    );

    expect(galaxyResult).toBeTruthy();
    expect(galaxyResult.galaxyId).toBeTruthy();

    // Verify galaxy was created
    const galaxy = await t.run(async (ctx) => {
      return await ctx.db.get(galaxyResult.galaxyId);
    });

    expect(galaxy).toBeTruthy();
    expect(galaxy?.groupId).toBe('complete-test');

    // Verify sectors were created
    const sectors = await t.query(api.game.map.galaxyQueries.getGalaxySectors, {
      galaxyId: galaxyResult.galaxyId
    });

    expect(sectors.length).toBe(100); // 10x10 grid

    // Step 2: Generate systems for a few sectors (for testing performance)
    let totalSystems = 0;
    let totalPlanets = 0;

    // Only process the first 4 sectors for testing efficiency
    const testSectors = sectors.slice(0, 4);

    for (const sector of testSectors) {
      // Generate star systems for this sector
      await t.mutation(api.game.map.galaxyGeneration.generateSectorSystems, {
        sectorId: sector._id,
        densityMultiplier: 0.05 // Low density for faster testing
      });

      // Query systems created
      const systems = await t.query(
        api.game.map.galaxyQueries.getSectorSystems,
        {
          sectorId: sector._id
        }
      );

      totalSystems += systems.length;

      // Step 3: Generate planets for each system
      for (const system of systems) {
        await t.mutation(api.game.map.galaxyGeneration.generateSystemPlanets, {
          systemId: system._id,
          planetCount: 2 // Each system should have ~2 planets
        });

        // Query planets created
        const planets = await t.query(
          api.game.map.galaxyQueries.getSystemPlanets,
          {
            systemId: system._id
          }
        );

        totalPlanets += planets.length;
      }
    }

    // We should have some systems
    expect(totalSystems).toBeGreaterThan(0);
    // We should have some planets
    expect(totalPlanets).toBeGreaterThan(0);

    console.log(
      `Galaxy generated with ${testSectors.length} sectors, ${totalSystems} systems, and ${totalPlanets} planets`
    );
  });
});
