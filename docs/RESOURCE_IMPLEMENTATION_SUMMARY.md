# Resource Management System - Implementation Summary

## What Was Created

### 1. Resource Schema (`convex/game/resources/resources.schema.ts`)

Three new tables for comprehensive resource management:

**`resourceDefinitions`** - Master table defining all resource types:

- Unique code, name, category
- Storage type (global/base/fleet)
- Display properties (icon, color, order)
- Gameplay flags (visible, tradeable, has production, has storage)
- Legacy field mapping for backward compatibility

**`playerResources`** - Tracks global player resources:

- Links user to resource definition
- Current amount, storage capacity, production rate
- Timestamp tracking

**`baseResources`** - Tracks base-specific resources (for future use):

- Links base to resource definition
- Local storage and production

### 2. Resource Definitions Seed (`convex/seed/resourceDefinitionsSeed.ts`)

Initial resource definitions:

**Active Resources:**

- Nova (Currency) - Primary currency
- Minerals (Material) - Construction material
- Volatiles (Material) - Advanced tech material

**Future Resources (Hidden):**

- Research Points - Flexible research currency
- Rare Minerals - Special materials
- Dark Matter - Exotic research
- Antimatter - Base-stored energy

### 3. Helper Functions (`convex/game/resources/resourceHelpers.ts`)

Comprehensive utility functions:

- `getResourceByCode()` - Fetch resource definition
- `getPlayerResourceAmount()` - Get amount (handles legacy fields)
- `getPlayerResourcesMap()` - Get all resources
- `updatePlayerResource()` - Set amount
- `modifyPlayerResource()` - Add/subtract
- `hasEnoughResources()` - Check affordability
- `deductResources()` - Atomic deduction
- `loadResourceCosts()` - Load from resourceCosts table

### 4. Documentation (`docs/RESOURCE_MANAGEMENT.md`)

Complete guide covering:

- Architecture overview
- Current and future resources
- Benefits of new system
- Migration strategy
- Recommendations for expansion
- Implementation priorities

## Key Benefits

### 1. Centralized Management

- All resources defined in one table
- No more schema changes to add resources
- Consistent handling across systems

### 2. Backward Compatible

- Legacy fields on `users` table still work
- Dual-system approach (checks new, falls back to legacy)
- Gradual migration path

### 3. Flexible & Scalable

- Easy to add new resource types
- Support for different storage models (global/base/fleet)
- Production and storage tracking built-in

### 4. Better UX

- Icons and colors for each resource
- Controlled visibility (hide unimplemented resources)
- Display order control

## Current State

✅ Schema created and added to main schema
✅ Helper functions ready to use
✅ Seed data for initial resources
✅ Documentation complete

⏳ TypeScript may show temporary errors until Convex regenerates types
⏳ Seeding not yet integrated into init.ts
⏳ Existing code still uses legacy system

## Next Steps

### Immediate (Required for System to Function)

1. **Add seeding to `convex/init.ts`:**

```typescript
import { resourceDefinitionsSeedData } from './seed/resourceDefinitionsSeed';

// In the init action, after other seeding:
const existingResources = await ctx.db.query('resourceDefinitions').collect();

if (existingResources.length === 0) {
  console.log('🔋 Seeding Resource Definitions...');
  for (const resource of resourceDefinitionsSeedData) {
    await ctx.db.insert('resourceDefinitions', resource);
  }
  console.info(
    `🔋 ${resourceDefinitionsSeedData.length} Resource Definitions seeded.`
  );
} else {
  console.log('🔋 Skipping Resource Definitions seeding - already exist.');
}
```

2. **Wait for Convex to regenerate types:**
   - The TypeScript errors will resolve once Convex dev server processes the new schema
   - The tables will appear in `_generated/dataModel.d.ts`

### Short-Term (Gradual Migration)

3. **Start using helpers in new code:**

```typescript
// Instead of: user.nova -= cost
// Use:
await modifyPlayerResource(ctx, userId, 'nova', -cost);

// Instead of: if (user.nova < cost)
// Use:
const check = await hasEnoughResources(ctx, userId, { nova: cost });
if (!check.hasEnough) throw new Error('Insufficient resources');
```

4. **Update one mutation at a time:**
   - Start with new features
   - Gradually migrate existing mutations
   - Both systems work simultaneously

### Medium-Term (Enhanced Features)

5. **Implement storage limits:**

   - Check storage capacity before adding resources
   - Show storage status in UI
   - Add storage upgrade mechanics

6. **Add production tracking:**

   - Cycle-based resource production
   - Production rate calculations
   - Production bonuses from structures/research

7. **Create resource UI components:**
   - ResourceDisplay component
   - ResourceCost component
   - ResourceBar with storage progress

### Long-Term (Advanced Features)

8. **Resource trading system**
9. **Resource conversion/refining**
10. **Resource events**
11. **Advanced resource types** (population, influence, etc.)

## Recommendations

### For Current Resources

1. **Add Production Tracking:**

   - Track nova/minerals/volatiles production rates
   - Show production per hour in UI
   - Calculate time until storage full

2. **Implement Storage:**

   - Start with 10k storage for minerals/volatiles
   - Add storage upgrades from structures
   - Show storage warnings at 80% full

3. **Resource Events:**
   - Random bonuses/penalties
   - Discovery events
   - Market fluctuations for nova

### For Future Expansion

1. **Population Resource:**

   - Affects production and research
   - Requires food to sustain
   - Growth based on habitability

2. **Influence Resource:**

   - Used for diplomacy
   - Generated by cultural structures
   - Required for alliances

3. **Energy as Resource:**
   - Convert from base-level stat to actual resource
   - Can be stored and traded
   - Required for ship operations

## Example Usage

### Check and Deduct Resources

```typescript
// Load costs from resourceCosts table
const costs = await loadResourceCosts(ctx, 'technology', 'shield_tech');

// Check if player can afford
const check = await hasEnoughResources(ctx, userId, costs);
if (!check.hasEnough) {
  throw new Error(
    `Missing: ${Object.entries(check.missing)
      .map(([r, a]) => `${r}: ${a}`)
      .join(', ')}`
  );
}

// Deduct atomically
await deductResources(ctx, userId, costs);
```

### Get All Player Resources

```typescript
const resources = await getPlayerResourcesMap(ctx, userId);
// Returns: { nova: 1000, mineral: 500, volatile: 250, ... }
```

### Add Resources (Production)

```typescript
await modifyPlayerResource(ctx, userId, 'nova', 100); // +100 nova
await modifyPlayerResource(ctx, userId, 'mineral', 50); // +50 minerals
```

## Testing the System

1. **Start Convex dev server** - Let it regenerate types
2. **Run init function** - Seeds resource definitions
3. **Check database** - View resourceDefinitions table in Convex dashboard
4. **Test helpers** - Call helper functions from mutations
5. **Verify legacy fallback** - Existing code still works

## Troubleshooting

**TypeScript errors:**

- Wait for Convex to regenerate types after schema changes
- Restart TypeScript language server if needed

**Resources not appearing:**

- Check if resourceDefinitions seeding ran
- Verify isVisible flag is true
- Check displayOrder for UI sorting

**Legacy fields not working:**

- Ensure legacyFieldName matches user document fields
- Check helper functions are using correct fallback logic

## Questions to Consider

1. **Storage Limits:**

   - Should overflow auto-sell? Convert? Waste?
   - Should storage be upgradeable per-resource or global?

2. **Production:**

   - Should production be continuous or cycle-based?
   - Should there be production efficiency mechanics?

3. **Trading:**

   - Player-to-player only or marketplace?
   - What resources should be tradeable?
   - Tax/fee on trades?

4. **Display:**
   - Show all resources or only non-zero?
   - Tooltip with production rate and time-to-full?
   - Separate tabs for different resource categories?
