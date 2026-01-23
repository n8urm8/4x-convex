# Base Structure Progression System

## Overview

The base structures follow a clear tier-based progression system. Players must build and upgrade basic structures before accessing more advanced ones.

## Progression Tiers

Each structure category follows a 5-tier progression:

### Tier 1: Basic (No Requirements)

- **Purpose**: Entry-level structures accessible immediately
- **Requirements**: None
- **Examples**: Hab Dome, Construction Yard, Shipyard, Research Lab, Trading Post

### Tier 2: Intermediate (Requires Tier 1 Level 3 + Research)

- **Purpose**: Improved efficiency structures
- **Requirements**:
  - Previous tier structure at level 3
  - Specific research technology
- **Examples**: Terraforming Station (requires Hab Dome Level 3), Advanced Shipyard (requires Shipyard Level 3)

### Tier 3: Advanced (Requires Tier 2 Level 5 + Research)

- **Purpose**: Specialized high-efficiency structures
- **Requirements**:
  - Previous tier structure at level 5
  - Advanced research technology
- **Examples**: Orbital Habitat (requires Terraforming Station Level 5), Command Center (requires Construction Facility Level 5)

### Tier 4: Elite (Requires Tier 3 Level 5 + Research)

- **Purpose**: Cutting-edge structures with unique bonuses
- **Requirements**:
  - Previous tier structure at level 5
  - Elite research technology
- **Examples**: Subterranean Complex (requires Orbital Habitat Level 5), Planetary Forge (requires Command Center Level 5)

### Tier 5: Ultimate (Requires Tier 4 Level 5 + Research)

- **Purpose**: End-game structures with maximum efficiency
- **Requirements**:
  - Previous tier structure at level 5
  - Ultimate research technology
- **Examples**: Megastructure Hub (requires Subterranean Complex Level 5), Industrial Complex (requires Planetary Forge Level 5)

## Structure Categories

### HABITAT (Space-providing structures)

1. **Hab Dome** (Tier 1) - No requirements
2. **Terraforming Station** (Tier 2) - Requires Hab Dome Level 3 + "Planetary Adaptation" research
3. **Orbital Habitat** (Tier 3) - Requires Terraforming Station Level 5 + "Zero-G Construction" research
4. **Subterranean Complex** (Tier 4) - Requires Orbital Habitat Level 5 + "Advanced Excavation" research
5. **Megastructure Hub** (Tier 5) - Requires Subterranean Complex Level 5 + "Megastructure Engineering" research

### CONSTRUCTION (Build speed and efficiency)

1. **Construction Yard** (Tier 1) - No requirements
2. **Construction Facility** (Tier 2) - Requires Construction Yard Level 3 + "Automated Construction" research
3. **Command Center** (Tier 3) - Requires Construction Facility Level 5 + "Advanced Logistics" research
4. **Planetary Forge** (Tier 4) - Requires Command Center Level 5 + "Matter Manipulation" research
5. **Industrial Complex** (Tier 5) - Requires Planetary Forge Level 5 + "Quantum Manufacturing" research

### PRODUCTION (Ship building)

1. **Shipyard** (Tier 1) - No requirements
2. **Advanced Shipyard** (Tier 2) - Requires Shipyard Level 3 + "Advanced Propulsion" research
3. **Fleet Command** (Tier 3) - Requires Advanced Shipyard Level 5 + "Fleet Tactics" research
4. **Titan Dock** (Tier 4) - Requires Fleet Command Level 5 + "Capital Ship Design" research
5. **Sovereign Shipworks** (Tier 5) - Requires Titan Dock Level 5 + "Dreadnought Technology" research

### RESEARCH (Research speed)

1. **Research Lab** (Tier 1) - No requirements
2. **Science Complex** (Tier 2) - Requires Research Lab Level 3 + "Scientific Method" research
3. **Technology Institute** (Tier 3) - Requires Science Complex Level 5 + "Advanced Physics" research
4. **Quantum Laboratory** (Tier 4) - Requires Technology Institute Level 5 + "Quantum Computing" research
5. **Stellar Observatory** (Tier 5) - Requires Quantum Laboratory Level 5 + "Dark Matter Studies" research

### ECONOMIC (Trade and economy)

1. **Trading Post** (Tier 1) - No requirements
2. **Trade Hub** (Tier 2) - Requires Trading Post Level 3 + "Interstellar Commerce" research
3. **Financial Center** (Tier 3) - Requires Trade Hub Level 5 + "Advanced Economics" research
4. **Galactic Exchange** (Tier 4) - Requires Financial Center Level 5 + "Market Manipulation" research
5. **Economic Nexus** (Tier 5) - Requires Galactic Exchange Level 5 + "Quantum Finance" research

### UTILITY (Special purpose structures)

1. **Power Generator** (Tier 1) - No requirements
2. **Fusion Reactor** (Tier 2) - Requires Power Generator Level 3 + "Fusion Technology" research
3. **Antimatter Plant** (Tier 3) - Requires Fusion Reactor Level 5 + "Antimatter Containment" research
4. **Zero-Point Generator** (Tier 4) - Requires Antimatter Plant Level 5 + "Zero-Point Energy" research
5. **Stellar Harvester** (Tier 5) - Requires Zero-Point Generator Level 5 + "Stellar Engineering" research

## Implementation Details

### Schema Fields

- `requiredStructureName`: Name of the prerequisite structure (optional)
- `requiredStructureLevel`: Minimum level required of the prerequisite structure (optional)
- `researchRequirementName`: Name of the required research technology (optional)

### Validation

**Server-side** (in `baseMutations.ts`):

- Validates research requirements
- Validates structure prerequisites (checks if required structure exists at required level)
- Throws detailed error messages on failure

**Client-side** (in `BaseStructuresTab.tsx`):

- Checks requirements before enabling build button
- Displays all missing requirements in the UI
- Shows tooltips with missing requirement details

### Error Messages

- "Research not completed: {researchName}"
- "Structure not built: {structureName}"
- "Structure level too low: {structureName} (Level {currentLevel}, Required: {requiredLevel})"

## Design Philosophy

1. **Clear Progression**: Each tier builds naturally on the previous one
2. **Player Choice**: Players choose which structure type to focus on first
3. **Strategic Depth**: Must balance upgrading existing structures vs building new ones
4. **No Skipping**: Cannot skip tiers; must progress through each level
5. **Research Gates**: Higher tiers require both structural prerequisites AND technological advancement
