import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { BaseDetails } from '@/features/bases/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';

export function BaseShipyardsTab({ base }: { base: BaseDetails }) {
  const [isBuilding, setIsBuilding] = useState<string | null>(null);
  
  // Get ship blueprints with requirements for this base
  const shipData = useQuery(api.game.ships.shipActions.getShipBlueprintsForBase, { 
    baseId: base._id 
  });
  
  const buildShip = useMutation(api.game.ships.shipActions.buildShip);

  const handleBuildShip = async (shipBlueprintId: string) => {
    setIsBuilding(shipBlueprintId);
    try {
      await buildShip({ 
        shipBlueprintId, 
        baseId: base._id, 
        quantity: 1 
      });
      toast.success('Ship built successfully!');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsBuilding(null);
    }
  };

  if (!shipData) {
    return <div>Loading shipyards...</div>;
  }

  const { blueprints } = shipData;

  const getRequirementBadge = (requirement: { satisfied: boolean; name: string }) => {
    return (
      <Badge 
        variant={requirement.satisfied ? "secondary" : "destructive"}
        className="text-xs"
      >
        {requirement.name} {requirement.satisfied ? "✓" : "✗"}
      </Badge>
    );
  };

  const formatStats = (blueprint: any) => {
    const stats = [];
    if (blueprint.damage > 0) stats.push(`DMG: ${blueprint.damage}`);
    if (blueprint.defense > 0) stats.push(`DEF: ${blueprint.defense}`);
    if (blueprint.shielding > 0) stats.push(`SHD: ${blueprint.shielding}`);
    if (blueprint.movementSpeed) stats.push(`SPD: ${blueprint.movementSpeed}`);
    return stats.join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Desktop table view */}
      <div className="hidden md:block">
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
            <div>Ship</div>
            <div>Category</div>
            <div>Stats</div>
            <div>Special</div>
            <div>Cost</div>
            <div>Requirements</div>
            <div className="text-right">Action</div>
          </div>
          {blueprints.map((blueprint) => {
            const isBuildingThis = isBuilding === blueprint.id;
            const isAnyActionInProgress = isBuilding !== null;
            
            return (
              <div 
                key={blueprint.id}
                className="grid grid-cols-7 gap-4 p-4 bg-card border rounded-lg items-center"
              >
                <div>
                  <div className="font-medium">{blueprint.name}</div>
                  <div className="text-sm text-muted-foreground">{blueprint.weaponType} Weapon</div>
                </div>
                <div>
                  <Badge variant="outline" className="text-xs">
                    {blueprint.category}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm">
                    {formatStats(blueprint)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Fleet Cost: {blueprint.fleetCapacityCost}
                    {blueprint.fighterCapacityProvided && ` | Fighters: +${blueprint.fighterCapacityProvided}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm">{blueprint.specialAbility}</div>
                </div>
                <div>
                  <div className="text-sm">
                    <div>Nova: {blueprint.novaCost.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      Build Time: {blueprint.buildTimeCycles} cycles
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-1">
                    {getRequirementBadge(blueprint.requirements.structure)}
                    {getRequirementBadge(blueprint.requirements.technology)}
                    <Badge 
                      variant={blueprint.requirements.resources.satisfied ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {blueprint.requirements.resources.nova.toLocaleString()} Nova {blueprint.requirements.resources.satisfied ? "✓" : "✗"}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <Button
                    size="sm"
                    onClick={() => handleBuildShip(blueprint.id)}
                    disabled={!blueprint.canBuild || isAnyActionInProgress}
                    variant={blueprint.canBuild ? 'default' : 'secondary'}
                  >
                    {isBuildingThis ? 'Building...' : blueprint.canBuild ? 'Build' : 'Cannot Build'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile card view */}
      <div className="block md:hidden space-y-3">
        {blueprints.map((blueprint) => {
          const isBuildingThis = isBuilding === blueprint.id;
          const isAnyActionInProgress = isBuilding !== null;
          
          return (
            <div 
              key={blueprint.id} 
              className="border rounded-lg p-4 bg-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium">{blueprint.name}</h3>
                  <p className="text-sm text-muted-foreground">{blueprint.weaponType} Weapon</p>
                </div>
                <div className="ml-2">
                  <Badge variant="outline" className="text-xs">
                    {blueprint.category}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Stats:</span> {formatStats(blueprint)}
                </div>
                <div>
                  <span className="font-medium">Special:</span> {blueprint.specialAbility}
                </div>
                <div>
                  <span className="font-medium">Cost:</span> {blueprint.novaCost.toLocaleString()} Nova
                </div>
                <div>
                  <span className="font-medium">Build Time:</span> {blueprint.buildTimeCycles} cycles
                </div>
                <div>
                  <span className="font-medium">Fleet Cost:</span> {blueprint.fleetCapacityCost}
                  {blueprint.fighterCapacityProvided && ` | Fighters: +${blueprint.fighterCapacityProvided}`}
                </div>
                <div>
                  <span className="font-medium">Requirements:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getRequirementBadge(blueprint.requirements.structure)}
                    {getRequirementBadge(blueprint.requirements.technology)}
                    <Badge 
                      variant={blueprint.requirements.resources.satisfied ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {blueprint.requirements.resources.nova.toLocaleString()} Nova {blueprint.requirements.resources.satisfied ? "✓" : "✗"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Button
                  className="w-full"
                  onClick={() => handleBuildShip(blueprint.id)}
                  disabled={!blueprint.canBuild || isAnyActionInProgress}
                  variant={blueprint.canBuild ? 'default' : 'secondary'}
                >
                  {isBuildingThis ? 'Building...' : blueprint.canBuild ? 'Build' : 'Cannot Build'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {blueprints.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No ship blueprints available. Build shipyards and research technologies to unlock ships.
        </div>
      )}
    </div>
  );
}
