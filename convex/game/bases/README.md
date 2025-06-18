# Base Mutations and Queries

This document provides an overview of the mutation and query functions available for managing player bases and structures within the Convex database.

## Base Mutations (`convex/game/bases/baseMutations.ts`)

These functions handle creating, modifying, and managing player bases and the structures within them.

-   **`createBase`**: Creates a new player base on a specified planet.
-   **`buildStructure`**: Initiates the construction of a new structure within a base.
-   **`completeStructureUpgrade`**: Finalizes a structure's build or upgrade process.
-   **`startStructureUpgrade`**: Begins the upgrade process for an existing structure.
-   **`cancelStructureUpgrade`**: Cancels an ongoing structure upgrade.
-   **`demolishStructure`**: Removes a structure from a base.
-   **`renameBase`**: Changes the name of a player base.
-   **`abandonBase`**: Allows a player to abandon a base.
-   **`rushComplete`**: Instantly completes a structure's build or upgrade, typically using a special currency.
-   **`collectBaseResources`**: Collects accumulated resources from a base.
-   **`checkCompletedUpgrades`**: Checks for and finalizes any structure upgrades that have completed their timers.

## Base Queries (`convex/game/bases/baseQueries.ts`)

These functions are used to retrieve information about base structures, definitions, costs, and player bases.

### Structure Definitions & Information
-   **`getAllStructureDefinitions`**: Retrieves all available structure definitions.
-   **`getStructuresByCategory`**: Retrieves structure definitions filtered by a specific category.
-   **`getStructureById`**: Retrieves a specific structure definition by its ID.
-   **`getStructureRequirements`**: Retrieves the requirements needed to build a specific structure.
-   **`getStructureEffectsAtLevel`**: Retrieves the effects (e.g., production bonuses) of a structure at a given level.

### Player Base Structures
-   **`getBaseStructures`**: Retrieves all structures currently built in a specific player base.
-   **`getDetailedBaseStructures`**: Retrieves structures in a base, including their detailed definition data.
-   **`getUpgradingStructures`**: Retrieves structures that are currently undergoing an upgrade in a base.
-   **`getAvailableStructures`**: Retrieves a list of structure definitions that can be built in a base (i.e., not already built and requirements met).
-   **`getUpgradableStructures`**: Retrieves a list of structures in a base that are eligible for an upgrade.

### Costs & Timers
-   **`getStructureBuildCost`**: Calculates the cost and time to build a new structure in a base.
-   **`getStructureUpgradeCost`**: Calculates the cost and time to upgrade an existing structure.

### Player Base Information
-   **`getPlayerBases`**: Retrieves all bases belonging to a specific player.
-   **`getBaseById`**: Retrieves a specific player base by its ID.
-   **`getBaseOnPlanet`**: Retrieves information if a base exists on a specific planet.
