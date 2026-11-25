import type { ReactNode } from 'react';

export type BadgeTone = 'forest' | 'sage' | 'gold' | 'terracotta' | 'neutral';

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  forest: 'bg-botanical-forest/12 text-botanical-forest border-botanical-forest/25',
  sage: 'bg-botanical-sage-soft/25 text-botanical-sage-dark border-botanical-sage/30',
  gold: 'bg-botanical-gold-light/25 text-botanical-text-secondary border-botanical-gold/35',
  terracotta: 'bg-botanical-terracotta/18 text-botanical-text border-botanical-terracotta/40',
  neutral: 'bg-botanical-surface text-botanical-muted border-botanical-beige',
};

export function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
