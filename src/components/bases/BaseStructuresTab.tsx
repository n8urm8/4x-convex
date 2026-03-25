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
import { ShowLockedToggle } from '@/components/bases/ShowLockedToggle';
import {
  computeStructureCostShortage,
  createStructureColumns,
  type StructureDefinition,
  type StructureTableRow,
  type StructuresTableMeta,
  type BuiltStructure,
} from '@/components/bases/structures/structuresTableColumns';

export function BaseStructuresTab({ base }: { base: BaseDetails }) {
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState<string | null>(null);
  const [showLocked, setShowLocked] = useState(false);

  const allStructureDefinitions = useQuery(
    api.game.bases.baseQueries.getAllStructureDefinitions
  );
  const playerTechnologiesData = useQuery(
    api.game.research.researchQueries.getPlayerTechnologies,
    {}
  );
  const playerResources = useQuery(api.app.getCurrentUserResources, {});

  const startUpgrade = useMutation(api.game.bases.baseMutations.startStructureUpgrade);
  const buildStructure = useMutation(api.game.bases.baseMutations.buildStructure);
  const instantCompleteStructures = useMutation(
    api.game.bases.baseMutations.instantCompleteUpgradingStructures
  );
  const [instantCompleting, setInstantCompleting] = useState(false);

  const columns = useMemo(() => createStructureColumns(), []);

  const hasNonDefenseUpgradeInProgress = useMemo(() => {
    if (!allStructureDefinitions) return false;
    const defById = new Map(allStructureDefinitions.map((d) => [d._id, d]));
    return base.structures.some((s) => {
      if (!s.upgrading) return false;
      const def = defById.get(s.structureDefId);
      return def && def.category !== STRUCTURE_CATEGORIES.DEFENSE;
    });
  }, [allStructureDefinitions, base.structures]);

  const handleInstantCompleteStructures = async () => {
    setInstantCompleting(true);
    try {
      const { completedCount } = await instantCompleteStructures({
        baseId: base._id,
        scope: 'non_defense',
      });
      if (completedCount === 0) {
        toast.message('No structure build or upgrade in progress on this tab.');
      } else {
        toast.success(
          completedCount === 1
            ? 'Structure build completed.'
            : `${completedCount} structure builds completed.`
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

  const toTableRow = (s: (typeof allStructuresWithState)[number]): StructureTableRow => {
    const canUpgrade =
      s.isBuilt &&
      !!s.builtStructure &&
      !s.builtStructure.upgrading &&
      (!s.definition.maxLevel || s.level < s.definition.maxLevel);
    return {
      ...s,
      requirementCheck: checkRequirements(s.definition),
      canUpgrade,
      costShortage: computeStructureCostShortage(
        base,
        playerResources?.nova,
        {
          definition: s.definition,
          isBuilt: s.isBuilt,
          level: s.level,
          canUpgrade,
        }
      ),
    };
  };

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
      <BaseDevGameToolbar>
        <DevInstantCompleteButton
          label="Complete build now"
          disabled={!hasNonDefenseUpgradeInProgress}
          pending={instantCompleting}
          onClick={handleInstantCompleteStructures}
        />
      </BaseDevGameToolbar>
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
