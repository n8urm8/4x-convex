import { GalaxyGridItem } from '@/components/map/GalaxyGridItem';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

interface GalaxyMapSearch {
  sectorX?: number;
  sectorY?: number;
  systemX?: number;
  systemY?: number;
}

export const Route = createFileRoute(
  '/_app/_auth/game/_layout/(map)/map/$galaxyNumber'
)({
  component: GalaxyMap,
  validateSearch: (search: Record<string, unknown>): GalaxyMapSearch => {
    // validate and parse the search params into a typed state
    return {
      sectorX: search.sectorX ? Number(search.sectorX) : undefined,
      sectorY: search.sectorY ? Number(search.sectorY) : undefined,
      systemX: search.systemX ? Number(search.systemX) : undefined,
      systemY: search.systemY ? Number(search.systemY) : undefined
    };
  }
});

export default function GalaxyMap() {
  const { galaxyNumber } = Route.useParams();
  const { sectorX, sectorY, systemX, systemY } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [selectedSector, setSelectedSector] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [selectedSystem, setSelectedSystem] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleSectorClick = (x: number, y: number) => {
    setSelectedSector({ x, y });
    setSelectedSystem(null);
    // Update the URL with the selected sector coordinates
    navigate({
      search: { sectorX: x, sectorY: y }
    });
  };

  const handleSystemClick = (x: number, y: number) => {
    setSelectedSystem({ x, y });
    // Update the URL with the selected system coordinates
    navigate({
      search: {
        sectorX: selectedSector?.x,
        sectorY: selectedSector?.y,
        systemX: x,
        systemY: y
      }
    });
  };

  useEffect(() => {
    // Check for sector coordinates in search params
    if (sectorX && sectorY) {
      setSelectedSector({
        x: sectorX,
        y: sectorY
      });

      // Check for system coordinates in search params
      if (systemX && systemY) {
        setSelectedSystem({
          x: systemX,
          y: systemY
        });
      } else {
        // Reset system selection if only sector is provided
        setSelectedSystem(null);
      }
    } else {
      // Reset both selections if no sector params
      setSelectedSector(null);
      setSelectedSystem(null);
    }
  }, [sectorX, sectorY, systemX, systemY]);

  return (
    <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
      <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
        <div className="flex w-full flex-col rounded-lg border border-border bg-card dark:bg-black">
          <div className="container mx-auto p-4">
            <div className="flex items-center justify-center mb-4">
              {/* <h1 className="text-3xl font-bold mb-6">Galaxy Map</h1> */}
              <Link
                to="/game/map/$galaxyNumber"
                params={{ galaxyNumber: galaxyNumber }}
              >
                {' '}
                {galaxyNumber}{' '}
              </Link>
              {selectedSector && (
                <>
                  <span> :: </span>
                  <Link
                    to="/game/map/$galaxyNumber"
                    params={{ galaxyNumber: galaxyNumber }}
                    search={{
                      sectorX: selectedSector.x,
                      sectorY: selectedSector.y
                    }}
                  >
                    {' '}
                    {selectedSector.x}
                    {selectedSector.y}{' '}
                  </Link>
                </>
              )}
              {selectedSystem && selectedSector && (
                <>
                  <span> :: </span>
                  <Link
                    to="/game/map/$galaxyNumber"
                    params={{ galaxyNumber: galaxyNumber }}
                    search={{
                      sectorX: selectedSector.x,
                      sectorY: selectedSector.y,
                      systemX: selectedSystem.x,
                      systemY: selectedSystem.y
                    }}
                  >
                    {' '}
                    {selectedSystem.x}
                    {selectedSystem.y}{' '}
                  </Link>
                </>
              )}
            </div>
            <div
              id="galaxy-map-grid"
              className={`container max-w-4xl ${!selectedSector ? 'grid grid-cols-10 grid-rows-10' : ''}`}
            >
              {!selectedSector ? (
                Array.from({ length: 10 }, (_, y) =>
                  Array.from({ length: 10 }, (_, x) => {
                    return (
                      <GalaxyGridItem
                        key={`sector-${x}-${y}`}
                        galaxyNumber={Number(galaxyNumber)}
                        x={x}
                        y={y}
                        isSelected={false}
                        setSelectedSector={handleSectorClick}
                        setSelectedSystem={() => {}}
                      />
                    );
                  })
                )
              ) : (
                <GalaxyGridItem
                  key={`system-${selectedSector.x}-${selectedSector.y}`}
                  galaxyNumber={Number(galaxyNumber)}
                  x={selectedSector.x}
                  y={selectedSector.y}
                  isSelected={true}
                  setSelectedSector={() => {}}
                  setSelectedSystem={handleSystemClick}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
