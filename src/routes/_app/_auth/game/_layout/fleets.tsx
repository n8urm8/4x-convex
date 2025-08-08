import { createFileRoute } from '@tanstack/react-router';
import { FleetManagement } from '@/components/fleets/FleetManagement';

export const Route = createFileRoute('/_app/_auth/game/_layout/fleets')({
  component: FleetsPage,
});

function FleetsPage() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Fleet Command</h1>
      <FleetManagement />
    </div>
  );
}
