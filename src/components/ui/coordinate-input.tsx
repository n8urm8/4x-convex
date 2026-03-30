import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Copy, 
  Clipboard,
  MapPin,
  Star,
  Globe
} from 'lucide-react';

export interface Coordinates {
  galaxyNumber: number;
  sectorX: number;
  sectorY: number;
  systemX: number;
  systemY: number;
  planetX?: number;
  planetY?: number;
  isAtStar?: boolean;
}

interface CoordinateInputProps {
  coordinates: Coordinates;
  onCoordinatesChange: (coordinates: Coordinates) => void;
  label?: string;
  className?: string;
}

export function CoordinateInput({ 
  coordinates, 
  onCoordinatesChange, 
  label = "Coordinates",
  className = "" 
}: CoordinateInputProps) {
  const [pasteInput, setPasteInput] = useState('');
  const [destinationType, setDestinationType] = useState<'star' | 'planet'>(
    coordinates.isAtStar !== false ? 'star' : 'planet'
  );

  // Update destination type when coordinates change
  useEffect(() => {
    setDestinationType(coordinates.isAtStar !== false ? 'star' : 'planet');
  }, [coordinates.isAtStar]);

  const formatCoordinates = (coords: Coordinates): string => {
    const base = `G${coords.galaxyNumber}-S${coords.sectorX}.${coords.sectorY}-Sys${coords.systemX}.${coords.systemY}`;
    
    if (coords.isAtStar !== false) {
      return `${base}-Star`;
    } else if (coords.planetX !== undefined && coords.planetY !== undefined) {
      return `${base}-P${coords.planetX}.${coords.planetY}`;
    }
    
    return `${base}-Star`;
  };

  const parseCoordinates = (input: string): Coordinates | null => {
    try {
      // Remove whitespace and convert to lowercase for parsing
      const clean = input.trim().toLowerCase();

      // Format 1: Full coordinate string (G1-S5.3-Sys2.7-P1.4 or G1-S5.3-Sys2.7-Star)
      const fullMatch = clean.match(/g(\d+)-s(\d+)\.(\d+)-sys(\d+)\.(\d+)(?:-(?:p(\d+)\.(\d+)|star))?/);
      if (fullMatch) {
        const [, galaxy, sectorX, sectorY, systemX, systemY, planetX, planetY] = fullMatch;
        const isAtStar = !planetX || !planetY;
        
        return {
          galaxyNumber: parseInt(galaxy),
          sectorX: parseInt(sectorX),
          sectorY: parseInt(sectorY),
          systemX: parseInt(systemX),
          systemY: parseInt(systemY),
          planetX: isAtStar ? undefined : parseInt(planetX),
          planetY: isAtStar ? undefined : parseInt(planetY),
          isAtStar
        };
      }

      // Format 2: Comma or space separated numbers
      const numbers = clean.split(/[,\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      
      if (numbers.length >= 5) {
        const [galaxy, sectorX, sectorY, systemX, systemY, planetX, planetY] = numbers;
        const hasPlaneCoords = numbers.length >= 7 && planetX !== undefined && planetY !== undefined;
        
        return {
          galaxyNumber: galaxy,
          sectorX,
          sectorY,
          systemX,
          systemY,
          planetX: hasPlaneCoords ? planetX : undefined,
          planetY: hasPlaneCoords ? planetY : undefined,
          isAtStar: !hasPlaneCoords
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const handlePaste = () => {
    const parsed = parseCoordinates(pasteInput);
    if (parsed) {
      onCoordinatesChange(parsed);
      setPasteInput('');
      toast.success('Coordinates parsed successfully!');
    } else {
      toast.error('Invalid coordinate format. Try: G1-S5.3-Sys2.7-P1.4 or 1,5,3,2,7,1,4');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatCoordinates(coordinates));
      toast.success('Coordinates copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy coordinates');
    }
  };

  const updateCoordinate = (field: keyof Coordinates, value: number | boolean | undefined) => {
    onCoordinatesChange({
      ...coordinates,
      [field]: value
    });
  };

  const toggleDestinationType = (type: 'star' | 'planet') => {
    setDestinationType(type);
    if (type === 'star') {
      onCoordinatesChange({
        ...coordinates,
        planetX: undefined,
        planetY: undefined,
        isAtStar: true
      });
    } else {
      onCoordinatesChange({
        ...coordinates,
        planetX: coordinates.planetX || 1,
        planetY: coordinates.planetY || 1,
        isAtStar: false
      });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {formatCoordinates(coordinates)}
          </Badge>
          <Button size="sm" variant="ghost" onClick={handleCopy}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Paste Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Paste coordinates (G1-S5.3-Sys2.7-P1.4 or 1,5,3,2,7,1,4)"
          value={pasteInput}
          onChange={(e) => setPasteInput(e.target.value)}
          className="flex-1"
        />
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handlePaste}
          disabled={!pasteInput.trim()}
        >
          <Clipboard className="h-3 w-3 mr-1" />
          Parse
        </Button>
      </div>

      {/* Manual Input */}
      <div className="space-y-3">
        {/* Galaxy and Sector */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="galaxy" className="text-xs">Galaxy</Label>
            <Input
              id="galaxy"
              type="number"
              min="1"
              value={coordinates.galaxyNumber}
              onChange={(e) => updateCoordinate('galaxyNumber', parseInt(e.target.value) || 1)}
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="sectorX" className="text-xs">Sector X</Label>
            <Input
              id="sectorX"
              type="number"
              min="1"
              value={coordinates.sectorX}
              onChange={(e) => updateCoordinate('sectorX', parseInt(e.target.value) || 1)}
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="sectorY" className="text-xs">Sector Y</Label>
            <Input
              id="sectorY"
              type="number"
              min="1"
              value={coordinates.sectorY}
              onChange={(e) => updateCoordinate('sectorY', parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        {/* System */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="systemX" className="text-xs">System X</Label>
            <Input
              id="systemX"
              type="number"
              min="1"
              value={coordinates.systemX}
              onChange={(e) => updateCoordinate('systemX', parseInt(e.target.value) || 1)}
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="systemY" className="text-xs">System Y</Label>
            <Input
              id="systemY"
              type="number"
              min="1"
              value={coordinates.systemY}
              onChange={(e) => updateCoordinate('systemY', parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        {/* Destination Type */}
        <div className="space-y-2">
          <Label className="text-xs">Destination Type</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={destinationType === 'star' ? 'default' : 'outline'}
              onClick={() => toggleDestinationType('star')}
              className="flex-1"
            >
              <Star className="h-3 w-3 mr-1" />
              Star
            </Button>
            <Button
              size="sm"
              variant={destinationType === 'planet' ? 'default' : 'outline'}
              onClick={() => toggleDestinationType('planet')}
              className="flex-1"
            >
              <Globe className="h-3 w-3 mr-1" />
              Planet
            </Button>
          </div>
        </div>

        {/* Planet Coordinates */}
        {destinationType === 'planet' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="planetX" className="text-xs">Planet X</Label>
              <Input
                id="planetX"
                type="number"
                min="1"
                value={coordinates.planetX || 1}
                onChange={(e) => updateCoordinate('planetX', parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="planetY" className="text-xs">Planet Y</Label>
              <Input
                id="planetY"
                type="number"
                min="1"
                value={coordinates.planetY || 1}
                onChange={(e) => updateCoordinate('planetY', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Current Coordinate Display */}
      <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
        <MapPin className="h-4 w-4" />
        <span className="font-mono">{formatCoordinates(coordinates)}</span>
      </div>
    </div>
  );
}

// Utility functions for external use
export const coordinateUtils = {
  format: (coordinates: Coordinates): string => {
    const base = `G${coordinates.galaxyNumber}-S${coordinates.sectorX}.${coordinates.sectorY}-Sys${coordinates.systemX}.${coordinates.systemY}`;
    
    if (coordinates.isAtStar !== false) {
      return `${base}-Star`;
    } else if (coordinates.planetX !== undefined && coordinates.planetY !== undefined) {
      return `${base}-P${coordinates.planetX}.${coordinates.planetY}`;
    }
    
    return `${base}-Star`;
  },

  parse: (input: string): Coordinates | null => {
    try {
      const clean = input.trim().toLowerCase();

      const fullMatch = clean.match(/g(\d+)-s(\d+)\.(\d+)-sys(\d+)\.(\d+)(?:-(?:p(\d+)\.(\d+)|star))?/);
      if (fullMatch) {
        const [, galaxy, sectorX, sectorY, systemX, systemY, planetX, planetY] = fullMatch;
        const isAtStar = !planetX || !planetY;
        
        return {
          galaxyNumber: parseInt(galaxy),
          sectorX: parseInt(sectorX),
          sectorY: parseInt(sectorY),
          systemX: parseInt(systemX),
          systemY: parseInt(systemY),
          planetX: isAtStar ? undefined : parseInt(planetX),
          planetY: isAtStar ? undefined : parseInt(planetY),
          isAtStar
        };
      }

      const numbers = clean.split(/[,\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      
      if (numbers.length >= 5) {
        const [galaxy, sectorX, sectorY, systemX, systemY, planetX, planetY] = numbers;
        const hasPlaneCoords = numbers.length >= 7 && planetX !== undefined && planetY !== undefined;
        
        return {
          galaxyNumber: galaxy,
          sectorX,
          sectorY,
          systemX,
          systemY,
          planetX: hasPlaneCoords ? planetX : undefined,
          planetY: hasPlaneCoords ? planetY : undefined,
          isAtStar: !hasPlaneCoords
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  },

  calculateDistance: (from: Coordinates, to: Coordinates): number => {
    // Cross-galaxy movement
    if (from.galaxyNumber !== to.galaxyNumber) {
      return 1000;
    }

    // Cross-sector movement
    if (from.sectorX !== to.sectorX || from.sectorY !== to.sectorY) {
      const sectorDistance = Math.sqrt(
        Math.pow(to.sectorX - from.sectorX, 2) + Math.pow(to.sectorY - from.sectorY, 2)
      );
      const systemDistance = Math.sqrt(
        Math.pow(to.systemX - from.systemX, 2) + Math.pow(to.systemY - from.systemY, 2)
      );
      
      let planetDistance = 0;
      if (from.planetX !== undefined && from.planetY !== undefined && 
          to.planetX !== undefined && to.planetY !== undefined) {
        planetDistance = Math.sqrt(
          Math.pow(to.planetX - from.planetX, 2) + Math.pow(to.planetY - from.planetY, 2)
        );
      }
      
      return (sectorDistance * 100) + systemDistance + (planetDistance * 0.1);
    }

    // Same sector movement
    if (from.systemX !== to.systemX || from.systemY !== to.systemY) {
      const systemDistance = Math.sqrt(
        Math.pow(to.systemX - from.systemX, 2) + Math.pow(to.systemY - from.systemY, 2)
      );
      
      let planetDistance = 0;
      if (from.planetX !== undefined && from.planetY !== undefined && 
          to.planetX !== undefined && to.planetY !== undefined) {
        planetDistance = Math.sqrt(
          Math.pow(to.planetX - from.planetX, 2) + Math.pow(to.planetY - from.planetY, 2)
        );
      }
      
      return systemDistance + (planetDistance * 0.1);
    }

    // Same system movement (planet to planet)
    if (from.planetX !== undefined && from.planetY !== undefined && 
        to.planetX !== undefined && to.planetY !== undefined) {
      const planetDistance = Math.sqrt(
        Math.pow(to.planetX - from.planetX, 2) + Math.pow(to.planetY - from.planetY, 2)
      );
      return planetDistance * 0.1;
    }

    // Same location
    return 0;
  }
};