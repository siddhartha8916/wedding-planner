import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { ToastContext, type ToastItem, type ToastTone } from '../../hooks/useToast.ts';

const toneStyles: Record<ToastTone, string> = {
  forest: 'bg-botanical-forest text-botanical-white border-botanical-forest',
  gold: 'bg-botanical-white text-botanical-text border-botanical-gold',
  terracotta: 'bg-botanical-white text-botanical-text border-botanical-terracotta',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'forest') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      setTimeout(() => {
        dismiss(id);
      }, 3600);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="no-print fixed z-50 left-4 right-4 bottom-20 md:left-auto md:right-6 md:bottom-6 md:w-96 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              'pointer-events-auto rounded-xl border px-4 py-3 flex items-center justify-between gap-3 text-sm',
              toneStyles[toast.tone],
            ].join(' ')}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.tone === 'forest' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              ) : toast.tone === 'terracotta' ? (
                <AlertCircle
                  className="w-4 h-4 shrink-0 text-botanical-terracotta"
                  strokeWidth={1.5}
                />
              ) : (
                <Info className="w-4 h-4 shrink-0 text-botanical-gold" strokeWidth={1.5} />
              )}
              <span className="truncate">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 opacity-75 hover:opacity-100 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
