import { Button } from '@/components/ui/button';
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
      onClick={() => void onClick()}
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      ) : null}
      {label}
    </Button>
  );
}
