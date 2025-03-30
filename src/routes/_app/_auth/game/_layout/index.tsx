import { createFileRoute, redirect } from '@tanstack/react-router';
import { Route as OverviewRoute } from './overview';

export const Route = createFileRoute('/_app/_auth/game/_layout/')({
  component: () => <div></div>,
  beforeLoad: () => {
    throw redirect(OverviewRoute);
  }
});
