import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_auth/game/_layout/(map)/map/')({
  component: () => <div></div>,
  beforeLoad: () => {
    throw redirect({
      to: '/game/map/0'
    });
  }
});
