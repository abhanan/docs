'use client';
import Link from 'next/link';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 text-center">
      <div>
        <div className="text-5xl">😵</div>
        <h1 className="mt-3 text-2xl font-bold text-stone-800">Something went wrong</h1>
        <p className="mt-1 text-stone-500">Please try again in a moment.</p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-stone-800 px-5 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Retry
          </button>
          <Link href="/" className="rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-700">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
