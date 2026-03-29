import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { BaseDetails } from '@/features/bases/types';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { BaseDevGameToolbar } from '@/components/bases/BaseDevGameToolbar';
import { PipelineQueueCard } from '@/components/bases/PipelineQueueCard';
import { mapShipBuildPipelineToQueueRows } from '@/components/bases/shipyards/shipBuildQueue';
import { DataTable } from '@/components/bases/DataTable';
import {
  createShipyardsColumns,
  type ShipBlueprintRow,
  type ShipyardsTableMeta,
} from '@/components/bases/shipyards/shipyardsTableColumns';

export function BaseShipyardsTab({ base }: { base: BaseDetails }) {
  const [isBuilding, setIsBuilding] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const shipData = useQuery(api.game.ships.shipActions.getShipBlueprintsForBase, {
    baseId: base._id,
  });
  const buildShip = useMutation(api.game.ships.shipActions.buildShip);
  const removeQueuedShipBuild = useMutation(api.game.ships.shipActions.removeQueuedShipBuild);

  const columns = useMemo(() => createShipyardsColumns(), []);

  const handleRemoveQueued = async (queueId: string) => {
    try {
      const result = await removeQueuedShipBuild({ queueEntryId: queueId as any });
      if (result.refunded > 0) {
        toast.success(`Build cancelled. Refunded ${result.refunded.toLocaleString()} Nova.`);
      } else {
        toast.success('Build cancelled.');
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const shipQueueRows = useMemo(
    () =>
      mapShipBuildPipelineToQueueRows(shipData?.shipBuildPipeline ?? [], handleRemoveQueued),
    [shipData?.shipBuildPipeline]
  );

  const handleBuildShip = async (shipBlueprintId: string, quantity: number) => {
    setIsBuilding(shipBlueprintId);
    try {
      const result = await buildShip({
        shipBlueprintId,
        baseId: base._id,
        quantity,
      });
      
      if (result.queued) {
        toast.success(`${quantity} ship${quantity > 1 ? 's' : ''} queued for production!`);
      } else {
        toast.success(`${quantity} ship${quantity > 1 ? 's' : ''} started building!`);
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsBuilding(null);
    }
  };

  const setQuantity = (shipBlueprintId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [shipBlueprintId]: quantity
    }));
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
    countAtBase: bp.countAtBase,
    requirements: bp.requirements,
  }));

  const meta: ShipyardsTableMeta = {
    isBuilding,
    handleBuild: handleBuildShip,
    quantities,
    setQuantity,
  };

  return (
    <div className="space-y-6">
      <BaseDevGameToolbar />
      <PipelineQueueCard title="Ship production" rows={shipQueueRows} />
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
