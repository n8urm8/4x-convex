# Database reset and migrations

## Updating structure definitions (space/energy costs)

After changing structure costs in the seed (e.g. `convex/seed/structuresSeed.reorganized.ts`), you can update existing data in two ways.

### Option 1: Sync costs from seed (recommended)

Updates existing structure definition rows so their `baseSpaceCost` and `baseEnergyCost` match the current seed, by name. No data is deleted; existing bases and built structures keep working.

```bash
npx convex run init:syncStructureCostsFromSeed
```

Uses the migration in `convex/init.ts` (`syncStructureCostsFromSeed`).

### Option 2: Full reset and re-seed

Only use this if you want a clean slate (e.g. dev environment).

1. **Clear the structure definitions table**  
   In the [Convex Dashboard](https://dashboard.convex.dev): open your deployment → **Data** → select `structureDefinitions` → delete all documents (or use the table menu to clear).

   Or via CLI (replaces the table with no data):
   ```bash
   npx convex import --replace-all --table structureDefinitions --format jsonLines /dev/null -y
   ```

2. **Re-run init** so structures are seeded again from the seed file:
   ```bash
   npx convex run init:default
   ```
   Or, if you use the default init as an action:
   ```bash
   npx convex dev --run init --until-success
   ```
   (Note: init skips structure seeding if any structure definitions already exist, so you must clear the table first.)

**Warning:** If you clear `structureDefinitions`, any existing `baseStructures` rows will reference removed definition IDs. For a full reset you may also need to clear `baseStructures` (and optionally `playerBases`). Prefer **Option 1** if you only need updated costs.

## Clearing other tables

To clear a single table via CLI:

```bash
npx convex import --replace-all --table <tableName> --format jsonLines /dev/null -y
```

Example for a full dev reset (run in an order that respects foreign keys / references):

```bash
# Example order; adjust table names to match your schema
npx convex import --replace-all --table baseStructures --format jsonLines /dev/null -y
npx convex import --replace-all --table structureDefinitions --format jsonLines /dev/null -y
# Then re-run init to re-seed structureDefinitions (and any other seed data)
npx convex run init:default
```
