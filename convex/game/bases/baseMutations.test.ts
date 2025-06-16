import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api } from '../../_generated/api';
import schema from '../../schema';

const mockUserEmail1 = 'user1@test.com';
const mockUserEmail2 = 'user2@test.com';

const defaultBaseData = {
  galaxyNumber: 1,
  sectorX: 1,
  sectorY: 1,
  systemX: 1,
  systemY: 1,
  planetX: 1,
  planetY: 1,
  totalSpace: 100,
  usedSpace: 0,
  totalEnergy: 100,
  usedEnergy: 0,
  researchPerCycle: 0,
  novaPerCycle: 0,
  mineralsPerCycle: 0,
  volatilesPerCycle: 0,
  buildTimeReduction: 0,
  shipProductionSpeed: 0,
  defenseBonus: 0,
  allProductionBonus: 0,
  researchSpeed: 0,
  createdAt: Date.now(),
  lastUpdated: Date.now(),
};

describe('Base Mutations', () => {
  describe('createBase', () => {
    test('should create a new base successfully', async () => {
      const t = convexTest(schema);
      const {
        planetId,
        galaxyNumber,
        sectorX,
        sectorY,
        systemX,
        systemY,
        planetX,
        planetY,
      } = await t.run(async (ctx) => {
        await ctx.db.insert('users', { name: 'Test User 1', email: mockUserEmail1, subject: mockUserEmail1 });
        const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-group' });
        const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 1, sectorY: 1 });
        const systemId = await ctx.db.insert('sectorSystems', {
          galaxySectorId: sectorId,
          galaxyNumber: 1,
          sectorX: 1,
          sectorY: 1,
          systemX: 1,
          systemY: 1,
          starType: 'Test Star',
          starColor: '#FFFFFF',
          starSize: 1,
        });
        const planetTypeId = await ctx.db.insert('planetTypes', { 
          name: 'Habitable Planet', 
          category: 'Test', 
          habitable: true, 
          space: 100, 
          energy: 100, 
          minerals: 100, 
          volatiles: 100, 
          description: 'A test planet type'
        });
        const planetId = await ctx.db.insert('systemPlanets', {
          sectorSystemId: systemId,
          galaxyNumber: 1,
          sectorX: 1,
          sectorY: 1,
          systemX: 1,
          systemY: 1,
          planetTypeId: planetTypeId,
          planetX: 1,
          planetY: 1,
        });
        return { planetId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetX: 1, planetY: 1 };
      });

      const result = await t.withIdentity({ subject: mockUserEmail1 }).mutation(api.game.bases.baseMutations.createBase, {
        planetId,
        name: 'New Base',
        galaxyNumber,
        sectorX,
        sectorY,
        systemX,
        systemY,
        planetX,
        planetY,
      });

      expect(result.baseId).toBeDefined();

      const base = await t.query(api.game.bases.baseQueries.getBaseById, { baseId: result.baseId });
      expect(base).not.toBeNull();
      expect(base?.name).toBe('New Base');
    });

    test('should fail if user is not authenticated', async () => {
        const t = convexTest(schema);
        // Generate a valid ID for a non-existent planet for validation purposes
        const { planetId } = await t.run(async (ctx) => {
            const tempGalaxyId = await ctx.db.insert('galaxies', { number: 99, groupId: 'temp-galaxy-auth-test' });
            const tempSectorId = await ctx.db.insert('galaxySectors', { galaxyId: tempGalaxyId, galaxyNumber: 99, sectorX: 0, sectorY: 0 });
            const tempSystemId = await ctx.db.insert('sectorSystems', { galaxySectorId: tempSectorId, galaxyNumber: 99, sectorX: 0, sectorY: 0, systemX: 0, systemY: 0, starType: 'Temp', starColor: '#000', starSize: 1 });
            const tempPlanetTypeId = await ctx.db.insert('planetTypes', { name: 'Temp Type Auth', category: 'Temp', habitable: false, space: 0, energy: 0, minerals: 0, volatiles: 0, description: 'Temp' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: tempSystemId, galaxyNumber: 99, sectorX: 0, sectorY: 0, systemX: 0, systemY: 0, planetTypeId: tempPlanetTypeId, planetX: 0, planetY: 0 });
            await ctx.db.delete(planetId);
            // Clean up other temporary documents to keep the test DB clean, though not strictly necessary for this ID generation
            await ctx.db.delete(tempPlanetTypeId);
            await ctx.db.delete(tempSystemId);
            await ctx.db.delete(tempSectorId);
            await ctx.db.delete(tempGalaxyId);
            return { planetId };
        });
        await expect(t.mutation(api.game.bases.baseMutations.createBase, {
            planetId,
            name: 'New Base',
            galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetX: 1, planetY: 1
        })).rejects.toThrow('User must be authenticated to create a base.');
    });

    test('should fail if planet is not habitable', async () => {
        const t = convexTest(schema);
        const { planetId } = await t.run(async (ctx) => {
            await ctx.db.insert('users', { name: 'Test User 1', email: mockUserEmail1, subject: mockUserEmail1 });
            const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-group' });
            const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 1, sectorY: 1 });
            const systemId = await ctx.db.insert('sectorSystems', { galaxySectorId: sectorId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, starType: 'Test', starColor: '#FFFFFF', starSize: 1 });
            const planetTypeId = await ctx.db.insert('planetTypes', { name: 'Uninhabitable', category: 'Test', habitable: false, space: 0, energy: 0, minerals: 0, volatiles: 0, description: '...' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: systemId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetTypeId, planetX: 1, planetY: 1 });
            return { planetId };
        });

        await expect(t.withIdentity({ subject: mockUserEmail1 }).mutation(api.game.bases.baseMutations.createBase, {
            planetId,
            name: 'New Base',
            galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetX: 1, planetY: 1
        })).rejects.toThrow('Cannot build a base on a non-habitable planet');
    });

    test('should fail if another base already exists on the planet', async () => {
        const t = convexTest(schema);
        const { planetId } = await t.run(async (ctx) => {
            const user1 = await ctx.db.insert('users', { name: 'User 1', email: mockUserEmail1, subject: mockUserEmail1 });
            await ctx.db.insert('users', { name: 'User 2', email: mockUserEmail2, subject: mockUserEmail2 });
            const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-group' });
            const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 1, sectorY: 1 });
            const systemId = await ctx.db.insert('sectorSystems', { galaxySectorId: sectorId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, starType: 'Test', starColor: '#FFFFFF', starSize: 1 });
            const planetTypeId = await ctx.db.insert('planetTypes', { name: 'Habitable', category: 'Test', habitable: true, space: 100, energy: 100, minerals: 100, volatiles: 100, description: '...' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: systemId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetTypeId, planetX: 1, planetY: 1 });
            await ctx.db.insert('playerBases', { userId: user1, planetId, name: 'Existing Base', galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetX: 1, planetY: 1, totalSpace: 100, usedSpace: 0, totalEnergy: 100, usedEnergy: 0, researchPerCycle: 0, novaPerCycle: 0, mineralsPerCycle: 0, volatilesPerCycle: 0, buildTimeReduction: 0, shipProductionSpeed: 0, defenseBonus: 0, allProductionBonus: 0, researchSpeed: 0, createdAt: Date.now(), lastUpdated: Date.now() });
            return { planetId };
        });

        await expect(t.withIdentity({ subject: mockUserEmail2 }).mutation(api.game.bases.baseMutations.createBase, {
            planetId,
            name: 'New Base',
            galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetX: 1, planetY: 1
        })).rejects.toThrow('A base already exists on this planet.');
    });

    test('should fail if the same user tries to build on the same planet twice', async () => {
        const t = convexTest(schema);
        const { planetId } = await t.run(async (ctx) => {
            const user1 = await ctx.db.insert('users', { name: 'User 1', email: mockUserEmail1, subject: mockUserEmail1 });
            const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-group' });
            const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 1, sectorY: 1 });
            const systemId = await ctx.db.insert('sectorSystems', { galaxySectorId: sectorId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, starType: 'Test', starColor: '#FFFFFF', starSize: 1 });
            const planetTypeId = await ctx.db.insert('planetTypes', { name: 'Habitable', category: 'Test', habitable: true, space: 100, energy: 100, minerals: 100, volatiles: 100, description: '...' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: systemId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetTypeId, planetX: 1, planetY: 1 });
            await ctx.db.insert('playerBases', { userId: user1, planetId, name: 'Existing Base', galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetX: 1, planetY: 1, totalSpace: 100, usedSpace: 0, totalEnergy: 100, usedEnergy: 0, researchPerCycle: 0, novaPerCycle: 0, mineralsPerCycle: 0, volatilesPerCycle: 0, buildTimeReduction: 0, shipProductionSpeed: 0, defenseBonus: 0, allProductionBonus: 0, researchSpeed: 0, createdAt: Date.now(), lastUpdated: Date.now() });
            return { planetId };
        });

        await expect(t.withIdentity({ subject: mockUserEmail1 }).mutation(api.game.bases.baseMutations.createBase, {
            planetId,
            name: 'New Base',
            galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetX: 1, planetY: 1
        })).rejects.toThrow('User already has a base on this planet.');
    });

    test('should fail if planet does not exist', async () => {
        const t = convexTest(schema);
        // Generate a valid ID for a non-existent planet
        const { nonExistentPlanetId } = await t.run(async (ctx) => {
            await ctx.db.insert('users', { name: 'Test User 1', email: mockUserEmail1, subject: mockUserEmail1 });
            const tempGalaxyId = await ctx.db.insert('galaxies', { number: 98, groupId: 'temp-galaxy-nonexist-test' });
            const tempSectorId = await ctx.db.insert('galaxySectors', { galaxyId: tempGalaxyId, galaxyNumber: 98, sectorX: 0, sectorY: 0 });
            const tempSystemId = await ctx.db.insert('sectorSystems', { galaxySectorId: tempSectorId, galaxyNumber: 98, sectorX: 0, sectorY: 0, systemX: 0, systemY: 0, starType: 'Temp', starColor: '#000', starSize: 1 });
            const tempPlanetTypeId = await ctx.db.insert('planetTypes', { name: 'Temp Type NonExist', category: 'Temp', habitable: false, space: 0, energy: 0, minerals: 0, volatiles: 0, description: 'Temp' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: tempSystemId, galaxyNumber: 98, sectorX: 0, sectorY: 0, systemX: 0, systemY: 0, planetTypeId: tempPlanetTypeId, planetX: 0, planetY: 0 });
            await ctx.db.delete(planetId); // Ensure it doesn't exist
            // Clean up other temporary documents
            await ctx.db.delete(tempPlanetTypeId);
            await ctx.db.delete(tempSystemId);
            await ctx.db.delete(tempSectorId);
            await ctx.db.delete(tempGalaxyId);
            return { nonExistentPlanetId: planetId };
        });

        await expect(t.withIdentity({ subject: mockUserEmail1 }).mutation(api.game.bases.baseMutations.createBase, {
            planetId: nonExistentPlanetId,
            name: 'New Base',
            galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetX: 1, planetY: 1
        })).rejects.toThrow('Planet not found');
    });
  });

  describe('renameBase', () => {
    test('should rename a base successfully', async () => {
        const t = convexTest(schema);
        const { baseId } = await t.run(async (ctx) => {
            const user1 = await ctx.db.insert('users', { name: 'User 1', email: mockUserEmail1, subject: mockUserEmail1 });
            const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-group' });
            const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 1, sectorY: 1 });
            const systemId = await ctx.db.insert('sectorSystems', { galaxySectorId: sectorId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, starType: 'Test', starColor: '#FFFFFF', starSize: 1 });
            const planetTypeId = await ctx.db.insert('planetTypes', { name: 'Habitable', category: 'Test', habitable: true, space: 100, energy: 100, minerals: 100, volatiles: 100, description: '...' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: systemId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetTypeId, planetX: 1, planetY: 1 });
            const baseId = await ctx.db.insert('playerBases', { ...defaultBaseData, userId: user1, planetId, name: 'Old Name' });
            return { baseId };
        });

        await t.withIdentity({ subject: mockUserEmail1 }).mutation(api.game.bases.baseMutations.renameBase, {
            baseId,
            name: 'New Name'
        });

        const base = await t.query(api.game.bases.baseQueries.getBaseById, { baseId });
        expect(base?.name).toBe('New Name');
    });

    test('should fail to rename a base if not the owner', async () => {
        const t = convexTest(schema);
        const { baseId } = await t.run(async (ctx) => {
            const user1 = await ctx.db.insert('users', { name: 'User 1', email: mockUserEmail1, subject: mockUserEmail1 });
            await ctx.db.insert('users', { name: 'User 2', email: mockUserEmail2, subject: mockUserEmail2 });
            const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-group' });
            const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 1, sectorY: 1 });
            const systemId = await ctx.db.insert('sectorSystems', { galaxySectorId: sectorId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, starType: 'Test', starColor: '#FFFFFF', starSize: 1 });
            const planetTypeId = await ctx.db.insert('planetTypes', { name: 'Habitable', category: 'Test', habitable: true, space: 100, energy: 100, minerals: 100, volatiles: 100, description: '...' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: systemId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetTypeId, planetX: 1, planetY: 1 });
            const baseId = await ctx.db.insert('playerBases', { ...defaultBaseData, userId: user1, planetId, name: 'Old Name' });
            return { baseId };
        });

        await expect(t.withIdentity({ subject: mockUserEmail2 }).mutation(api.game.bases.baseMutations.renameBase, {
            baseId,
            name: 'New Name'
        })).rejects.toThrow('User is not the owner of the base');
    });

    test('should fail to rename a base if not authenticated', async () => {
        const t = convexTest(schema);
        const { baseId } = await t.run(async (ctx) => {
            const user1 = await ctx.db.insert('users', { name: 'User 1', email: mockUserEmail1, subject: mockUserEmail1 });
            const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-group' });
            const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 1, sectorY: 1 });
            const systemId = await ctx.db.insert('sectorSystems', { galaxySectorId: sectorId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, starType: 'Test', starColor: '#FFFFFF', starSize: 1 });
            const planetTypeId = await ctx.db.insert('planetTypes', { name: 'Habitable', category: 'Test', habitable: true, space: 100, energy: 100, minerals: 100, volatiles: 100, description: '...' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: systemId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetTypeId, planetX: 1, planetY: 1 });
            const baseId = await ctx.db.insert('playerBases', { ...defaultBaseData, userId: user1, planetId, name: 'Old Name' });
            return { baseId };
        });

        await expect(t.mutation(api.game.bases.baseMutations.renameBase, {
            baseId,
            name: 'New Name'
        })).rejects.toThrow('User must be authenticated to rename a base.');
    });

    test('should fail to rename a base if not authenticated', async () => {
        const t = convexTest(schema);
        const { baseId } = await t.run(async (ctx) => {
            const user1 = await ctx.db.insert('users', { name: 'User 1', email: mockUserEmail1, subject: mockUserEmail1 });
            const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-group' });
            const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 1, sectorY: 1 });
            const systemId = await ctx.db.insert('sectorSystems', { galaxySectorId: sectorId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, starType: 'Test', starColor: '#FFFFFF', starSize: 1 });
            const planetTypeId = await ctx.db.insert('planetTypes', { name: 'Habitable', category: 'Test', habitable: true, space: 100, energy: 100, minerals: 100, volatiles: 100, description: '...' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: systemId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetTypeId, planetX: 1, planetY: 1 });
            const baseId = await ctx.db.insert('playerBases', { ...defaultBaseData, userId: user1, planetId, name: 'Old Name' });
            return { baseId };
        });

        await expect(t.mutation(api.game.bases.baseMutations.renameBase, {
            baseId,
            name: 'New Name'
        })).rejects.toThrow('User must be authenticated to rename a base.');
    });
  });

  describe('abandonBase', () => {
    test('should abandon a base successfully', async () => {
        const t = convexTest(schema);
        const { baseId } = await t.run(async (ctx) => {
            const user1 = await ctx.db.insert('users', { name: 'User 1', email: mockUserEmail1, subject: mockUserEmail1 });
            const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-group' });
            const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 1, sectorY: 1 });
            const systemId = await ctx.db.insert('sectorSystems', { galaxySectorId: sectorId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, starType: 'Test', starColor: '#FFFFFF', starSize: 1 });
            const planetTypeId = await ctx.db.insert('planetTypes', { name: 'Habitable', category: 'Test', habitable: true, space: 100, energy: 100, minerals: 100, volatiles: 100, description: '...' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: systemId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetTypeId, planetX: 1, planetY: 1 });
            const baseId = await ctx.db.insert('playerBases', { ...defaultBaseData, userId: user1, planetId, name: 'Base to Abandon' });
            return { baseId };
        });

        await t.withIdentity({ subject: mockUserEmail1 }).mutation(api.game.bases.baseMutations.abandonBase, { baseId });

        const base = await t.query(api.game.bases.baseQueries.getBaseById, { baseId });
        expect(base).toBeNull();
    });

    test('should fail to abandon a base if not the owner', async () => {
        const t = convexTest(schema);
        const { baseId } = await t.run(async (ctx) => {
            const user1 = await ctx.db.insert('users', { name: 'User 1', email: mockUserEmail1, subject: mockUserEmail1 });
            await ctx.db.insert('users', { name: 'User 2', email: mockUserEmail2, subject: mockUserEmail2 });
            const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-group' });
            const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 1, sectorY: 1 });
            const systemId = await ctx.db.insert('sectorSystems', { galaxySectorId: sectorId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, starType: 'Test', starColor: '#FFFFFF', starSize: 1 });
            const planetTypeId = await ctx.db.insert('planetTypes', { name: 'Habitable', category: 'Test', habitable: true, space: 100, energy: 100, minerals: 100, volatiles: 100, description: '...' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: systemId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetTypeId, planetX: 1, planetY: 1 });
            const baseId = await ctx.db.insert('playerBases', { ...defaultBaseData, userId: user1, planetId, name: 'Base to Abandon' });
            return { baseId };
        });

        await expect(t.withIdentity({ subject: mockUserEmail2 }).mutation(api.game.bases.baseMutations.abandonBase, { baseId })).rejects.toThrow('User is not the owner of the base');
    });

    test('should fail to abandon a base if not authenticated', async () => {
        const t = convexTest(schema);
        const { baseId } = await t.run(async (ctx) => {
            const user1 = await ctx.db.insert('users', { name: 'User 1', email: mockUserEmail1, subject: mockUserEmail1 });
            const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-group' });
            const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 1, sectorY: 1 });
            const systemId = await ctx.db.insert('sectorSystems', { galaxySectorId: sectorId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, starType: 'Test', starColor: '#FFFFFF', starSize: 1 });
            const planetTypeId = await ctx.db.insert('planetTypes', { name: 'Habitable', category: 'Test', habitable: true, space: 100, energy: 100, minerals: 100, volatiles: 100, description: '...' });
            const planetId = await ctx.db.insert('systemPlanets', { sectorSystemId: systemId, galaxyNumber: 1, sectorX: 1, sectorY: 1, systemX: 1, systemY: 1, planetTypeId, planetX: 1, planetY: 1 });
            const baseId = await ctx.db.insert('playerBases', { ...defaultBaseData, userId: user1, planetId, name: 'Base to Abandon' });
            return { baseId };
        });

        await expect(t.mutation(api.game.bases.baseMutations.abandonBase, { baseId })).rejects.toThrow('User must be authenticated to abandon a base.');
    });
  });
});
