export const LIMITS = {
  name: 60,
  message: 1000,
  title: 120,
  occasion: 60,
  recipientLabel: 120,
};

export function cleanString(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/** Tokens are hex from gen_random_bytes(24) => 48 chars; be lenient but sane. */
export function looksLikeToken(token: string): boolean {
  return /^[a-f0-9]{16,128}$/i.test(token);
}
