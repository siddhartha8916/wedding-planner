import { type ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Accordion({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-botanical-beige bg-botanical-ivory/40 overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-botanical-surface/50 transition-colors cursor-pointer"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-botanical-text-secondary">{title}</span>
            {badge ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-botanical-surface text-botanical-muted border border-botanical-beige">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? <p className="text-xs text-botanical-muted mt-0.5">{subtitle}</p> : null}
        </div>
        <ChevronDown
          className={[
            'w-4 h-4 text-botanical-muted shrink-0 transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
          strokeWidth={1.5}
        />
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-2 border-t border-botanical-taupe/70 space-y-4 bg-botanical-white">
          {children}
        </div>
      ) : null}
    </div>
  );
}
