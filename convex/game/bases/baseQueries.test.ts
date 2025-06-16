import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api } from '../../_generated/api';
import schema from '../../schema';

const mockUserEmail1 = 'user1@test.com';
const mockUserEmail2 = 'user2@test.com';

describe('Base Queries', () => {
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
  describe('getPlayerBases', () => {
    test('should retrieve all bases for a given user', async () => {
      const t = convexTest(schema);
      const { userId1, userId2 } = await t.run(async (ctx) => {
        const userId1 = await ctx.db.insert('users', { name: 'Test User 1', email: mockUserEmail1, subject: mockUserEmail1 });
        const userId2 = await ctx.db.insert('users', { name: 'Test User 2', email: mockUserEmail2, subject: mockUserEmail2 });

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
          name: 'Test Planet Type', 
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

        // Bases for user 1
        await ctx.db.insert('playerBases', { ...defaultBaseData, userId: userId1, planetId, name: 'Base Alpha' });
        await ctx.db.insert('playerBases', { ...defaultBaseData, userId: userId1, planetId, name: 'Base Beta' });

        // Base for user 2
        await ctx.db.insert('playerBases', { ...defaultBaseData, userId: userId2, planetId, name: 'Base Gamma' });

        return { userId1, userId2 };
      });

      const user1Bases = await t.query(api.game.bases.baseQueries.getPlayerBases, { userId: userId1 });
      expect(user1Bases).toHaveLength(2);
      expect(user1Bases.every((base) => base.userId === userId1)).toBe(true);

      const user2Bases = await t.query(api.game.bases.baseQueries.getPlayerBases, { userId: userId2 });
      expect(user2Bases).toHaveLength(1);
      expect(user2Bases[0].name).toBe('Base Gamma');
    });
  });

  describe('getBaseById', () => {
    test('should retrieve a specific base by its ID', async () => {
      const t = convexTest(schema);
      const { baseId } = await t.run(async (ctx) => {
        const userId = await ctx.db.insert('users', { name: 'Test User 1', email: mockUserEmail1, subject: mockUserEmail1 });
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
          name: 'Test Planet Type', 
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
        const baseId = await ctx.db.insert('playerBases', { ...defaultBaseData, userId, planetId, name: 'Base Delta' });
        return { baseId };
      });

      const base = await t.query(api.game.bases.baseQueries.getBaseById, { baseId });
      expect(base).not.toBeNull();
      expect(base?._id).toBe(baseId);
      expect(base?.name).toBe('Base Delta');
    });
  });

  describe('getBaseOnPlanet', () => {
    test('should retrieve the base on a specific planet', async () => {
      const t = convexTest(schema);
      const { planetId, baseId } = await t.run(async (ctx) => {
        const userId = await ctx.db.insert('users', { name: 'Test User 1', email: mockUserEmail1, subject: mockUserEmail1 });
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
          name: 'Test Planet Type', 
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
        const baseId = await ctx.db.insert('playerBases', { ...defaultBaseData, userId, planetId, name: 'Base Epsilon' });
        return { planetId, baseId };
      });

      const base = await t.query(api.game.bases.baseQueries.getBaseOnPlanet, { planetId });
      expect(base).not.toBeNull();
      expect(base?._id).toBe(baseId);
      expect(base?.planetId).toBe(planetId);
    });

    test('should return null if no base exists on the planet', async () => {
      const t = convexTest(schema);
      const { planetId } = await t.run(async (ctx) => {
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
          name: 'Test Planet Type', 
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
        return { planetId };
      });

      const base = await t.query(api.game.bases.baseQueries.getBaseOnPlanet, { planetId });
      expect(base).toBeNull();
    });
  });
});
