import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UpgradeTimer } from '@/components/ui/upgrade-timer';
import { Doc } from '@cvx/_generated/dataModel';
import { BaseDetails } from '@/features/bases/types';

export type DefenseStructureDefinition = Doc<'structureDefinitions'>;
export type BuiltStructure = BaseDetails['structures'][number];

export type DefenseTableRow = {
  definition: DefenseStructureDefinition;
  builtStructure: BuiltStructure | undefined;
  level: number;
  isBuilt: boolean;
  canUpgrade: boolean;
};

export type DefensesTableMeta = {
  isBuilding: string | null;
  isUpgrading: string | null;
  handleBuild: (structureDefId: string) => void;
  handleUpgrade: (structureId: string) => void;
};

export function createDefensesColumns(): ColumnDef<DefenseTableRow>[] {
  return [
    {
      accessorKey: 'definition',
      header: 'Defensive Structure',
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
      id: 'defenseDamage',
      header: 'Defense/Damage',
      cell: ({ row }) => {
        const { definition } = row.original;
        return (
          <div className="text-sm space-y-1">
            {definition.defense != null && (
              <div className="text-green-600">Defense: {definition.defense}</div>
            )}
            {definition.damage != null && (
              <div className="text-red-600">Damage: {definition.damage}</div>
            )}
            {definition.shielding != null && (
              <div className="text-blue-600">Shielding: {definition.shielding}</div>
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
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.definition.researchRequirementName ?? 'None'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Action</div>,
      cell: ({ row, table }) => {
        const { definition, builtStructure, isBuilt, canUpgrade } = row.original;
        const meta = table.options.meta as { defensesMeta?: DefensesTableMeta } | undefined;
        const defensesMeta = meta?.defensesMeta;
        if (!defensesMeta) return null;

        const { isBuilding, isUpgrading, handleBuild, handleUpgrade } = defensesMeta;
        const isUpgradingThis = builtStructure && isUpgrading === builtStructure._id;
        const isBuildingThis = isBuilding === definition._id;
        const isAnyActionInProgress = isUpgrading !== null || isBuilding !== null;

        return (
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
