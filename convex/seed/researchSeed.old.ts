import { RESEARCH_CATEGORIES, ResearchDefinitionSeed } from '../game/research/research.schema';

export const researchSeedData: ResearchDefinitionSeed[] = [
  // === DEFENSE TECHNOLOGIES ===
  // Tier 1: Basic defensive capabilities
  {
    name: 'Basic Armor',
    tier: 1,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: '+25% defense HP for all defensive structures and ships',
    description: 'Improved armor plating technology increases the durability of defensive systems',
    unlocks: ['Defense Platform', 'Armored variants of basic ships'],
  },
  {
    name: 'Shield Technology',
    tier: 1,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: '+20% shield capacity for all structures and ships with shields',
    description: 'Basic energy shield generators provide additional protection',
    unlocks: ['Shield Generator', 'Shielded variants of structures'],
  },

  // Tier 2: Advanced defensive systems
  {
    name: 'Advanced Armor',
    tier: 2,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: '+50% defense HP for all defensive structures and ships',
    description: 'Composite armor materials provide superior protection',
    unlocks: ['Heavy Defense Platform', 'Heavily armored ship variants'],
  },
  {
    name: 'Advanced Shields',
    tier: 2,
    category: RESEARCH_CATEGORIES.DEFENSE,
    primaryEffect: '+40% shield capacity and +25% shield regeneration',
    description: 'Enhanced shield technology with improved power efficiency',
    unlocks: ['Advanced Shield Generator', 'Capital ship shield systems'],
  },

  // === WEAPONS TECHNOLOGIES ===
  // Tier 1: Basic weapon systems
  {
    name: 'Kinetic Weapons',
    tier: 1,
    category: RESEARCH_CATEGORIES.WEAPONS,
    primaryEffect: '+25% damage for all kinetic weapons',
    description: 'Improved projectile weapons with enhanced velocity and impact',
    unlocks: ['Kinetic Defense Battery', 'Ranger Scout', 'Dart Fighter'],
  },
  {
    name: 'Energy Weapons',
    tier: 1,
    category: RESEARCH_CATEGORIES.WEAPONS,
    primaryEffect: '+25% damage for all energy weapons',
    description: 'Basic laser and beam weapon technology',
    unlocks: ['Energy Defense Array', 'Beam-armed ships'],
  },

  // Tier 2: Advanced weapon systems
  {
    name: 'Advanced Kinetics',
    tier: 2,
    category: RESEARCH_CATEGORIES.WEAPONS,
    primaryEffect: '+50% damage for all kinetic weapons',
    description: 'Railgun and mass driver technology for devastating kinetic strikes',
    unlocks: ['Heavy Kinetic Battery', 'Sentinel Frigate', 'Guardian Destroyer'],
  },
  {
    name: 'Plasma Weapons',
    tier: 2,
    category: RESEARCH_CATEGORIES.WEAPONS,
    primaryEffect: '+50% damage for all energy weapons',
    description: 'Superheated plasma projection systems',
    unlocks: ['Plasma Defense Grid', 'Tempest Strike Ship', 'Energy-focused cruisers'],
  },

  // Tier 3: Ultimate weapons
  {
    name: 'Quantum Weapons',
    tier: 3,
    category: RESEARCH_CATEGORIES.WEAPONS,
    primaryEffect: '+100% damage for all weapons',
    description: 'Reality-altering quantum field manipulation weapons',
    unlocks: ['Quantum Defense Array', 'Nova Leviathan', 'Apocalypse Dreadnought'],
  },

  // === SHIPS TECHNOLOGIES ===
  // Tier 1: Basic propulsion and ship design
  {
    name: 'Chemical Propulsion',
    tier: 1,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: '+25% ship speed and maneuverability',
    description: 'Basic chemical rocket engines for space travel',
    unlocks: ['Genesis Colonizer', 'Basic civilian ships'],
  },
  {
    name: 'Small Ship Design',
    tier: 1,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Enables construction of small military vessels',
    description: 'Fundamental spacecraft engineering for small combat vessels',
    unlocks: ['Requires weapon tech for specific ship variants'],
  },

  // Tier 2: Advanced propulsion and medium ships
  {
    name: 'Ion Propulsion',
    tier: 2,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: '+50% ship speed and maneuverability',
    description: 'Efficient ion drive technology for extended space operations',
    unlocks: ['Void Harvester', 'Long-range exploration ships'],
  },
  {
    name: 'Medium Ship Design',
    tier: 2,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Enables construction of cruiser-class vessels',
    description: 'Advanced hull design and systems integration for larger warships',
    unlocks: ['Dauntless Cruiser', 'Intrepid Carrier Cruiser'],
  },

  // Tier 3: Quantum engines and capital ships
  {
    name: 'Quantum Drive',
    tier: 3,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: '+100% ship speed and enables faster-than-light travel',
    description: 'Quantum field manipulation for near-instantaneous travel',
    unlocks: ['Capital ship mobility', 'Strategic redeployment capabilities'],
  },
  {
    name: 'Capital Ship Design',
    tier: 3,
    category: RESEARCH_CATEGORIES.SHIPS,
    primaryEffect: 'Enables construction of battleship and dreadnought-class vessels',
    description: 'Massive warship architecture and life support systems',
    unlocks: ['Juggernaut Battleship', 'Sovereign Dreadnought', 'Colossus Carrier'],
  },

  // === STRUCTURES TECHNOLOGIES ===
  // Tier 1: Basic infrastructure
  {
    name: 'Basic Infrastructure',
    tier: 1,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enables basic colony buildings',
    description: 'Fundamental construction and life support technologies',
    unlocks: ['Hab Dome', 'Power Plant', 'Construction Yard'],
  },
  {
    name: 'Scientific Method',
    tier: 1,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enables research facilities and +25% research speed',
    description: 'Systematic approach to knowledge acquisition and experimentation',
    unlocks: ['Research Lab', 'Observatory'],
  },

  // Tier 2: Advanced facilities
  {
    name: 'Industrial Engineering',
    tier: 2,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enables advanced production and +25% construction speed',
    description: 'Automated manufacturing and resource processing systems',
    unlocks: ['Automated Fabricator', 'Mineral Refinery', 'Energy Nexus'],
  },
  {
    name: 'Advanced Research',
    tier: 2,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enables advanced research facilities and +50% research speed',
    description: 'Cutting-edge laboratory equipment and research methodologies',
    unlocks: ['Advanced Laboratory', 'Scientific Complex'],
  },

  // Tier 3: Megastructures
  {
    name: 'Megaengineering',
    tier: 3,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enables planetary-scale construction projects',
    description: 'Massive construction capabilities for world-spanning projects',
    unlocks: ['Orbital Habitat', 'Planetary Shield', 'Megastructure Hub'],
  },
  {
    name: 'Quantum Computing',
    tier: 3,
    category: RESEARCH_CATEGORIES.STRUCTURES,
    primaryEffect: 'Enables ultimate research facilities and +100% research speed',
    description: 'Quantum-scale computation for breakthrough discoveries',
    unlocks: ['Quantum Research Center', 'Theoretical Physics Institute'],
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
