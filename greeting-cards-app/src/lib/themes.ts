export interface Theme {
  id: string;
  name: string;
  /** Tailwind classes for the page background. */
  bg: string;
  /** Tailwind classes for accent text / headings. */
  accent: string;
  /** Emoji motif used in the unwrap animation and empty states. */
  motif: string;
  /** Card (message tile) background. */
  tile: string;
}

export const THEMES: Theme[] = [
  {
    id: 'classic',
    name: 'Classic Cream',
    bg: 'bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50',
    accent: 'text-rose-700',
    motif: '💌',
    tile: 'bg-white',
  },
  {
    id: 'birthday',
    name: 'Birthday Confetti',
    bg: 'bg-gradient-to-br from-fuchsia-50 via-purple-50 to-sky-50',
    accent: 'text-fuchsia-700',
    motif: '🎉',
    tile: 'bg-white',
  },
  {
    id: 'wedding',
    name: 'Wedding Blush',
    bg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-stone-50',
    accent: 'text-rose-600',
    motif: '💍',
    tile: 'bg-white/90',
  },
  {
    id: 'farewell',
    name: 'Farewell Dusk',
    bg: 'bg-gradient-to-br from-indigo-50 via-slate-50 to-cyan-50',
    accent: 'text-indigo-700',
    motif: '🌇',
    tile: 'bg-white',
  },
  {
    id: 'thankyou',
    name: 'Thank You Sage',
    bg: 'bg-gradient-to-br from-emerald-50 via-lime-50 to-teal-50',
    accent: 'text-emerald-700',
    motif: '🌿',
    tile: 'bg-white',
  },
  {
    id: 'holiday',
    name: 'Holiday Frost',
    bg: 'bg-gradient-to-br from-sky-50 via-blue-50 to-red-50',
    accent: 'text-red-600',
    motif: '❄️',
    tile: 'bg-white',
  },
];

export const OCCASIONS = [
  'Birthday',
  'Wedding',
  'Farewell',
  'Anniversary',
  'New Baby',
  'Get Well',
  'Congratulations',
  'Thank You',
  'Holiday',
  'Just Because',
];

const THEME_BY_ID = new Map(THEMES.map((t) => [t.id, t]));

export function getTheme(id: string | null | undefined): Theme {
  return (id && THEME_BY_ID.get(id)) || THEMES[0];
}
