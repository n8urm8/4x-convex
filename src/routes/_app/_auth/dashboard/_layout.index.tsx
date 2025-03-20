/* eslint-disable @typescript-eslint/no-non-null-assertion */
// shadcn components
import { AdminGalaxiesTab } from '@/components/admin/dashboard/GalaxiesTab';
import { AdminSectorsTab } from '@/components/admin/dashboard/SectorsTab';
import { AdminSystemsTab } from '@/components/admin/dashboard/SystemsTab';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Id } from '@cvx/_generated/dataModel';
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

  const [densityMultiplier, setDensityMultiplier] = useState<number>(1.0);

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
                densityMultiplier={densityMultiplier}
                setDensityMultiplier={setDensityMultiplier}
                selectedGalaxyId={selectedGalaxyId}
                selectedSectorId={selectedSectorId}
                setSelectedSectorId={setSelectedSectorId}
              />

              {/* SYSTEMS TAB */}
              <AdminSystemsTab
                selectedSectorId={selectedSectorId}
                densityMultiplier={densityMultiplier}
                selectedGalaxyId={selectedGalaxyId}
                setSelectedSectorId={setSelectedSectorId}
              />
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
