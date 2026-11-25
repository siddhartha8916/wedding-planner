import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-botanical-beige bg-botanical-white/80 px-6 py-10 text-center flex flex-col items-center">
      <div className="w-11 h-11 rounded-full bg-botanical-ivory border border-botanical-beige flex items-center justify-center text-botanical-forest mb-3.5">
        {icon}
      </div>
      <h3 className="font-serif text-xl font-semibold text-botanical-text">{title}</h3>
      <p className="text-sm text-botanical-muted max-w-sm mt-1.5">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
