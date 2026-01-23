# Resource Management System

## Overview

This document describes the enhanced resource management system for the 4X game. The system provides a flexible, scalable way to define and manage various types of resources.

## Architecture

### Three-Table Design

1. **`resourceDefinitions`** - Defines all available resource types
2. **`playerResources`** - Tracks global player resource amounts
3. **`baseResources`** - Tracks base-specific resource amounts (for future base-level resources)
4. **`resourceCosts`** - Links resources to game entities (research, structures, ships)

### Resource Definition Properties

Each resource has:

- **Code**: Unique identifier (e.g., "nova", "mineral")
- **Name**: Display name (e.g., "Nova", "Minerals")
- **Category**: Type of resource (currency, material, energy, research, special)
- **Storage Type**: Where it's stored (global, base, fleet)
- **Display Properties**: Icon, color, display order
- **Gameplay Properties**: Visibility, tradeability, production, storage limits

## Current Resources

### Active Resources

1. **Nova** (Currency) - Primary currency, no storage limit
2. **Minerals** (Material) - Construction material, 10k base storage
3. **Volatiles** (Material) - Advanced tech material, 10k base storage

### Future Resources (Defined but Hidden)

4. **Research Points** - Flexible research currency
5. **Rare Minerals** - Special materials for advanced tech
6. **Dark Matter** - Exotic research material
7. **Antimatter** - Base-stored energy resource

## Benefits of New System

### 1. Centralized Resource Management

- All resource types defined in one place
- Easy to add new resources without schema migrations
- Consistent resource handling across all game systems

### 2. Flexible Storage

- Global resources (empire-wide)
- Base resources (local production/storage)
- Fleet resources (cargo - future feature)

### 3. Enhanced Gameplay

- Per-resource storage limits
- Production rate tracking
- Resource visibility control (can hide unimplemented resources)
- Trading flags (some resources can't be traded)

### 4. Better UI/UX

- Consistent resource icons and colors
- Controlled display order
- Easy to show/hide resources based on game progression

### 5. Future-Proof

- Easy to add new resource types
- Support for complex resource relationships
- Can implement resource conversion/refinement
- Base-level resource management ready

## Helper Functions

Located in `convex/game/resources/resourceHelpers.ts`:

- `getResourceByCode()` - Get resource definition
- `getVisibleResources()` - Get all visible resources
- `getPlayerResourceAmount()` - Get player's resource amount (handles legacy)
- `getPlayerResourcesMap()` - Get all resources as map
- `updatePlayerResource()` - Set resource amount
- `modifyPlayerResource()` - Add/subtract resource
- `hasEnoughResources()` - Check if player can afford costs
- `deductResources()` - Atomic deduction with validation
- `loadResourceCosts()` - Load costs from resourceCosts table

## Migration Strategy

### Phase 1: Dual System (Current)

- New tables created but not actively used
- Legacy fields on `users` table still work
- Helper functions check new system first, fallback to legacy

### Phase 2: Gradual Migration

- New features use new system
- Existing code continues using legacy
- Both systems work simultaneously

### Phase 3: Full Migration (Future)

- Move all resource amounts to `playerResources` table
- Keep legacy fields for backward compatibility
- Update all mutations to use helper functions

### Phase 4: Cleanup (Optional)

- Remove legacy fields from `users` table
- Remove legacy fallback code
- Pure new system

## Recommendations

### 1. Resource Types to Add

**Immediate Value:**

- **Population** - Track citizens, affects production and research
- **Food** - Required to sustain population growth
- **Influence** - Political resource for diplomacy

**Mid-Term:**

- **Deuterium** - Advanced ship fuel
- **Quantum Crystals** - High-tier technology material
- **Cultural Points** - For cultural victory path

**Long-Term:**

- **Time Crystals** - Unique resource for temporal tech
- **Exotic Matter** - Wormhole and FTL tech
- **Nanomaterials** - Self-replicating construction

### 2. Resource Production System

Implement a cycle-based production system:

```typescript
// Example: Calculate and apply resource production
export const processResourceProduction = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const bases = await ctx.db
      .query('playerBases')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    // Calculate total production from all bases
    const production = calculateTotalProduction(bases);

    // Apply production to resources
    for (const [resourceCode, amount] of Object.entries(production)) {
      await modifyPlayerResource(ctx, args.userId, resourceCode, amount);
    }
  }
});
```

### 3. Resource Storage System

Implement storage limits with overflow options:

```typescript
// Storage upgrades from research/structures
// Overflow options: auto-sell, auto-convert, warehouses
export const upgradeResourceStorage = mutation({
  args: {
    resourceCode: v.string(),
    newCapacity: v.number()
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const resourceDef = await getResourceByCode(ctx, args.resourceCode);

    // Update storage capacity
    const playerResource = await getPlayerResource(userId, resourceDef._id);
    await ctx.db.patch(playerResource._id, {
      storageCapacity: args.newCapacity
    });
  }
});
```

### 4. Resource Trading System

Enable player-to-player resource trading:

```typescript
// Trade offers table
tradeOffers: defineTable({
  sellerId: v.id('users'),
  buyerId: v.optional(v.id('users')), // null = open market
  resourceDefinitionId: v.id('resourceDefinitions'),
  amount: v.number(),
  pricePerUnit: v.number(),
  priceResourceId: v.id('resourceDefinitions'), // what they want in exchange
  expiresAt: v.number(),
  status: v.union(
    v.literal('open'),
    v.literal('completed'),
    v.literal('cancelled')
  )
});
```

### 5. Resource Conversion/Refining

Allow converting one resource to another:

```typescript
// Conversion recipes table
resourceConversions: defineTable({
  name: v.string(),
  inputResourceId: v.id('resourceDefinitions'),
  inputAmount: v.number(),
  outputResourceId: v.id('resourceDefinitions'),
  outputAmount: v.number(),
  conversionTime: v.number(), // seconds
  requiredStructure: v.optional(v.string()),
  requiredResearch: v.optional(v.string())
});
```

### 6. Resource Events

Random events that affect resource production:

```typescript
// Resource events
- Solar flares (boost energy production)
- Asteroid strike (instant mineral bonus)
- Market crash (nova production reduced)
- Discovery (unlock rare resource node)
- Pirates (lose volatiles)
```

### 7. Resource Visualization

Enhanced UI components:

```typescript
// Resource display component with:
- Current amount / storage capacity progress bar
- Production rate per hour
- Time until storage full
- Trending indicators (increasing/decreasing)
- Color coding for critical levels
```

### 8. Resource Efficiency System

Structures and tech that affect resource efficiency:

```typescript
// Efficiency multipliers
- Base efficiency: 100%
- Research bonuses: +10-50%
- Structure bonuses: +5-25%
- Planet bonuses: +0-50%
- Empire bonuses: +10-30%

// Calculate effective production
effectiveProduction = baseProduction * (1 + bonuses)
```

## Implementation Priority

### High Priority

1. ✅ Create resource definitions table
2. ✅ Create helper functions
3. ✅ Seed initial resources
4. Create migration to populate playerResources
5. Update existing mutations to use helpers

### Medium Priority

6. Implement storage limits
7. Add resource production tracking
8. Create resource UI components
9. Add resource events system
10. Implement resource conversion

### Low Priority

11. Player trading system
12. Resource market/economy
13. Advanced resource types
14. Resource-based achievements
15. Resource statistics/analytics

## Example Usage

```typescript
// Check if player can afford research
const costs = await loadResourceCosts(ctx, 'technology', 'advanced_armor');
const check = await hasEnoughResources(ctx, userId, costs);

if (!check.hasEnough) {
  throw new Error(`Missing: ${JSON.stringify(check.missing)}`);
}

// Deduct resources atomically
await deductResources(ctx, userId, costs);

// Or manually modify individual resources
await modifyPlayerResource(ctx, userId, 'nova', -1000); // spend 1000 nova
await modifyPlayerResource(ctx, userId, 'mineral', 500); // gain 500 minerals
```

## Testing Recommendations

1. **Resource Helper Tests** - Unit tests for all helper functions
2. **Migration Tests** - Verify legacy fallback works
3. **Storage Limit Tests** - Test overflow behavior
4. **Production Tests** - Verify production calculations
5. **Transaction Tests** - Atomic operations don't leave partial states

## Performance Considerations

1. **Caching** - Cache resource definitions (they rarely change)
2. **Batch Operations** - Group multiple resource updates
3. **Denormalization** - Keep frequently accessed values on user doc
4. **Indexes** - Ensure proper indexes on resource queries
5. **Pagination** - Paginate resource transaction history

## Conclusion

This resource management system provides a solid foundation for current gameplay while enabling future expansion. The dual-system approach allows gradual migration without breaking existing functionality.

Key advantages:

- Scalable and maintainable
- Type-safe resource handling
- Easy to add new resources
- Supports complex resource relationships
- Better player experience with clear resource tracking
