import { useMutation, useQuery } from 'convex/react';
import { useState, useEffect } from 'react';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research & Development</CardTitle>
        {researchingTech && researchFinishesAt && (
          <div className="mt-2">
            <p className="font-semibold">
              Currently researching: {researchingTech.name}
            </p>
            <ResearchTimer
              finishesAt={researchFinishesAt}
              onComplete={handleCompleteResearch}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Technology</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technologies.map((tech) => (
              <TableRow key={tech._id}>
                <TableCell>{tech.name}</TableCell>
                <TableCell>{tech.description}</TableCell>
                <TableCell>{tech.tier}</TableCell>
                <TableCell>{tech.category}</TableCell>
                <TableCell>
                  {researchingId === tech._id
                    ? 'Researching'
                    : tech.isResearched
                    ? 'Researched'
                    : 'Available'}
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleResearch(tech._id)}
                    disabled={
                      tech.isResearched ||
                      isCurrentlyResearching ||
                      isResearching
                    }
                  >
                    {tech.isResearched ? 'Completed' : 'Research'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
