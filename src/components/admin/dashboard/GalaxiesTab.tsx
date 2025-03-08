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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

interface AdminGalaxiesTabProps {
  selectedGalaxyId: Id<'galaxies'> | null;
  setSelectedGalaxyId: Dispatch<SetStateAction<Id<'galaxies'> | null>>;
}

export const AdminGalaxiesTab = ({
  selectedGalaxyId,
  setSelectedGalaxyId
}: AdminGalaxiesTabProps) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('default');
  const [customGroup, setCustomGroup] = useState<string>('');
  const [newGalaxyGroup, setNewGalaxyGroup] = useState<string>('default');
  const [isCreatingGalaxy, setIsCreatingGalaxy] = useState(false);

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

  // Update selectedGroup if it's not in the list
  useEffect(() => {
    if (allGroups.length > 0 && !allGroups.includes(selectedGroup)) {
      setSelectedGroup(allGroups[0]);
    }
  }, [allGroups, selectedGroup]);

  // Mutations
  const createGalaxyMutation = useMutation({
    mutationFn: useConvexMutation(api.game.map.galaxyGeneration.createGalaxy)
  });
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
  return (
    <TabsContent value="galaxies" className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <Label htmlFor="group-select">Galaxy Group</Label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger id="group-select" className="w-full">
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              {allGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group} ({groupedGalaxies[group]?.length || 0} galaxies)
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
                      <SelectItem value="new">New Group...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newGalaxyGroup === 'new' && (
                  <div>
                    <Label htmlFor="new-group-name">New Group Name</Label>
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
                disabled={isCreatingGalaxy || createGalaxyMutation.isPending}
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
                  <CardDescription>ID: {galaxy._id.toString()}</CardDescription>
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
  );
};
