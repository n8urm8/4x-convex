import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { useQuery } from '@tanstack/react-query';

interface GalaxyGridItemProps {
  galaxyNumber: number;
  x: number;
  y: number;
  isSelected: boolean;
  setSelectedSector: (x: number, y: number) => void;
  setSelectedSystem: (x: number, y: number) => void;
}

export const GalaxyGridItem = ({
  galaxyNumber,
  x,
  y,
  isSelected,
  setSelectedSector,
  setSelectedSystem
}: GalaxyGridItemProps) => {
  const queryArgs =
    galaxyNumber !== undefined && x !== undefined && y !== undefined
      ? {
          galaxyNumber: Number(galaxyNumber),
          sectorX: x,
          sectorY: y
        }
      : 'skip';
  const { data: sectorSystems } = useQuery(
    convexQuery(
      api.game.map.galaxyQueries.getSectorSystemsByCoordinates,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryArgs as any
    )
  );

  return (
    <div
      // key={`sector-${x}-${y}`}
      className={`border aspect-square grid grid-cols-25 grid-rows-25 ${isSelected ? 'p-4' : 'cursor-pointer'}`}
      onClick={() => setSelectedSector(x, y)}
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
          // Create a lighter version of the base color for the core
          const lightColor =
            baseColor === '#FFFFFF' ? '#FFFFFF' : `${baseColor}FF`;
          // Generate a slightly transparent version of the color for the glow
          const glowColor = `${baseColor}00`;

          return (
            <div
              key={`sector-${x}-${y} - system-${x}-${y}`}
              className="rounded-full"
              style={{
                cursor: 'pointer',
                width: `${size}px`,
                height: `${size}px`,
                background: `radial-gradient(circle, white 0%, ${lightColor} 20%,  ${baseColor}40 60%, ${glowColor} 80%)`,
                boxShadow: `0 0 ${size / 2}px ${size / 4}px ${baseColor}40`
              }}
              onClick={isSelected ? () => setSelectedSystem(x, y) : undefined}
            ></div>
          );
        })
      )}
    </div>
  );
};
