import { CATEGORY_ICON_OPTIONS } from '../../config/presets.ts';
import { CategoryIcon } from './CategoryIcon.tsx';

export interface CategoryIconPickerProps {
  value: string;
  onChange: (iconKey: string) => void;
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-botanical-text-secondary">
        Category Icon
      </span>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {CATEGORY_ICON_OPTIONS.map((opt) => {
          const selected = opt.key === value;
          return (
            <button
              key={opt.key}
              type="button"
              title={opt.label}
              aria-label={opt.label}
              aria-pressed={selected}
              onClick={() => onChange(opt.key)}
              className={[
                'min-h-11 rounded-lg border flex flex-col items-center justify-center gap-1 p-1.5 transition-colors cursor-pointer',
                selected
                  ? 'bg-botanical-forest text-botanical-white border-botanical-forest'
                  : 'bg-botanical-white text-botanical-text-secondary border-botanical-beige hover:bg-botanical-surface/70',
              ].join(' ')}
            >
              <CategoryIcon name={opt.key} className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
