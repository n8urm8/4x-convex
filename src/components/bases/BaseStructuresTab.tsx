import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { BaseDetails } from '@/features/bases/types';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { UpgradeTimer } from '@/components/ui/upgrade-timer';
import { useState } from 'react';
import { Id } from '@cvx/_generated/dataModel';

export function BaseStructuresTab({ base }: { base: BaseDetails }) {
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState<string | null>(null);
  
  // Get all available structure definitions
  const allStructureDefinitions = useQuery(api.game.bases.baseQueries.getAllStructureDefinitions);
  
  const startUpgrade = useMutation(
    api.game.bases.baseMutations.startStructureUpgrade
  );
  const buildStructure = useMutation(
    api.game.bases.baseMutations.buildStructure
  );

  const handleUpgrade = async (structureId: string) => {
    setIsUpgrading(structureId);
    try {
      await startUpgrade({ structureId: structureId as Id<'baseStructures'> });
    } catch (error) {
      console.error('Failed to start upgrade:', error);
      // TODO: Show a toast notification to the user
    } finally {
      setIsUpgrading(null);
    }
  };

  const handleBuild = async (structureDefId: string) => {
    setIsBuilding(structureDefId);
    try {
      await buildStructure({ 
        baseId: base._id, 
        structureDefId: structureDefId as Id<'structureDefinitions'> 
      });
    } catch (error) {
      console.error('Failed to build structure:', error);
      // TODO: Show a toast notification to the user
    } finally {
      setIsBuilding(null);
    }
  };

  if (!allStructureDefinitions) {
    return <div>Loading structures...</div>;
  }

  // Create a map of built structures by their definition ID for quick lookup
  const builtStructuresMap = new Map(
    base.structures.map(structure => [structure.structureDefId, structure])
  );

  // Filter out defensive structures (they have their own tab now)
  const nonDefensiveStructureDefinitions = allStructureDefinitions.filter(
    definition => definition.category !== 'defense'
  );

  // Combine non-defensive structure definitions with their current state in the base
  const allStructuresWithState = nonDefensiveStructureDefinitions.map(definition => {
    const builtStructure = builtStructuresMap.get(definition._id);
    return {
      definition,
      builtStructure,
      level: builtStructure?.level || 0,
      isBuilt: !!builtStructure
    };
  });

  // Group structures by function/effect
  const structureGroups = {
    'Space Providers': allStructuresWithState.filter(s => 
      s.definition.effects.toLowerCase().includes('space') || 
      s.definition.category === 'habitat'
    ),
    'Energy Producers': allStructuresWithState.filter(s => 
      s.definition.effects.toLowerCase().includes('energy') && 
      !s.definition.effects.includes('-') // Exclude energy consumers
    ),
    'Resource Generators': allStructuresWithState.filter(s => 
      s.definition.effects.toLowerCase().includes('minerals') ||
      s.definition.effects.toLowerCase().includes('volatiles') ||
      s.definition.effects.toLowerCase().includes('nova')
    ),
    'Research Facilities': allStructuresWithState.filter(s => 
      s.definition.effects.toLowerCase().includes('research') ||
      s.definition.category === 'research'
    ),
    'Production & Construction': allStructuresWithState.filter(s => 
      s.definition.effects.toLowerCase().includes('build time') ||
      s.definition.effects.toLowerCase().includes('ship') ||
      s.definition.category === 'construction' ||
      s.definition.category === 'production'
    ),
    'Economic & Trade': allStructuresWithState.filter(s => 
      s.definition.category === 'economic'
    ),
    'Utility & Special': allStructuresWithState.filter(s => 
      s.definition.category === 'utility' ||
      s.definition.category === 'special' ||
      (!s.definition.effects.toLowerCase().includes('space') &&
       !s.definition.effects.toLowerCase().includes('energy') &&
       !s.definition.effects.toLowerCase().includes('minerals') &&
       !s.definition.effects.toLowerCase().includes('volatiles') &&
       !s.definition.effects.toLowerCase().includes('nova') &&
       !s.definition.effects.toLowerCase().includes('research') &&
       !s.definition.effects.toLowerCase().includes('build') &&
       !s.definition.effects.toLowerCase().includes('ship') &&
       s.definition.category !== 'research' &&
       s.definition.category !== 'construction' &&
       s.definition.category !== 'production' &&
       s.definition.category !== 'economic' &&
       s.definition.category !== 'habitat')
    )
  };

  // Remove empty groups
  const nonEmptyGroups = Object.entries(structureGroups).filter(([_, structures]) => structures.length > 0);

  return (
    <div className="space-y-6">
      {/* Desktop table view */}
      <div className="hidden md:block">
        {nonEmptyGroups.map(([groupName, structures]) => (
          <div key={groupName} className="space-y-3">
            <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
              {groupName}
            </h3>
            <div className="grid grid-cols-6 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
              <div>Structure</div>
              <div>Level</div>
              <div>Effects</div>
              <div>Costs</div>
              <div>Requirements</div>
              <div className="text-right">Action</div>
            </div>
            {structures.map(({ definition, builtStructure, level, isBuilt }) => {
              const isUpgradingThis = builtStructure && isUpgrading === builtStructure._id;
              const isBuildingThis = isBuilding === definition._id;
              const isAnyActionInProgress = isUpgrading !== null || isBuilding !== null;
              
              // Calculate if this structure can be upgraded (if built and not at max level)
              const canUpgrade = isBuilt && builtStructure && !builtStructure.upgrading && 
                (!definition.maxLevel || level < definition.maxLevel);
              
              return (
                <div 
                  key={definition._id}
                  className="grid grid-cols-6 gap-4 p-4 bg-card border rounded-lg items-center"
                >
                  <div>
                    <div className="font-medium">{definition.name}</div>
                    <div className="text-sm text-muted-foreground">{definition.description}</div>
                  </div>
                  <div>
                    {isBuilt ? (
                      <div className="space-y-1">
                        <Badge variant="secondary">Level {level}</Badge>
                        {builtStructure?.upgrading && builtStructure.upgradeCompleteTime && builtStructure.upgradeLevel && (
                          <UpgradeTimer 
                            upgradeCompleteTime={builtStructure.upgradeCompleteTime}
                            upgradeLevel={builtStructure.upgradeLevel}
                          />
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">Not Built</Badge>
                    )}
                  </div>
                  <div>
                    <div className="text-sm">
                      <div>{definition.effects}</div>
                      <div className="text-muted-foreground mt-1">{definition.upgradeBenefits}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm">
                      <div>Space: {definition.baseSpaceCost}</div>
                      <div>Energy: {definition.baseEnergyCost}</div>
                      <div>Nova: {definition.baseNovaCost}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm">
                      {definition.researchRequirementName || 'None'}
                    </div>
                  </div>
                  <div className="text-right">
                    {!isBuilt ? (
                      <Button
                        size="sm"
                        onClick={() => handleBuild(definition._id)}
                        disabled={isAnyActionInProgress}
                      >
                        {isBuildingThis ? 'Building...' : 'Build'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleUpgrade(builtStructure!._id)}
                        disabled={!canUpgrade || isAnyActionInProgress}
                        variant={canUpgrade ? 'default' : 'secondary'}
                      >
                        {builtStructure!.upgrading
                          ? 'Upgrading...'
                          : isUpgradingThis
                            ? 'Starting...'
                            : canUpgrade
                              ? 'Upgrade'
                              : 'Max Level'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Mobile list view */}
      <div className="block md:hidden space-y-6">
        {nonEmptyGroups.map(([groupName, structures]) => (
          <div key={groupName} className="space-y-3">
            <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
              {groupName}
            </h3>
            {structures.map(({ definition, builtStructure, level, isBuilt }) => {
              const isUpgradingThis = builtStructure && isUpgrading === builtStructure._id;
              const isBuildingThis = isBuilding === definition._id;
              const isAnyActionInProgress = isUpgrading !== null || isBuilding !== null;
              
              // Calculate if this structure can be upgraded (if built and not at max level)
              const canUpgrade = isBuilt && builtStructure && !builtStructure.upgrading && 
                (!definition.maxLevel || level < definition.maxLevel);
              
              return (
                <div 
                  key={definition._id} 
                  className="border rounded-lg p-4 bg-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{definition.name}</h3>
                      <p className="text-sm text-muted-foreground">{definition.description}</p>
                    </div>
                    <div className="ml-2">
                      {isBuilt ? (
                        <div className="space-y-1 text-right">
                          <Badge variant="secondary">Level {level}</Badge>
                          {builtStructure?.upgrading && builtStructure.upgradeCompleteTime && builtStructure.upgradeLevel && (
                            <UpgradeTimer 
                              upgradeCompleteTime={builtStructure.upgradeCompleteTime}
                              upgradeLevel={builtStructure.upgradeLevel}
                            />
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">Not Built</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Effects:</span> {definition.effects}
                    </div>
                    <div>
                      <span className="font-medium">Upgrade Benefits:</span> {definition.upgradeBenefits}
                    </div>
                    <div>
                      <span className="font-medium">Costs:</span> Space: {definition.baseSpaceCost}, 
                      Energy: {definition.baseEnergyCost}, Nova: {definition.baseNovaCost}
                    </div>
                    <div>
                      <span className="font-medium">Requirements:</span> {definition.researchRequirementName || 'None'}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    {!isBuilt ? (
                      <Button
                        className="w-full"
                        onClick={() => handleBuild(definition._id)}
                        disabled={isAnyActionInProgress}
                      >
                        {isBuildingThis ? 'Building...' : 'Build'}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleUpgrade(builtStructure!._id)}
                        disabled={!canUpgrade || isAnyActionInProgress}
                        variant={canUpgrade ? 'default' : 'secondary'}
                      >
                        {builtStructure!.upgrading
                          ? 'Upgrading...'
                          : isUpgradingThis
                            ? 'Starting...'
                            : canUpgrade
                              ? 'Upgrade'
                              : 'Max Level'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
