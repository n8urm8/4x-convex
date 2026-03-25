import { BaseOverviewTab } from '@/components/bases/BaseOverviewTab';
import { BaseDefensesTab } from '@/components/bases/BaseDefensesTab';
import { BaseResearchTab } from '@/components/bases/BaseResearchTab';
import { BaseShipyardsTab } from '@/components/bases/BaseShipyardsTab';
import { BaseStructuresTab } from '@/components/bases/BaseStructuresTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { useCompletionChecker } from '@/hooks/useCompletionChecker';

const BASE_TABS = [
  'overview',
  'structures',
  'defenses',
  'shipyards',
  'research',
] as const;

export type BaseDetailTab = (typeof BASE_TABS)[number];

export type BaseDetailSearch = {
  tab: BaseDetailTab;
};

function parseBaseTab(search: Record<string, unknown>): BaseDetailTab {
  const raw = search.tab;
  if (
    typeof raw === 'string' &&
    (BASE_TABS as readonly string[]).includes(raw)
  ) {
    return raw as BaseDetailTab;
  }
  return 'overview';
}

export const Route = createFileRoute('/_app/_auth/game/_layout/bases/$baseId/')({
  validateSearch: (search: Record<string, unknown>): BaseDetailSearch => ({
    tab: parseBaseTab(search),
  }),
  component: BasePage,
});

function BasePage() {
  const { baseId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: base, isLoading } = useQuery({
    ...convexQuery(api.game.bases.baseQueries.getBaseDetails, {
      baseId: baseId as Id<'playerBases'>,
    }),
  });

  // Automatically check for completed upgrades and research
  // Check every 60 seconds (1 minute) instead of every 30 seconds for less frequent calls
  useCompletionChecker(baseId as Id<'playerBases'>, { 
    intervalMs: 60000 // 1 minute 
  });

  if (isLoading) {
    return <div>Loading base details...</div>;
  }

  if (!base) {
    return <div>Base not found or you do not have access.</div>;
  }

  return (
    <div className="p-4">
      <Tabs
        value={tab}
        onValueChange={(next) => {
          navigate({
            search: (prev: BaseDetailSearch) => ({ ...prev, tab: next as BaseDetailTab }),
          });
        }}
      >
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold mb-4">{base.name}</h1>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="structures">Structures</TabsTrigger>
          <TabsTrigger value="defenses">Defenses</TabsTrigger>
          <TabsTrigger value="shipyards">Shipyards</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
        </TabsList>
        </div>
        <TabsContent value="overview">
          <BaseOverviewTab base={base} />
        </TabsContent>
        <TabsContent value="structures">
          <BaseStructuresTab base={base} />
        </TabsContent>
        <TabsContent value="defenses">
          <BaseDefensesTab base={base} />
        </TabsContent>
        <TabsContent value="shipyards">
          <BaseShipyardsTab base={base} />
        </TabsContent>
        <TabsContent value="research">
          <BaseResearchTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
