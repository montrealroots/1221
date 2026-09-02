/**
 * SLATE — Money.
 *
 * LAW: money is always integer minor units (cents). Floats never touch a
 * balance. Every rounding decision is explicit and happens exactly once, at
 * the point a rate is applied, so ledgers reconcile to the cent forever.
 */

/** Integer cents. Positive is a credit to the holder, negative a debit. */
export type Money = number;

export const ZERO: Money = 0;

export function dollars(amount: number): Money {
  return Math.round(amount * 100);
}

export function toDollars(cents: Money): number {
  return cents / 100;
}

/** Applies a rate and rounds half away from zero, once. */
export function applyRate(base: Money, rate: number): Money {
  const raw = base * rate;
  return raw >= 0 ? Math.round(raw) : -Math.round(-raw);
}

export function percentOf(base: Money, percent: number): Money {
  return applyRate(base, percent / 100);
}

/**
 * Splits an amount into n parts that sum exactly to the original.
 * Remainder cents are distributed to the earliest parts.
 */
export function splitEvenly(amount: Money, parts: number): Money[] {
  if (parts <= 0) return [];
  const base = Math.trunc(amount / parts);
  let remainder = amount - base * parts;
  const out: Money[] = [];
  const step = remainder >= 0 ? 1 : -1;
  for (let i = 0; i < parts; i++) {
    let value = base;
    if (remainder !== 0) {
      value += step;
      remainder -= step;
    }
    out.push(value);
  }
  return out;
}

/** Splits by weights, preserving the exact total (largest-remainder method). */
export function splitByWeights(amount: Money, weights: readonly number[]): Money[] {
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) return splitEvenly(amount, weights.length);
  const exact = weights.map((w) => (amount * Math.max(0, w)) / total);
  const floored = exact.map((v) => Math.trunc(v));
  let remaining = amount - floored.reduce((s, v) => s + v, 0);
  const order = exact
    .map((v, i) => ({ i, frac: Math.abs(v - Math.trunc(v)) }))
    .sort((a, b) => b.frac - a.frac);
  const step = remaining >= 0 ? 1 : -1;
  let k = 0;
  while (remaining !== 0 && order.length > 0) {
    const idx = (order[k % order.length] as { i: number }).i;
    floored[idx] = (floored[idx] as number) + step;
    remaining -= step;
    k++;
  }
  return floored;
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
});

export function formatMoney(cents: Money, opts: { cents?: boolean } = {}): string {
  const showCents = opts.cents ?? Math.abs(cents) < 100_000_00;
  return (showCents ? usd : usdWhole).format(cents / 100);
}

/** Compact display for large sums: $1.2M, $340K, $4.8B. */
export function formatMoneyCompact(cents: Money): string {
  const v = Math.abs(cents) / 100;
  const sign = cents < 0 ? '-' : '';
  if (v >= 1_000_000_000) return `${sign}$${(v / 1_000_000_000).toFixed(v >= 10_000_000_000 ? 0 : 1)}B`;
  if (v >= 1_000_000) return `${sign}$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 10_000) return `${sign}$${Math.round(v / 1000)}K`;
  return formatMoney(cents, { cents: v < 100 });
}

export function formatSignedMoney(cents: Money): string {
  return `${cents > 0 ? '+' : ''}${formatMoney(cents)}`;
}
