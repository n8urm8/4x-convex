/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TabsContent } from '@/components/ui/tabs';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { useMutation, useQuery } from '@tanstack/react-query';

interface AdminSystemsTabProps {
  selectedGalaxyId: Id<'galaxies'> | null;
  selectedSectorId: Id<'galaxySectors'> | null;
  setSelectedSectorId: (id: Id<'galaxySectors'>) => void;
  densityMultiplier: number;
}

export const AdminSystemsTab = ({
  selectedGalaxyId,
  selectedSectorId,
  setSelectedSectorId,
  densityMultiplier
}: AdminSystemsTabProps) => {
  // Query to get all galaxies
  const { data: allGalaxies = [] } = useQuery(
    convexQuery(api.game.map.galaxyQueries.getAllGalaxies, {})
  );
  // Find the selected galaxy
  const selectedGalaxy = selectedGalaxyId
    ? allGalaxies.find((g) => g._id === selectedGalaxyId)
    : null;
  // Query to get systems for selected sector
  const sectorSystemsArgs = selectedSectorId
    ? { sectorId: selectedSectorId }
    : 'skip';

  const { data: sectorSystems = [] } = useQuery(
    // @ts-expect-error The convexQuery helper type inference struggles with the 'skip' token
    // when the underlying Convex query has mandatory arguments. However, 'skip' is the
    // intended mechanism for conditional queries with TanStack Query via this helper.
    convexQuery(api.game.map.galaxyQueries.getSectorSystems, sectorSystemsArgs)
  );

  const generateSystemPlanetsMutation = useMutation({
    mutationFn: useConvexMutation(
      api.game.map.galaxyGeneration.generateSystemPlanets
    )
  });

  // Handle generating planets for a system
  const handleGenerateSystemPlanets = async (systemId: Id<'sectorSystems'>) => {
    try {
      await generateSystemPlanetsMutation.mutateAsync({ systemId });
    } catch (error) {
      console.error('Failed to generate system planets:', error);
    }
  };

  const generateSectorSystemsMutation = useMutation({
    mutationFn: useConvexMutation(
      api.game.map.galaxyGeneration.generateSectorSystems
    )
  });
  // Handle generating systems for a sector
  const handleGenerateSectorSystems = async (sectorId: Id<'galaxySectors'>) => {
    try {
      await generateSectorSystemsMutation.mutateAsync({
        sectorId,
        densityMultiplier
      });
      setSelectedSectorId(sectorId);
    } catch (error) {
      console.error('Failed to generate sector systems:', error);
    }
  };

  // if (!sectorSystems) {
  //   return null;
  // }

  return (
    <TabsContent value="systems" className="space-y-4">
      {!selectedSectorId ? (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <p className="text-gray-500">
            Select a sector first to view star systems
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              (
                document.querySelector(
                  'button[value="sectors"]'
                ) as HTMLButtonElement
              )?.click()
            }
          >
            Go to Sectors Tab
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {/* Need sector info */}
              Systems in Sector ({sectorSystems[0].systemX},{' '}
              {sectorSystems[0].systemY})
            </h2>
            <Button
              variant="outline"
              onClick={() =>
                (
                  document.querySelector(
                    'button[value="sectors"]'
                  ) as HTMLButtonElement
                )?.click()
              }
            >
              Back to Sectors
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sector Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Galaxy</Label>
                  <div className="font-medium">
                    #{selectedGalaxy?.number} ({selectedGalaxy?.groupId})
                  </div>
                </div>
                <div>
                  <Label>Total Systems</Label>
                  <div className="font-medium">{sectorSystems.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectorSystems.map((system) => (
              <Card key={system._id.toString()}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    <span>{system.starType}</span>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: system.starColor }}
                    ></div>
                  </CardTitle>
                  <CardDescription>
                    Position: ({system.systemX}, {system.systemY})
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Star Size:</span>
                      <span className="font-medium">
                        {system.starSize.toFixed(1)}
                      </span>
                    </div>

                    <Separator />

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      disabled={
                        generateSystemPlanetsMutation.isPending &&
                        generateSystemPlanetsMutation.variables?.systemId ===
                          system._id
                      }
                      onClick={() => handleGenerateSystemPlanets(system._id)}
                    >
                      {generateSystemPlanetsMutation.isPending &&
                      generateSystemPlanetsMutation.variables?.systemId ===
                        system._id
                        ? 'Generating...'
                        : 'Generate Planets'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sectorSystems.length === 0 && (
            <div className="text-center py-10 border rounded-lg bg-gray-50">
              <p className="text-gray-500">
                No systems generated for this sector yet
              </p>
              <Button
                className="mt-4"
                disabled={generateSectorSystemsMutation.isPending}
                onClick={() => handleGenerateSectorSystems(selectedSectorId)}
              >
                {generateSectorSystemsMutation.isPending
                  ? 'Generating...'
                  : 'Generate Systems'}
              </Button>
            </div>
          )}
        </>
      )}
    </TabsContent>
  );
};
