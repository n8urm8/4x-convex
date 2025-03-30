import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_auth/game/_layout/overview')({
  component: GameOverview
});

export default function GameOverview() {
  return (
    <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
      <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
        <div className="flex w-full flex-col rounded-lg border border-border bg-card dark:bg-black">
          <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Game Overview</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
