/**
 * Centralised env access. Server-only secrets are read lazily inside functions
 * so that importing this module in a client component never throws — only the
 * NEXT_PUBLIC_* values are read at module scope.
 */

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  r2PublicBaseUrl: (process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? '').replace(/\/+$/, ''),
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, ''),
};

export function requireServerEnv() {
  const {
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_ENDPOINT,
  } = process.env;

  const missing: string[] = [];
  if (!NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  return {
    supabaseUrl: NEXT_PUBLIC_SUPABASE_URL ?? '',
    supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY ?? '',
    r2AccountId: R2_ACCOUNT_ID ?? '',
    r2AccessKeyId: R2_ACCESS_KEY_ID ?? '',
    r2SecretAccessKey: R2_SECRET_ACCESS_KEY ?? '',
    r2Bucket: R2_BUCKET_NAME ?? '',
    r2Endpoint:
      R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : ''),
    missing,
  };
}

export function assertSupabaseServer() {
  const env = requireServerEnv();
  if (env.missing.length > 0) {
    throw new Error(
      `Missing required Supabase env vars: ${env.missing.join(', ')}. ` +
        `Copy .env.example to .env.local and fill them in.`,
    );
  }
  return env;
}

export function r2Configured(): boolean {
  const env = requireServerEnv();
  return Boolean(env.r2AccessKeyId && env.r2SecretAccessKey && env.r2Bucket && env.r2Endpoint);
}
