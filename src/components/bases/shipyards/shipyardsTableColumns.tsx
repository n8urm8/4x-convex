import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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
  countAtBase: number;
  requirements: {
    structure: { name: string; satisfied: boolean };
    technology: { name: string; satisfied: boolean };
    resources: { nova: number; satisfied: boolean };
  };
};

export type ShipyardsTableMeta = {
  isBuilding: string | null;
  handleBuild: (shipBlueprintId: string, quantity: number) => void;
  quantities: Record<string, number>;
  setQuantity: (shipBlueprintId: string, quantity: number) => void;
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
      accessorKey: 'countAtBase',
      header: 'Count',
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.original.countAtBase}
        </div>
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
        const buildTimeMinutes = b.buildTimeCycles * 5;
        const hours = Math.floor(buildTimeMinutes / 60);
        const minutes = buildTimeMinutes % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        
        return (
          <div className="text-sm">
            <div>{b.novaCost.toLocaleString()} Nova</div>
            <div className="text-xs text-muted-foreground">
              {timeString}
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
      id: 'quantity',
      header: 'Quantity',
      cell: ({ row, table }) => {
        const blueprint = row.original;
        const meta = table.options.meta as { shipyardsMeta?: ShipyardsTableMeta } | undefined;
        const shipyardsMeta = meta?.shipyardsMeta;
        if (!shipyardsMeta) return null;

        const { quantities, setQuantity } = shipyardsMeta;
        const quantity = quantities[blueprint.id] || 1;
        const totalCost = blueprint.novaCost * quantity;
        const totalBuildTimeMinutes = blueprint.buildTimeCycles * 5 * quantity;
        const totalHours = Math.floor(totalBuildTimeMinutes / 60);
        const totalMins = totalBuildTimeMinutes % 60;
        const totalTimeString = `${totalHours.toString().padStart(2, '0')}:${totalMins.toString().padStart(2, '0')}:00`;

        return (
          <div className="space-y-2">
            <Input
              type="number"
              min="1"
              max="999"
              value={quantity}
              onChange={(e) => {
                const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                setQuantity(blueprint.id, newQuantity);
              }}
              className="w-20 text-center"
            />
            <div className="text-xs text-muted-foreground text-center">
              <div>{totalCost.toLocaleString()} Nova</div>
              <div>{totalTimeString}</div>
            </div>
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

        const { isBuilding, handleBuild, quantities } = shipyardsMeta;
        const quantity = quantities[blueprint.id] || 1;
        const isBuildingThis = isBuilding === blueprint.id;
        const isAnyActionInProgress = isBuilding !== null;

        return (
          <div className="text-right">
            <Button
              size="sm"
              onClick={() => handleBuild(blueprint.id, quantity)}
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
