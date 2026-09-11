import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 text-center">
      <div>
        <div className="text-5xl">🤔</div>
        <h1 className="mt-3 text-2xl font-bold text-stone-800">Page not found</h1>
        <p className="mt-1 text-stone-500">That card or link doesn&apos;t seem to exist.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-rose-600 underline">
          Go home
        </Link>
      </div>
    </main>
  );
}
