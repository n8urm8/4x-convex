import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UpgradeTimer } from '@/components/ui/upgrade-timer';
import { cn } from '@/lib/utils';
import { Doc } from '@cvx/_generated/dataModel';
import { BaseDetails } from '@/features/bases/types';

export type StructureDefinition = Doc<'structureDefinitions'>;
export type BuiltStructure = BaseDetails['structures'][number];

export type StructureCostShortage = {
  space: boolean;
  energy: boolean;
  nova: boolean;
};

export type StructureTableRow = {
  definition: StructureDefinition;
  builtStructure: BuiltStructure | undefined;
  level: number;
  isBuilt: boolean;
  requirementCheck: { canBuild: boolean; missingRequirements: string[] };
  canUpgrade: boolean;
  costShortage: StructureCostShortage;
};

/** Matches server checks: new builds include queued build footprint; upgrades use current used* + scaled costs. */
export function computeStructureCostShortage(
  base: BaseDetails,
  playerNova: number | undefined,
  row: {
    definition: StructureDefinition;
    isBuilt: boolean;
    level: number;
    canUpgrade: boolean;
  }
): StructureCostShortage {
  const def = row.definition;
  const fp = base.queuedBuildFootprint ?? { space: 0, energy: 0 };
  const availSpaceForNewBuild =
    base.totalSpace - base.usedSpace - fp.space;
  const availEnergyForNewBuild =
    base.totalEnergy - base.usedEnergy - fp.energy;

  if (!row.isBuilt) {
    return {
      space: availSpaceForNewBuild < def.baseSpaceCost,
      energy: availEnergyForNewBuild < def.baseEnergyCost,
      nova: false,
    };
  }

  if (!row.canUpgrade) {
    return { space: false, energy: false, nova: false };
  }

  const nextLevel = row.level + 1;
  const novaCost = def.baseNovaCost * nextLevel;
  const energyCost = def.baseEnergyCost * nextLevel;
  const availEnergy = base.totalEnergy - base.usedEnergy;

  return {
    space: false,
    energy: availEnergy < energyCost,
    nova:
      playerNova !== undefined && playerNova < novaCost,
  };
}

export type StructuresTableMeta = {
  isBuilding: string | null;
  isUpgrading: string | null;
  handleBuild: (structureDefId: string) => void;
  handleUpgrade: (structureId: string) => void;
};

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export function createStructureColumns(): ColumnDef<StructureTableRow>[] {
  return [
    {
      accessorKey: 'definition',
      header: 'Structure',
      cell: ({ row }) => {
        const { definition } = row.original;
        return (
          <div>
            <div className="font-medium">{definition.name}</div>
            <div className="text-sm text-muted-foreground">{definition.description}</div>
          </div>
        );
      },
    },
    {
      id: 'category',
      accessorFn: (row) => row.definition.category,
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatCategory(row.original.definition.category)}
        </span>
      ),
    },
    {
      id: 'level',
      header: 'Level',
      cell: ({ row }) => {
        const { builtStructure, level, isBuilt } = row.original;
        return (
          <div className="space-y-1">
            {isBuilt ? (
              <>
                <Badge variant="secondary">Level {level}</Badge>
                {builtStructure?.upgrading &&
                  builtStructure.upgradeCompleteTime &&
                  builtStructure.upgradeLevel && (
                    <UpgradeTimer
                      upgradeCompleteTime={builtStructure.upgradeCompleteTime}
                      upgradeLevel={builtStructure.upgradeLevel}
                    />
                  )}
              </>
            ) : (
              <Badge variant="outline">Not Built</Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'effects',
      header: 'Effects',
      cell: ({ row }) => {
        const { definition } = row.original;
        return (
          <div className="text-sm min-w-[140px]">
            <div>{definition.effects}</div>
            <div className="text-muted-foreground mt-1">{definition.upgradeBenefits}</div>
          </div>
        );
      },
    },
    {
      id: 'costs',
      header: 'Costs',
      cell: ({ row }) => {
        const { definition, isBuilt, level, canUpgrade, costShortage } =
          row.original;

        if (isBuilt && !canUpgrade) {
          return (
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              <div>Space: —</div>
              <div>Energy: —</div>
              <div>Nova: —</div>
            </div>
          );
        }

        if (isBuilt && canUpgrade) {
          const nl = level + 1;
          return (
            <div className="text-sm whitespace-nowrap">
              <div className="text-muted-foreground">Space: —</div>
              <div
                className={cn(costShortage.energy && 'text-destructive')}
              >
                Energy: {definition.baseEnergyCost * nl}
              </div>
              <div className={cn(costShortage.nova && 'text-destructive')}>
                Nova: {definition.baseNovaCost * nl}
              </div>
            </div>
          );
        }

        return (
          <div className="text-sm whitespace-nowrap">
            <div className={cn(costShortage.space && 'text-destructive')}>
              Space: {definition.baseSpaceCost}
            </div>
            <div className={cn(costShortage.energy && 'text-destructive')}>
              Energy: {definition.baseEnergyCost}
            </div>
            <div>Nova: {definition.baseNovaCost}</div>
          </div>
        );
      },
    },
    {
      id: 'requirements',
      header: 'Requirements',
      cell: ({ row }) => {
        const { requirementCheck } = row.original;
        return (
          <div className="text-sm min-w-[120px]">
            {requirementCheck.missingRequirements.length === 0 ? (
              <span className="text-muted-foreground">None</span>
            ) : (
              <div className="space-y-1">
                {requirementCheck.missingRequirements.map((req, idx) => (
                  <div key={idx} className="text-destructive">
                    {req}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Action</div>,
      cell: ({ row, table }) => {
        const { definition, builtStructure, isBuilt, requirementCheck, canUpgrade } =
          row.original;
        const meta = table.options.meta as { structuresMeta?: StructuresTableMeta } | undefined;
        const structuresMeta = meta?.structuresMeta;
        if (!structuresMeta) return null;

        const { isBuilding, isUpgrading, handleBuild, handleUpgrade } = structuresMeta;
        const isUpgradingThis = builtStructure && isUpgrading === builtStructure._id;
        const isBuildingThis = isBuilding === definition._id;
        const isAnyActionInProgress = isUpgrading !== null || isBuilding !== null;

        return (
          <div className="text-right">
            {!isBuilt ? (
              <Button
                size="sm"
                onClick={() => handleBuild(definition._id)}
                disabled={!requirementCheck.canBuild || isAnyActionInProgress}
                title={
                  !requirementCheck.canBuild
                    ? `Missing: ${requirementCheck.missingRequirements.join(', ')}`
                    : undefined
                }
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
        );
      },
    },
  ];
}
