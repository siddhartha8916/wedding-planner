import { useId } from 'react';
import { formatINRInputDisplay, parseINRInput } from '../../utils/currency.ts';

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  error,
  helperText,
  placeholder = '0',
  disabled = false,
  id,
  name,
  required,
}: CurrencyInputProps) {
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
      <div
        className={[
          'flex items-center min-h-11 rounded-lg border bg-botanical-white overflow-hidden transition-colors',
          'focus-within:ring-2 focus-within:ring-botanical-forest/20 focus-within:border-botanical-forest',
          error ? 'border-botanical-terracotta' : 'border-botanical-beige',
          disabled ? 'opacity-60 bg-botanical-surface/40' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span
          aria-hidden="true"
          className="px-3.5 py-2 text-base sm:text-sm font-medium text-botanical-muted bg-botanical-ivory/60 border-r border-botanical-beige select-none self-stretch flex items-center"
        >
          ₹
        </span>
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required={required}
          disabled={disabled}
          value={formatINRInputDisplay(value)}
          placeholder={placeholder}
          onChange={(e) => onChange(parseINRInput(e.target.value))}
          className="w-full min-h-11 px-3 py-2 text-base sm:text-sm text-botanical-text bg-transparent tabular-nums placeholder:text-botanical-disabled focus:outline-none"
        />
      </div>
      {error ? (
        <p className="text-xs text-botanical-terracotta">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-botanical-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
