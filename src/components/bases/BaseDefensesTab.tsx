import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { BaseDetails } from '@/features/bases/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Id } from '@cvx/_generated/dataModel';
import { STRUCTURE_CATEGORIES } from '@cvx/game/bases/bases.schema';

export function BaseDefensesTab({ base }: { base: BaseDetails }) {
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
    return <div>Loading defensive structures...</div>;
  }

  // Filter only defensive structures
  const defensiveStructureDefinitions = allStructureDefinitions.filter(
    definition => definition.category === STRUCTURE_CATEGORIES.DEFENSE
  );

  // Create a map of built structures by their definition ID for quick lookup
  const builtStructuresMap = new Map(
    base.structures.map(structure => [structure.structureDefId, structure])
  );

  // Combine defensive structure definitions with their current state in the base
  const defensiveStructuresWithState = defensiveStructureDefinitions.map(definition => {
    const builtStructure = builtStructuresMap.get(definition._id);
    return {
      definition,
      builtStructure,
      level: builtStructure?.level || 0,
      isBuilt: !!builtStructure
    };
  });

  if (defensiveStructuresWithState.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No defensive structures available yet. Research new defensive technologies to unlock them.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table view */}
      <div className="hidden md:block">
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
            <div>Defensive Structure</div>
            <div>Level</div>
            <div>Defense/Damage</div>
            <div>Effects</div>
            <div>Costs</div>
            <div>Requirements</div>
            <div className="text-right">Action</div>
          </div>
          {defensiveStructuresWithState.map(({ definition, builtStructure, level, isBuilt }) => {
            const isUpgradingThis = builtStructure && isUpgrading === builtStructure._id;
            const isBuildingThis = isBuilding === definition._id;
            const isAnyActionInProgress = isUpgrading !== null || isBuilding !== null;
            
            // Calculate if this structure can be upgraded (if built and not at max level)
            const canUpgrade = isBuilt && builtStructure && !builtStructure.upgrading && 
              (!definition.maxLevel || level < definition.maxLevel);
            
            return (
              <div 
                key={definition._id}
                className="grid grid-cols-7 gap-4 p-4 bg-card border rounded-lg items-center"
              >
                <div>
                  <div className="font-medium">{definition.name}</div>
                  <div className="text-sm text-muted-foreground">{definition.description}</div>
                </div>
                <div>
                  {isBuilt ? (
                    <Badge variant="secondary">Level {level}</Badge>
                  ) : (
                    <Badge variant="outline">Not Built</Badge>
                  )}
                </div>
                <div>
                  <div className="text-sm space-y-1">
                    {definition.defense && (
                      <div className="text-green-600">Defense: {definition.defense}</div>
                    )}
                    {definition.damage && (
                      <div className="text-red-600">Damage: {definition.damage}</div>
                    )}
                    {definition.shielding && (
                      <div className="text-blue-600">Shielding: {definition.shielding}</div>
                    )}
                  </div>
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
                        ? `Upgrading to ${builtStructure!.upgradeLevel}`
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
      </div>

      {/* Mobile list view */}
      <div className="block md:hidden space-y-3">
        {defensiveStructuresWithState.map(({ definition, builtStructure, level, isBuilt }) => {
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
                    <Badge variant="secondary">Level {level}</Badge>
                  ) : (
                    <Badge variant="outline">Not Built</Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex gap-4">
                  {definition.defense && (
                    <span className="text-green-600">Defense: {definition.defense}</span>
                  )}
                  {definition.damage && (
                    <span className="text-red-600">Damage: {definition.damage}</span>
                  )}
                  {definition.shielding && (
                    <span className="text-blue-600">Shielding: {definition.shielding}</span>
                  )}
                </div>
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
                      ? `Upgrading to ${builtStructure!.upgradeLevel}`
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
    </div>
  );
}