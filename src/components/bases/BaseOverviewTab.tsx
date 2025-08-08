import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { BaseDetails } from '@/features/bases/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getPlanetImage } from '@/lib/planet-images';
import { Clock, MapPin, Zap, Box, Wrench, Rocket, FlaskConical, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

function CountdownTimer({ finishesAt, onComplete }: { finishesAt: number; onComplete?: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((finishesAt - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0 && onComplete) {
        onComplete();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [finishesAt, onComplete]);

  if (timeLeft === 0) return <span className="text-green-600">Complete!</span>;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <span className="font-mono text-sm">
      {hours > 0 ? `${hours}:` : ''}{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </span>
  );
}

export function BaseOverviewTab({ base }: { base: BaseDetails }) {
  const { data: overviewData } = useQuery({
    ...convexQuery(api.game.bases.baseQueries.getBaseOverview, {
      baseId: base._id,
    }),
  });

  if (!overviewData) {
    return <div>Loading overview...</div>;
  }

  const { planet, planetType, upgradingStructures, recentShips, currentResearch } = overviewData;

  // Calculate resource production per hour
  const productionBonus = 1 + (base.allProductionBonus / 100);
  const novaPerHour = Math.round(base.novaPerCycle * productionBonus);
  const mineralsPerHour = Math.round(base.mineralsPerCycle * productionBonus);
  const volatilesPerHour = Math.round(base.volatilesPerCycle * productionBonus);
  const researchPerHour = Math.round(base.researchPerCycle * (1 + base.researchSpeed / 100));

  // Calculate usage percentages
  const energyPercentage = (base.usedEnergy / base.totalEnergy) * 100;
  const spacePercentage = (base.usedSpace / base.totalSpace) * 100;

  // Get planet image
  const planetImageUrl = planetType 
    ? getPlanetImage(planetType.name)
    : '/src/assets/planets/Planets_Rocky_01_560x560.png';

  return (
    <div className="space-y-6">
      {/* Planet and Location Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Planet Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={planetImageUrl}
                alt={planetType?.name || 'Planet'}
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
              />
            </div>
            <div className="flex-1 space-y-2">
    <div>
                <h3 className="font-medium">{planetType?.name || 'Unknown Planet'}</h3>
                <p className="text-sm text-muted-foreground">{planetType?.description}</p>
              </div>
              <div className="text-sm">
                <div><strong>Location:</strong> G{base.galaxyNumber}-S{base.sectorX}.{base.sectorY}-S{base.systemX}.{base.systemY}-P{base.planetX}.{base.planetY}</div>
                {planetType && (
                  <div className="mt-1">
                    <strong>Planet Bonuses:</strong> Space +{planetType.space}, Energy +{planetType.energy}, 
                    Minerals +{planetType.minerals}/h, Volatiles +{planetType.volatiles}/h
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Energy Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span>{base.usedEnergy} / {base.totalEnergy}</span>
              </div>
              <Progress value={energyPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {energyPercentage.toFixed(1)}% used
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Space Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span>{base.usedSpace} / {base.totalSpace}</span>
              </div>
              <Progress value={spacePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {spacePercentage.toFixed(1)}% used
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Production */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resource Production (per hour)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-yellow-600">{novaPerHour.toLocaleString()}</div>
              <div className="text-muted-foreground">Nova</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-600">{mineralsPerHour.toLocaleString()}</div>
              <div className="text-muted-foreground">Minerals</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-purple-600">{volatilesPerHour.toLocaleString()}</div>
              <div className="text-muted-foreground">Volatiles</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">{researchPerHour.toLocaleString()}</div>
              <div className="text-muted-foreground">Research</div>
            </div>
          </div>
          {base.allProductionBonus > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Production bonus: +{base.allProductionBonus}%
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upgrading Structures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Upgrading Structures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upgradingStructures.length > 0 ? (
              <div className="space-y-3">
                {upgradingStructures.map((structure) => (
                  <div key={structure._id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">{structure.definition?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Level {structure.level} → {structure.upgradeLevel}
                      </div>
                    </div>
                    <div className="text-right">
                      {structure.upgradeCompleteTime && (
                        <CountdownTimer finishesAt={structure.upgradeCompleteTime} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No structures currently upgrading</p>
            )}
          </CardContent>
        </Card>

        {/* Current Research */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Current Research
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentResearch ? (
              <div className="p-2 bg-muted/50 rounded">
                <div className="font-medium">{currentResearch.definition?.name}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  {currentResearch.definition?.description}
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="default">Researching</Badge>
                  <CountdownTimer finishesAt={currentResearch.finishesAt} />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No active research</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Ships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Recent Ships Built
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentShips.length > 0 ? (
            <div className="space-y-2">
              {recentShips.map((ship, index) => (
                <div key={ship._id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <div className="font-medium">{ship.blueprintId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    <div className="text-sm text-muted-foreground">
                      DMG: {ship.damage} | DEF: {ship.defense} | SHD: {ship.shielding}
                    </div>
                  </div>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No ships built yet</p>
          )}
        </CardContent>
      </Card>

      {/* Base Bonuses */}
      {(base.buildTimeReduction > 0 || base.shipProductionSpeed > 0 || base.defenseBonus > 0 || base.researchSpeed > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Base Bonuses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {base.buildTimeReduction > 0 && (
                <div className="text-center">
                  <div className="font-medium text-orange-600">-{base.buildTimeReduction}%</div>
                  <div className="text-muted-foreground">Build Time</div>
                </div>
              )}
              {base.shipProductionSpeed > 0 && (
                <div className="text-center">
                  <div className="font-medium text-blue-600">+{base.shipProductionSpeed}%</div>
                  <div className="text-muted-foreground">Ship Production</div>
                </div>
              )}
              {base.defenseBonus > 0 && (
                <div className="text-center">
                  <div className="font-medium text-red-600">+{base.defenseBonus}%</div>
                  <div className="text-muted-foreground">Defense</div>
                </div>
              )}
              {base.researchSpeed > 0 && (
                <div className="text-center">
                  <div className="font-medium text-green-600">+{base.researchSpeed}%</div>
                  <div className="text-muted-foreground">Research Speed</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
