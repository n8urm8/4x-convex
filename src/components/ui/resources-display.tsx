import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ResourcesDisplay() {
  const { data: resources } = useQuery({
    ...convexQuery(api.app.getCurrentUserResources, {}),
  });

  if (!resources) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Available Resources</CardTitle>
      </CardHeader>
      <CardContent>
      <div className="flex gap-4 text-sm">
        <div>
          Nova: <span className="font-medium text-yellow-600">{resources.nova.toLocaleString()}</span>
        </div>
        <div>
          Minerals: <span className="font-medium text-blue-600">{resources.minerals.toLocaleString()}</span>
        </div>
        <div>
          Volatiles: <span className="font-medium text-purple-600">{resources.volatiles.toLocaleString()}</span>
        </div>
      </div>
      </CardContent>
    </Card>
  );
}
