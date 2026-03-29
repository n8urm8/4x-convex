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
import { FleetDetailsModal } from './FleetDetailsModal';
import { FleetsList } from './FleetsList';
import { BaseInformation } from './BaseInformation';
import { PlanetHeader } from './PlanetHeader';

export function PlanetView() {
  const [isCreateBaseModalOpen, setCreateBaseModalOpen] = useState(false);
  const [selectedFleetId, setSelectedFleetId] = useState<Id<'fleets'> | null>(null);

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

  const { data: fleetsInSystem, isLoading: loadingFleets } = useQuery({
    ...convexQuery(
      api.game.fleets.fleetQueries.getFleetsInSystem,
      starSystem?._id
        ? { systemId: starSystem._id }
        : { systemId: '' as Id<'sectorSystems'> }
    ),
    enabled: !!starSystem?._id
  });

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
    loadingPlanet || loadingStarSystem || loadingBase || loadingCurrentUser || loadingFleets;

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
      <PlanetHeader
        displayName={displayName}
        displayType={displayType}
        imageSrc={imageSrc}
        galaxyNumber={Number(galaxyNumber!)}
        sectorX={Number(sectorX!)}
        sectorY={Number(sectorY!)}
        systemX={Number(systemX!)}
        systemY={Number(systemY!)}
        planetX={planetX}
        planetY={planetY}
        starSystem={starSystem || undefined}
      />

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

      <BaseInformation
        base={baseOnPlanet}
        currentUserId={currentUser?._id}
        currentUserName={currentUser?.name}
      />

      <FleetsList
        fleets={fleetsInSystem || []}
        currentUserId={currentUser?._id}
        onFleetClick={setSelectedFleetId}
      />

      <CreateBaseModal
        isOpen={isCreateBaseModalOpen}
        onClose={() => setCreateBaseModalOpen(false)}
        onSubmit={handleConfirmCreateBase}
        isCreating={isCreatingBase}
      />

      <FleetDetailsModal
        fleetId={selectedFleetId}
        onClose={() => setSelectedFleetId(null)}
      />
    </div>
  );
};