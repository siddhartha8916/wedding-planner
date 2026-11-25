import { forwardRef, type InputHTMLAttributes, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, id, className = '', ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="space-y-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-botanical-text-secondary"
        >
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={[
          'w-full min-h-[44px] rounded-lg border bg-botanical-white px-3.5 py-2 text-base sm:text-sm text-botanical-text',
          'placeholder:text-botanical-disabled transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-botanical-forest/20 focus:border-botanical-forest',
          error ? 'border-botanical-terracotta' : 'border-botanical-beige',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error ? (
        <p className="text-xs text-botanical-terracotta">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-botanical-muted">{helperText}</p>
      ) : null}
    </div>
  );
});
