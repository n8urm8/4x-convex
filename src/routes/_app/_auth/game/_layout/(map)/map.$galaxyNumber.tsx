import { GalaxyGridItem } from '@/components/map/GalaxyGridItem';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute(
  '/_app/_auth/game/_layout/(map)/map/$galaxyNumber'
)({
  component: GalaxyMap
});

export default function GalaxyMap() {
  const { galaxyNumber } = Route.useParams();
  const [selectedSector, setSelectedSector] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [selectedSystem, setSelectedSystem] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const { data };

  return (
    <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
      <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
        <div className="flex w-full flex-col rounded-lg border border-border bg-card dark:bg-black">
          <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Galaxy Map</h1>
            <div
              id="galaxy-map-grid"
              className="container grid grid-cols-10 grid-rows-10"
            >
              {Array.from({ length: 10 }, (_, y) =>
                Array.from({ length: 10 }, (_, x) => {
                  const isSelected =
                    selectedSector?.x === x && selectedSector?.y === y;
                  return (
                    <GalaxyGridItem
                      x={x}
                      y={y}
                      isSelected={isSelected}
                      setSelectedSector={setSelectedSector}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
