import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type ShipBlueprintRow = {
  id: string;
  name: string;
  weaponType: string;
  category: string;
  damage?: number;
  defense?: number;
  shielding?: number;
  movementSpeed?: number;
  specialAbility: string;
  novaCost: number;
  buildTimeCycles: number;
  fleetCapacityCost: number;
  fighterCapacityProvided?: number;
  canBuild: boolean;
  requirements: {
    structure: { name: string; satisfied: boolean };
    technology: { name: string; satisfied: boolean };
    resources: { nova: number; satisfied: boolean };
  };
};

export type ShipyardsTableMeta = {
  isBuilding: string | null;
  handleBuild: (shipBlueprintId: string) => void;
};

function formatStats(blueprint: ShipBlueprintRow): string {
  const stats: string[] = [];
  if (blueprint.damage && blueprint.damage > 0) stats.push(`DMG: ${blueprint.damage}`);
  if (blueprint.defense && blueprint.defense > 0) stats.push(`DEF: ${blueprint.defense}`);
  if (blueprint.shielding && blueprint.shielding > 0) stats.push(`SHD: ${blueprint.shielding}`);
  if (blueprint.movementSpeed) stats.push(`SPD: ${blueprint.movementSpeed}`);
  return stats.join(', ');
}

export function createShipyardsColumns(): ColumnDef<ShipBlueprintRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Ship',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.weaponType} Weapon</div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.category}
        </Badge>
      ),
    },
    {
      id: 'stats',
      header: 'Stats',
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="text-sm">
            <div>{formatStats(b)}</div>
            <div className="text-xs text-muted-foreground">
              Fleet Cost: {b.fleetCapacityCost}
              {b.fighterCapacityProvided != null && ` | Fighters: +${b.fighterCapacityProvided}`}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'specialAbility',
      header: 'Special',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.specialAbility}</div>
      ),
    },
    {
      id: 'cost',
      header: 'Cost',
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="text-sm">
            <div>Nova: {b.novaCost.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Build Time: {b.buildTimeCycles} cycles
            </div>
          </div>
        );
      },
    },
    {
      id: 'requirements',
      header: 'Requirements',
      cell: ({ row }) => {
        const { requirements } = row.original;
        return (
          <div className="space-y-1">
            <Badge
              variant={requirements.structure.satisfied ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {requirements.structure.name} {requirements.structure.satisfied ? '✓' : '✗'}
            </Badge>
            <Badge
              variant={requirements.technology.satisfied ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {requirements.technology.name} {requirements.technology.satisfied ? '✓' : '✗'}
            </Badge>
            <Badge
              variant={requirements.resources.satisfied ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {requirements.resources.nova.toLocaleString()} Nova {requirements.resources.satisfied ? '✓' : '✗'}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Action</div>,
      cell: ({ row, table }) => {
        const blueprint = row.original;
        const meta = table.options.meta as { shipyardsMeta?: ShipyardsTableMeta } | undefined;
        const shipyardsMeta = meta?.shipyardsMeta;
        if (!shipyardsMeta) return null;

        const { isBuilding, handleBuild } = shipyardsMeta;
        const isBuildingThis = isBuilding === blueprint.id;
        const isAnyActionInProgress = isBuilding !== null;

        return (
          <div className="text-right">
            <Button
              size="sm"
              onClick={() => handleBuild(blueprint.id)}
              disabled={!blueprint.canBuild || isAnyActionInProgress}
              variant={blueprint.canBuild ? 'default' : 'secondary'}
            >
              {isBuildingThis ? 'Building...' : blueprint.canBuild ? 'Build' : 'Cannot Build'}
            </Button>
          </div>
        );
      },
    },
  ];
}
