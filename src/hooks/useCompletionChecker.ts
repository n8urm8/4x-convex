import { useConvexMutation } from '@convex-dev/react-query';
import { useEffect, useRef } from 'react';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';

interface CompletionCheckerOptions {
  /** How often to check for completions in milliseconds. Default: 30000 (30 seconds) */
  intervalMs?: number;
  /** Whether to check immediately when the hook mounts. Default: true */
  checkOnMount?: boolean;
  /** Whether to enable periodic checking. Default: true */
  enablePeriodicCheck?: boolean;
}

export function useCompletionChecker(
  baseId: Id<'playerBases'> | undefined, 
  options: CompletionCheckerOptions = {}
) {
  const { 
    intervalMs = 30000, // Default to 30 seconds instead of 10
    checkOnMount = true, 
    enablePeriodicCheck = true 
  } = options;
  
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

    // Check immediately if enabled
    if (checkOnMount) {
      checkAllCompletions();
    }

    // Set up periodic checking if enabled
    if (enablePeriodicCheck) {
      intervalRef.current = setInterval(checkAllCompletions, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [baseId, checkCompletedUpgrades, checkCompletedResearch, intervalMs, checkOnMount, enablePeriodicCheck]);

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