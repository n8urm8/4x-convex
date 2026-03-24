import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { BaseDetails } from '@/features/bases/types';
import { useMemo, useState } from 'react';
import { Id } from '@cvx/_generated/dataModel';
import { STRUCTURE_CATEGORIES } from '@cvx/game/bases/bases.schema';
import { toast } from 'sonner';
import { BaseResourceUsageCard } from '@/components/bases/BaseResourceUsageCard';
import { BaseDevGameToolbar } from '@/components/bases/BaseDevGameToolbar';
import { DevInstantCompleteButton } from '@/components/bases/DevInstantCompleteButton';
import { DataTable } from '@/components/bases/DataTable';
import {
  createDefensesColumns,
  type DefenseTableRow,
  type DefensesTableMeta,
} from '@/components/bases/defenses/defensesTableColumns';

export function BaseDefensesTab({ base }: { base: BaseDetails }) {
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState<string | null>(null);

  const allStructureDefinitions = useQuery(
    api.game.bases.baseQueries.getAllStructureDefinitions
  );
  const startUpgrade = useMutation(
    api.game.bases.baseMutations.startStructureUpgrade
  );
  const buildStructure = useMutation(
    api.game.bases.baseMutations.buildStructure
  );
  const instantCompleteStructures = useMutation(
    api.game.bases.baseMutations.instantCompleteUpgradingStructures
  );
  const [instantCompleting, setInstantCompleting] = useState(false);

  const columns = useMemo(() => createDefensesColumns(), []);

  const hasDefenseUpgradeInProgress = useMemo(() => {
    if (!allStructureDefinitions) return false;
    const defById = new Map(allStructureDefinitions.map((d) => [d._id, d]));
    return base.structures.some((s) => {
      if (!s.upgrading) return false;
      const def = defById.get(s.structureDefId);
      return def?.category === STRUCTURE_CATEGORIES.DEFENSE;
    });
  }, [allStructureDefinitions, base.structures]);

  const handleInstantCompleteDefenses = async () => {
    setInstantCompleting(true);
    try {
      const { completedCount } = await instantCompleteStructures({
        baseId: base._id,
        scope: 'defense',
      });
      if (completedCount === 0) {
        toast.message('No defense build or upgrade in progress.');
      } else {
        toast.success(
          completedCount === 1
            ? 'Defense build completed.'
            : `${completedCount} defense builds completed.`
        );
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setInstantCompleting(false);
    }
  };

  const handleUpgrade = async (structureId: string) => {
    setIsUpgrading(structureId);
    try {
      const result = await startUpgrade({
        structureId: structureId as Id<'baseStructures'>,
      });
      if (result && 'queued' in result && result.queued) {
        toast.success('Upgrade queued. It will start when the current job finishes.');
      }
    } catch (error) {
      console.error('Failed to start upgrade:', error);
    } finally {
      setIsUpgrading(null);
    }
  };

  const handleBuild = async (structureDefId: string) => {
    setIsBuilding(structureDefId);
    try {
      const result = await buildStructure({
        baseId: base._id,
        structureDefId: structureDefId as Id<'structureDefinitions'>,
      });
      if (result && 'queued' in result && result.queued) {
        toast.success('Added to build queue. It will start when the current job finishes.');
      }
    } catch (error) {
      console.error('Failed to build structure:', error);
    } finally {
      setIsBuilding(null);
    }
  };

  if (!allStructureDefinitions) {
    return <div>Loading defensive structures...</div>;
  }

  const defensiveStructureDefinitions = allStructureDefinitions.filter(
    (definition) => definition.category === STRUCTURE_CATEGORIES.DEFENSE
  );

  const builtStructuresMap = new Map(
    base.structures.map((structure) => [structure.structureDefId, structure])
  );

  const defensiveStructuresWithState = defensiveStructureDefinitions.map(
    (definition) => {
      const builtStructure = builtStructuresMap.get(definition._id);
      return {
        definition,
        builtStructure,
        level: builtStructure?.level || 0,
        isBuilt: !!builtStructure,
      };
    }
  );

  const rows: DefenseTableRow[] = defensiveStructuresWithState.map((s) => ({
    ...s,
    canUpgrade:
      s.isBuilt &&
      !!s.builtStructure &&
      !s.builtStructure.upgrading &&
      (!s.definition.maxLevel || s.level < s.definition.maxLevel),
  }));

  const meta: DefensesTableMeta = {
    isBuilding,
    isUpgrading,
    handleBuild,
    handleUpgrade,
  };

  return (
    <div className="space-y-6">
      <BaseDevGameToolbar>
        <DevInstantCompleteButton
          label="Complete build now"
          disabled={!hasDefenseUpgradeInProgress}
          pending={instantCompleting}
          onClick={handleInstantCompleteDefenses}
        />
      </BaseDevGameToolbar>
      <BaseResourceUsageCard base={base} />
      {rows.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No defensive structures available yet. Research new defensive technologies to unlock
          them.
        </div>
      ) : (
        <DataTable<DefenseTableRow>
          columns={columns}
          data={rows}
          getRowId={(row) => row.definition._id}
          meta={{ defensesMeta: meta }}
          emptyMessage="No defensive structures."
        />
      )}
    </div>
  );
}
