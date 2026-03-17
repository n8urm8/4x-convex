import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Id } from '@cvx/_generated/dataModel';

export type ResearchTechRow = {
  _id: Id<'researchDefinitions'>;
  name: string;
  description: string;
  tier: number;
  category: string;
  costs: Record<string, number> | null;
  isResearched: boolean;
  canResearch: boolean;
};

export type ResearchTableMeta = {
  isResearching: boolean;
  researchingId: Id<'researchDefinitions'> | null;
  handleResearch: (researchId: Id<'researchDefinitions'>) => void;
  canResearchTech: (tech: ResearchTechRow) => boolean;
};

export function createResearchColumns(): ColumnDef<ResearchTechRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Technology',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const tech = row.original;
        return (
          <div className="text-sm">
            <div className="text-muted-foreground">{tech.description}</div>
            {!tech.canResearch && tech.tier > 1 && (
              <div className="text-xs text-red-500 mt-1">
                Requires all Tier {tech.tier - 1} {tech.category} technologies
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'tier',
      header: 'Tier',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.tier}</div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.category}</div>
      ),
    },
    {
      id: 'costs',
      header: 'Costs',
      cell: ({ row }) => {
        const costs = row.original.costs;
        return (
          <div className="text-sm">
            {costs && Object.keys(costs).length > 0 ? (
              Object.entries(costs).map(([resource, amount]) => (
                <div key={resource}>
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}: {amount}
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">None</div>
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row, table }) => {
        const tech = row.original;
        const meta = table.options.meta as { researchMeta?: ResearchTableMeta } | undefined;
        const researchMeta = meta?.researchMeta;
        if (!researchMeta) return null;

        const { researchingId } = researchMeta;
        if (researchingId === tech._id) {
          return <Badge variant="default">Researching</Badge>;
        }
        if (tech.isResearched) {
          return <Badge variant="secondary">Completed</Badge>;
        }
        if (!tech.canResearch) {
          return <Badge variant="destructive">Locked</Badge>;
        }
        return <Badge variant="outline">Available</Badge>;
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Action</div>,
      cell: ({ row, table }) => {
        const tech = row.original;
        const meta = table.options.meta as { researchMeta?: ResearchTableMeta } | undefined;
        const researchMeta = meta?.researchMeta;
        if (!researchMeta) return null;

        const { isResearching, researchingId, handleResearch, canResearchTech } = researchMeta;
        const isCurrentlyResearching = researchingId !== null && researchingId !== undefined;

        return (
          <div className="text-right">
            <Button
              size="sm"
              onClick={() => handleResearch(tech._id)}
              disabled={
                tech.isResearched ||
                isCurrentlyResearching ||
                isResearching ||
                !canResearchTech(tech)
              }
              variant={tech.isResearched ? 'secondary' : 'default'}
            >
              {tech.isResearched
                ? 'Completed'
                : !canResearchTech(tech)
                  ? 'Locked'
                  : 'Research'}
            </Button>
          </div>
        );
      },
    },
  ];
}
