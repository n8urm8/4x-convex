import { BaseDetails } from '@/features/bases/types';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function BaseResourceUsageCard({ base }: { base: BaseDetails }) {
  const energyPercentage = (base.usedEnergy / base.totalEnergy) * 100;
  const spacePercentage = (base.usedSpace / base.totalSpace) * 100;

  return (
    <Card>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Energy Usage</span>
            <span>
              {base.usedEnergy} / {base.totalEnergy}
            </span>
          </div>
          <Progress value={energyPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {energyPercentage.toFixed(1)}% used
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Space Usage</span>
            <span>
              {base.usedSpace} / {base.totalSpace}
            </span>
          </div>
          <Progress value={spacePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {spacePercentage.toFixed(1)}% used
          </p>
        </div>
        {base.structureBuildQueue && base.structureBuildQueue.length > 0 ? (
          <div className="md:col-span-2 border-t pt-4 space-y-2">
            <p className="text-sm font-medium">Build queue</p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              {base.structureBuildQueue.map((item) => (
                <li key={item._id}>
                  {item.kind === 'build' ? 'Build' : 'Upgrade'}: {item.label}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
