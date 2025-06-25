import { useMutation } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { BaseDetails } from '@/features/bases/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useState } from 'react'; // Added import for useState
import { Id } from '@cvx/_generated/dataModel';

export function BaseStructuresTab({ base }: { base: BaseDetails }) {
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const startUpgrade = useMutation(
    api.game.bases.baseMutations.startStructureUpgrade
  );

  const handleUpgrade = async (structureId: string) => {
    setIsUpgrading(structureId);
    try {
      await startUpgrade({ structureId: structureId as Id<'baseStructures'> });
    } catch (error) {
      console.error('Failed to start upgrade:', error);
      // TODO: Show a toast notification to the user
    } finally {
      setIsUpgrading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {base.structures.map((structure) => {
        if (!structure.definition) return null;
        const isButtonDisabled = structure.upgrading || isUpgrading !== null;
        return (
          <Card key={structure._id}>
            <CardHeader>
              <CardTitle>
                {structure.definition.name} (Level {structure.level})
              </CardTitle>
              <CardDescription>
                {structure.definition.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div>
                <h4 className="font-semibold">Effects</h4>
                <p className="text-sm text-muted-foreground">
                  {structure.definition.effects}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Upgrade Benefits</h4>
                <p className="text-sm text-muted-foreground">
                  {structure.definition.upgradeBenefits}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Costs</h4>
                <p className="text-sm text-muted-foreground">
                  Space: {structure.definition.baseSpaceCost}, Energy:{' '}
                  {structure.definition.baseEnergyCost}, Nova:{' '}
                  {structure.definition.baseNovaCost}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  {structure.definition.researchRequirementName}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleUpgrade(structure._id)}
                disabled={isButtonDisabled}
              >
                {structure.upgrading
                  ? `Upgrading to ${structure.upgradeLevel}`
                  : isUpgrading === structure._id
                    ? 'Starting...'
                    : 'Upgrade'}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
