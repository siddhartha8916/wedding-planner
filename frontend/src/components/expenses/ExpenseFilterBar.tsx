import { Search } from 'lucide-react';
import { CEREMONY_OPTIONS } from '../../config/presets.ts';
import type { CeremonyTag, ExpenseStatus } from '../../types/wedding.ts';
import { Select } from '../ui/Select.tsx';

export interface ExpenseFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: ExpenseStatus | 'all';
  onStatusChange: (value: ExpenseStatus | 'all') => void;
  ceremony: CeremonyTag | 'all';
  onCeremonyChange: (value: CeremonyTag | 'all') => void;
}

const statusPills: { value: ExpenseStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Advance Paid' },
  { value: 'paid', label: 'Settled' },
  { value: 'overdue', label: 'Overdue' },
];

export function ExpenseFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  ceremony,
  onCeremonyChange,
}: ExpenseFilterBarProps) {
  return (
    <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-3">
      <div className="relative flex-1 lg:max-w-xs">
        <Search
          className="w-4 h-4 text-botanical-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          strokeWidth={1.5}
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search title, notes, vendor..."
          className="w-full min-h-11 rounded-lg border border-botanical-beige bg-botanical-white pl-10 pr-3.5 py-2 text-base sm:text-sm text-botanical-text placeholder:text-botanical-disabled focus:outline-none focus:ring-2 focus:ring-botanical-forest/20 focus:border-botanical-forest"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {statusPills.map((pill) => {
            const active = status === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => onStatusChange(pill.value)}
                className={[
                  'min-h-9.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors cursor-pointer shrink-0',
                  active
                    ? 'bg-botanical-forest text-botanical-white border-botanical-forest'
                    : 'bg-botanical-white text-botanical-text-secondary border-botanical-beige hover:bg-botanical-surface/70',
                ].join(' ')}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="sm:w-44 shrink-0">
          <Select
            aria-label="Filter by ceremony"
            value={ceremony}
            onChange={(e) => onCeremonyChange(e.target.value as CeremonyTag | 'all')}
            options={[
              { value: 'all', label: 'All Ceremonies' },
              ...CEREMONY_OPTIONS.map((c) => ({ value: c.value, label: c.label })),
            ]}
          />
        </div>
      </div>
    </div>
  );
}
