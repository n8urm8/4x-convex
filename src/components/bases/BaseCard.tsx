import { Link } from '@tanstack/react-router';
import { Doc } from '@cvx/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Zap, Box, Wrench } from 'lucide-react';
import { getPlanetImage } from '@/lib/planet-images';

type BaseWithUpgrades = Doc<'playerBases'> & {
  upgradingStructures: Doc<'baseStructures'>[];
  planet: Doc<'systemPlanets'> | null;
  planetType: Doc<'planetTypes'> | null;
};

interface BaseCardProps {
  base: BaseWithUpgrades;
}

export function BaseCard({ base }: BaseCardProps) {
  const energyPercentage = (base.usedEnergy / base.totalEnergy) * 100;
  const spacePercentage = (base.usedSpace / base.totalSpace) * 100;
  
  // Get planet image
  const planetImageUrl = base.planetType 
    ? getPlanetImage(base.planetType.name)
    : '/src/assets/planets/Planets_Rocky_01_560x560.png'; // fallback

  return (
    <Link
      to="/game/bases/$baseId"
      params={{ baseId: base._id }}
      className="block transition-transform hover:scale-105"
    >
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3 mb-2">
            <div className="relative flex-shrink-0">
              <img
                src={planetImageUrl}
                alt={base.planetType?.name || 'Planet'}
                className="w-12 h-12 rounded-full object-cover border-2 border-border"
              />
              {base.planetType && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background border border-border rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold text-foreground mb-1">
                {base.name}
              </CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">
                  G{base.galaxyNumber}-S{base.sectorX}.{base.sectorY}-S{base.systemX}.{base.systemY}-P{base.planetX}.{base.planetY}
                </span>
              </div>
              {base.planetType && (
                <div className="text-xs text-muted-foreground mt-1">
                  {base.planetType.name}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Energy Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                <span className="font-medium">Energy</span>
              </div>
              <span className="text-muted-foreground">
                {base.usedEnergy} / {base.totalEnergy}
              </span>
            </div>
            <Progress 
              value={energyPercentage} 
              className="h-2"
              style={{
                background: energyPercentage > 90 ? 'hsl(var(--destructive))' : 
                           energyPercentage > 75 ? 'hsl(var(--warning))' : 
                           'hsl(var(--muted))'
              }}
            />
          </div>

          {/* Space Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Box className="w-4 h-4 mr-1 text-blue-500" />
                <span className="font-medium">Space</span>
              </div>
              <span className="text-muted-foreground">
                {base.usedSpace} / {base.totalSpace}
              </span>
            </div>
            <Progress 
              value={spacePercentage} 
              className="h-2"
              style={{
                background: spacePercentage > 90 ? 'hsl(var(--destructive))' : 
                           spacePercentage > 75 ? 'hsl(var(--warning))' : 
                           'hsl(var(--muted))'
              }}
            />
          </div>

          {/* Upgrades in Progress */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Wrench className="w-4 h-4 mr-1 text-orange-500" />
              <span className="text-sm font-medium">Upgrades</span>
            </div>
            {base.upgradingStructures.length > 0 ? (
              <div className="space-y-1">
                {base.upgradingStructures.slice(0, 2).map((structure) => (
                  <Badge 
                    key={structure._id} 
                    variant="secondary" 
                    className="text-xs block w-fit"
                  >
                    Upgrading to Level {structure.upgradeLevel}
                  </Badge>
                ))}
                {base.upgradingStructures.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{base.upgradingStructures.length - 2} more
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No active upgrades</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 