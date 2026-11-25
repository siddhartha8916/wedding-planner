import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, subtitle, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="fixed inset-0 bg-botanical-text/35" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-botanical-white border border-botanical-beige overflow-hidden">
        <div className="px-5 py-4 border-b border-botanical-taupe flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-semibold text-botanical-text">{title}</h3>
            {subtitle ? <p className="text-xs text-botanical-muted mt-0.5">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-11 min-h-11 -mr-2 -mt-2 flex items-center justify-center rounded-lg text-botanical-muted hover:text-botanical-text hover:bg-botanical-surface/70 cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[75dvh] overflow-y-auto">{children}</div>
        {footer ? (
          <div className="px-5 py-3.5 border-t border-botanical-taupe bg-botanical-ivory/40 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
