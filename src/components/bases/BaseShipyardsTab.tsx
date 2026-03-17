import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { BaseDetails } from '@/features/bases/types';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/bases/DataTable';
import {
  createShipyardsColumns,
  type ShipBlueprintRow,
  type ShipyardsTableMeta,
} from '@/components/bases/shipyards/shipyardsTableColumns';

export function BaseShipyardsTab({ base }: { base: BaseDetails }) {
  const [isBuilding, setIsBuilding] = useState<string | null>(null);

  const shipData = useQuery(api.game.ships.shipActions.getShipBlueprintsForBase, {
    baseId: base._id,
  });
  const buildShip = useMutation(api.game.ships.shipActions.buildShip);

  const columns = useMemo(() => createShipyardsColumns(), []);

  const handleBuildShip = async (shipBlueprintId: string) => {
    setIsBuilding(shipBlueprintId);
    try {
      await buildShip({
        shipBlueprintId,
        baseId: base._id,
        quantity: 1,
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
  type BlueprintWithReqs = ShipBlueprintRow & { id: string };
  const resolvedBlueprints = (Array.isArray(blueprints) ? blueprints : []) as BlueprintWithReqs[];

  const rows: ShipBlueprintRow[] = resolvedBlueprints.map((bp) => ({
    id: bp.id,
    name: bp.name,
    weaponType: bp.weaponType,
    category: bp.category,
    damage: bp.damage,
    defense: bp.defense,
    shielding: bp.shielding,
    movementSpeed: bp.movementSpeed,
    specialAbility: bp.specialAbility,
    novaCost: bp.novaCost,
    buildTimeCycles: bp.buildTimeCycles,
    fleetCapacityCost: bp.fleetCapacityCost,
    fighterCapacityProvided: bp.fighterCapacityProvided,
    canBuild: bp.canBuild,
    requirements: bp.requirements,
  }));

  const meta: ShipyardsTableMeta = {
    isBuilding,
    handleBuild: handleBuildShip,
  };

  return (
    <div className="space-y-6">
      <DataTable<ShipBlueprintRow>
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        meta={{ shipyardsMeta: meta }}
        emptyMessage="No ship blueprints available. Build shipyards and research technologies to unlock ships."
      />
    </div>
  );
}
