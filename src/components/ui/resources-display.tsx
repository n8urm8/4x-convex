import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';

export function ResourcesDisplay() {
  const { data: resources } = useQuery({
    ...convexQuery(api.app.getCurrentUserResources, {}),
  });

  if (!resources) {
    return null;
  }

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <h3 className="font-medium mb-2">Available Resources</h3>
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
    </div>
  );
}
