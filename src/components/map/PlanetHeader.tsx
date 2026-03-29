import { formatCoordinates } from '@/lib/coordinates';

interface ExplorerNameProps {
  explorerId: string;
}

const ExplorerName = ({ }: ExplorerNameProps) => {
  // This would need to be implemented with a proper user query
  return <>Another Player</>;
};

interface StarSystem {
  starType?: string;
  exploredBy?: string;
}

interface PlanetHeaderProps {
  displayName: string;
  displayType?: string;
  imageSrc: string;
  galaxyNumber: number;
  sectorX: number;
  sectorY: number;
  systemX: number;
  systemY: number;
  planetX?: number;
  planetY?: number;
  starSystem?: StarSystem;
}

export function PlanetHeader({
  displayName,
  displayType,
  imageSrc,
  galaxyNumber,
  sectorX,
  sectorY,
  systemX,
  systemY,
  planetX,
  planetY,
  starSystem
}: PlanetHeaderProps) {
  return (
    <>
      {/* Image Section */}
      <div className="w-32 h-32 mx-auto rounded-md flex items-center justify-center overflow-hidden">
        <img
          src={imageSrc}
          alt={displayName}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Details Section */}
      <div className="text-center">
        <h2 className="text-xl font-semibold">{displayName}</h2>
        <p className="text-sm text-gray-400">Type: {displayType || 'N/A'}</p>
        <p className="text-xs text-gray-500">
          Coords: {planetX !== undefined && planetY !== undefined 
            ? formatCoordinates({
                galaxyNumber,
                sectorX,
                sectorY,
                systemX,
                systemY,
                planetX,
                planetY
              })
            : formatCoordinates({
                galaxyNumber,
                sectorX,
                sectorY,
                systemX,
                systemY
              })
          }
        </p>
        {starSystem && (
          <p className="text-sm">
            {starSystem.exploredBy ? (
              <>
                Explored by: <ExplorerName explorerId={starSystem.exploredBy} />
              </>
            ) : (
              'Unexplored'
            )}
          </p>
        )}
      </div>
    </>
  );
}