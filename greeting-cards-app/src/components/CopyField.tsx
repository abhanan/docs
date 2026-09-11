'use client';
import { useState } from 'react';

export function CopyField({ label, value }: { label?: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: select nothing fancy; just ignore.
    }
  }

  return (
    <div>
      {label && <div className="mb-1 text-sm font-medium text-stone-600">{label}</div>}
      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 font-mono text-sm text-stone-700"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 active:scale-[0.98]"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
