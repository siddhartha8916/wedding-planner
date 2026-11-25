import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery.ts';

export interface ResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function ResponsiveSheet({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: ResponsiveSheetProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-botanical-text/35 transition-opacity"
        onClick={onClose}
      />

      <div
        className={
          isMobile
            ? 'fixed inset-x-0 bottom-0 z-10 flex flex-col max-h-[92dvh] rounded-t-2xl bg-botanical-white border-t border-botanical-beige'
            : 'fixed inset-y-0 right-0 z-10 flex flex-col w-full max-w-lg bg-botanical-white border-l border-botanical-beige'
        }
      >
        {isMobile ? (
          <div className="flex justify-center pt-2.5 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-botanical-beige" />
          </div>
        ) : null}

        <div className="px-5 py-4 border-b border-botanical-taupe flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl font-semibold text-botanical-text leading-tight">
              {title}
            </h2>
            {subtitle ? <p className="text-xs text-botanical-muted mt-1">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 flex items-center justify-center rounded-lg text-botanical-muted hover:text-botanical-text hover:bg-botanical-surface/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">{children}</div>

        {footer ? (
          <div className="px-5 py-3.5 border-t border-botanical-taupe bg-botanical-white shrink-0 safe-pb">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
