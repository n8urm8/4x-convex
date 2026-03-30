import { useState, useEffect } from 'react';
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
import { CoordinateInput, Coordinates, coordinateUtils } from '@/components/ui/coordinate-input';
import { toast } from 'sonner';
import { 
  Rocket, 
  Clock,
  Minus,
  Plus,
  Users
} from 'lucide-react';

interface FleetMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fleetId: Id<'fleets'>;
}

interface ShipSelection {
  shipId: Id<'playerShips'>;
  blueprintId: string;
  name: string;
  quantity: number;
  maxQuantity: number;
}

export function FleetMoveDialog({ open, onOpenChange, fleetId }: FleetMoveDialogProps) {
  const [coordinates, setCoordinates] = useState<Coordinates>({
    galaxyNumber: 1,
    sectorX: 1,
    sectorY: 1,
    systemX: 1,
    systemY: 1,
    isAtStar: true
  });
  const [shipSelections, setShipSelections] = useState<ShipSelection[]>([]);
  const [isMoving, setIsMoving] = useState(false);

  // Queries
  const fleetDetails = useQuery(api.game.fleets.fleetQueries.getFleetDetails, { fleetId });
  const moveFleetWithShips = useMutation(api.game.fleets.fleetActions.moveFleetWithShips);

  // Initialize ship selections when fleet details load
  useEffect(() => {
    if (fleetDetails?.ships) {
      // Group ships by blueprint
      const shipGroups = fleetDetails.ships.reduce((acc, ship) => {
        const key = ship.blueprintId;
        if (!acc[key]) {
          acc[key] = {
            blueprintId: ship.blueprintId,
            name: ship.blueprint?.name || 'Unknown Ship',
            ships: []
          };
        }
        acc[key].ships.push(ship);
        return acc;
      }, {} as Record<string, { blueprintId: string; name: string; ships: any[] }>);

      // Create selections
      const selections: ShipSelection[] = Object.values(shipGroups).map(group => ({
        shipId: group.ships[0]._id, // Use first ship as representative
        blueprintId: group.blueprintId,
        name: group.name,
        quantity: group.ships.length, // Default to all ships
        maxQuantity: group.ships.length
      }));

      setShipSelections(selections);
    }
  }, [fleetDetails]);

  const updateShipQuantity = (blueprintId: string, newQuantity: number) => {
    setShipSelections(prev => 
      prev.map(selection => 
        selection.blueprintId === blueprintId 
          ? { ...selection, quantity: Math.max(0, Math.min(newQuantity, selection.maxQuantity)) }
          : selection
      )
    );
  };

  const selectAllShips = () => {
    setShipSelections(prev => 
      prev.map(selection => ({ ...selection, quantity: selection.maxQuantity }))
    );
  };

  const clearAllShips = () => {
    setShipSelections(prev => 
      prev.map(selection => ({ ...selection, quantity: 0 }))
    );
  };

  const getSelectedShipIds = (): Id<'playerShips'>[] => {
    if (!fleetDetails?.ships) return [];
    
    const selectedIds: Id<'playerShips'>[] = [];
    
    shipSelections.forEach(selection => {
      if (selection.quantity > 0) {
        const shipsOfType = fleetDetails.ships.filter(
          ship => ship.blueprintId === selection.blueprintId
        );
        
        // Take the first N ships of this type
        const shipsToMove = shipsOfType.slice(0, selection.quantity);
        selectedIds.push(...shipsToMove.map(ship => ship._id));
      }
    });
    
    return selectedIds;
  };

  const getTotalSelectedShips = () => {
    return shipSelections.reduce((total, selection) => total + selection.quantity, 0);
  };

  const getFleetSpeed = () => {
    if (!fleetDetails?.ships) return 0;
    
    const selectedShipIds = getSelectedShipIds();
    const selectedShips = fleetDetails.ships.filter(ship => 
      selectedShipIds.includes(ship._id)
    );
    
    if (selectedShips.length === 0) return 0;
    
    // Fleet moves at speed of slowest ship
    return Math.min(...selectedShips.map(ship => ship.blueprint?.movementSpeed || 1));
  };

  const calculateTravelTime = () => {
    const speed = getFleetSpeed();
    if (speed === 0) return 0;

    if (!fleetDetails?.currentSystem) return 0;

    // Create current coordinates from fleet details
    const currentCoords: Coordinates = {
      galaxyNumber: fleetDetails.currentSystem.galaxyNumber,
      sectorX: fleetDetails.currentSystem.sectorX,
      sectorY: fleetDetails.currentSystem.sectorY,
      systemX: fleetDetails.currentSystem.systemX,
      systemY: fleetDetails.currentSystem.systemY,
      planetX: fleetDetails.currentPlanetX,
      planetY: fleetDetails.currentPlanetY,
      isAtStar: fleetDetails.currentPlanetX === undefined || fleetDetails.currentPlanetY === undefined
    };

    // Calculate distance using utility function
    const distance = coordinateUtils.calculateDistance(currentCoords, coordinates);

    // Movement time = distance / speed (minimum 1 minute)
    return Math.max(1, distance / speed);
  };

  const formatCurrentLocation = () => {
    if (!fleetDetails?.currentSystem) return 'Unknown';
    
    const coords: Coordinates = {
      galaxyNumber: fleetDetails.currentSystem.galaxyNumber,
      sectorX: fleetDetails.currentSystem.sectorX,
      sectorY: fleetDetails.currentSystem.sectorY,
      systemX: fleetDetails.currentSystem.systemX,
      systemY: fleetDetails.currentSystem.systemY,
      planetX: fleetDetails.currentPlanetX,
      planetY: fleetDetails.currentPlanetY,
      isAtStar: fleetDetails.currentPlanetX === undefined || fleetDetails.currentPlanetY === undefined
    };
    
    return coordinateUtils.format(coords);
  };

  const formatTravelTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleMove = async () => {
    if (getTotalSelectedShips() === 0) {
      toast.error('Please select at least one ship to move');
      return;
    }

    setIsMoving(true);
    try {
      const selectedShipIds = getSelectedShipIds();
      
      const result = await moveFleetWithShips({
        fleetId,
        shipIds: selectedShipIds,
        destinationCoordinates: coordinates
      });

      toast.success(result.message);
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsMoving(false);
    }
  };

  if (!fleetDetails) {
    return null;
  }

  const travelTime = calculateTravelTime();
  const selectedShipCount = getTotalSelectedShips();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Move Fleet: {fleetDetails.name}
          </DialogTitle>
          <DialogDescription>
            Select ships to move and enter destination coordinates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              Current Location
            </div>
            <div className="p-2 bg-muted rounded-md text-sm font-mono">
              {formatCurrentLocation()}
            </div>
          </div>

          {/* Ship Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Ships to Move</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={clearAllShips}>
                  Clear All
                </Button>
                <Button size="sm" variant="outline" onClick={selectAllShips}>
                  Select All
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {shipSelections.map((selection) => (
                <div key={selection.blueprintId} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{selection.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Available: {selection.maxQuantity}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateShipQuantity(selection.blueprintId, selection.quantity - 1)}
                      disabled={selection.quantity === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-8 text-center text-sm font-medium">
                      {selection.quantity}
                    </span>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateShipQuantity(selection.blueprintId, selection.quantity + 1)}
                      disabled={selection.quantity >= selection.maxQuantity}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {selectedShipCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>Selected: {selectedShipCount} ships</span>
                <Badge variant="outline">Speed: {getFleetSpeed()}</Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Destination Coordinates */}
          <CoordinateInput
            coordinates={coordinates}
            onCoordinatesChange={setCoordinates}
            label="Destination Coordinates"
          />

          {/* Travel Time */}
          {selectedShipCount > 0 && travelTime > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                Estimated travel time: <strong>{formatTravelTime(travelTime)}</strong>
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={selectedShipCount === 0 || isMoving}
          >
            {isMoving ? 'Moving...' : `Move ${selectedShipCount} Ships`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}