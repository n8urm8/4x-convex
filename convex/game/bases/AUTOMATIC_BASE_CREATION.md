# Automatic Starting Base for New Users

## Overview

New users are automatically assigned a starting base on a suitable planet when they create their account. The system uses weighted random selection to favor the center of the galaxy and ensures an optimal starting experience.

## How It Works

### 1. User Creation Flow

When a user creates an account in [devEmailHelpers.ts](../otp/devEmailHelpers.ts), after initializing their resources, the system schedules the `createStartingBase` mutation.

### 2. Location Selection (Weighted Random)

The selection algorithm uses a **normal distribution** centered at the middle of the galaxy (coordinates 4.5 in a 0-9 range):

```typescript
function selectWeightedCoordinate(): number {
  const center = 4.5;
  const stdDev = 2.0;
  // Box-Muller transform for normal distribution
  // Returns a coordinate between 0-9, heavily weighted towards center
}
```

**Effect**: ~68% of bases will be within 2 units of center, ~95% within 4 units.

### 3. Sector Selection

- Selects random sector coordinates (0-9, 0-9) using weighted distribution
- Favors central sectors for higher player density

### 4. System Selection

- Gets all systems in the selected sector
- Prefers unexplored systems
- Uses weighted coordinates (0-99 range) to select system near sector center
- Finds closest system to weighted coordinates

### 5. System Exploration

If the selected system hasn't been explored:

- Marks system as explored by the new user
- Generates planets in the system
- User becomes the discoverer

### 6. Planet Selection (Best Available)

Planets are scored based on:

- **Space**: x3 weight (most important for building)
- **Energy**: x2 weight (powers structures)
- **Minerals**: x1.5 weight (common resource)
- **Volatiles**: x1 weight (advanced resource)

Only **habitable** planets are considered. The planet with the highest score becomes the starting base location.

### 7. Base Creation

- Creates a base named "Home Base"
- Initializes with planet's resource capacity
- Sets all production values to 0 (player must build structures)

## File Structure

### New Files

- `convex/game/bases/baseInitialization.ts` - Main logic for automatic base creation

### Modified Files

- `convex/otp/devEmailHelpers.ts` - Triggers base creation after user creation

## Algorithm Details

### Weighted Random Selection

Uses **Box-Muller transform** to generate normally distributed random numbers:

- Center: 4.5 (middle of 0-9 range)
- Standard deviation: 2.0
- Results are clamped to [0, 9] range

This creates a "center-out" population pattern, naturally filling the galaxy core first.

### Planet Scoring Formula

```
score = (space * 3) + (energy * 2) + (minerals * 1.5) + (volatiles * 1)
```

Example planet types and scores:

- **Terrestrial** (5 space, 3 energy, 4 minerals, 2 volatiles): 29 points
- **Desert** (4 space, 4 energy, 2 minerals, 1 volatile): 27 points
- **Ice** (3 space, 2 energy, 3 minerals, 4 volatiles): 22.5 points

### Fallback Logic

If the best planet already has a base:

1. Try the second-best planet
2. If all suitable planets are occupied, return error
3. User would need manual base placement (rare edge case)

## Future Enhancements

- Ensure minimum distance between starting bases
- Reserve "safe zones" for new players
- Add race-based starting location preferences
- Implement retry logic for planet generation timing
