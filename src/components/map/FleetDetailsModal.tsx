import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatSystemCoordinates } from '@/lib/coordinates';

interface FleetDetailsModalProps {
  fleetId: Id<'fleets'> | null;
  onClose: () => void;
}

export function FleetDetailsModal({ fleetId, onClose }: FleetDetailsModalProps) {
  const { data: selectedFleetDetails, isLoading: loadingFleetDetails } = useQuery({
    ...convexQuery(
      api.game.fleets.fleetQueries.getFleetDetails,
      fleetId
        ? { fleetId }
        : { fleetId: '' as Id<'fleets'> }
    ),
    enabled: !!fleetId
  });

  return (
    <Dialog open={!!fleetId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedFleetDetails?.name || 'Fleet Details'}
          </DialogTitle>
        </DialogHeader>
        
        {loadingFleetDetails ? (
          <div className="p-4">Loading fleet details...</div>
        ) : selectedFleetDetails ? (
          <div className="space-y-4">
            {/* Fleet Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Fleet Information</h4>
                <div className="space-y-1 text-sm">
                  <div>Status: <span className="text-yellow-400">{selectedFleetDetails.status}</span></div>
                  <div>Ships: {selectedFleetDetails.shipCount}</div>
                  <div>Fleet Capacity: {selectedFleetDetails.currentCapacity}/{selectedFleetDetails.maxCapacity}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Combat Stats</h4>
                <div className="space-y-1 text-sm">
                  <div>Total Damage: {selectedFleetDetails.totalDamage}</div>
                  <div>Total Defense: {selectedFleetDetails.totalDefense}</div>
                  <div>Total Shielding: {selectedFleetDetails.totalShielding}</div>
                  <div>Fleet Speed: {selectedFleetDetails.fleetSpeed}</div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h4 className="font-semibold mb-2">Location</h4>
              <div className="text-sm">
                <div>Current System: {selectedFleetDetails.currentSystemName}</div>
                <div>Coordinates: {formatSystemCoordinates({
                  galaxyNumber: selectedFleetDetails.currentGalaxyNumber,
                  sectorX: selectedFleetDetails.currentSectorX,
                  sectorY: selectedFleetDetails.currentSectorY,
                  systemX: selectedFleetDetails.currentSystemX,
                  systemY: selectedFleetDetails.currentSystemY,
                })}</div>
                {selectedFleetDetails.destinationSystemName && (
                  <div className="text-yellow-400">
                    Moving to: {selectedFleetDetails.destinationSystemName}
                    {selectedFleetDetails.arrivalTime && (
                      <span className="ml-2">
                        (ETA: {new Date(selectedFleetDetails.arrivalTime).toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ships Table */}
            {selectedFleetDetails.ships && selectedFleetDetails.ships.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Ships ({selectedFleetDetails.ships.length})</h4>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-800 border-b border-gray-600">
                      <tr>
                        <th className="text-left p-2">Ship Type</th>
                        <th className="text-center p-2">Qty</th>
                        <th className="text-center p-2">DMG</th>
                        <th className="text-center p-2">DEF</th>
                        <th className="text-center p-2">SHD</th>
                        <th className="text-center p-2">HP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Group ships by blueprint ID
                        const shipGroups = selectedFleetDetails.ships.reduce((groups, ship) => {
                          const key = ship.blueprintId;
                          if (!groups[key]) {
                            groups[key] = {
                              blueprint: ship.blueprint,
                              ships: [],
                              damage: ship.damage,
                              defense: ship.defense,
                              shielding: ship.shielding,
                            };
                          }
                          groups[key].ships.push(ship);
                          return groups;
                        }, {} as Record<string, { blueprint: any; ships: any[]; damage: number; defense: number; shielding: number; }>);

                        return Object.entries(shipGroups).map(([blueprintId, group]) => {
                          const totalHP = group.ships.reduce((sum, ship) => sum + ship.currentHealth, 0);
                          const maxHP = group.ships.length * group.defense;
                          
                          return (
                            <tr key={blueprintId} className="border-b border-gray-700 hover:bg-gray-700/50">
                              <td className="p-2 font-medium">{group.blueprint?.name || 'Unknown Ship'}</td>
                              <td className="p-2 text-center">{group.ships.length}</td>
                              <td className="p-2 text-center">{group.damage}</td>
                              <td className="p-2 text-center">{group.defense}</td>
                              <td className="p-2 text-center">{group.shielding}</td>
                              <td className="p-2 text-center">
                                <span className={totalHP < maxHP * 0.5 ? 'text-red-400' : totalHP < maxHP * 0.8 ? 'text-yellow-400' : 'text-green-400'}>
                                  {totalHP}/{maxHP}
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            Fleet details not available. You can only view details of your own fleets.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}