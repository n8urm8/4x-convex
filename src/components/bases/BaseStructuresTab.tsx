import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { BaseDetails } from '@/features/bases/types';
import { useMemo, useState } from 'react';
import { Id } from '@cvx/_generated/dataModel';
import { BaseResourceUsageCard } from '@/components/bases/BaseResourceUsageCard';
import { DataTable } from '@/components/bases/DataTable';
import { ShowLockedToggle } from '@/components/bases/ShowLockedToggle';
import {
  createStructureColumns,
  type StructureDefinition,
  type StructureTableRow,
  type StructuresTableMeta,
  type BuiltStructure,
} from '@/components/bases/structures/structuresTableColumns';

export function BaseStructuresTab({ base }: { base: BaseDetails }) {
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState<string | null>(null);
  const [showLocked, setShowLocked] = useState(true);

  const allStructureDefinitions = useQuery(
    api.game.bases.baseQueries.getAllStructureDefinitions
  );
  const playerTechnologiesData = useQuery(
    api.game.research.researchQueries.getPlayerTechnologies,
    {}
  );

  const startUpgrade = useMutation(api.game.bases.baseMutations.startStructureUpgrade);
  const buildStructure = useMutation(api.game.bases.baseMutations.buildStructure);

  const columns = useMemo(() => createStructureColumns(), []);

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

  if (!allStructureDefinitions || !playerTechnologiesData) {
    return <div>Loading structures...</div>;
  }

  const builtStructuresMap = new Map(
    base.structures.map((structure) => [structure.structureDefId, structure])
  );
  const builtStructuresByName = new Map(
    base.structures
      .map((structure) => {
        const def = allStructureDefinitions.find((d) => d._id === structure.structureDefId);
        return def ? [def.name, structure] : null;
      })
      .filter(Boolean) as Array<[string, BuiltStructure]>
  );

  const checkRequirements = (structureDef: StructureDefinition) => {
    const issues: string[] = [];
    if (structureDef.researchRequirementName) {
      const hasResearch = playerTechnologiesData.technologies.some(
        (tech) =>
          tech.name === structureDef.researchRequirementName && tech.isResearched
      );
      if (!hasResearch) {
        issues.push(`Research: ${structureDef.researchRequirementName}`);
      }
    }
    if (structureDef.requiredStructureName && structureDef.requiredStructureLevel) {
      const prerequisite = builtStructuresByName.get(structureDef.requiredStructureName);
      if (!prerequisite) {
        issues.push(`Build: ${structureDef.requiredStructureName}`);
      } else if (prerequisite.level < structureDef.requiredStructureLevel) {
        issues.push(
          `${structureDef.requiredStructureName} Level ${structureDef.requiredStructureLevel}`
        );
      }
    }
    return { canBuild: issues.length === 0, missingRequirements: issues };
  };

  const nonDefensiveStructureDefinitions = allStructureDefinitions.filter(
    (definition) => definition.category !== 'defense'
  );

  const allStructuresWithState = nonDefensiveStructureDefinitions.map((definition) => {
    const builtStructure = builtStructuresMap.get(definition._id);
    return {
      definition,
      builtStructure,
      level: builtStructure?.level || 0,
      isBuilt: !!builtStructure,
    };
  });

  const toTableRow = (s: (typeof allStructuresWithState)[number]): StructureTableRow => ({
    ...s,
    requirementCheck: checkRequirements(s.definition),
    canUpgrade:
      s.isBuilt &&
      !!s.builtStructure &&
      !s.builtStructure.upgrading &&
      (!s.definition.maxLevel || s.level < s.definition.maxLevel),
  });

  const allTableRows = allStructuresWithState.map(toTableRow).sort((a, b) => {
    const catA = a.definition.category;
    const catB = b.definition.category;
    if (catA !== catB) return catA.localeCompare(catB);
    return a.definition.name.localeCompare(b.definition.name);
  });

  const displayData = showLocked
    ? allTableRows
    : allTableRows.filter(
        (row) => row.requirementCheck.canBuild || row.isBuilt
      );

  const meta: StructuresTableMeta = {
    isBuilding,
    isUpgrading,
    handleBuild,
    handleUpgrade,
  };

  const toolbar = (
    <ShowLockedToggle
      showLocked={showLocked}
      onShowLockedChange={setShowLocked}
      visibleCount={displayData.length}
      totalCount={allTableRows.length}
      itemLabel="structures"
    />
  );

  const emptyMessage = showLocked
    ? 'No structures.'
    : 'No structures available to build. Turn on "Show structures I can\'t build yet" to see locked ones.';

  return (
    <div className="space-y-6">
      <BaseResourceUsageCard base={base} />
      <DataTable<StructureTableRow>
        columns={columns}
        data={displayData}
        getRowId={(row) => row.definition._id}
        meta={{ structuresMeta: meta }}
        toolbar={toolbar}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
