Let me explain the galaxy creation process in detail and show you how we can modify it to create a more realistic distribution with higher density at the center.

## Current Galaxy Creation Process

Currently, the galaxy creation happens in three distinct steps:

### 1. Creating the Galaxy Structure

```typescript
export const createGalaxy = mutation({
  args: {
    groupId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Create the galaxy record
    const galaxyId = await ctx.db.insert('galaxies', {
      number: nextNumber,
      groupId: args.groupId ?? 'default'
    });

    // Create 10x10 empty sectors
    for (let x = 0; x < GALAXY_SIZE; x++) {
      for (let y = 0; y < GALAXY_SIZE; y++) {
        await ctx.db.insert('galaxySectors', {
          galaxyId,
          sectorX: x,
          sectorY: y
        });
      }
    }

    return { galaxyId };
  }
});
```

This creates a 10×10 grid of empty sectors. Each sector is identified by its coordinates (sectorX, sectorY).

### 2. Generating Star Systems in a Sector (On Demand)

```typescript
export const generateSectorSystems = mutation({
  args: {
    sectorId: v.id('galaxySectors'),
    density: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Determine number of star systems (default 20% density)
    const density = args.density ?? 0.2;
    const maxSystems = SECTOR_SIZE * SECTOR_SIZE * density;
    const numSystems = Math.min(Math.floor(maxSystems), 2000);

    // Generate random systems within the sector
    for (let i = 0; i < numSystems; i++) {
      // Random position
      const systemX = Math.floor(Math.random() * SECTOR_SIZE);
      const systemY = Math.floor(Math.random() * SECTOR_SIZE);

      // Create the star system
      await ctx.db.insert('sectorSystems', {
        galaxySectorId: args.sectorId,
        systemX,
        systemY,
        starType: starInfo.type,
        starSize: 0.5 + Math.random() * 2.5,
        starColor: starInfo.color
      });
    }
  }
});
```

This creates a random distribution of star systems within a single sector. The systems are placed at random coordinates, without any pattern.

### 3. Generating Planets in a Star System (On Demand)

```typescript
export const generateSystemPlanets = mutation({
  args: {
    systemId: v.id('sectorSystems'),
    planetCount: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Determine number of planets (2-8 by default)
    const numPlanets = args.planetCount ?? 2 + Math.floor(Math.random() * 7);

    // Create planets in orbital positions around the star
    const starX = Math.floor(SYSTEM_SIZE / 2);
    const starY = Math.floor(SYSTEM_SIZE / 2);

    for (let i = 0; i < numPlanets; i++) {
      // Distance from star (1-3 units)
      const distanceFromStar = Math.floor(1 + Math.random() * 3);

      // Random angle around star
      const angle = Math.random() * 2 * Math.PI;
      planetX = starX + Math.round(Math.cos(angle) * distanceFromStar);
      planetY = starY + Math.round(Math.sin(angle) * distanceFromStar);

      // Create the planet
      await ctx.db.insert('systemPlanets', {
        sectorSystemId: args.systemId,
        planetTypeId: planetType._id,
        planetX,
        planetY
      });
    }
  }
});
```

This creates planets in orbital positions around the star. The planets are distributed in concentric circles at distances 1-3 from the star.

## Creating a More Realistic Galaxy Distribution

To create a galaxy with higher density at the center, we need to modify the system generation function. Here's how we can do it:

## How The Realistic Galaxy Distribution Works

The enhanced galaxy generation above creates a much more realistic galaxy with the following features:

### 1. Density Distribution Based on Distance from Center

The key function is `calculateDensityAtPosition`:

```typescript
function calculateDensityAtPosition(galaxyX, galaxyY) {
  // Normalize coordinates to -1 to 1 range
  const normalizedX = (galaxyX / GALAXY_SIZE) * 2 - 1;
  const normalizedY = (galaxyY / GALAXY_SIZE) * 2 - 1;

  // Calculate distance from center
  const distanceFromCenter = Math.sqrt(
    normalizedX * normalizedX + normalizedY * normalizedY
  );

  // Calculate density based on distance (higher at center, lower at edges)
  let density =
    GALAXY_CENTER_DENSITY *
      Math.pow(1 - normalizedDistance, GALAXY_DENSITY_FALLOFF) +
    GALAXY_EDGE_DENSITY;

  // [Optional spiral arm effect]

  return density;
}
```

This creates a smooth gradient with:

- Highest density (GALAXY_CENTER_DENSITY = 0.5) at the center
- Lowest density (GALAXY_EDGE_DENSITY = 0.05) at the edges
- A non-linear falloff controlled by GALAXY_DENSITY_FALLOFF

### 2. Optional Spiral Arm Effect

The code also includes an optional spiral arm effect that creates higher density along spiral arms:

```typescript
// Optional: Add spiral arm effect
if (GALAXY_SPIRAL_FACTOR > 0) {
  // Convert to polar coordinates
  const angle = Math.atan2(normalizedY, normalizedX);

  // Calculate spiral arm effect (higher near arms)
  const armAngle = angle * GALAXY_SPIRAL_ARMS;
  const spiralPhase = Math.cos(armAngle - 3 * normalizedDistance);

  // Apply spiral effect more strongly toward edges
  const spiralModifier =
    GALAXY_SPIRAL_FACTOR * normalizedDistance * Math.pow(spiralPhase, 2);
  density = density * (1 + spiralModifier);
}
```

This creates density waves that spiral outward from the center, simulating spiral arms.

### 3. Realistic Planet Distribution

The planet generation is also enhanced to be more realistic:

- Planets are placed at increasing distances from the star
- The number of planets varies based on star type (giant stars have more planets)
- Planet types are matched to their distance from the star (hot planets close, ice giants far)

## How To Use The Enhanced Galaxy Generation

### Step 1: Create the Galaxy

```typescript
const { galaxyId } = await createGalaxy();
```

This creates the galaxy with 10×10 empty sectors.

### Step 2a: Generate Systems in a Specific Sector (On Demand)

```typescript
// Get the sector first
const sectors = await getGalaxySectors({ galaxyId });
const sectorId = sectors.find((s) => s.sectorX === 5 && s.sectorY === 5)._id; // Center sector

// Generate systems just for this sector
await generateSectorSystems({ sectorId });
```

The system density will automatically be higher in central sectors and lower in edge sectors.

### Step 2b: Generate All Systems at Once (Bulk Creation)

```typescript
// Generate all systems for the entire galaxy at once
await generateAllGalaxySystems({ galaxyId });
```

This will create all systems in all sectors with the appropriate density distribution.

### Step 3: Generate Planets for a System (On Demand)

```typescript
// Get a system first
const systems = await getSectorSystems({ sectorId });
const systemId = systems[0]._id;

// Generate planets for this system
await generateSystemPlanets({ systemId });
```

## Visualization and Testing

You can use the `getGalaxyDensityMap` query to visualize the density distribution:

```typescript
const densityMap = await getGalaxyDensityMap({ galaxyId });
```

This returns the theoretical density for each sector, which you can use to visualize how your galaxy should look.

## Configuration Options

You can adjust these constants to change the galaxy shape:

```typescript
const GALAXY_CENTER_DENSITY = 0.5; // Maximum density at center (0-1)
const GALAXY_EDGE_DENSITY = 0.05; // Minimum density at edges (0-1)
const GALAXY_DENSITY_FALLOFF = 1.5; // How quickly density drops (higher = sharper)
const GALAXY_SPIRAL_FACTOR = 0.5; // Spiral arm strength (0 = no spirals)
const GALAXY_SPIRAL_ARMS = 2; // Number of spiral arms
```

These give you complete control over the galaxy's shape and distribution.

## Summary

The enhanced galaxy generation creates a much more realistic galaxy with:

1. Higher star density near the center, gradually decreasing toward the edges
2. Optional spiral arm patterns for a more interesting distribution
3. Realistic planetary systems with appropriate planet types based on distance
4. On-demand generation that allows you to only create systems as needed

This approach gives you a good balance between realism and performance, since you can generate sectors only when players explore them.
