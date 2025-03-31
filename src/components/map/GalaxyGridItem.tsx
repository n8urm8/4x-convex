import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { useQuery } from '@tanstack/react-query';

interface GalaxyGridItemProps {
  galaxyNumber: number;
  x: number;
  y: number;
  isSelected: boolean;
  setSelectedSector: (sector: { x: number; y: number }) => void;
}

export const GalaxyGridItem = ({
  galaxyNumber,
  x,
  y,
  isSelected,
  setSelectedSector
}: GalaxyGridItemProps) => {
  //   const { data: sectorInfo } = useQuery(
  //     convexQuery(api.game.map.galaxyQueries.getSectorByCoordinates, {
  //       galaxyNumber: Number(galaxyNumber),
  //       sectorX: x,
  //       sectorY: y
  //     })
  //   );

  const { data: sectorSystems } = useQuery(
    convexQuery(api.game.map.galaxyQueries.getSectorSystemsByCoordinates, {
      galaxyNumber: Number(galaxyNumber),
      sectorX: x,
      sectorY: y
    })
  );

  console.log(x, 'x', y, 'sectorSystems', sectorSystems);
  return (
    <div
      key={`sector-${x}-${y}`}
      className={`border aspect-square grid grid-cols-25 grid-rows-25 ${isSelected ? 'p-4' : ''}`}
      onClick={() => setSelectedSector({ x, y })}
    >
      {Array.from({ length: 25 }, (_, y) =>
        Array.from({ length: 25 }, (_, x) => {
          const system = sectorSystems?.find(
            (system) => system.systemX === x && system.systemY === y
          );

          if (!system)
            return (
              <div
                key={`sector-${x}-${y} - system-${x}-${y}`}
                // className="h-1 w-1"
              ></div>
            );

          // Calculate size based on star size, with minimum of 1.5
          const size = isSelected
            ? Math.max(16, (system.starSize ?? 0) * 10)
            : Math.max(4, (system.starSize ?? 0) * 2);

          // Create a glow effect with radial gradient
          const baseColor = system.starColor;
          // Generate a slightly transparent version of the color for the glow
          const glowColor = `${baseColor}00`;

          return (
            <div
              key={`sector-${x}-${y} - system-${x}-${y}`}
              className="rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                background: `radial-gradient(circle, ${baseColor} 0%, ${baseColor}40 30%, ${glowColor} 70%)`
                // boxShadow: `0 0 ${size}px ${size / 2}px ${baseColor}40`
              }}
            ></div>
          );
        })
      )}
    </div>
  );
};
