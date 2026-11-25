export interface SkeletonProps {
  variant?: 'card' | 'row' | 'text';
  className?: string;
}

export function Skeleton({ variant = 'text', className = '' }: SkeletonProps) {
  if (variant === 'card') {
    return (
      <div
        className={[
          'rounded-xl border border-botanical-beige bg-botanical-white p-5 space-y-3 animate-pulse',
          className,
        ].join(' ')}
      >
        <div className="h-4 w-1/3 rounded bg-botanical-surface" />
        <div className="h-7 w-1/2 rounded bg-botanical-surface" />
        <div className="h-2.5 w-full rounded-full bg-botanical-surface" />
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div
        className={[
          'rounded-xl border border-botanical-beige bg-botanical-white p-4 flex items-center justify-between gap-4 animate-pulse',
          className,
        ].join(' ')}
      >
        <div className="space-y-2 flex-1">
          <div className="h-4 w-2/5 rounded bg-botanical-surface" />
          <div className="h-3 w-3/5 rounded bg-botanical-surface" />
        </div>
        <div className="h-8 w-24 rounded-lg bg-botanical-surface" />
      </div>
    );
  }

  return <div className={['h-4 rounded bg-botanical-surface animate-pulse', className].join(' ')} />;
}
