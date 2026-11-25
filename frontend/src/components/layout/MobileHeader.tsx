import { Plus } from 'lucide-react';
import type { WeddingProfile } from '../../types/wedding.ts';

export interface MobileHeaderProps {
  profile: WeddingProfile;
  title: string;
  onQuickAddExpense: () => void;
}

export function MobileHeader({ profile, title, onQuickAddExpense }: MobileHeaderProps) {
  const brideInitial = profile.brideName.trim().charAt(0).toUpperCase() || 'B';
  const groomInitial = profile.groomName.trim().charAt(0).toUpperCase() || 'G';

  return (
    <header className="no-print md:hidden sticky top-0 z-30 h-14 bg-botanical-white border-b border-botanical-beige px-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-botanical-ivory border border-botanical-beige flex items-center justify-center shrink-0 font-serif text-xs font-semibold text-botanical-forest">
          {brideInitial}&amp;{groomInitial}
        </div>
        <span className="font-serif text-xl font-semibold text-botanical-text truncate">
          {title}
        </span>
      </div>

      <button
        type="button"
        onClick={onQuickAddExpense}
        aria-label="Add Expense"
        className="min-w-11 min-h-11 -mr-2 flex items-center justify-center rounded-lg text-botanical-forest hover:bg-botanical-surface/70 cursor-pointer"
      >
        <Plus className="w-5 h-5" strokeWidth={1.5} />
      </button>
    </header>
  );
}
