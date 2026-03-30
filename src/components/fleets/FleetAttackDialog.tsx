import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Sword, 
  MapPin, 
  Users,
  Shield,
  Zap,
  Target
} from 'lucide-react';

interface FleetAttackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fleetId: Id<'fleets'>;
}

export function FleetAttackDialog({ open, onOpenChange, fleetId }: FleetAttackDialogProps) {
  const [selectedTarget, setSelectedTarget] = useState<Id<'fleets'> | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);

  // Queries
  const fleetDetails = useQuery(api.game.fleets.fleetQueries.getFleetDetails, { fleetId });
  const combatTargets = useQuery(
    api.game.fleets.fleetQueries.getCombatTargets,
    fleetDetails?.currentSystemId ? { systemId: fleetDetails.currentSystemId } : 'skip'
  );

  // Mutations
  const attackFleet = useMutation(api.game.fleets.fleetActions.attackFleet);

  const formatLocation = (system: any) => {
    if (!system) return 'Unknown';
    return `G${system.galaxyNumber}-S${system.sectorX}.${system.sectorY}-Sys${system.systemX}.${system.systemY}`;
  };

  const handleAttack = async () => {
    if (!selectedTarget) {
      toast.error('Please select a target fleet');
      return;
    }

    setIsAttacking(true);
    try {
      const result = await attackFleet({
        attackerFleetId: fleetId,
        defenderFleetId: selectedTarget
      });

      toast.success(result.message);
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsAttacking(false);
    }
  };

  if (!fleetDetails) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-red-600" />
            Attack with Fleet: {fleetDetails.name}
          </DialogTitle>
          <DialogDescription>
            Select an enemy fleet in the same system to attack
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Current Location
            </div>
            <div className="p-2 bg-muted rounded-md text-sm">
              {formatLocation(fleetDetails.currentSystem)}
            </div>
          </div>

          {/* Fleet Stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Your Fleet Stats
            </div>
            <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-md">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-600">
                  <Sword className="h-4 w-4" />
                  <span className="font-bold">{fleetDetails.totalDamage}</span>
                </div>
                <div className="text-xs text-muted-foreground">Damage</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-600">
                  <Shield className="h-4 w-4" />
                  <span className="font-bold">{fleetDetails.totalDefense}</span>
                </div>
                <div className="text-xs text-muted-foreground">Defense</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-purple-600">
                  <Zap className="h-4 w-4" />
                  <span className="font-bold">{fleetDetails.totalShielding}</span>
                </div>
                <div className="text-xs text-muted-foreground">Shielding</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {fleetDetails.ships?.length || 0} ships • Health: {fleetDetails.totalHealth}/{fleetDetails.maxHealth}
            </div>
          </div>

          <Separator />

          {/* Available Targets */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />
              Available Targets
            </div>

            {!combatTargets || combatTargets.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No enemy fleets found in this system</p>
                <p className="text-xs">Move to a system with enemy fleets to engage in combat</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {combatTargets.map((target) => (
                  <div
                    key={target._id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedTarget === target._id
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : 'border-border hover:bg-muted'
                    }`}
                    onClick={() => setSelectedTarget(target._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{target.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Owner: {target.owner}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="font-medium">{target.shipCount}</div>
                          <div className="text-xs text-muted-foreground">Ships</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="font-medium text-orange-600">
                            {target.approximatePower}
                          </div>
                          <div className="text-xs text-muted-foreground">Power</div>
                        </div>
                        
                        <Badge 
                          variant={target.status === 'idle' ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {target.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Combat Warning */}
          {selectedTarget && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex items-start gap-2">
                <Sword className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200">
                    Combat Warning
                  </div>
                  <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Attacking will initiate combat. Both fleets may take damage or be destroyed.
                    Make sure you're prepared for battle!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAttack}
            disabled={!selectedTarget || isAttacking || !combatTargets?.length}
            variant="destructive"
          >
            {isAttacking ? 'Attacking...' : 'Attack Fleet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}