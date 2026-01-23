import { StructureDefinitionSeed, STRUCTURE_CATEGORIES } from '../game/bases/bases.schema';

/**
 * REORGANIZED STRUCTURE PROGRESSION SYSTEM
 * 
 * Each category now has a clear progression:
 * - Tier 1 (Basic): No requirements, just resource costs
 * - Tier 2: Requires research + Level 3 in Tier 1 structure
 * - Tier 3: Requires research + Level 5 in Tier 2 structure
 * - Tier 4: Requires research + Level 5 in Tier 3 structure
 * - Tier 5: Requires research + Level 5 in Tier 4 structure
 */

export const structuresSeedData: StructureDefinitionSeed[] = [
  // ==================== HABITAT STRUCTURES (Space Providers) ====================
  // Tier 1: Basic - NO REQUIREMENTS
  {
    name: 'Hab Dome',
    category: STRUCTURE_CATEGORIES.HABITAT,
    description: 'Basic habitat providing living space for colonists',
    baseSpaceCost: 5,
    baseEnergyCost: 2,
    baseNovaCost: 300,
    effects: '=+10 Space',
    upgradeBenefits: '=+5 Space per level',
  },

  // Tier 2: Requires research + Hab Dome Level 3
  {
    name: 'Terraforming Station',
    category: STRUCTURE_CATEGORIES.HABITAT,
    description: 'Advanced habitat with terraforming capabilities',
    baseSpaceCost: 8,
    baseEnergyCost: 3,
    baseNovaCost: 500,
    researchRequirementName: 'Planetary Adaptation',
    requiredStructureName: 'Hab Dome',
    requiredStructureLevel: 3,
    effects: '=+15 Space, -1 Volatiles',
    upgradeBenefits: '=+8 Space per level',
  },

  // Tier 3: Requires research + Terraforming Station Level 5
  {
    name: 'Orbital Habitat',
    category: STRUCTURE_CATEGORIES.HABITAT,
    description: 'Orbital living complex for expanding population',
    baseSpaceCost: 12,
    baseEnergyCost: 4,
    baseNovaCost: 800,
    researchRequirementName: 'Zero-G Construction',
    requiredStructureName: 'Terraforming Station',
    requiredStructureLevel: 5,
    effects: '=+20 Space, +1 Research',
    upgradeBenefits: '=+10 Space per level',
  },

  // Tier 4: Requires research + Orbital Habitat Level 5
  {
    name: 'Subterranean Complex',
    category: STRUCTURE_CATEGORIES.HABITAT,
    description: 'Underground city networks maximizing space usage',
    baseSpaceCost: 15,
    baseEnergyCost: 5,
    baseNovaCost: 1200,
    researchRequirementName: 'Advanced Excavation',
    requiredStructureName: 'Orbital Habitat',
    requiredStructureLevel: 5,
    effects: '=+25 Space, +1 Minerals',
    upgradeBenefits: '=+12 Space per level, +0.5 Minerals per level',
  },

  // Tier 5: Requires research + Subterranean Complex Level 5
  {
    name: 'Megastructure Hub',
    category: STRUCTURE_CATEGORIES.HABITAT,
    description: 'Massive megastructure housing millions',
    baseSpaceCost: 25,
    baseEnergyCost: 8,
    baseNovaCost: 2000,
    researchRequirementName: 'Megaengineering',
    requiredStructureName: 'Subterranean Complex',
    requiredStructureLevel: 5,
    effects: '=+40 Space, +2 Energy',
    upgradeBenefits: '=+20 Space per level, +1 Energy per level',
  },

  // ==================== CONSTRUCTION STRUCTURES (Build Speed) ====================
  // Tier 1: Basic - NO REQUIREMENTS
  {
    name: 'Construction Yard',
    category: STRUCTURE_CATEGORIES.CONSTRUCTION,
    description: 'Basic construction facility for building structures',
    baseSpaceCost: 8,
    baseEnergyCost: 3,
    baseNovaCost: 400,
    effects: '-10% Build Time',
    upgradeBenefits: '-5% Build Time per level',
  },

  // Tier 2: Requires research + Construction Yard Level 3
  {
    name: 'Automated Fabricator',
    category: STRUCTURE_CATEGORIES.CONSTRUCTION,
    description: 'Automated construction with minimal oversight',
    baseSpaceCost: 12,
    baseEnergyCost: 5,
    baseNovaCost: 700,
    researchRequirementName: 'Automation',
    requiredStructureName: 'Construction Yard',
    requiredStructureLevel: 3,
    effects: '-15% Build Time, +1 Minerals',
    upgradeBenefits: '-8% Build Time per level',
  },

  // Tier 3: Requires research + Automated Fabricator Level 5
  {
    name: 'Nanite Assembly',
    category: STRUCTURE_CATEGORIES.CONSTRUCTION,
    description: 'Nanomachine-powered rapid construction',
    baseSpaceCost: 15,
    baseEnergyCost: 7,
    baseNovaCost: 1100,
    researchRequirementName: 'Nanotechnology',
    requiredStructureName: 'Automated Fabricator',
    requiredStructureLevel: 5,
    effects: '-20% Build Time, +2 Minerals',
    upgradeBenefits: '-10% Build Time per level',
  },

  // Tier 4: Requires research + Nanite Assembly Level 5
  {
    name: 'Matter Compiler',
    category: STRUCTURE_CATEGORIES.CONSTRUCTION,
    description: 'Matter replication for instant construction',
    baseSpaceCost: 20,
    baseEnergyCost: 10,
    baseNovaCost: 1800,
    researchRequirementName: 'Matter Manipulation',
    requiredStructureName: 'Nanite Assembly',
    requiredStructureLevel: 5,
    effects: '-30% Build Time, +3 Minerals',
    upgradeBenefits: '-15% Build Time per level',
  },

  // Tier 5: Requires research + Matter Compiler Level 5
  {
    name: 'Quantum Constructor',
    category: STRUCTURE_CATEGORIES.CONSTRUCTION,
    description: 'Quantum-level construction at impossible speeds',
    baseSpaceCost: 30,
    baseEnergyCost: 15,
    baseNovaCost: 3000,
    researchRequirementName: 'Quantum Engineering',
    requiredStructureName: 'Matter Compiler',
    requiredStructureLevel: 5,
    effects: '-50% Build Time, +5 Minerals',
    upgradeBenefits: '-20% Build Time per level',
  },

  // ==================== PRODUCTION STRUCTURES (Shipyards) ====================
  // Tier 1: Basic - NO REQUIREMENTS
  {
    name: 'Shipyard',
    category: STRUCTURE_CATEGORIES.PRODUCTION,
    description: 'Basic shipyard for constructing small vessels',
    baseSpaceCost: 10,
    baseEnergyCost: 5,
    baseNovaCost: 500,
    effects: 'Unlocks Basic Ships',
    upgradeBenefits: '=+10% Ship Production Speed per level',
  },

  // Tier 2: Requires research + Shipyard Level 3
  {
    name: 'Advanced Shipyard',
    category: STRUCTURE_CATEGORIES.PRODUCTION,
    description: 'Advanced shipyard for medium-class vessels',
    baseSpaceCost: 15,
    baseEnergyCost: 8,
    baseNovaCost: 900,
    researchRequirementName: 'Advanced Propulsion',
    requiredStructureName: 'Shipyard',
    requiredStructureLevel: 3,
    effects: 'Unlocks Medium Ships',
    upgradeBenefits: '=+15% Ship Production Speed per level',
  },

  // Tier 3: Requires research + Advanced Shipyard Level 5
  {
    name: 'Capital Shipyard',
    category: STRUCTURE_CATEGORIES.PRODUCTION,
    description: 'Capital-class shipyard for heavy vessels',
    baseSpaceCost: 25,
    baseEnergyCost: 12,
    baseNovaCost: 1500,
    researchRequirementName: 'Capital Ships',
    requiredStructureName: 'Advanced Shipyard',
    requiredStructureLevel: 5,
    effects: 'Unlocks Heavy Ships',
    upgradeBenefits: '=+20% Ship Production Speed per level',
  },

  // Tier 4: Requires research + Capital Shipyard Level 5
  {
    name: 'Dreadnought Facility',
    category: STRUCTURE_CATEGORIES.PRODUCTION,
    description: 'Massive facility for dreadnought construction',
    baseSpaceCost: 35,
    baseEnergyCost: 20,
    baseNovaCost: 2500,
    researchRequirementName: 'Dreadnought Engineering',
    requiredStructureName: 'Capital Shipyard',
    requiredStructureLevel: 5,
    effects: 'Unlocks Dreadnoughts',
    upgradeBenefits: '=+25% Ship Production Speed per level',
  },

  // Tier 5: Requires research + Dreadnought Facility Level 5
  {
    name: 'Star Forge',
    category: STRUCTURE_CATEGORIES.PRODUCTION,
    description: 'Legendary forge capable of titan-class construction',
    baseSpaceCost: 50,
    baseEnergyCost: 30,
    baseNovaCost: 4000,
    researchRequirementName: 'Stellar Engineering',
    requiredStructureName: 'Dreadnought Facility',
    requiredStructureLevel: 5,
    effects: 'Unlocks Titan-class',
    upgradeBenefits: '=+30% Ship Production Speed per level',
  },

  // ==================== RESEARCH STRUCTURES ====================
  // Tier 1: Basic - NO REQUIREMENTS
  {
    name: 'Research Lab',
    category: STRUCTURE_CATEGORIES.RESEARCH,
    description: 'Basic laboratory for scientific research',
    baseSpaceCost: 8,
    baseEnergyCost: 4,
    baseNovaCost: 400,
    effects: '=+5 Research',
    upgradeBenefits: '=+3 Research per level',
  },

  // Tier 2: Requires research + Research Lab Level 3
  {
    name: 'Advanced Laboratory',
    category: STRUCTURE_CATEGORIES.RESEARCH,
    description: 'Advanced research facility with specialized equipment',
    baseSpaceCost: 12,
    baseEnergyCost: 6,
    baseNovaCost: 700,
    researchRequirementName: 'Advanced Analytics',
    requiredStructureName: 'Research Lab',
    requiredStructureLevel: 3,
    effects: '=+8 Research',
    upgradeBenefits: '=+5 Research per level',
  },

  // Tier 3: Requires research + Advanced Laboratory Level 5
  {
    name: 'Scientific Complex',
    category: STRUCTURE_CATEGORIES.RESEARCH,
    description: 'Comprehensive research complex for breakthrough discoveries',
    baseSpaceCost: 18,
    baseEnergyCost: 10,
    baseNovaCost: 1200,
    researchRequirementName: 'Complex Systems',
    requiredStructureName: 'Advanced Laboratory',
    requiredStructureLevel: 5,
    effects: '=+12 Research',
    upgradeBenefits: '=+7 Research per level',
  },

  // Tier 4: Requires research + Scientific Complex Level 5
  {
    name: 'Quantum Research Center',
    category: STRUCTURE_CATEGORIES.RESEARCH,
    description: 'Quantum computing-powered research center',
    baseSpaceCost: 25,
    baseEnergyCost: 15,
    baseNovaCost: 2000,
    researchRequirementName: 'Quantum Computing',
    requiredStructureName: 'Scientific Complex',
    requiredStructureLevel: 5,
    effects: '=+18 Research',
    upgradeBenefits: '=+10 Research per level',
  },

  // Tier 5: Requires research + Quantum Research Center Level 5
  {
    name: 'Theoretical Physics Institute',
    category: STRUCTURE_CATEGORIES.RESEARCH,
    description: 'Elite institute pushing boundaries of known science',
    baseSpaceCost: 35,
    baseEnergyCost: 20,
    baseNovaCost: 3000,
    researchRequirementName: 'Theoretical Physics',
    requiredStructureName: 'Quantum Research Center',
    requiredStructureLevel: 5,
    effects: '=+25 Research',
    upgradeBenefits: '=+15 Research per level',
  },

  // ==================== ECONOMIC STRUCTURES ====================
  // Tier 1: Basic - NO REQUIREMENTS
  {
    name: 'Trading Post',
    category: STRUCTURE_CATEGORIES.ECONOMIC,
    description: 'Basic trading post for commerce',
    baseSpaceCost: 6,
    baseEnergyCost: 2,
    baseNovaCost: 300,
    effects: '=+5 Nova/cycle',
    upgradeBenefits: '=+3 Nova/cycle per level',
  },

  // Tier 2: Requires research + Trading Post Level 3
  {
    name: 'Commercial Hub',
    category: STRUCTURE_CATEGORIES.ECONOMIC,
    description: 'Expanded trading center with better yields',
    baseSpaceCost: 10,
    baseEnergyCost: 4,
    baseNovaCost: 600,
    researchRequirementName: 'Resource Refining',
    requiredStructureName: 'Trading Post',
    requiredStructureLevel: 3,
    effects: '=+8 Nova/cycle',
    upgradeBenefits: '=+5 Nova/cycle per level',
  },

  // Tier 3: Requires research + Commercial Hub Level 5
  {
    name: 'Financial Center',
    category: STRUCTURE_CATEGORIES.ECONOMIC,
    description: 'Advanced financial center for wealth generation',
    baseSpaceCost: 15,
    baseEnergyCost: 6,
    baseNovaCost: 1000,
    researchRequirementName: 'Chemical Engineering',
    requiredStructureName: 'Commercial Hub',
    requiredStructureLevel: 5,
    effects: '=+12 Nova/cycle',
    upgradeBenefits: '=+7 Nova/cycle per level',
  },

  // Tier 4: Requires research + Financial Center Level 5
  {
    name: 'Galactic Market',
    category: STRUCTURE_CATEGORIES.ECONOMIC,
    description: 'Major market hub for galactic trade',
    baseSpaceCost: 20,
    baseEnergyCost: 8,
    baseNovaCost: 1400,
    researchRequirementName: 'Galactic Economics',
    requiredStructureName: 'Financial Center',
    requiredStructureLevel: 5,
    effects: '=+18 Nova/cycle',
    upgradeBenefits: '=+10 Nova/cycle per level',
  },

  // Tier 5: Requires research + Galactic Market Level 5
  {
    name: 'Stellar Exchange',
    category: STRUCTURE_CATEGORIES.ECONOMIC,
    description: 'Sector-wide financial exchange',
    baseSpaceCost: 30,
    baseEnergyCost: 12,
    baseNovaCost: 2200,
    researchRequirementName: 'Financial Instruments',
    requiredStructureName: 'Galactic Market',
    requiredStructureLevel: 5,
    effects: '=+25 Nova/cycle',
    upgradeBenefits: '=+15 Nova/cycle per level',
  },

  // ==================== UTILITY STRUCTURES ====================
  // Energy Production: Tier 1 - NO REQUIREMENTS
  {
    name: 'Power Plant',
    category: STRUCTURE_CATEGORIES.UTILITY,
    description: 'Basic power generation facility',
    baseSpaceCost: 10,
    baseEnergyCost: -5, // Produces energy
    baseNovaCost: 400,
    effects: '=+10 Energy',
    upgradeBenefits: '=+5 Energy per level',
  },

  // Energy Production: Tier 2 - Requires Power Plant Level 3
  {
    name: 'Fusion Reactor',
    category: STRUCTURE_CATEGORIES.UTILITY,
    description: 'Advanced fusion-powered energy generator',
    baseSpaceCost: 15,
    baseEnergyCost: -8,
    baseNovaCost: 700,
    researchRequirementName: 'Fusion Power',
    requiredStructureName: 'Power Plant',
    requiredStructureLevel: 3,
    effects: '=+15 Energy',
    upgradeBenefits: '=+8 Energy per level',
  },

  // Energy Production: Tier 3 - Requires Fusion Reactor Level 5
  {
    name: 'Energy Nexus',
    category: STRUCTURE_CATEGORIES.UTILITY,
    description: 'Cutting-edge energy distribution network',
    baseSpaceCost: 20,
    baseEnergyCost: -12,
    baseNovaCost: 1200,
    researchRequirementName: 'Advanced Energy',
    requiredStructureName: 'Fusion Reactor',
    requiredStructureLevel: 5,
    effects: '=+22 Energy',
    upgradeBenefits: '=+12 Energy per level',
  },

  // Mineral Production: Tier 1 - NO REQUIREMENTS
  {
    name: 'Mining Facility',
    category: STRUCTURE_CATEGORIES.UTILITY,
    description: 'Basic mineral extraction facility',
    baseSpaceCost: 10,
    baseEnergyCost: 3,
    baseNovaCost: 500,
    effects: '=+3 Minerals',
    upgradeBenefits: '=+2 Minerals per level',
  },

  // Mineral Production: Tier 2 - Requires Mining Facility Level 3
  {
    name: 'Mineral Extractor',
    category: STRUCTURE_CATEGORIES.UTILITY,
    description: 'Advanced mineral extraction technology',
    baseSpaceCost: 12,
    baseEnergyCost: 4,
    baseNovaCost: 600,
    researchRequirementName: 'Extraction Technology',
    requiredStructureName: 'Mining Facility',
    requiredStructureLevel: 3,
    effects: '=+5 Minerals',
    upgradeBenefits: '=+3 Minerals per level',
  },

  // Volatile Production: Tier 1 - NO REQUIREMENTS
  {
    name: 'Gas Harvester',
    category: STRUCTURE_CATEGORIES.UTILITY,
    description: 'Basic volatile gas collection facility',
    baseSpaceCost: 10,
    baseEnergyCost: 3,
    baseNovaCost: 500,
    effects: '=+3 Volatiles',
    upgradeBenefits: '=+2 Volatiles per level',
  },

  // Volatile Production: Tier 2 - Requires Gas Harvester Level 3
  {
    name: 'Volatile Synthesizer',
    category: STRUCTURE_CATEGORIES.UTILITY,
    description: 'Advanced volatile synthesis and refinement',
    baseSpaceCost: 12,
    baseEnergyCost: 5,
    baseNovaCost: 700,
    researchRequirementName: 'Molecular Synthesis',
    requiredStructureName: 'Gas Harvester',
    requiredStructureLevel: 3,
    effects: '=+5 Volatiles',
    upgradeBenefits: '=+3 Volatiles per level',
  },

  // Defense Utility: Requires research (but no structure prereq as it's different type)
  {
    name: 'Planetary Shield',
    category: STRUCTURE_CATEGORIES.UTILITY,
    description: 'Defensive shield protecting the base',
    baseSpaceCost: 20,
    baseEnergyCost: 15,
    baseNovaCost: 1500,
    researchRequirementName: 'Shield Technology',
    effects: '=+20% Defense',
    upgradeBenefits: '=+10% Defense per level',
  },

  // ==================== SPECIAL STRUCTURES ====================
  // These are unique, powerful structures with their own requirements
  {
    name: 'Planetary Capital',
    category: STRUCTURE_CATEGORIES.SPECIAL,
    description: 'Central governance hub boosting all production',
    baseSpaceCost: 30,
    baseEnergyCost: 10,
    baseNovaCost: 2000,
    researchRequirementName: 'Planetary Governance',
    effects: '=+10% to all production',
    upgradeBenefits: '=+5% to all production per level',
    maxLevel: 3,
  },
  {
    name: 'Stellar Observatory',
    category: STRUCTURE_CATEGORIES.SPECIAL,
    description: 'Advanced astronomical facility',
    baseSpaceCost: 15,
    baseEnergyCost: 8,
    baseNovaCost: 1200,
    researchRequirementName: 'Advanced Astronomy',
    effects: '=+15% Research Speed',
    upgradeBenefits: '=+10% Research Speed per level',
    maxLevel: 3,
  },
  {
    name: 'Defense Matrix',
    category: STRUCTURE_CATEGORIES.SPECIAL,
    description: 'Comprehensive planetary defense system',
    baseSpaceCost: 25,
    baseEnergyCost: 12,
    baseNovaCost: 1800,
    researchRequirementName: 'Defensive Systems',
    effects: '=+25% Base Defense',
    upgradeBenefits: '=+15% Base Defense per level',
    maxLevel: 3,
  },
  {
    name: 'Interstellar Portal',
    category: STRUCTURE_CATEGORIES.SPECIAL,
    description: 'Portal enabling instant travel between bases',
    baseSpaceCost: 40,
    baseEnergyCost: 25,
    baseNovaCost: 3500,
    researchRequirementName: 'Wormhole Technology',
    effects: 'Portal travel between bases',
    upgradeBenefits: '',
    maxLevel: 1,
  },
  {
    name: 'Cosmic Amplifier',
    category: STRUCTURE_CATEGORIES.SPECIAL,
    description: 'Amplifies the base\'s strongest resource production',
    baseSpaceCost: 35,
    baseEnergyCost: 20,
    baseNovaCost: 3000,
    researchRequirementName: 'Cosmic Energy',
    effects: '=+25% best resource',
    upgradeBenefits: '=+15% best resource per level',
    maxLevel: 3,
  },
];
