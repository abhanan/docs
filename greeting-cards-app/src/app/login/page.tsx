'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getSSRBrowserClient } from '@/lib/supabase/ssr-browser';

function LoginInner() {
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<null | 'google' | 'email'>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect back to the SAME origin the user is on (preview / prod / localhost),
  // so auth works on every deployment. Supabase must allow these in its
  // redirect-URL config (a wildcard like https://*.vercel.app/auth/callback).
  const callbackUrl =
    (typeof window !== 'undefined' ? window.location.origin : '') +
    `/auth/callback?next=${encodeURIComponent(next)}`;

  async function signInWithGoogle() {
    setError(null);
    const supabase = getSSRBrowserClient();
    if (!supabase) return setError('Auth is not configured yet.');
    setBusy('google');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setError(error.message);
      setBusy(null);
    }
    // On success the browser redirects to Google.
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = getSSRBrowserClient();
    if (!supabase) return setError('Auth is not configured yet.');
    if (!email.trim()) return setError('Enter your email.');
    setBusy('email');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl },
    });
    setBusy(null);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/85 p-7 tile-shadow">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
          ← Home
        </Link>
        <div className="mt-3 text-center">
          <div className="text-4xl">💌</div>
          <h1 className="mt-2 font-display text-2xl font-bold text-stone-800">Sign in</h1>
          <p className="mt-1 text-sm text-stone-600">to create and manage your cards</p>
        </div>

        {sent ? (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-800">
            ✉️ Check your inbox — we sent a magic sign-in link to <strong>{email}</strong>.
            <button
              onClick={() => setSent(false)}
              className="mt-3 block w-full text-xs text-emerald-700 underline"
            >
              Use a different method
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={signInWithGoogle}
              disabled={busy !== null}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
            >
              <GoogleIcon />
              {busy === 'google' ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <div className="my-4 flex items-center gap-3 text-xs text-stone-400">
              <span className="h-px flex-1 bg-stone-200" /> or <span className="h-px flex-1 bg-stone-200" />
            </div>

            <form onSubmit={signInWithEmail} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5"
              />
              <button
                type="submit"
                disabled={busy !== null}
                className="w-full rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                {busy === 'email' ? 'Sending…' : 'Email me a magic link'}
              </button>
            </form>
          </>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
