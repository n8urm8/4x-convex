import { getPlanetImage } from '@/lib/planet-images';
import { getStarImage } from '@/lib/star-images';
import {
  Route,
  type GalaxyMapSearch
} from '@/routes/_app/_auth/game/_layout/(map)/map.$galaxyNumber';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateBaseModal } from './CreateBaseModal';

const ExplorerName = ({ explorerId }: { explorerId: Id<'users'> }) => {
  const { data: explorer } = useQuery(
    convexQuery(api.app.getUserById, { userId: explorerId })
  );
  return <>{explorer?.username ?? 'Another Player'}</>;
};

export function PlanetView() {
  const [isCreateBaseModalOpen, setCreateBaseModalOpen] = useState(false);
  const { sectorX, sectorY, systemX, systemY, planetX, planetY } =
    Route.useSearch();

  const { galaxyNumber } = Route.useParams();
  const navigate = Route.useNavigate();

  const planetQueryEnabled =
    galaxyNumber !== undefined &&
    sectorX !== undefined &&
    sectorY !== undefined &&
    systemX !== undefined &&
    systemY !== undefined &&
    planetX !== undefined &&
    planetY !== undefined;

  const { data: planet, isLoading: loadingPlanet } = useQuery({
    ...convexQuery(api.game.map.galaxyQueries.getPlanetByCoordinates, {
      galaxyNumber: Number(galaxyNumber!),
      sectorX: Number(sectorX!),
      sectorY: Number(sectorY!),
      systemX: Number(systemX!),
      systemY: Number(systemY!),
      planetX: Number(planetX!),
      planetY: Number(planetY!)
    }),
    enabled: planetQueryEnabled
  });

  const starSystemQueryEnabled =
    galaxyNumber !== undefined &&
    sectorX !== undefined &&
    sectorY !== undefined &&
    systemX !== undefined &&
    systemY !== undefined;

  const { data: starSystem, isLoading: loadingStarSystem } = useQuery({
    ...convexQuery(api.game.map.galaxyQueries.getStarSystemByCoordinates, {
      galaxyNumber: Number(galaxyNumber!),
      sectorX: Number(sectorX!),
      sectorY: Number(sectorY!),
      systemX: Number(systemX!),
      systemY: Number(systemY!)
    }),
    enabled: starSystemQueryEnabled
  });

  const { data: baseOnPlanet, isLoading: loadingBase } = useQuery({
    ...convexQuery(
      api.game.bases.baseQueries.getBaseOnPlanet,
      planet?._id
        ? { planetId: planet._id }
        : { planetId: '' as Id<'systemPlanets'> }
    ),
    enabled: !!planet?._id
  });

  const { data: currentUser, isLoading: loadingCurrentUser } = useQuery(
    convexQuery(api.app.getCurrentUser, {})
  );

  const discoverSystemAdapter = useConvexMutation(
    api.game.map.systemMutations.discoverSystem
  );
  const { mutate: discoverSystemMutateFn, isPending: isDiscoveringSystem } =
    useMutation({
      mutationFn: discoverSystemAdapter,
      onSuccess: () => {
        navigate({
          search: (prev: GalaxyMapSearch) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { planetX, planetY, ...rest } = prev;
            return rest;
          }
        });
      }
    });

  const createBaseAdapter = useConvexMutation(
    api.game.bases.baseMutations.createBase
  );
  const { mutate: createBaseMutateFn, isPending: isCreatingBase } = useMutation({
    mutationFn: createBaseAdapter,
    onSuccess: () => {
      setCreateBaseModalOpen(false);
    }
  });

  const handleConfirmCreateBase = (name: string) => {
    if (
      !planet?._id ||
      galaxyNumber === undefined ||
      sectorX === undefined ||
      sectorY === undefined ||
      systemX === undefined ||
      systemY === undefined ||
      planet.planetX === undefined ||
      planet.planetY === undefined
    ) {
      return;
    }
    createBaseMutateFn({
      planetId: planet._id,
      name,
      galaxyNumber: Number(galaxyNumber),
      sectorX,
      sectorY,
      systemX,
      systemY,
      planetX: planet.planetX,
      planetY: planet.planetY
    });
  };

  const handleDiscoverSystem = () => {
    if (!starSystem?._id) return;
    discoverSystemMutateFn({ systemId: starSystem._id });
  };

  const isStar = planetX === 4 && planetY === 4;
  const isLoading =
    loadingPlanet || loadingStarSystem || loadingBase || loadingCurrentUser;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const canBuildBase =
    starSystem && starSystem.exploredBy && planet && !isStar && !baseOnPlanet;

  const canDiscoverSystem = starSystem && !starSystem.exploredBy;

  const displayName = isStar
    ? `System ${systemX}-${systemY}`
    : planet?.type?.name || `Planet ${planetX}-${planetY}`;
  const displayType = isStar ? starSystem?.starType : planet?.type?.name;
  const imageSrc = isStar
    ? getStarImage(starSystem?.starType)
    : getPlanetImage(planet?.type?.name ?? '');

  return (
    <div className="p-4 space-y-4">
      {/* Image Section - Smaller */}
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
          Coords: G{galaxyNumber}/S{sectorX}-{sectorY}/Sys{systemX}-{systemY}
          {!isStar && `/P${planetX}-${planetY}`}
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

      {/* Action Buttons Section */}
      <div className="flex justify-center space-x-2">
        {canDiscoverSystem && (
          <Button onClick={handleDiscoverSystem} disabled={isDiscoveringSystem}>
            {isDiscoveringSystem ? 'Discovering...' : 'Discover System'}
          </Button>
        )}
        {canBuildBase && (
          <Button
            onClick={() => setCreateBaseModalOpen(true)}
            disabled={isCreatingBase || !canBuildBase}
            className="w-full"
          >
            {isCreatingBase ? 'Building...' : 'Build Base'}
          </Button>
        )}
      </div>

      {/* Base Information Section */}
      {baseOnPlanet && (
        <div className="mt-4 p-3 border rounded-md bg-gray-800">
          <h3 className="font-semibold">Base Present</h3>
          <p>Name: {baseOnPlanet.name}</p>
          <p>
            Owner:{' '}
            {baseOnPlanet.userId === currentUser?._id
              ? currentUser?.name
              : 'Another Player'}{' '}
            {/* Changed to flat currentUser access */}
            {/* TODO: Fetch player name if not current user */}
          </p>
        </div>
      )}

      <CreateBaseModal
        isOpen={isCreateBaseModalOpen}
        onClose={() => setCreateBaseModalOpen(false)}
        onSubmit={handleConfirmCreateBase}
        isCreating={isCreatingBase}
      />

      {/* TODO: Fleets Table Section */}
    </div>
  );
};
