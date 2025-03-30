import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_auth/game/_layout/(map)/map/')({
  component: () => <div>Hello /_app/_auth/game/map/!</div>
});
