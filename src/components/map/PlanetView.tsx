import RedStar from '@/assets/stars/star_red01.png';
import { Route } from '@/routes/_app/_auth/game/_layout/(map)/map.$galaxyNumber';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { useQuery } from '@tanstack/react-query';

export const PlanetView = () => {
  const { sectorX, sectorY, systemX, systemY, planetX, planetY } =
    Route.useSearch();

  const { galaxyNumber } = Route.useParams();

  const queryArgs =
    galaxyNumber !== undefined &&
    sectorX !== undefined &&
    sectorY !== undefined &&
    systemX !== undefined &&
    systemY !== undefined &&
    planetX !== undefined &&
    planetY !== undefined
      ? {
          galaxyNumber: Number(galaxyNumber),
          sectorX: sectorX,
          sectorY: sectorY,
          systemX: systemX,
          systemY: systemY,
          planetX: planetX,
          planetY: planetY
        }
      : 'skip';

  const { data: planet, isLoading: loadingPlanet } = useQuery(
    convexQuery(
      api.game.map.galaxyQueries.getPlanetByCoordinates,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryArgs as any
    )
  );

  const isStar = planetX === 4 && planetY === 4;
  console.log('planet view: ', planet);

  return (
    <div>
      <div
        className={`border rounded-sm aspect-square grid grid-cols-9 grid-rows-9 `}
      >
        {loadingPlanet && (
          <div className="col-span-9 row-span-9 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white-100"></div>
          </div>
        )}
        {planet && (
          <div className="col-span-9 row-span-9 flex items-center justify-center">
            <img src={RedStar} alt="star" />
            <p>Type: {planet.type?.name}</p>
          </div>
        )}
        {!planet && isStar && (
          <div className="col-span-9 row-span-9 flex items-center justify-center">
            <img src={RedStar} alt="star" />
            <p>Type: Star</p>
          </div>
        )}
      </div>
    </div>
  );
};
