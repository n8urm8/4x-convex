import { BaseDetails } from '@/features/bases/types';

export function BaseShipyardsTab({ base }: { base: BaseDetails }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Shipyards</h2>
      <p>Build ships from your shipyards here.</p>
    </div>
  );
}
