import { useMutation, useQuery } from 'convex/react';
import { useState, useEffect } from 'react';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export function BaseResearchTab() {
  const [isResearching, setIsResearching] = useState(false);
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

  const getStatusBadge = (tech: any) => {
    if (researchingId === tech._id) {
      return <Badge variant="default">Researching</Badge>;
    } else if (tech.isResearched) {
      return <Badge variant="secondary">Completed</Badge>;
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
          <div className="grid grid-cols-6 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
            <div>Technology</div>
            <div>Description</div>
            <div>Tier</div>
            <div>Category</div>
            <div>Status</div>
            <div className="text-right">Action</div>
          </div>
          {technologies.map((tech) => (
            <div 
              key={tech._id}
              className="grid grid-cols-6 gap-4 p-4 bg-card border rounded-lg items-center"
            >
              <div>
                <div className="font-medium">{tech.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{tech.description}</div>
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
                    isResearching
                  }
                  variant={tech.isResearched ? 'secondary' : 'default'}
                >
                  {tech.isResearched ? 'Completed' : 'Research'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile list view */}
      <div className="block md:hidden space-y-3">
        {technologies.map((tech) => (
          <div 
            key={tech._id} 
            className="border rounded-lg p-4 bg-card"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium">{tech.name}</h3>
                <p className="text-sm text-muted-foreground">{tech.description}</p>
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
                  isResearching
                }
                variant={tech.isResearched ? 'secondary' : 'default'}
              >
                {tech.isResearched ? 'Completed' : 'Research'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
