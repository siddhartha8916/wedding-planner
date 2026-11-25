import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  surface?: 'white' | 'ivory';
  children: ReactNode;
}

const paddingClasses = {
  none: '',
  sm: 'p-3.5 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

const surfaceClasses = {
  white: 'bg-botanical-white',
  ivory: 'bg-botanical-ivory/75',
};

export function Card({
  padding = 'md',
  interactive = false,
  surface = 'white',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-botanical-beige',
        surfaceClasses[surface],
        paddingClasses[padding],
        interactive
          ? 'transition-colors hover:border-botanical-gold/70 hover:bg-botanical-white cursor-pointer'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
