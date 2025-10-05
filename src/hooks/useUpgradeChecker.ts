import { useConvexMutation } from '@convex-dev/react-query';
import { useEffect, useRef } from 'react';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';

export function useCompletionChecker(baseId: Id<'playerBases'> | undefined) {
  const checkCompletedUpgrades = useConvexMutation(api.game.bases.baseMutations.checkCompletedUpgrades);
  const checkCompletedResearch = useConvexMutation(api.game.research.researchMutations.checkCompletedResearch);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!baseId) return;

    // Combined check function for both upgrades and research
    const checkAllCompletions = async () => {
      try {
        // Check structure upgrades for this base
        await checkCompletedUpgrades({ baseId });
        
        // Check research completion (user-level, not base-specific)
        await checkCompletedResearch({});
      } catch (error) {
        console.error('Failed to check completed items:', error);
      }
    };

    // Check immediately
    checkAllCompletions();

    // Set up periodic checking every 10 seconds
    intervalRef.current = setInterval(checkAllCompletions, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [baseId, checkCompletedUpgrades, checkCompletedResearch]);

  // Manual trigger function
  const triggerCheck = () => {
    if (baseId) {
      Promise.all([
        checkCompletedUpgrades({ baseId }),
        checkCompletedResearch({})
      ]).catch((error) => {
        console.error('Failed to check completed items:', error);
      });
    }
  };

  return { triggerCheck };
}