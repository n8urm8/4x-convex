import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type DevInstantCompleteButtonProps = {
  label: string;
  disabled?: boolean;
  pending?: boolean;
  onClick: () => void | Promise<void>;
};

export function DevInstantCompleteButton({
  label,
  disabled,
  pending,
  onClick,
}: DevInstantCompleteButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={disabled || pending}
      className="relative"
      onClick={() => void onClick()}
    >
      <span className={cn(pending && 'invisible')}>{label}</span>
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
