import { Link, createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { Doc } from '@cvx/_generated/dataModel';

export const Route = createFileRoute('/_app/_auth/game/_layout/bases/')({
  component: BasesOverviewPage
});

type BaseWithUpgrades = Doc<'playerBases'> & {
  upgradingStructures: Doc<'baseStructures'>[];
};

function BasesOverviewPage() {
  const { data: bases, isLoading } = useQuery({
    ...convexQuery(api.game.bases.baseQueries.getPlayerBasesOverview, {})
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bases Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bases?.map((base: BaseWithUpgrades) => (
          <Link
            key={base._id}
            to="/game/bases/$baseId"
            params={{ baseId: base._id }}
            className="block border p-4 rounded-lg hover:bg-muted/50"
          >
            <h2 className="text-xl font-semibold">{base.name}</h2>
            <p>
              Location: G{base.galaxyNumber}-S{base.sectorX}.{base.sectorY}-S
              {base.systemX}.{base.systemY}-P{base.planetX}.{base.planetY}
            </p>
            <p>
              Energy: {base.usedEnergy} / {base.totalEnergy}
            </p>
            <p>
              Space: {base.usedSpace} / {base.totalSpace}
            </p>
            <div>
              <h3 className="font-bold mt-2">Upgrades in Progress:</h3>
              {base.upgradingStructures.length > 0 ? (
                <ul>
                  {base.upgradingStructures.map((structure) => (
                    <li key={structure._id}>
                      Upgrading structure to level {structure.upgradeLevel}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>None</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
