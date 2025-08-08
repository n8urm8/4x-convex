import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Id } from '@cvx/_generated/dataModel';
import { toast } from 'sonner';
import { 
  Rocket, 
  MapPin, 
  Users, 
  Clock
} from 'lucide-react';

function FleetCard({ fleet, onManage }: { fleet: any; onManage: (fleetId: Id<'fleets'>) => void }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'idle':
        return <Badge variant="secondary">Idle</Badge>;
      case 'moving':
        return <Badge variant="default">Moving</Badge>;
      case 'in-combat':
        return <Badge variant="destructive">In Combat</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFleetTypeBadge = (isBaseFleet: boolean) => {
    return isBaseFleet 
      ? <Badge variant="outline" className="text-xs">Base Fleet</Badge>
      : <Badge variant="default" className="text-xs">Mobile Fleet</Badge>;
  };

  const formatLocation = (system: any) => {
    if (!system) return 'Unknown';
    return `G${system.galaxyNumber}-S${system.sectorX}.${system.sectorY}-Sys${system.systemX}.${system.systemY}`;
  };

  const formatTime = (timestamp: number) => {
    const minutes = Math.ceil((timestamp - Date.now()) / (60 * 1000));
    if (minutes <= 0) return 'Arrived';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            {fleet.name}
          </CardTitle>
          <div className="flex gap-1">
            {getFleetTypeBadge(fleet.isBaseFleet)}
            {getStatusBadge(fleet.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            <span>{formatLocation(fleet.currentSystem)}</span>
          </div>

          {/* Movement info */}
          {fleet.status === 'moving' && fleet.destinationSystem && fleet.arrivalTime && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Clock className="h-4 w-4" />
              <span>→ {formatLocation(fleet.destinationSystem)} ({formatTime(fleet.arrivalTime)})</span>
            </div>
          )}

          {/* Fleet composition */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span>{fleet.shipCount} ships</span>
          </div>

          {/* Fleet stats */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-red-600">{fleet.totalDamage}</div>
              <div className="text-muted-foreground">DMG</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-600">{fleet.totalDefense}</div>
              <div className="text-muted-foreground">DEF</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-purple-600">{fleet.totalShielding}</div>
              <div className="text-muted-foreground">SHD</div>
            </div>
          </div>

          {/* Health bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Health</span>
              <span>{fleet.totalHealth}/{fleet.maxHealth}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all" 
                style={{ width: `${(fleet.totalHealth / fleet.maxHealth) * 100}%` }}
              />
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Capacity</span>
              <span>{fleet.currentCapacity}/{fleet.maxCapacity}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all" 
                style={{ width: `${(fleet.currentCapacity / fleet.maxCapacity) * 100}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onManage(fleet._id)}
              className="flex-1"
            >
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FleetManagement() {
  // Queries
  const fleets = useQuery(api.game.fleets.fleetQueries.getUserFleets);
  const fleetLimits = useQuery(api.game.fleets.fleetQueries.getFleetLimits);
  const movingFleets = useQuery(api.game.fleets.fleetQueries.getMovingFleets);

  // Mutations
  const completeMovement = useMutation(api.game.fleets.fleetActions.completeFleetMovement);

  const handleCompleteMovement = async (fleetId: Id<'fleets'>) => {
    try {
      const result = await completeMovement({ fleetId });
      toast.success(result.message);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleManageFleet = (_fleetId: Id<'fleets'>) => {
    // TODO: Open fleet management modal/page
    toast.info('Fleet management interface coming soon!');
  };

  if (!fleets || !fleetLimits) {
    return <div>Loading fleets...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Fleet Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Command</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{fleetLimits.totalFleets}</div>
              <div className="text-sm text-muted-foreground">Total Fleets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{fleetLimits.baseFleets}</div>
              <div className="text-sm text-muted-foreground">Base Fleets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{fleetLimits.mobileFleets}</div>
              <div className="text-sm text-muted-foreground">Mobile Fleets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{fleetLimits.maxMobileFleets}</div>
              <div className="text-sm text-muted-foreground">Max Mobile</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{movingFleets?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Moving</div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Base Fleets:</strong> Created automatically when ships are built at bases</p>
            <p>• <strong>Mobile Fleets:</strong> Created when ships are split from existing fleets</p>
            <p>• Mobile fleet limit: {fleetLimits.basesCount} bases + 1 + research bonuses</p>
            {!fleetLimits.canCreateMoreMobile && (
              <p className="text-orange-600">• Mobile fleet limit reached. Build more bases to increase capacity.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Moving Fleets */}
      {movingFleets && movingFleets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Fleets in Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {movingFleets.map((fleet) => (
                <div key={fleet._id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <div className="font-medium">{fleet.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Moving to {fleet.destinationSystem?.systemX}.{fleet.destinationSystem?.systemY}
                    </div>
                  </div>
                  <div className="text-right">
                    {fleet.canComplete ? (
                      <Button 
                        size="sm" 
                        onClick={() => handleCompleteMovement(fleet._id)}
                      >
                        Complete Arrival
                      </Button>
                    ) : (
                      <div className="text-sm">
                        {Math.ceil(fleet.timeRemaining / (60 * 1000))}m remaining
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fleet List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fleets.map((fleet) => (
          <FleetCard 
            key={fleet._id} 
            fleet={fleet} 
            onManage={handleManageFleet}
          />
        ))}
      </div>

      {fleets.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Fleets Yet</h3>
            <p className="text-muted-foreground mb-4">
              Fleets are created automatically when you build ships at your bases.
              Build ships in your shipyards to create your first fleet!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
