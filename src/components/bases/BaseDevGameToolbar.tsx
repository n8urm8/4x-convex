import { useMutation, useQuery } from 'convex/react';
import { api } from '@cvx/_generated/api';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const IS_VITE_DEV = import.meta.env.DEV;

type ResourceCode = 'nova' | 'mineral' | 'volatile';

function DevAddResourceButton({
  resourceCode,
  label,
  devToolsEnabled,
}: {
  resourceCode: ResourceCode;
  label: string;
  devToolsEnabled: boolean;
}) {
  const grant = useMutation(api.game.bases.devMutations.devGrantResources);
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!devToolsEnabled || pending}
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
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      ) : null}
      +1000 {label}
    </Button>
  );
}

export function BaseDevGameToolbar({ children }: { children?: React.ReactNode }) {
  const status = useQuery(api.devQueries.getDevGameToolsStatus);
  const devToolsEnabled = status?.enabled === true;
  const show = IS_VITE_DEV && devToolsEnabled;

  if (!IS_VITE_DEV) {
    return null;
  }

  if (status === undefined) {
    return null;
  }

  if (!devToolsEnabled) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {children}
      <DevAddResourceButton resourceCode="nova" label="Nova" devToolsEnabled={devToolsEnabled} />
      <DevAddResourceButton
        resourceCode="mineral"
        label="Minerals"
        devToolsEnabled={devToolsEnabled}
      />
      <DevAddResourceButton
        resourceCode="volatile"
        label="Volatiles"
        devToolsEnabled={devToolsEnabled}
      />
    </div>
  );
}
