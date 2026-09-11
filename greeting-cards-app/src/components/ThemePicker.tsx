'use client';
import { THEMES } from '@/lib/themes';

export function ThemePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEMES.map((theme) => {
        const selected = theme.id === value;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={`relative overflow-hidden rounded-xl border-2 p-3 text-left transition ${
              selected ? 'border-stone-800 ring-2 ring-stone-800/20' : 'border-transparent'
            }`}
          >
            <div className={`${theme.bg} mb-2 flex h-16 items-center justify-center rounded-lg text-2xl`}>
              {theme.motif}
            </div>
            <div className="text-sm font-medium text-stone-700">{theme.name}</div>
            {selected && (
              <div className="absolute right-2 top-2 rounded-full bg-stone-800 px-1.5 text-xs text-white">
                ✓
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
