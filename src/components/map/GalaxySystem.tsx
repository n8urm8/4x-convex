import { Route } from '@/routes/_app/_auth/game/_layout/(map)/map.$galaxyNumber';
import { convexQuery } from '@convex-dev/react-query';
import { getPlanetImage } from '@/lib/planet-images';
import { getStarImage } from '@/lib/star-images';
import { api } from '@cvx/_generated/api';
import { Doc } from '@cvx/_generated/dataModel';
import { useQuery } from '@tanstack/react-query';

export const GalaxySystem = () => {
  const { sectorX, sectorY, systemX, systemY } = Route.useSearch();
  const { galaxyNumber } = Route.useParams();
  const navigate = Route.useNavigate();

  const systemQueryArgs =
    galaxyNumber !== undefined &&
    sectorX !== undefined &&
    sectorY !== undefined &&
    systemX !== undefined &&
    systemY !== undefined
      ? {
          galaxyNumber: Number(galaxyNumber),
          sectorX: sectorX,
          sectorY: sectorY,
          systemX: systemX,
          systemY: systemY
        }
      : 'skip';

  const { data: system, isLoading: loadingSystem } = useQuery(
    convexQuery(
      api.game.map.galaxyQueries.getStarSystemByCoordinates,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      systemQueryArgs as any
    )
  );
  console.log(' system: ', system);

  const planetsQueryArgs = system?._id ? { systemId: system._id } : 'skip';

  const { data: systemPlanets, isLoading: loadingPlanets } = useQuery(
    convexQuery(
      api.game.map.galaxyQueries.getSystemPlanets,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      planetsQueryArgs as any
    )
  );

  console.log('planets: ', systemPlanets);

  const handlePlanetClick = (x: number, y: number) => {
    // Update the URL with the selected planet coordinates
    navigate({
      search: {
        sectorX: sectorX,
        sectorY: sectorY,
        systemX: systemX,
        systemY: systemY,
        planetX: x,
        planetY: y
      }
    });
  };

  return (
    <div>
      <div
        className={`border rounded-sm aspect-square grid grid-cols-9 grid-rows-9 `}
      >
        {(loadingSystem || loadingPlanets) && (
          <div className="col-span-9 row-span-9 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white-100"></div>
          </div>
        )}
        {system &&
          systemPlanets &&
          Array.from({ length: 9 }, (_, y) =>
            Array.from({ length: 9 }, (_, x) => {
              const planet = systemPlanets?.find(
                (planet: Doc<'systemPlanets'>) =>
                  planet.planetX === x && planet.planetY === y
              );

              if (x === 4 && y === 4) {
                // Star in the center
                return (
                  <div
                    key={`${x}-${y}`}
                    className="group relative h-16 w-16 cursor-pointer transition-transform hover:scale-110"
                    onClick={() => handlePlanetClick(x, y)}
                  >
                    <img
                      src={getStarImage(system.starType)}
                      alt={system.starType}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                );
              } else if (planet && planet.type) {
                // Planet
                return (
                  <div
                    key={`${x}-${y}`}
                    className="group relative h-12 w-12 cursor-pointer transition-transform hover:scale-110"
                    onClick={() => handlePlanetClick(x, y)}
                  >
                    <img
                      src={getPlanetImage(
                        planet.type.name,
                        planet._creationTime
                      )}
                      alt={planet.type.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                );
              } else {
                // Empty space
                return <div key={`${x}-${y}`} className="h-12 w-12" />;
              }
            })
          )}
      </div>
    </div>
  );
};
