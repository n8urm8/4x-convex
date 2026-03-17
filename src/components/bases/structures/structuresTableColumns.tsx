import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UpgradeTimer } from '@/components/ui/upgrade-timer';
import { Doc } from '@cvx/_generated/dataModel';
import { BaseDetails } from '@/features/bases/types';

export type StructureDefinition = Doc<'structureDefinitions'>;
export type BuiltStructure = BaseDetails['structures'][number];

export type StructureTableRow = {
  definition: StructureDefinition;
  builtStructure: BuiltStructure | undefined;
  level: number;
  isBuilt: boolean;
  requirementCheck: { canBuild: boolean; missingRequirements: string[] };
  canUpgrade: boolean;
};

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
        const { definition } = row.original;
        return (
          <div className="text-sm whitespace-nowrap">
            <div>Space: {definition.baseSpaceCost}</div>
            <div>Energy: {definition.baseEnergyCost}</div>
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
