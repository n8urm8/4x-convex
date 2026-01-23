import { ResourceDefinitionSeed, RESOURCE_CATEGORIES, STORAGE_TYPES } from '../game/resources/resources.schema';

/**
 * Initial resource definitions for the game
 * These define all available resource types
 */
export const resourceDefinitionsSeedData: ResourceDefinitionSeed[] = [
  // Primary Currency
  {
    code: 'nova',
    name: 'Nova',
    category: RESOURCE_CATEGORIES.CURRENCY,
    storageType: STORAGE_TYPES.GLOBAL,
    description: 'The primary currency used throughout the empire for construction, research, and trade.',
    displayOrder: 1,
    icon: '💎',
    color: '#60A5FA', // blue-400
    isVisible: true,
    isTradeable: true,
    hasProductionRate: true,
    hasStorage: false, // Currency has no storage limit
    legacyFieldName: 'nova',
  },
  
  // Material Resources
  {
    code: 'mineral',
    name: 'Minerals',
    category: RESOURCE_CATEGORIES.MATERIAL,
    storageType: STORAGE_TYPES.GLOBAL,
    description: 'Essential materials mined from planets, used for construction and manufacturing.',
    displayOrder: 2,
    icon: '⛏️',
    color: '#A78BFA', // violet-400
    isVisible: true,
    isTradeable: true,
    hasProductionRate: true,
    hasStorage: true,
    baseStorageLimit: 10000,
    legacyFieldName: 'minerals',
  },
  
  {
    code: 'volatile',
    name: 'Volatiles',
    category: RESOURCE_CATEGORIES.MATERIAL,
    storageType: STORAGE_TYPES.GLOBAL,
    description: 'Volatile compounds used in advanced technologies, ship fuel, and chemical processes.',
    displayOrder: 3,
    icon: '🧪',
    color: '#34D399', // emerald-400
    isVisible: true,
    isTradeable: true,
    hasProductionRate: true,
    hasStorage: true,
    baseStorageLimit: 10000,
    legacyFieldName: 'volatiles',
  },
  
  // Research Resource (optional - for future use)
  {
    code: 'research_points',
    name: 'Research Points',
    category: RESOURCE_CATEGORIES.RESEARCH,
    storageType: STORAGE_TYPES.GLOBAL,
    description: 'Accumulated research progress that can be applied to any technology.',
    displayOrder: 4,
    icon: '🔬',
    color: '#F59E0B', // amber-400
    isVisible: false, // Hidden for now, can be enabled later
    isTradeable: false,
    hasProductionRate: true,
    hasStorage: false,
  },
  
  // Future Resources (examples for expansion)
  {
    code: 'rare_minerals',
    name: 'Rare Minerals',
    category: RESOURCE_CATEGORIES.SPECIAL,
    storageType: STORAGE_TYPES.GLOBAL,
    description: 'Extremely rare materials used in the most advanced technologies.',
    displayOrder: 10,
    icon: '💠',
    color: '#EC4899', // pink-400
    isVisible: false, // Not yet implemented
    isTradeable: true,
    hasProductionRate: false,
    hasStorage: true,
    baseStorageLimit: 1000,
  },
  
  {
    code: 'dark_matter',
    name: 'Dark Matter',
    category: RESOURCE_CATEGORIES.SPECIAL,
    storageType: STORAGE_TYPES.GLOBAL,
    description: 'Mysterious substance used in cutting-edge research and exotic technologies.',
    displayOrder: 11,
    icon: '🌌',
    color: '#8B5CF6', // violet-500
    isVisible: false, // Not yet implemented
    isTradeable: false,
    hasProductionRate: false,
    hasStorage: true,
    baseStorageLimit: 100,
  },
  
  {
    code: 'antimatter',
    name: 'Antimatter',
    category: RESOURCE_CATEGORIES.ENERGY,
    storageType: STORAGE_TYPES.BASE,
    description: 'Highly volatile energy source for the most powerful weapons and reactors.',
    displayOrder: 12,
    icon: '⚛️',
    color: '#EF4444', // red-400
    isVisible: false, // Not yet implemented
    isTradeable: false,
    hasProductionRate: true,
    hasStorage: true,
    baseStorageLimit: 500,
  },
];
