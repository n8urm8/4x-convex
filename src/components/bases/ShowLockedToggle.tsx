import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export interface ShowLockedToggleProps {
  showLocked: boolean;
  onShowLockedChange: (checked: boolean) => void;
  visibleCount: number;
  totalCount: number;
  itemLabel: string;
  /** Optional override for toggle label. Default: "Show {itemLabel} I can't build yet" */
  toggleLabel?: string;
  id?: string;
}

export function ShowLockedToggle({
  showLocked,
  onShowLockedChange,
  visibleCount,
  totalCount,
  itemLabel,
  toggleLabel,
  id = 'show-locked',
}: ShowLockedToggleProps) {
  const label = toggleLabel ?? `Show ${itemLabel} I can't build yet`;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Switch
          id={id}
          checked={showLocked}
          onCheckedChange={(checked) => onShowLockedChange(checked === true)}
        />
        <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
          {label}
        </Label>
      </div>
      <span className="text-sm text-muted-foreground">
        {visibleCount} of {totalCount} {itemLabel}
      </span>
    </div>
  );
}
