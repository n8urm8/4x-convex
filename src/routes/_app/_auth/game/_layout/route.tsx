import { convexQuery } from '@convex-dev/react-query';
import { api } from '@cvx/_generated/api';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Navigation } from '@/components/ui/Navigation';

export const Route = createFileRoute('/_app/_auth/game/_layout')({
  component: GameLayout
});

function GameLayout() {
  const { data: user } = useQuery(convexQuery(api.app.getCurrentUser, {}));
  if (!user) {
    return null;
  }
  return (
    <div className="flex min-h-[100vh] w-full flex-col bg-secondary dark:bg-black">
      <Navigation user={user} />
      {/* <Header /> */}
      <Outlet />
    </div>
  );
}
