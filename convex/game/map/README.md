# Map Queries (`convex/game/map/galaxyQueries.ts`)

This document provides an overview of the query functions available for retrieving galaxy, sector, system, and planet data from the Convex database.

## Planet Queries

-   **`getAllPlanetTypes`**: Retrieves all documents from the `planetTypes` table.
-   **`getPlanetTypesByCategory`**: Takes a `category` string and retrieves all documents from the `planetTypes` table. *Note: The current implementation does not filter by category.*
-   **`getPlanetsByType`**: Takes a `planetTypeId` and retrieves all `systemPlanets` documents of that type.

## Galaxy & Sector Queries

-   **`getAllGalaxies`**: Retrieves all documents from the `galaxies` table.
-   **`getGalaxyByNumber`**: Retrieves a single galaxy document by its unique `number`.
-   **`getGalaxySectorIds`** (internal): Retrieves an array of sector `_id`s for a given `galaxyId`.
-   **`getGalaxySectors`**: Retrieves all sector documents for a given `galaxyId`.
-   **`getSectorByCoordinates`**: Retrieves a single sector document using its coordinates, looking up by either `galaxyId` or `galaxyNumber`.

## System Queries

-   **`getSectorSystems`**: Retrieves all star system documents within a given `sectorId`.
-   **`getSectorSystemsByCoordinates`**: Retrieves all star system documents within a sector, specified by `galaxyNumber` and sector coordinates.
-   **`getStarSystemById`**: Retrieves a single star system document by its `_id`.
-   **`getStarSystemByCoordinates`**: Retrieves a single star system document using its absolute coordinates (`galaxyNumber`, sector coords, system coords).

## Planet Queries (in Systems)

-   **`getSystemPlanets`**: Retrieves all planet documents for a given `systemId`, enriching each with its full `planetType` data.
-   **`getPlanetByCoordinates`**: Retrieves a single planet document using its absolute coordinates, enriching it with its full `planetType` data.
