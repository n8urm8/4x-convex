import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api } from '../../_generated/api';
import schema from '../../schema';

describe('System Mutations', () => {
  describe('discoverSystem', () => {
    const mockUserEmail1 = 'testuser1@example.com';
    const mockUserEmail2 = 'testuser2@example.com';

    test('should successfully discover an unexplored system', async () => {
      const t = convexTest(schema);

      // 1. Seed user and system data
      const { systemId, userId } = await t.run(async (ctx) => {
        const userId = await ctx.db.insert('users', {
          name: 'Test User 1',
          email: mockUserEmail1,
          subject: mockUserEmail1,
        });
        const galaxyId = await ctx.db.insert('galaxies', { number: 1, groupId: 'test-galaxy-1' });
        const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 1, sectorX: 0, sectorY: 0 });
        const systemId = await ctx.db.insert('sectorSystems', {
          galaxySectorId: sectorId,
          galaxyNumber: 1,
          sectorX: 0,
          sectorY: 0,
          systemX: 1,
          systemY: 1,
          starType: 'Test Star',
          starColor: '#FFFFFF',
          starSize: 1,
        });
        return { systemId, userId };
      });

      const tWithAuth = t.withIdentity({ subject: mockUserEmail1 });

      // 2. Call the discoverSystem mutation
      const result = await tWithAuth.mutation(api.game.map.systemMutations.discoverSystem, {
        systemId,
      });

      // 3. Assert the result of the mutation
      expect(result.success).toBe(true);
      expect(result.message).toBe('System discovered.');

      // 4. Verify the database state
      const updatedSystem = await t.query(api.game.map.galaxyQueries.getStarSystemById, { systemId });
      expect(updatedSystem).not.toBeNull();
      expect(updatedSystem?.exploredBy).toBe(userId);
    });

    test('should return success:false if system already explored by another user', async () => {
      const t = convexTest(schema);

      // 1. Seed users and an already explored system
      const { systemId, firstExplorerActualId } = await t.run(async (ctx) => {
        const firstExplorerActualId = await ctx.db.insert('users', { name: 'Explorer One', email: mockUserEmail1, subject: mockUserEmail1 });
        await ctx.db.insert('users', { name: 'Explorer Two', email: mockUserEmail2, subject: mockUserEmail2 }); // Second user

        const galaxyId = await ctx.db.insert('galaxies', { number: 2, groupId: 'test-galaxy-2' });
        const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 2, sectorX: 1, sectorY: 1 });
        const systemId = await ctx.db.insert('sectorSystems', {
          galaxySectorId: sectorId,
          galaxyNumber: 2,
          sectorX: 1,
          sectorY: 1,
          systemX: 2,
          systemY: 2,
          starType: 'Old Star',
          starColor: '#FFFF00',
          starSize: 2,
          exploredBy: firstExplorerActualId, // Explored by user 1
        });
        return { systemId, firstExplorerActualId };
      });

      const tAsSecondExplorer = t.withIdentity({ subject: mockUserEmail2 });

      // 2. Attempt to discover with the second user
      const result = await tAsSecondExplorer.mutation(api.game.map.systemMutations.discoverSystem, {
        systemId,
      });

      // 3. Assert the result
      expect(result.success).toBe(false);
      expect(result.message).toBe('System already explored.');

      // 4. Verify the database state (exploredBy should not change)
      const system = await t.query(api.game.map.galaxyQueries.getStarSystemById, { systemId });
      expect(system?.exploredBy).toBe(firstExplorerActualId);
    });

    test('should return success:false if system already explored by the same user', async () => {
      const t = convexTest(schema);

      const { systemId, explorerId } = await t.run(async (ctx) => {
        const explorerId = await ctx.db.insert('users', { name: 'Self Explorer', email: mockUserEmail1, subject: mockUserEmail1 });
        const galaxyId = await ctx.db.insert('galaxies', { number: 3, groupId: 'test-galaxy-3' });
        const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 3, sectorX: 2, sectorY: 2 });
        const systemId = await ctx.db.insert('sectorSystems', {
          galaxySectorId: sectorId,
          galaxyNumber: 3,
          sectorX: 2,
          sectorY: 2,
          systemX: 3,
          systemY: 3,
          starType: 'Blue Star',
          starColor: '#0000FF',
          starSize: 0.5,
          exploredBy: explorerId, // Already explored by this user
        });
        return { systemId, explorerId };
      });

      const tWithAuth = t.withIdentity({ subject: mockUserEmail1 });

      const result = await tWithAuth.mutation(api.game.map.systemMutations.discoverSystem, {
        systemId,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('System already explored by you.');
      const system = await t.query(api.game.map.galaxyQueries.getStarSystemById, { systemId });
      expect(system?.exploredBy).toBe(explorerId);
    });

    test('should throw error if user is not authenticated', async () => {
      const t = convexTest(schema);
      // 1. Seed a system (no user needed for this specific test path)
      const { systemId } = await t.run(async (ctx) => {
        const galaxyId = await ctx.db.insert('galaxies', { number: 4, groupId: 'test-galaxy-4' });
        const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 4, sectorX: 3, sectorY: 3 });
        const systemId = await ctx.db.insert('sectorSystems', {
          galaxySectorId: sectorId,
          galaxyNumber: 4,
          sectorX: 3,
          sectorY: 3,
          systemX: 4,
          systemY: 4,
          starType: 'Ghost Star',
          starColor: '#AAAAAA',
          starSize: 1,
        });
        return { systemId };
      });

      // 2. Call mutation (unauthenticated) and expect it to throw
      await expect(
        t.mutation(api.game.map.systemMutations.discoverSystem, { systemId })
      ).rejects.toThrow('User must be authenticated to discover a system.');
    });

    test('should throw error if authenticated user has no record in users table', async () => {
      const t = convexTest(schema);
      const nonExistentUserEmail = 'ghost@example.com';

      // 1. Seed a system (but no user with nonExistentUserEmail)
      const { systemId } = await t.run(async (ctx) => {
        const galaxyId = await ctx.db.insert('galaxies', { number: 5, groupId: 'test-galaxy-5' });
        const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 5, sectorX: 4, sectorY: 4 });
        const systemId = await ctx.db.insert('sectorSystems', {
          galaxySectorId: sectorId,
          galaxyNumber: 5,
          sectorX: 4,
          sectorY: 4,
          systemX: 5,
          systemY: 5,
          starType: 'Void Star',
          starColor: '#000000',
          starSize: 3,
        });
        return { systemId };
      });

      const tWithAuth = t.withIdentity({ subject: nonExistentUserEmail });

      await expect(
        tWithAuth.mutation(api.game.map.systemMutations.discoverSystem, { systemId })
      ).rejects.toThrow(`User record not found for subject: ${nonExistentUserEmail}. Please ensure user exists.`);
    });

    test('should throw error if system not found', async () => {
      const t = convexTest(schema);

      // 1. Seed a user
      await t.run(async (ctx) => {
        await ctx.db.insert('users', { name: 'Finder User', email: mockUserEmail1, subject: mockUserEmail1 });
      });

      // 2. Create a valid but non-existent system ID by creating and then deleting a system
      const { nonExistentSystemId } = await t.run(async (ctx) => {
        const galaxyId = await ctx.db.insert('galaxies', { number: 99, groupId: 'temp-galaxy' });
        const sectorId = await ctx.db.insert('galaxySectors', { galaxyId, galaxyNumber: 99, sectorX: 9, sectorY: 9 });
        const tempSystemId = await ctx.db.insert('sectorSystems', {
          galaxySectorId: sectorId,
          galaxyNumber: 99,
          sectorX: 9,
          sectorY: 9,
          systemX: 9,
          systemY: 9,
          starType: 'Temp Star',
          starColor: '#000000',
          starSize: 1,
        });
        await ctx.db.delete(tempSystemId);
        return { nonExistentSystemId: tempSystemId };
      });

      const tWithAuth = t.withIdentity({ subject: mockUserEmail1 });

      // 3. Call mutation and expect it to throw the correct error
      await expect(
        tWithAuth.mutation(api.game.map.systemMutations.discoverSystem, {
          systemId: nonExistentSystemId,
        })
      ).rejects.toThrow('System not found');
    });
  });
});
