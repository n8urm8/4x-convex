/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { TabsContent } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  convexQuery,
  useConvexAction,
  useConvexMutation
} from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface AdminSectorsTabProps {
  selectedGalaxyId: Id<'galaxies'> | null;
  selectedSectorId: Id<'galaxySectors'> | null;
  setSelectedSectorId: (id: Id<'galaxySectors'>) => void;
  densityMultiplier: number;
  setDensityMultiplier: (value: number) => void;
}

export const AdminSectorsTab = ({
  selectedGalaxyId,
  selectedSectorId,
  setSelectedSectorId,
  densityMultiplier,
  setDensityMultiplier
}: AdminSectorsTabProps) => {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Query to get systems for selected sector
  // const { data: sectorSystems = { sector: null, systems: [] } } = useQuery({
  //   ...convexQuery(api.game.map.galaxyQueries.getSectorSystems, {
  //     sectorId: selectedSectorId!
  //   }),
  //   enabled: !!selectedSectorId
  // });
  // Query to get all galaxies
  const { data: allGalaxies = [] } = useQuery(
    convexQuery(api.game.map.galaxyQueries.getAllGalaxies, {})
  );
  // Find the selected galaxy
  const selectedGalaxy = selectedGalaxyId
    ? allGalaxies.find((g) => g._id === selectedGalaxyId)
    : null;

  // mutations
  const generateAllGalaxySystemsMutation = useMutation({
    mutationFn: useConvexAction(
      api.game.map.galaxyGeneration.generateAllGalaxySystems
    )
  });
  const generateSectorSystemsMutation = useMutation({
    mutationFn: useConvexMutation(
      api.game.map.galaxyGeneration.generateSectorSystems
    )
  });

  const galaxyQueryArgs = selectedGalaxyId
    ? { galaxyId: selectedGalaxyId }
    : 'skip';

  // Get density map for selected galaxy
  const { data: galaxyDensityMap = [] } = useQuery(
    convexQuery(
      api.game.map.galaxyGeneration.getGalaxyDensityMap,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      galaxyQueryArgs as any
    )
  );

  // Query to get sectors for selected galaxy
  const { data: galaxySectors = [] } = useQuery(
    convexQuery(
      api.game.map.galaxyQueries.getGalaxySectors,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      galaxyQueryArgs as any
    )
  );
  // Handle generating systems for a sector
  // const handleGenerateSectorSystems = async (sectorId: Id<'galaxySectors'>) => {
  //   try {
  //     await generateSectorSystemsMutation.mutateAsync({
  //       sectorId,
  //       densityMultiplier
  //     });
  //     setSelectedSectorId(sectorId);
  //   } catch (error) {
  //     console.error('Failed to generate sector systems:', error);
  //   }
  // };

  // Handle generating all systems for a galaxy
  const handleGenerateAllSystems = async () => {
    if (!selectedGalaxyId) return;

    setIsGeneratingAll(true);
    try {
      await generateAllGalaxySystemsMutation.mutateAsync({
        galaxyId: selectedGalaxyId,
        densityMultiplier
      });
    } catch (error) {
      console.error('Failed to generate all systems:', error);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  return (
    <TabsContent value="sectors" className="space-y-4">
      {!selectedGalaxyId ? (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <p className="text-gray-500">Select a galaxy first to view sectors</p>
          <Button
            className="mt-4"
            onClick={() =>
              (
                document.querySelector(
                  'button[value="galaxies"]'
                ) as HTMLButtonElement
              )?.click()
            }
          >
            Go to Galaxies Tab
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[300px]">
              <Card>
                <CardHeader>
                  <CardTitle>Galaxy #{selectedGalaxy?.number}</CardTitle>
                  <CardDescription>
                    Group: {selectedGalaxy?.groupId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="density-multiplier">
                        Density Multiplier
                      </Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          id="density-multiplier"
                          value={[densityMultiplier]}
                          onValueChange={(value) =>
                            setDensityMultiplier(value[0])
                          }
                          min={0.1}
                          max={2}
                          step={0.1}
                          className="flex-1"
                        />
                        <span className="w-12 text-right">
                          {densityMultiplier.toFixed(1)}×
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={
                          isGeneratingAll ||
                          generateAllGalaxySystemsMutation.isPending
                        }
                      >
                        {isGeneratingAll ||
                        generateAllGalaxySystemsMutation.isPending
                          ? 'Generating...'
                          : 'Generate All Systems'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Generate all systems?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will generate star systems for ALL sectors in
                          this galaxy. This operation might take some time and
                          can't be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleGenerateAllSystems}>
                          Generate All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            </div>

            <div className="flex-1 min-w-[300px]">
              <Card>
                <CardHeader>
                  <CardTitle>Density Heatmap</CardTitle>
                  <CardDescription>System density distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-10 gap-[2px] p-1 bg-gray-100 rounded">
                    {galaxyDensityMap.map((sector, index) => {
                      // Convert density to a color (green to red)
                      const hue = 120 - 120 * (sector.density / 0.5);
                      const color = `hsl(${hue}, 80%, 50%)`;
                      return (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="aspect-square bg-white"
                                style={{ backgroundColor: color }}
                              ></div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <div>
                                  Position: ({sector.sectorX}, {sector.sectorY})
                                </div>
                                <div>
                                  Density: {(sector.density * 100).toFixed(1)}%
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-4">
            Galaxy Sectors (10×10 Grid)
          </h2>

          <ScrollArea className="min-h-fit border rounded-lg p-4">
            <div className="grid grid-cols-10 gap-2">
              {galaxySectors.map((sector) => {
                // Find the density for this sector
                const sectorDensity = galaxyDensityMap.find(
                  (s) =>
                    s.sectorX === sector.sectorX && s.sectorY === sector.sectorY
                );
                const density = sectorDensity?.density || 0;

                // Find the number of systems for this sector
                const systemCount = undefined;
                // sectorSystems.sector?._id === sector._id
                //   ? sectorSystems.length
                //   : undefined;

                return (
                  <Card
                    key={sector._id.toString()}
                    className={`${sector._id === selectedSectorId ? 'ring-2 ring-primary' : ''} cursor-pointer`}
                    onClick={() => setSelectedSectorId(sector._id)}
                  >
                    <CardHeader className="p-3">
                      <CardTitle className="text-base">
                        Sector ({sector.sectorX}, {sector.sectorY})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-xs space-y-2">
                        <div className="flex justify-between">
                          <span>Density:</span>
                          <span className="font-medium">
                            {(density * 100).toFixed(1)}%
                          </span>
                        </div>
                        {systemCount !== undefined && (
                          <div className="flex justify-between">
                            <span>Systems:</span>
                            <span className="font-medium">{systemCount}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-3 pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8"
                        disabled={generateSectorSystemsMutation.isPending}
                        onClick={() => {
                          setSelectedSectorId(sector._id);
                        }}
                      >
                        Go to System
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </>
      )}
    </TabsContent>
  );
};
