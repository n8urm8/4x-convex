import { Route } from '@/routes/_app/_auth/game/_layout/(map)/map.$galaxyNumber';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { useQuery } from '@tanstack/react-query';

export const GalaxySystem = () => {
  const { sectorX, sectorY, systemX, systemY } = Route.useSearch();
  const { galaxyNumber } = Route.useParams();

  const { data: system, isLoading: loadingSystem } = useQuery(
    convexQuery(api.game.map.galaxyQueries.getStarSystemByCoordinates, {
      galaxyNumber: Number(galaxyNumber),
      systemX: systemX!,
      systemY: systemY!,
      sectorX: sectorX!,
      sectorY: sectorY!
    })
  );
  console.log(' system: ', system);

  const { data: systemPlanets, isLoading: loadingPlanets } = useQuery({
    ...convexQuery(api.game.map.galaxyQueries.getSystemPlanets, {
      // @ts-expect-error undefined, but doesn't run until defined
      systemId: system?._id
    }),
    enabled: !!system?._id
  });

  console.log(' systemPlanets: ', systemPlanets);

  return (
    <div className={`border aspect-square grid grid-cols-9 grid-rows-9 `}>
      {loadingSystem && (
        <div className="col-span-9 row-span-9 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white-100"></div>
        </div>
      )}
      {system &&
        systemPlanets &&
        Array.from({ length: 9 }, (_, y) =>
          Array.from({ length: 9 }, (_, x) => {
            const planet = systemPlanets?.find(
              (planet) => planet.planetX === x && planet.planetY === y
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
                  className="rounded-full"
                  style={{
                    cursor: 'pointer',
                    width: `${size}px`,
                    height: `${size}px`,
                    background: `radial-gradient(circle, white 0%, ${lightColor} 20%,  ${baseColor}40 60%, ${glowColor} 80%)`,
                    boxShadow: `0 0 ${size / 2}px ${size / 4}px ${baseColor}40`
                  }}
                ></div>
              );
            }

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
