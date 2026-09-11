'use client';
import { useState } from 'react';
import type { Contributor } from '@/lib/types';
import type { Theme } from '@/lib/themes';

export function ContributionTile({
  contributor,
  theme,
  onDelete,
}: {
  contributor: Contributor;
  theme: Theme;
  onDelete?: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <figure
      className={`${theme.tile} tile-shadow relative rounded-2xl p-4 sm:p-5 animate-fade-in`}
    >
      {contributor.photo_url && (
        // Direct <img> from R2 — the DB is never in the image path.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={contributor.photo_url}
          alt={`Photo from ${contributor.name}`}
          loading="lazy"
          className="mb-3 max-h-80 w-full rounded-xl object-cover"
        />
      )}
      <blockquote className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
        {contributor.message}
      </blockquote>
      <figcaption className={`mt-3 text-sm font-semibold ${theme.accent}`}>
        — {contributor.name}
      </figcaption>

      {onDelete && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onDelete(contributor.id);
            setBusy(false);
          }}
          title="Remove this contribution"
          className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-red-600 opacity-0 shadow transition group-hover:opacity-100 hover:bg-white disabled:opacity-50 sm:opacity-100"
        >
          {busy ? '…' : 'Remove'}
        </button>
      )}
    </figure>
  );
}
