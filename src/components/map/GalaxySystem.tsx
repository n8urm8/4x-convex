import { Route } from '@/routes/_app/_auth/game/_layout/(map)/map.$galaxyNumber';
import { convexQuery } from '@convex-dev/react-query';
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
                (planet: Doc<'systemPlanets'>) => planet.planetX === x && planet.planetY === y
              );

              if (x === 4 && y === 4) {
                // Center star
                // Calculate size based on star size, with minimum of 1.5
                const size = Math.max(30, (system.starSize ?? 0) * 30);

                // Create a glow effect with radial gradient
                const baseColor = system.starColor;
                // Create a lighter version of the base color for the core
                const lightColor =
                  baseColor === '#FFFFFF' ? '#FFFFFF' : `${baseColor}FF`;
                // Generate a slightly transparent version of the color for the glow
                const glowColor = `${baseColor}00`;
                return (
                  <div
                    key={`system-${systemX}-${systemY} - star-${x}-${y}`}
                    className="h-full w-full flex flex-col justify-center items-center"
                  >
                    <div
                      className="rounded-full"
                      onClick={() => handlePlanetClick(x, y)}
                      style={{
                        cursor: 'pointer',
                        width: `${size}px`,
                        height: `${size}px`,
                        background: `radial-gradient(circle, white 0%, ${lightColor} 20%,  ${baseColor}40 60%, ${glowColor} 80%)`,
                        boxShadow: `0 0 ${size / 2}px ${size / 4}px ${baseColor}40`
                      }}
                    ></div>
                    {system.exploredBy == undefined && (
                      <div className="text-xs text-nowrap text-gray-200 pt-2">
                        System Undiscovered
                      </div>
                    )}
                  </div>
                );
              }

              if (!planet)
                return (
                  <div
                    key={`system-${systemX}-${systemY} - planet-${x}-${y}`}
                    className="h-full w-full"
                  ></div>
                );

              // Calculate size based on star size, with minimum of 1.5
              const size = 10;

              return (
                <div
                  onClick={() => handlePlanetClick(x, y)}
                  key={`system-${systemX}-${systemY} - planet-${x}-${y}`}
                  className={`h-${size} w-${size} bg-gray-500 rounded-full`}
                ></div>
              );
            })
          )}
      </div>
    </div>
  );
};
