/* eslint-disable @typescript-eslint/no-non-null-assertion */
// shadcn components
import { AdminGalaxiesTab } from '@/components/admin/dashboard/GalaxiesTab';
import { AdminSectorsTab } from '@/components/admin/dashboard/SectorsTab';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import siteConfig from '~/site.config';

export const Route = createFileRoute('/_app/_auth/dashboard/_layout/')({
  component: Dashboard,
  beforeLoad: () => ({
    title: `${siteConfig.siteTitle} - Dashboard`,
    headerTitle: 'Dashboard',
    headerDescription: 'Admin Dashboard for Astral Ascension'
  })
});

export default function Dashboard() {
  const [selectedGalaxyId, setSelectedGalaxyId] =
    useState<Id<'galaxies'> | null>(null);
  const [selectedSectorId, setSelectedSectorId] =
    useState<Id<'galaxySectors'> | null>(null);

  // Query to get systems for selected sector
  const { data: sectorSystems = { sector: null, systems: [] } } = useQuery({
    ...convexQuery(api.game.map.galaxyQueries.getSectorSystems, {
      sectorId: selectedSectorId!
    }),
    enabled: !!selectedSectorId
  });

  const generateSectorSystemsMutation = useMutation({
    mutationFn: useConvexMutation(
      api.game.map.galaxyGeneration.generateSectorSystems
    )
  });
  const generateSystemPlanetsMutation = useMutation({
    mutationFn: useConvexMutation(
      api.game.map.galaxyGeneration.generateSystemPlanets
    )
  });

  // Handle generating planets for a system
  const handleGenerateSystemPlanets = async (systemId: Id<'starSystems'>) => {
    try {
      await generateSystemPlanetsMutation.mutateAsync({ systemId });
    } catch (error) {
      console.error('Failed to generate system planets:', error);
    }
  };

  return (
    <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
      <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
        <div className="flex w-full flex-col rounded-lg border border-border bg-card dark:bg-black">
          <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Galaxy Admin Dashboard</h1>

            <Tabs defaultValue="galaxies" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="galaxies">Galaxies</TabsTrigger>
                <TabsTrigger value="sectors">Sectors</TabsTrigger>
                <TabsTrigger value="systems">Star Systems</TabsTrigger>
              </TabsList>

              {/* GALAXIES TAB */}
              <AdminGalaxiesTab
                selectedGalaxyId={selectedGalaxyId}
                setSelectedGalaxyId={setSelectedGalaxyId}
              />

              {/* SECTORS TAB */}
              <AdminSectorsTab
                selectedGalaxyId={selectedGalaxyId}
                selectedSectorId={selectedSectorId}
                setSelectedSectorId={setSelectedSectorId}
              />

              {/* SYSTEMS TAB */}
              <TabsContent value="systems" className="space-y-4">
                {!selectedSectorId ? (
                  <div className="text-center py-10 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">
                      Select a sector first to view star systems
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() =>
                        document
                          .querySelector('button[value="sectors"]')
                          ?.click()
                      }
                    >
                      Go to Sectors Tab
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold">
                        Systems in Sector ({sectorSystems.sector?.sectorX},{' '}
                        {sectorSystems.sector?.sectorY})
                      </h2>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedSectorId(null)}
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
                              #{selectedGalaxy?.number} (
                              {selectedGalaxy?.groupId})
                            </div>
                          </div>
                          <div>
                            <Label>Total Systems</Label>
                            <div className="font-medium">
                              {sectorSystems.systems.length}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sectorSystems.systems.map((system) => (
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
                                  generateSystemPlanetsMutation.variables
                                    ?.systemId === system._id
                                }
                                onClick={() =>
                                  handleGenerateSystemPlanets(system._id)
                                }
                              >
                                {generateSystemPlanetsMutation.isPending &&
                                generateSystemPlanetsMutation.variables
                                  ?.systemId === system._id
                                  ? 'Generating...'
                                  : 'Generate Planets'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {sectorSystems.systems.length === 0 && (
                      <div className="text-center py-10 border rounded-lg bg-gray-50">
                        <p className="text-gray-500">
                          No systems generated for this sector yet
                        </p>
                        <Button
                          className="mt-4"
                          disabled={generateSectorSystemsMutation.isPending}
                          onClick={() =>
                            handleGenerateSectorSystems(selectedSectorId)
                          }
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
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
