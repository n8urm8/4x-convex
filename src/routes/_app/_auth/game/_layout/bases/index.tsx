import { Link, createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { Doc } from '@cvx/_generated/dataModel';
import { BaseCard } from '@/components/bases/BaseCard';

export const Route = createFileRoute('/_app/_auth/game/_layout/bases/')({
  component: BasesOverviewPage
});

type BaseWithUpgrades = Doc<'playerBases'> & {
  upgradingStructures: Doc<'baseStructures'>[];
  planet: Doc<'systemPlanets'> | null;
  planetType: Doc<'planetTypes'> | null;
};

function BasesOverviewPage() {
  const { data: bases, isLoading } = useQuery({
    ...convexQuery(api.game.bases.baseQueries.getPlayerBasesOverview, {})
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your bases...</p>
        </div>
      </div>
    );
  }

  if (!bases || bases.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">No Bases Found</h1>
          <p className="text-muted-foreground mb-6">
            You don't have any bases yet. Explore the galaxy map to establish your first base and begin your expansion!
          </p>
          <Link 
            to="/game/map" 
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
            </svg>
            Explore Galaxy Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bases Overview</h1>
        <p className="text-muted-foreground">
          Manage your {bases.length} base{bases.length !== 1 ? 's' : ''} across the galaxy
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {bases?.map((base: BaseWithUpgrades) => (
          <BaseCard key={base._id} base={base} />
        ))}
      </div>
    </div>
  );
}
