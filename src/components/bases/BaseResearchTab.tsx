import { useMutation, useQuery } from 'convex/react';
import { useState, useEffect } from 'react';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

function ResearchTimer({
  finishesAt,
  onComplete,
}: {
  finishesAt: number;
  onComplete: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.floor((finishesAt - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [finishesAt, timeLeft, onComplete]);

  return (
    <span className="text-sm text-muted-foreground">
      Time remaining: {formatTime(timeLeft)}
    </span>
  );
}

type SortOption = 'category' | 'name' | 'tier';

export function BaseResearchTab() {
  const [isResearching, setIsResearching] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [showLockedTechs, setShowLockedTechs] = useState(false);
  const playerTechData = useQuery(
    api.game.research.researchQueries.getPlayerTechnologies,
  );
  const startResearch = useMutation(
    api.game.research.researchMutations.startResearch,
  );
  const completeResearch = useMutation(
    api.game.research.researchMutations.completeResearch,
  );

  const handleResearch = async (researchId: Id<'researchDefinitions'>) => {
    setIsResearching(true);
    try {
      await startResearch({ researchId });
      toast.success('Research started!');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsResearching(false);
    }
  };

  const handleCompleteResearch = async () => {
    try {
      await completeResearch({});
      toast.success('Research complete!');
    } catch (error) {
      // This might fail if another client already completed it.
      // We can ignore the error or log it for debugging.
      console.error('Failed to complete research:', error);
    }
  };

  if (!playerTechData) {
    return <div>Loading...</div>;
  }

  const { technologies, researchingId, researchFinishesAt } = playerTechData;
  const isCurrentlyResearching =
    researchingId !== null && researchingId !== undefined;
  const researchingTech = isCurrentlyResearching
    ? technologies.find((tech) => tech._id === researchingId)
    : null;

  // Check if a technology's requirements are met
  const canResearchTech = (tech: typeof technologies[0]) => {
    // Tier 1 technologies have no requirements
    if (tech.tier === 1) {
      return true;
    }

    // For higher tiers, all technologies of the previous tier in the same category must be researched
    const previousTier = tech.tier - 1;
    const previousTierTechs = technologies.filter(
      (t) => t.category === tech.category && t.tier === previousTier
    );

    // If there are no previous tier techs in this category, allow research
    if (previousTierTechs.length === 0) {
      return true;
    }

    // All previous tier techs in the same category must be researched
    return previousTierTechs.every((t) => t.isResearched);
  };

  // Filter technologies based on locked toggle
  const filteredTechnologies = showLockedTechs 
    ? technologies 
    : technologies.filter(tech => 
        tech.isResearched ||                    // Show completed research
        canResearchTech(tech) ||               // Show available research  
        researchingId === tech._id             // Show currently researching (even if would be locked)
      );

  const hiddenCount = technologies.length - filteredTechnologies.length;

  // Sort technologies based on selected option
  const sortedTechnologies = [...filteredTechnologies].sort((a, b) => {
    switch (sortBy) {
      case 'category':
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        // Secondary sort by tier, then name
        if (a.tier !== b.tier) {
          return a.tier - b.tier;
        }
        return a.name.localeCompare(b.name);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'tier':
        if (a.tier !== b.tier) {
          return a.tier - b.tier;
        }
        // Secondary sort by category, then name
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const getStatusBadge = (tech: typeof technologies[0]) => {
    if (researchingId === tech._id) {
      return <Badge variant="default">Researching</Badge>;
    } else if (tech.isResearched) {
      return <Badge variant="secondary">Completed</Badge>;
    } else if (!canResearchTech(tech)) {
      return <Badge variant="destructive">Locked</Badge>;
    } else {
      return <Badge variant="outline">Available</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Research Status */}
      {researchingTech && researchFinishesAt && (
        <Card>
          <CardHeader>
            <CardTitle>Current Research</CardTitle>
            <div className="mt-2">
              <p className="font-semibold">
                Currently researching: {researchingTech.name}
              </p>
              <ResearchTimer
                finishesAt={researchFinishesAt}
                onComplete={handleCompleteResearch}
              />
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Desktop row view */}
      <div className="hidden md:block">
        <div className="space-y-3">
            <div className="flex items-center gap-2 ml-4">
              <Switch
                id="show-locked"
                checked={showLockedTechs}
                onCheckedChange={setShowLockedTechs}
              />
              <Label htmlFor="show-locked" className="text-sm">
                Show locked {!showLockedTechs && hiddenCount > 0 && `(${hiddenCount} hidden)`}
              </Label>
            </div>
          <div className="flex items-center justify-between px-4 py-2">
            <div className="grid grid-cols-6 gap-4 flex-1 text-sm font-medium text-muted-foreground">
              <button 
                className={`text-left hover:text-foreground transition-colors ${sortBy === 'name' ? 'text-foreground' : ''}`}
                onClick={() => setSortBy('name')}
              >
                Technology {sortBy === 'name' && '↓'}
              </button>
              <div>Description</div>
              <button 
                className={`text-left hover:text-foreground transition-colors ${sortBy === 'tier' ? 'text-foreground' : ''}`}
                onClick={() => setSortBy('tier')}
              >
                Tier {sortBy === 'tier' && '↓'}
              </button>
              <button 
                className={`text-left hover:text-foreground transition-colors ${sortBy === 'category' ? 'text-foreground' : ''}`}
                onClick={() => setSortBy('category')}
              >
                Category {sortBy === 'category' && '↓'}
              </button>
              <div>Status</div>
              <div className="text-right">Action</div>
            </div>
          </div>
          {sortedTechnologies.map((tech) => (
            <div 
              key={tech._id}
              className="grid grid-cols-6 gap-4 p-4 bg-card border rounded-lg items-center"
            >
              <div>
                <div className="font-medium">{tech.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{tech.description}</div>
                {!canResearchTech(tech) && tech.tier > 1 && (
                  <div className="text-xs text-red-500 mt-1">
                    Requires all Tier {tech.tier - 1} {tech.category} technologies
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm">{tech.tier}</div>
              </div>
              <div>
                <div className="text-sm">{tech.category}</div>
              </div>
              <div>
                {getStatusBadge(tech)}
              </div>
              <div className="text-right">
                <Button
                  size="sm"
                  onClick={() => handleResearch(tech._id)}
                  disabled={
                    tech.isResearched ||
                    isCurrentlyResearching ||
                    isResearching ||
                    !canResearchTech(tech)
                  }
                  variant={tech.isResearched ? 'secondary' : 'default'}
                >
                  {tech.isResearched 
                    ? 'Completed' 
                    : !canResearchTech(tech) 
                      ? 'Locked' 
                      : 'Research'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile list view */}
      <div className="block md:hidden space-y-3">
        {/* Mobile sorting controls */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">Sort by:</span>
            <button 
              className={`px-3 py-1 rounded text-sm transition-colors ${sortBy === 'name' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              onClick={() => setSortBy('name')}
            >
              Name {sortBy === 'name' && '↓'}
            </button>
            <button 
              className={`px-3 py-1 rounded text-sm transition-colors ${sortBy === 'tier' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              onClick={() => setSortBy('tier')}
            >
              Tier {sortBy === 'tier' && '↓'}
            </button>
            <button 
              className={`px-3 py-1 rounded text-sm transition-colors ${sortBy === 'category' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              onClick={() => setSortBy('category')}
            >
              Category {sortBy === 'category' && '↓'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-locked-mobile"
              checked={showLockedTechs}
              onCheckedChange={setShowLockedTechs}
            />
            <Label htmlFor="show-locked-mobile" className="text-sm">
              Show locked technologies {!showLockedTechs && hiddenCount > 0 && `(${hiddenCount} hidden)`}
            </Label>
          </div>
        </div>
        
        {sortedTechnologies.map((tech) => (
          <div 
            key={tech._id} 
            className="border rounded-lg p-4 bg-card"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium">{tech.name}</h3>
                <p className="text-sm text-muted-foreground">{tech.description}</p>
                {!canResearchTech(tech) && tech.tier > 1 && (
                  <p className="text-xs text-red-500 mt-1">
                    Requires all Tier {tech.tier - 1} {tech.category} technologies
                  </p>
                )}
              </div>
              <div className="ml-2">
                {getStatusBadge(tech)}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Tier:</span> {tech.tier}
              </div>
              <div>
                <span className="font-medium">Category:</span> {tech.category}
              </div>
            </div>
            
            <div className="mt-4">
              <Button
                className="w-full"
                onClick={() => handleResearch(tech._id)}
                disabled={
                  tech.isResearched ||
                  isCurrentlyResearching ||
                  isResearching ||
                  !canResearchTech(tech)
                }
                variant={tech.isResearched ? 'secondary' : 'default'}
              >
                {tech.isResearched 
                  ? 'Completed' 
                  : !canResearchTech(tech) 
                    ? 'Locked' 
                    : 'Research'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
