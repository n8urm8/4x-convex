import RedStar from '@/assets/stars/star_red01.png'; // Assuming other planet/star images might be used later
import { Route } from '@/routes/_app/_auth/game/_layout/(map)/map.$galaxyNumber';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { useQuery, useMutation } from '@tanstack/react-query'; // Added useMutation
import { Button } from '@/components/ui/button'; // Assuming a Button component exists



export const PlanetView = () => {
  const { sectorX, sectorY, systemX, systemY, planetX, planetY } =
    Route.useSearch();

  const { galaxyNumber } = Route.useParams();

  const planetQueryEnabled = 
    galaxyNumber !== undefined &&
    sectorX !== undefined &&
    sectorY !== undefined &&
    systemX !== undefined &&
    systemY !== undefined &&
    planetX !== undefined &&
    planetY !== undefined;

  const planetQueryArgs = planetQueryEnabled ? {
    galaxyNumber: Number(galaxyNumber!),
    sectorX: Number(sectorX!),
    sectorY: Number(sectorY!),
    systemX: Number(systemX!),
    systemY: Number(systemY!),
    planetX: Number(planetX!),
    planetY: Number(planetY!),
  } : { galaxyNumber: 0, sectorX: 0, sectorY: 0, systemX: 0, systemY: 0, planetX: 0, planetY: 0 }; // Default args when disabled

  const { data: planet, isLoading: loadingPlanet } = useQuery({
    ...convexQuery(
      api.game.map.galaxyQueries.getPlanetByCoordinates,
      planetQueryArgs // Always pass args, enabled flag controls execution
    ),
    enabled: planetQueryEnabled,
  });

  // Query for the star system to check exploration status
  const starSystemQueryEnabled = 
    galaxyNumber !== undefined &&
    sectorX !== undefined &&
    sectorY !== undefined &&
    systemX !== undefined &&
    systemY !== undefined;

  const starSystemQueryArgs = starSystemQueryEnabled ? {
    galaxyNumber: Number(galaxyNumber!),
    sectorX: Number(sectorX!),
    sectorY: Number(sectorY!),
    systemX: Number(systemX!),
    systemY: Number(systemY!),
  } : { galaxyNumber: 0, sectorX: 0, sectorY: 0, systemX: 0, systemY: 0 }; // Default args when disabled

  const { data: starSystem, isLoading: loadingStarSystem } = useQuery({
    ...convexQuery(
      api.game.map.galaxyQueries.getStarSystemByCoordinates,
      starSystemQueryArgs // Always pass args, enabled flag controls execution
    ),
    enabled: starSystemQueryEnabled,
  });

  // Query for base on the planet
  const baseQueryEnabled = !!planet?._id;
  const baseQueryArgs = baseQueryEnabled 
    ? { planetId: planet._id as Id<'systemPlanets'> } 
    : { planetId: 'dummySystemPlanetId' as Id<'systemPlanets'> }; // Default args when disabled

  const { data: baseOnPlanet, isLoading: loadingBase } = useQuery({
    ...convexQuery(
      api.game.bases.baseQueries.getBaseOnPlanet,
      baseQueryArgs // Always pass args, enabled flag controls execution
    ),
    enabled: baseQueryEnabled,
  });

  const { data: currentUser, isLoading: loadingCurrentUser } = useQuery(convexQuery(api.app.getCurrentUser, {}));

  const discoverSystemAdapter = useConvexMutation(api.game.map.systemMutations.discoverSystem);
  const { mutate: discoverSystemMutateFn, isPending: isDiscoveringSystem } = useMutation({
    mutationFn: discoverSystemAdapter,
  });

  const createBaseAdapter = useConvexMutation(api.game.bases.baseMutations.createBase);
  const { mutate: createBaseMutateFn, isPending: isCreatingBase } = useMutation({
    mutationFn: createBaseAdapter,
  });

  const handleDiscoverSystem = async () => {
    if (!starSystem?._id || !currentUser?._id) return;
    try {
      discoverSystemMutateFn({
        systemId: starSystem._id,
      });
      // Optionally, refetch starSystem or handle UI update
    } catch (error) {
      console.error('Failed to discover system:', error);
    }
  };

  const handleBuildBase = async () => {
    if (!planet?._id || !currentUser?._id || 
        galaxyNumber === undefined || sectorX === undefined || sectorY === undefined || 
        systemX === undefined || systemY === undefined || 
        planet.planetX === undefined || planet.planetY === undefined) {
      console.error('Missing required data to create base');
      return;
    }
    const baseName = prompt('Enter a name for your new base:');
    if (!baseName) return;

    try {
      createBaseMutateFn({
        // userId is now derived server-side
        planetId: planet._id,
        name: baseName,
        galaxyNumber: Number(galaxyNumber),
        sectorX: Number(sectorX),
        sectorY: Number(sectorY),
        systemX: Number(systemX),
        systemY: Number(systemY),
        planetX: planet.planetX, // Use direct properties from planet object
        planetY: planet.planetY  // Use direct properties from planet object
      });
      // Optionally, refetch baseOnPlanet or handle UI update
    } catch (error) {
      console.error('Failed to build base:', error);
    }
  };

  const isStar = planetX === 4 && planetY === 4; // Assuming star is always at fixed coordinates in system view
  // console.log('planet view: ', planet);
  // console.log('starSystem view: ', starSystem);
  // console.log('baseOnPlanet view: ', baseOnPlanet);

    const isLoading = loadingPlanet || loadingStarSystem || loadingBase || loadingCurrentUser;

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white-100"></div>
      </div>
    );
  }

  const canBuildBase = 
    starSystem && starSystem.exploredBy && 
    planet && !isStar && 
    !baseOnPlanet;

  const canDiscoverSystem = starSystem && starSystem.exploredBy === undefined;

  // Determine what to display (star or planet)
  
  const displayName = isStar ? `System ${systemX}-${systemY}` : planet?.type?.name || `Planet ${planetX}-${planetY}`; // Use planet.type.name
  const displayType = isStar ? starSystem?.starType : planet?.type?.name;
  const imageSrc = RedStar; // Placeholder, ideally dynamic based on type

  return (
    <div className="p-4 space-y-4">
      {/* Image Section - Smaller */}
      <div className="w-32 h-32 mx-auto border rounded-md flex items-center justify-center overflow-hidden">
        <img src={imageSrc} alt={displayName} className="max-w-full max-h-full object-contain" />
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
            {starSystem.exploredBy 
              ? `Explored by: ${starSystem.exploredBy === currentUser?._id ? currentUser?.name : 'Another Player'}` // Changed to flat currentUser access
              : 'Unexplored'}
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
          <Button onClick={handleBuildBase} disabled={isCreatingBase}>
            {isCreatingBase ? 'Building...' : 'Build Base'}
          </Button>
        )}
      </div>

      {/* Base Information Section */}
      {baseOnPlanet && (
        <div className="mt-4 p-3 border rounded-md bg-gray-800">
          <h3 className="font-semibold">Base Present</h3>
          <p>Name: {baseOnPlanet.name}</p>
          <p>Owner: {baseOnPlanet.userId === currentUser?._id ? currentUser?.name : 'Another Player'} {/* Changed to flat currentUser access */}
             {/* TODO: Fetch player name if not current user */}
          </p>
        </div>
      )}

      {/* TODO: Fleets Table Section */}
    </div>
  );

};
