import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Doc, Id } from '../../../convex/_generated/dataModel';
import { getPlanetImage } from '../../lib/planet-images';

interface SystemPlanetProps {
  planetId: Id<'systemPlanets'>;
  planetType: Doc<'planetTypes'>;
  onClick: () => void;
}

export const SystemPlanet = ({
  planetId,
  planetType,
  onClick
}: SystemPlanetProps) => {
  const base = useQuery(api.game.bases.baseQueries.getBaseOnPlanet, {
    planetId: planetId
  });

  return (
    <div
      key={planetId}
      className="group relative flex h-12 w-12 cursor-pointer flex-col items-center"
      onClick={onClick}
    >
      <img
        src={getPlanetImage(planetType.name)}
        alt={planetType.name}
        className="h-full w-full rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      {base && (
        <div className="absolute top-full mt-1 w-full text-center text-xs text-white">
          {base.name}
        </div>
      )}
    </div>
  );
};
