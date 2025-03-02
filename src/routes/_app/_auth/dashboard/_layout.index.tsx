/* eslint-disable @typescript-eslint/no-non-null-assertion */
// shadcn components
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
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
  // State for selected group
  const [selectedGroup, setSelectedGroup] = useState<string>('default');
  const [customGroup, setCustomGroup] = useState<string>('');
  const [newGalaxyGroup, setNewGalaxyGroup] = useState<string>('default');
  const [isCreatingGalaxy, setIsCreatingGalaxy] = useState(false);
  const [selectedGalaxyId, setSelectedGalaxyId] =
    useState<Id<'galaxies'> | null>(null);
  const [selectedSectorId, setSelectedSectorId] =
    useState<Id<'galaxySectors'> | null>(null);
  const [densityMultiplier, setDensityMultiplier] = useState<number>(1.0);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Query to get all galaxies
  const { data: allGalaxies = [], error: allGalaxiesError } = useQuery(
    convexQuery(api.game.map.galaxyQueries.getAllGalaxies, {})
  );

  // Group galaxies by groupId
  const groupedGalaxies = allGalaxies.reduce(
    (acc, galaxy) => {
      const group = galaxy.groupId;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(galaxy);
      return acc;
    },
    {} as Record<string, typeof allGalaxies>
  );

  // Get all unique group IDs
  const allGroups = Object.keys(groupedGalaxies);

  // Query to get sectors for selected galaxy
  const { data: galaxySectors = [] } = useQuery({
    ...convexQuery(api.game.map.galaxyQueries.getGalaxySectors, {
      galaxyId: selectedGalaxyId!
    }),
    enabled: !!selectedGalaxyId
  });

  // Query to get systems for selected sector
  const { data: sectorSystems = { sector: null, systems: [] } } = useQuery({
    ...convexQuery(api.game.map.galaxyQueries.getSectorSystems, {
      sectorId: selectedSectorId!
    }),
    enabled: !!selectedSectorId
  });

  // Get density map for selected galaxy
  const { data: galaxyDensityMap = [] } = useQuery({
    ...convexQuery(api.game.map.galaxyGeneration.getGalaxyDensityMap, {
      galaxyId: selectedGalaxyId!
    }),
    enabled: !!selectedGalaxyId
  });

  // Mutations
  const createGalaxyMutation = useMutation({
    mutationFn: useConvexMutation(api.game.map.galaxyGeneration.createGalaxy)
  });
  const generateSectorSystemsMutation = useMutation({
    mutationFn: useConvexMutation(
      api.game.map.galaxyGeneration.generateSectorSystems
    )
  });
  const generateAllGalaxySystemsMutation = useMutation({
    mutationFn: useConvexMutation(
      api.game.map.galaxyGeneration.generateAllGalaxySystems
    )
  });
  const generateSystemPlanetsMutation = useMutation({
    mutationFn: useConvexMutation(
      api.game.map.galaxyGeneration.generateSystemPlanets
    )
  });

  // Handle creating a new galaxy
  const handleCreateGalaxy = async () => {
    setIsCreatingGalaxy(true);
    try {
      const { galaxyId } = await createGalaxyMutation.mutateAsync({
        groupId: newGalaxyGroup
      });
      setSelectedGalaxyId(galaxyId);
    } catch (error) {
      console.error('Failed to create galaxy:', error);
    } finally {
      setIsCreatingGalaxy(false);
    }
  };

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

  // Handle generating planets for a system
  const handleGenerateSystemPlanets = async (systemId: Id<'starSystems'>) => {
    try {
      await generateSystemPlanetsMutation.mutateAsync({ systemId });
    } catch (error) {
      console.error('Failed to generate system planets:', error);
    }
  };

  // Update selectedGroup if it's not in the list
  useEffect(() => {
    if (allGroups.length > 0 && !allGroups.includes(selectedGroup)) {
      setSelectedGroup(allGroups[0]);
    }
  }, [allGroups, selectedGroup]);

  // Find the selected galaxy
  const selectedGalaxy = selectedGalaxyId
    ? allGalaxies.find((g) => g._id === selectedGalaxyId)
    : null;

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
              <TabsContent value="galaxies" className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[300px]">
                    <Label htmlFor="group-select">Galaxy Group</Label>
                    <Select
                      value={selectedGroup}
                      onValueChange={setSelectedGroup}
                    >
                      <SelectTrigger id="group-select" className="w-full">
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        {allGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group} ({groupedGalaxies[group]?.length || 0}{' '}
                            galaxies)
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Group...</SelectItem>
                      </SelectContent>
                    </Select>

                    {selectedGroup === 'custom' && (
                      <div className="mt-2">
                        <Input
                          placeholder="Enter custom group name"
                          value={customGroup}
                          onChange={(e) => setCustomGroup(e.target.value)}
                          onBlur={() => {
                            if (customGroup.trim()) {
                              setSelectedGroup(customGroup.trim());
                            } else {
                              setSelectedGroup('default');
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-[300px]">
                    <Card>
                      <CardHeader>
                        <CardTitle>Create New Galaxy</CardTitle>
                        <CardDescription>
                          Add a galaxy to the selected group
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="new-galaxy-group">Group</Label>
                            <Select
                              value={newGalaxyGroup}
                              onValueChange={setNewGalaxyGroup}
                            >
                              <SelectTrigger id="new-galaxy-group">
                                <SelectValue placeholder="Select a group" />
                              </SelectTrigger>
                              <SelectContent>
                                {allGroups.map((group) => (
                                  <SelectItem key={group} value={group}>
                                    {group}
                                  </SelectItem>
                                ))}
                                <SelectItem value="new">
                                  New Group...
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {newGalaxyGroup === 'new' && (
                            <div>
                              <Label htmlFor="new-group-name">
                                New Group Name
                              </Label>
                              <Input
                                id="new-group-name"
                                placeholder="Enter new group name"
                                value={customGroup}
                                onChange={(e) => setCustomGroup(e.target.value)}
                                onBlur={() => {
                                  if (customGroup.trim()) {
                                    setNewGalaxyGroup(customGroup.trim());
                                  } else {
                                    setNewGalaxyGroup('default');
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={handleCreateGalaxy}
                          disabled={
                            isCreatingGalaxy || createGalaxyMutation.isPending
                          }
                          className="w-full"
                        >
                          {isCreatingGalaxy || createGalaxyMutation.isPending
                            ? 'Creating...'
                            : 'Create Galaxy'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {selectedGroup === 'custom'
                      ? `Galaxies in "${customGroup}" Group`
                      : `Galaxies in "${selectedGroup}" Group`}
                  </h2>

                  {(groupedGalaxies[selectedGroup]?.length || 0) === 0 ? (
                    <div className="text-center py-10 border rounded-lg bg-gray-50">
                      <p className="text-gray-500">No galaxies in this group</p>
                      <Button
                        className="mt-4"
                        onClick={() => {
                          setNewGalaxyGroup(selectedGroup);
                          handleCreateGalaxy();
                        }}
                      >
                        Create New Galaxy in This Group
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedGalaxies[selectedGroup]?.map((galaxy) => (
                        <Card
                          key={galaxy._id.toString()}
                          className={`${galaxy._id === selectedGalaxyId ? 'ring-2 ring-primary' : ''}`}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="flex justify-between">
                              <span>Galaxy #{galaxy.number}</span>
                              <Badge variant="outline">{galaxy.groupId}</Badge>
                            </CardTitle>
                            <CardDescription>
                              ID: {galaxy._id.toString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-40 bg-gray-100 rounded flex items-center justify-center mb-4">
                              {/* Simple galaxy visualization */}
                              <div className="w-32 h-32 relative">
                                <div className="w-32 h-32 bg-black rounded-full flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-full bg-yellow-500 animate-pulse"></div>
                                  <div className="absolute inset-0 opacity-50">
                                    {Array.from({ length: 50 }).map((_, i) => {
                                      const angle = Math.random() * Math.PI * 2;
                                      const distance = Math.random() * 16;
                                      const size = Math.random() * 2 + 1;
                                      const style = {
                                        left: `${16 + Math.cos(angle) * distance}px`,
                                        top: `${16 + Math.sin(angle) * distance}px`,
                                        width: `${size}px`,
                                        height: `${size}px`
                                      };
                                      return (
                                        <div
                                          key={i}
                                          className="absolute rounded-full bg-white"
                                          style={style}
                                        ></div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-sm">
                              <div className="flex justify-between mb-1">
                                <span>Sectors:</span>
                                <span className="font-medium">10 × 10</span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0">
                            <Button
                              variant="default"
                              className="w-full"
                              onClick={() => setSelectedGalaxyId(galaxy._id)}
                            >
                              {galaxy._id === selectedGalaxyId
                                ? 'Selected'
                                : 'Select Galaxy'}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* SECTORS TAB */}
              <TabsContent value="sectors" className="space-y-4">
                {!selectedGalaxyId ? (
                  <div className="text-center py-10 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">
                      Select a galaxy first to view sectors
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() =>
                        document
                          .querySelector('button[value="galaxies"]')
                          ?.click()
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
                            <CardTitle>
                              Galaxy #{selectedGalaxy?.number}
                            </CardTitle>
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
                                    This will generate star systems for ALL
                                    sectors in this galaxy. This operation might
                                    take some time and can't be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleGenerateAllSystems}
                                  >
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
                            <CardDescription>
                              System density distribution
                            </CardDescription>
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
                                            Position: ({sector.sectorX},{' '}
                                            {sector.sectorY})
                                          </div>
                                          <div>
                                            Density:{' '}
                                            {(sector.density * 100).toFixed(1)}%
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

                    <ScrollArea className="h-[600px] border rounded-lg p-4">
                      <div className="grid grid-cols-10 gap-2">
                        {galaxySectors.map((sector) => {
                          // Find the density for this sector
                          const sectorDensity = galaxyDensityMap.find(
                            (s) =>
                              s.sectorX === sector.sectorX &&
                              s.sectorY === sector.sectorY
                          );
                          const density = sectorDensity?.density || 0;

                          // Find the number of systems for this sector
                          const systemCount =
                            sectorSystems.sector?._id === sector._id
                              ? sectorSystems.systems.length
                              : undefined;

                          return (
                            <Card
                              key={sector._id.toString()}
                              className={`${sector._id === selectedSectorId ? 'ring-2 ring-primary' : ''}`}
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
                                      <span className="font-medium">
                                        {systemCount}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter className="p-3 pt-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs h-8"
                                  disabled={
                                    generateSectorSystemsMutation.isPending
                                  }
                                  onClick={() => {
                                    setSelectedSectorId(sector._id);
                                    handleGenerateSectorSystems(sector._id);
                                  }}
                                >
                                  {generateSectorSystemsMutation.isPending &&
                                  generateSectorSystemsMutation.variables
                                    ?.sectorId === sector._id
                                    ? 'Generating...'
                                    : systemCount
                                      ? 'View Systems'
                                      : 'Generate Systems'}
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
