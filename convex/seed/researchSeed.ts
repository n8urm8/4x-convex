import { RESEARCH_CATEGORIES, ResearchDefinitionSeed } from '../game/research/research.schema';

export const researchSeedData: ResearchDefinitionSeed[] = [
  // Basic Structure Technologies (Tier 1)
  {
    name: 'Basic Habitation',
    tier: 1,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enables basic habitat construction',
    unlocks: ['Hab Dome'],
  },
  {
    name: 'Basic Construction',
    tier: 1,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Foundation for construction buildings',
    unlocks: ['Construction Yard'],
  },
  {
    name: 'Scientific Method',
    tier: 1,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enables basic research',
    unlocks: ['Research Lab'],
  },
  {
    name: 'Interplanetary Commerce',
    tier: 1,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enables basic economic activity',
    unlocks: ['Trading Post'],
  },
  {
    name: 'Energy Systems',
    tier: 1,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enables energy production',
    unlocks: ['Power Plant'],
  },
  {
    name: 'Basic Propulsion',
    tier: 1,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Enables basic space flight',
    unlocks: ['Ranger Scout'],
  },
  {
    name: 'Fighter Technology',
    tier: 1,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Small combat spacecraft',
    unlocks: ['Dart Fighter'],
  },
  {
    name: 'Naval Architecture',
    tier: 1,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Small military vessel design',
    unlocks: ['Sentinel Frigate'],
  },
  {
    name: 'Kinetic Weapons',
    tier: 1,
    category: RESEARCH_CATEGORIES.WEAPONS,
    primaryEffect: 'Basic projectile weapons',
    unlocks: ['Various Kinetic weapon ships'], // Placeholder, might need specific ship names later
  },
  {
    name: 'Basic Colonization',
    tier: 1,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Enables settlement of new worlds',
    unlocks: ['Genesis Colonizer'],
  },

  // Intermediate Technologies (Tier 2)
  {
    name: 'Planetary Adaptation',
    tier: 2,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enhanced habitat capabilities',
    unlocks: ['Terraforming Station'],
  },
  {
    name: 'Automation',
    tier: 2,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Improved construction efficiency',
    unlocks: ['Automated Fabricator'],
  },
  {
    name: 'Advanced Analytics',
    tier: 2,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enhanced research capabilities',
    unlocks: ['Advanced Laboratory'],
  },
  {
    name: 'Resource Refining',
    tier: 2,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Improved resource processing',
    unlocks: ['Mineral Refinery'],
  },
  {
    name: 'Extraction Technology',
    tier: 2,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Resource gathering',
    unlocks: ['Mineral Extractor'],
  },
  {
    name: 'Advanced Energy',
    tier: 2,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Improved energy generation',
    unlocks: ['Energy Nexus'],
  },
  {
    name: 'Medium Ship Design',
    tier: 2,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Destroyer-class vessels',
    unlocks: ['Guardian Destroyer'],
  },
  {
    name: 'Advanced Weaponry',
    tier: 2,
    category: RESEARCH_CATEGORIES.SHIPS, // Assuming this is ship-related tech for advanced weapons on ships
    primaryEffect: 'Enhanced weapon systems',
    unlocks: ['Tempest Strike Ship'],
  },
  {
    name: 'Advanced Ordinance',
    tier: 2,
    category: RESEARCH_CATEGORIES.SHIPS, // Assuming this is ship-related tech for advanced ordinance on ships
    primaryEffect: 'Specialized munitions',
    unlocks: ['Havoc Bomber'],
  },
  {
    name: 'Shield Technology',
    tier: 2,
    category: RESEARCH_CATEGORIES.SHIPS, // Assuming this is ship-related shield tech
    primaryEffect: 'Defensive shield systems',
    unlocks: ['Horizon Escort'],
  },
  {
    name: 'Resource Extraction',
    tier: 2,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Space mining operations',
    unlocks: ['Void Harvester'],
  },
  {
    name: 'Energy Weapons',
    tier: 2,
    category: RESEARCH_CATEGORIES.WEAPONS,
    primaryEffect: 'Beam-based weapon systems',
    unlocks: ['Various Energy weapon ships'], // Placeholder
  },
  {
    name: 'Missile Systems',
    tier: 2,
    category: RESEARCH_CATEGORIES.WEAPONS,
    primaryEffect: 'Guided projectile weapons',
    unlocks: ['Various Missile weapon ships'], // Placeholder
  },
  {
    name: 'Explosive Ordinance',
    tier: 2,
    category: RESEARCH_CATEGORIES.WEAPONS, // This appears twice, once under Weapons, once under Defense. Assuming Weapons here.
    primaryEffect: 'Area-effect munitions',
    unlocks: ['Havoc Bomber'],
  },
  {
    name: 'Orbital Defense',
    tier: 2,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Basic space-based defenses',
    unlocks: ['Orbital Platform'],
  },
  {
    name: 'Satellite Technology',
    tier: 2,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Defensive satellite deployment',
    unlocks: ['Defense Satellite'],
  },
  // 'Explosive Ordinance' listed under Defense as well, using the one from Weapons for now.
  // If it's a separate tech, it needs a distinct name or clarification.
  {
    name: 'Sensor Arrays',
    tier: 2,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Enhanced detection systems',
    unlocks: ['Early Warning System'],
  },
  {
    name: 'Kinetic Weapons (Defense)', // Renamed to avoid conflict with Tier 1 Kinetic Weapons
    tier: 2,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Defensive projectile weapons',
    unlocks: ['Kinetic Defense Battery'],
  },

  // Advanced Technologies (Tier 3)
  {
    name: 'Zero-G Construction',
    tier: 3,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Space-based building techniques',
    unlocks: ['Orbital Habitat'],
  },
  {
    name: 'Nanotechnology',
    tier: 3,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Microscale construction',
    unlocks: ['Nanite Assembly'],
  },
  {
    name: 'Complex Systems',
    tier: 3,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Advanced research methodologies',
    unlocks: ['Scientific Complex'],
  },
  {
    name: 'Chemical Engineering',
    tier: 3,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Advanced material processing',
    unlocks: ['Volatile Processing'],
  },
  {
    name: 'Molecular Synthesis',
    tier: 3,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Creation of complex molecules',
    unlocks: ['Volatile Synthesizer'],
  },
  {
    name: 'Cruiser Design',
    tier: 3,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Medium-large warship construction',
    unlocks: ['Dauntless Cruiser'],
  },
  {
    name: 'Carrier Operations',
    tier: 3,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Fighter carrier capabilities',
    unlocks: ['Intrepid Carrier Cruiser'],
  },
  {
    name: 'Plasma Technology',
    tier: 3,
    category: RESEARCH_CATEGORIES.WEAPONS,
    primaryEffect: 'Advanced energy weapons',
    unlocks: ['Tempest Strike Ship', 'Nova Leviathan'],
  },
  {
    name: 'Beam Weapons',
    tier: 3,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Advanced directed energy weapons',
    unlocks: ['Ion Cannon'],
  },
  {
    name: 'Defense Networks',
    tier: 3,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Integrated defense systems',
    unlocks: ['Orbital Defense Grid'],
  },
  {
    name: 'Stealth Systems',
    tier: 3,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Concealment technology',
    unlocks: ['Stealth Field Generator'],
  },
  {
    name: 'Electronic Warfare',
    tier: 3,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Signal disruption and countermeasures',
    unlocks: ['Electronic Warfare Array'],
  },

  // Specialized Technologies (Tier 4)
  {
    name: 'Advanced Excavation',
    tier: 4,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Deep planet construction',
    unlocks: ['Subterranean Complex'],
  },
  {
    name: 'Matter Manipulation',
    tier: 4,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Matter state control',
    unlocks: ['Matter Compiler'],
  },
  {
    name: 'Quantum Computing',
    tier: 4,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Advanced computational methods',
    unlocks: ['Quantum Research Center'],
  },
  {
    name: 'Galactic Economics',
    tier: 4,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Interstellar trade networks',
    unlocks: ['Galactic Market'],
  },
  {
    name: 'Shield Technology (Structures)', // Renamed to avoid conflict with Tier 2 Shield Technology (Ships)
    tier: 4,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enhanced defensive systems',
    unlocks: ['Planetary Shield'],
  },
  {
    name: 'Battleship Design',
    tier: 4,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Heavy warship construction',
    unlocks: ['Juggernaut Battleship'],
  },
  {
    name: 'Advanced Defensive Systems',
    tier: 4,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Enhanced protective systems',
    unlocks: ['Bastion Defense Battleship'],
  },
  {
    name: 'Dreadnought Architecture',
    tier: 4,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Massive warship framework',
    unlocks: ['Sovereign Dreadnought'],
  },
  {
    name: 'Quantum Technology',
    tier: 4,
    category: RESEARCH_CATEGORIES.WEAPONS,
    primaryEffect: 'Phase-shifting weapon systems',
    unlocks: ['Quantum Disruptor'],
  },
  {
    name: 'Gravitational Physics',
    tier: 4,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Gravity manipulation weapons',
    unlocks: ['Graviton Projector'],
  },

  // Advanced Capital Technologies (Tier 5)
  {
    name: 'Megaengineering',
    tier: 5,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Massive construction projects',
    unlocks: ['Megastructure Hub'],
  },
  {
    name: 'Quantum Engineering',
    tier: 5,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Quantum-scale manufacturing',
    unlocks: ['Quantum Constructor'],
  },
  {
    name: 'Theoretical Physics',
    tier: 5,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Bleeding-edge scientific research',
    unlocks: ['Theoretical Physics Institute'],
  },
  {
    name: 'Financial Instruments',
    tier: 5,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Advanced economic tools',
    unlocks: ['Stellar Exchange'],
  },
  {
    name: 'Carrier Operations II',
    tier: 5,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Advanced carrier systems',
    unlocks: ['Colossus Carrier'],
  },
  {
    name: 'Advanced Capital Design',
    tier: 5,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Super-capital ship construction',
    unlocks: ['Nova Leviathan'],
  },
  {
    name: 'Apocalypse Weapons',
    tier: 5,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Planet-killing weapons',
    unlocks: ['Apocalypse Dreadnought'],
  },
  {
    name: 'Quantum Physics',
    tier: 5,
    category: RESEARCH_CATEGORIES.WEAPONS,
    primaryEffect: 'Ultimate weapon technology',
    unlocks: ['Apocalypse Dreadnought'],
  },
  {
    name: 'Antimatter Technology',
    tier: 5,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Antimatter containment and weaponry',
    unlocks: ['Antimatter Mine Field'],
  },
  {
    name: 'Advanced Energy (Defense)', // Renamed to avoid conflict with Tier 2 Advanced Energy (Structures)
    tier: 5,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Ultimate energy weapon systems',
    unlocks: ['Nova Cannon'],
  },

  // Worldship Technologies (Tier 6)
  {
    name: 'Worldship Engineering',
    tier: 6,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Mobile habitat-scale vessels',
    unlocks: [], // N/A
  },
  {
    name: 'Planetary Reconstruction',
    tier: 6,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Dead world terraforming',
    unlocks: [], // N/A
  },
  {
    name: 'Advanced Capital Design (Worldship)', // Renamed to avoid conflict
    tier: 6,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Ultimate vessel frameworks',
    unlocks: [], // N/A
  },
  {
    name: 'Dimensional Technology',
    tier: 6,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: 'Cross-dimensional weapon systems',
    unlocks: [], // N/A
  },
];
