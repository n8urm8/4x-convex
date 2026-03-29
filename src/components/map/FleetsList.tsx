import { Id } from '@cvx/_generated/dataModel';

interface Fleet {
  _id: Id<'fleets'>;
  name: string;
  userId: Id<'users'>;
  owner: string;
  status: string;
  shipCount: number;
}

interface FleetsListProps {
  fleets: Fleet[];
  currentUserId?: Id<'users'>;
  onFleetClick: (fleetId: Id<'fleets'>) => void;
}

export function FleetsList({ fleets, currentUserId, onFleetClick }: FleetsListProps) {
  if (!fleets || fleets.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-3 border rounded-md bg-gray-800">
      <h3 className="font-semibold mb-3">Fleets in System ({fleets.length})</h3>
      <div className="space-y-2">
        {fleets.map((fleet) => (
          <div
            key={fleet._id}
            className="flex justify-between items-center p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors"
            onClick={() => onFleetClick(fleet._id)}
          >
            <div>
              <div className="font-medium">{fleet.name}</div>
              <div className="text-sm text-gray-400">
                {fleet.shipCount} ship{fleet.shipCount !== 1 ? 's' : ''}
                {fleet.status !== 'idle' && (
                  <span className="ml-2 text-yellow-400">({fleet.status})</span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-300">
              {fleet.owner}
              {fleet.userId === currentUserId && (
                <span className="ml-1 text-green-400">(You)</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}