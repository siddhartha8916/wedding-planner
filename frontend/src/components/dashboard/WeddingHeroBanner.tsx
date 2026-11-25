import { CalendarHeart, FolderPlus, Plus } from 'lucide-react';
import type { WeddingProfile } from '../../types/wedding.ts';
import { formatLongDate, getDaysRemaining } from '../../utils/date.ts';
import { Badge } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';

export interface WeddingHeroBannerProps {
  profile: WeddingProfile;
  onAddExpense: () => void;
  onAddCategory: () => void;
}

export function WeddingHeroBanner({
  profile,
  onAddExpense,
  onAddCategory,
}: WeddingHeroBannerProps) {
  const daysLeft = getDaysRemaining(profile.weddingDate);
  const formattedDate = formatLongDate(profile.weddingDate);

  return (
    <section className="rounded-2xl border border-botanical-beige bg-botanical-white p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="gold">
            <CalendarHeart className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="tabular-nums">
              {daysLeft > 0
                ? `${daysLeft} Days to Go`
                : daysLeft === 0
                  ? 'Wedding Day'
                  : 'Celebration Complete'}
            </span>
          </Badge>
          {formattedDate ? (
            <span className="text-xs text-botanical-muted tabular-nums">{formattedDate}</span>
          ) : null}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-botanical-text tracking-tight">
          {profile.brideName} &amp; {profile.groomName}
        </h1>
        <p className="text-sm text-botanical-muted">
          Calm financial clarity for every ceremony, vendor deposit, and final settlement.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <Button
          variant="secondary"
          icon={<FolderPlus className="w-4 h-4" strokeWidth={1.5} />}
          onClick={onAddCategory}
        >
          Add Category
        </Button>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
          onClick={onAddExpense}
        >
          Add Expense
        </Button>
      </div>
    </section>
  );
}
