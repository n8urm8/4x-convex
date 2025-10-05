import { ResourceCostSeed, RESOURCE_TYPES } from '../game/resources/resourceCosts.schema';
import { researchSeedData } from './researchSeed';

// Helper function to generate costs based on tier
function getBaseCosts(tier: number): { nova: number; volatile: number } {
  if (tier === 1) return { nova: 100, volatile: 0 };
  if (tier === 2) return { nova: 200, volatile: 50 };
  if (tier === 3) return { nova: 350, volatile: 120 };
  return { nova: 100, volatile: 0 };
}

export const resourceCostSeedData: ResourceCostSeed[] = researchSeedData.flatMap(tech => {
  const costs = getBaseCosts(tech.tier);
  return [
    {
      ownerType: 'technology',
      ownerCode: tech.code,
      resource: RESOURCE_TYPES.NOVA,
      amount: costs.nova,
    },
    {
      ownerType: 'technology',
      ownerCode: tech.code,
      resource: RESOURCE_TYPES.VOLATILE,
      amount: costs.volatile,
    },
  ];
});
