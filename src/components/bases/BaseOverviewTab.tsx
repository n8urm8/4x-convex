import { BaseDetails } from '@/features/bases/types';

export function BaseOverviewTab({ base }: { base: BaseDetails }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Overview</h2>
      <p>
        Energy: {base.usedEnergy} / {base.totalEnergy}
      </p>
      <p>
        Space: {base.usedSpace} / {base.totalSpace}
      </p>
      <p>Location: G{base.galaxyNumber}-S{base.sectorX}.{base.sectorY}-S{base.systemX}.{base.systemY}-P{base.planetX}.{base.planetY}</p>
    </div>
  );
}
