import { BaseOverviewTab } from '@/components/bases/BaseOverviewTab';
import { BaseResearchTab } from '@/components/bases/BaseResearchTab';
import { BaseShipyardsTab } from '@/components/bases/BaseShipyardsTab';
import { BaseStructuresTab } from '@/components/bases/BaseStructuresTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';

export const Route = createFileRoute('/_app/_auth/game/_layout/(bases)/$baseId/')({
  component: BasePage,
});

function BasePage() {
  const { baseId } = Route.useParams();
  const { data: base, isLoading } = useQuery({
    ...convexQuery(api.game.bases.baseQueries.getBaseDetails, {
      baseId: baseId as Id<'playerBases'>,
    }),
  });

  if (isLoading) {
    return <div>Loading base details...</div>;
  }

  if (!base) {
    return <div>Base not found or you do not have access.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{base.name}</h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="structures">Structures</TabsTrigger>
          <TabsTrigger value="shipyards">Shipyards</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <BaseOverviewTab base={base} />
        </TabsContent>
        <TabsContent value="structures">
          <BaseStructuresTab base={base} />
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
