import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_app/_auth/game/_layout/(map)/map/$galaxyId'
)({
  component: () => <div>Hello /_app/_auth/game/_layout/(map)/map/$galaxy!</div>
});
