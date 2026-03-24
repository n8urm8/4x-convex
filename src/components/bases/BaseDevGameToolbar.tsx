import { useMutation } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

/** Vite dev server only. Convex does not inherit shell env; mutations still need `pnpm exec convex env set DEV_GAME_TOOLS true` on your dev deployment once. */
const IS_VITE_DEV = import.meta.env.DEV;

type ResourceCode = 'nova' | 'mineral' | 'volatile';

function DevAddResourceButton({
  resourceCode,
  label,
}: {
  resourceCode: ResourceCode;
  label: string;
}) {
  const grant = useMutation(api.game.bases.devMutations.devGrantResources);
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      className="relative"
      onClick={() => {
        setPending(true);
        void (async () => {
          try {
            await grant({ resourceCode, amount: 1000 });
            toast.success(`+1000 ${label}`);
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      <span className={cn(pending && 'invisible')}>+1000 {label}</span>
      {pending ? (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      ) : null}
    </Button>
  );
}

export function BaseDevGameToolbar({ children }: { children?: React.ReactNode }) {
  if (!IS_VITE_DEV) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <DevAddResourceButton resourceCode="nova" label="Nova" />
      <DevAddResourceButton resourceCode="mineral" label="Minerals" />
      <DevAddResourceButton resourceCode="volatile" label="Volatiles" />
      {children}
    </div>
  );
}
