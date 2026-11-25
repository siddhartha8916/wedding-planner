import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-botanical-forest text-botanical-white border border-botanical-forest hover:bg-botanical-forest/92 active:bg-botanical-forest/85',
  secondary:
    'bg-botanical-white text-botanical-text border border-botanical-beige hover:bg-botanical-surface/70 active:bg-botanical-surface',
  ghost:
    'bg-transparent text-botanical-text-secondary border border-transparent hover:bg-botanical-surface/80 active:bg-botanical-surface',
  danger:
    'bg-botanical-terracotta/15 text-botanical-text border border-botanical-terracotta/60 hover:bg-botanical-terracotta/25',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] md:min-h-[36px] px-3 py-1.5 text-sm',
  md: 'min-h-[44px] px-4 py-2 text-sm',
  lg: 'min-h-[48px] px-5 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-forest',
        'disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : icon}
      {children}
    </button>
  );
}
