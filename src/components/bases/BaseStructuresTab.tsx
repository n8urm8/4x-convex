import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { BaseDetails } from '@/features/bases/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UpgradeTimer } from '@/components/ui/upgrade-timer';
import { useMemo, useState } from 'react';
import { Id } from '@cvx/_generated/dataModel';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

type StructureDefinition = NonNullable<
  ReturnType<typeof useQuery<typeof api.game.bases.baseQueries.getAllStructureDefinitions>>
>[number];

type BuiltStructure = BaseDetails['structures'][number];

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

function createColumns(): ColumnDef<StructureTableRow>[] {
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

function StructuresDataTable({
  data,
  meta,
  columns,
  showLocked,
  onShowLockedChange,
  totalCount,
}: {
  data: StructureTableRow[];
  meta: StructuresTableMeta;
  columns: ColumnDef<StructureTableRow>[];
  showLocked: boolean;
  onShowLockedChange: (checked: boolean) => void;
  totalCount: number;
}) {
  const displayData = showLocked
    ? data
    : data.filter(
        (row) => row.requirementCheck.canBuild || row.isBuilt
      );

  const table = useReactTable({
    data: displayData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.definition._id,
    meta: { structuresMeta: meta },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="show-locked"
            checked={showLocked}
            onCheckedChange={(checked) => onShowLockedChange(checked === true)}
          />
          <Label htmlFor="show-locked" className="text-sm font-normal cursor-pointer">
            Show structures I can&apos;t build yet
          </Label>
        </div>
        <span className="text-sm text-muted-foreground">
          {displayData.length} of {totalCount} structures
        </span>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {showLocked
                    ? 'No structures.'
                    : 'No structures available to build. Turn on "Show structures I can\'t build yet" to see locked ones.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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

  const columns = useMemo(() => createColumns(), []);

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

  const energyPercentage = (base.usedEnergy / base.totalEnergy) * 100;
  const spacePercentage = (base.usedSpace / base.totalSpace) * 100;

  const meta: StructuresTableMeta = {
    isBuilding,
    isUpgrading,
    handleBuild,
    handleUpgrade,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Energy Usage</span>
              <span>
                {base.usedEnergy} / {base.totalEnergy}
              </span>
            </div>
            <Progress value={energyPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {energyPercentage.toFixed(1)}% used
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Space Usage</span>
              <span>
                {base.usedSpace} / {base.totalSpace}
              </span>
            </div>
            <Progress value={spacePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {spacePercentage.toFixed(1)}% used
            </p>
          </div>
        </CardContent>
      </Card>

      <StructuresDataTable
        data={allTableRows}
        meta={meta}
        columns={columns}
        showLocked={showLocked}
        onShowLockedChange={setShowLocked}
        totalCount={allTableRows.length}
      />
    </div>
  );
}
