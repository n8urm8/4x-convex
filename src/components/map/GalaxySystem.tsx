import { Route } from '@/routes/_app/_auth/game/_layout/(map)/map.$galaxyNumber';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { useQuery } from '@tanstack/react-query';

export const GalaxySystem = () => {
  const { sectorX, sectorY, systemX, systemY } = Route.useSearch();
  const { galaxyNumber } = Route.useParams();

  const { data: system } = useQuery(
    convexQuery(api.game.map.galaxyQueries.getStarSystemByCoordinates, {
      galaxyNumber: Number(galaxyNumber),
      systemX: systemX!,
      systemY: systemY!,
      sectorX: sectorX!,
      sectorY: sectorY!
    })
  );
  console.log(' system: ', system);

  const { data: systemPlanets } = useQuery({
    ...convexQuery(api.game.map.galaxyQueries.getSystemPlanets, {
      systemId: system!._id
    }),
    enabled: !!system?._id
  });

  console.log(' systemPlanets: ', systemPlanets);

  return (
    <div className={`border aspect-square grid grid-cols-9 grid-rows-9 `}>
      {Array.from({ length: 9 }, (_, y) =>
        Array.from({ length: 9 }, (_, x) => {
          const planet = systemPlanets?.find(
            (planet) => planet.planetX === x && planet.planetY === y
          );

          if (!planet)
            return (
              <div
                key={`system-${x}-${y} - planet-${x}-${y}`}
                className="h-1 w-1"
              ></div>
            );

          // Calculate size based on star size, with minimum of 1.5
          const size = 10;

          return (
            <div
              key={`system-${x}-${y} - planet-${x}-${y}`}
              className={`h-${size} w-${size} bg-gray-500 rounded-full`}
            ></div>
          );
        })
      )}
    </div>
  );
};
