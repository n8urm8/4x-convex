import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { BaseDetails } from '@/features/bases/types';
import { useMemo, useState } from 'react';
import { Id } from '@cvx/_generated/dataModel';
import { STRUCTURE_CATEGORIES } from '@cvx/game/bases/bases.schema';
import { BaseResourceUsageCard } from '@/components/bases/BaseResourceUsageCard';
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

  const columns = useMemo(() => createDefensesColumns(), []);

  const handleUpgrade = async (structureId: string) => {
    setIsUpgrading(structureId);
    try {
      await startUpgrade({ structureId: structureId as Id<'baseStructures'> });
    } catch (error) {
      console.error('Failed to start upgrade:', error);
    } finally {
      setIsUpgrading(null);
    }
  };

  const handleBuild = async (structureDefId: string) => {
    setIsBuilding(structureDefId);
    try {
      await buildStructure({
        baseId: base._id,
        structureDefId: structureDefId as Id<'structureDefinitions'>,
      });
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

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No defensive structures available yet. Research new defensive technologies
        to unlock them.
      </div>
    );
  }

  const meta: DefensesTableMeta = {
    isBuilding,
    isUpgrading,
    handleBuild,
    handleUpgrade,
  };

  return (
    <div className="space-y-6">
      <BaseResourceUsageCard base={base} />
      <DataTable<DefenseTableRow>
        columns={columns}
        data={rows}
        getRowId={(row) => row.definition._id}
        meta={{ defensesMeta: meta }}
        emptyMessage="No defensive structures."
      />
    </div>
  );
}
