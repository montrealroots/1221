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

/**
 * Whole units of the ledger's currency to minor units, and back.
 *
 * Named `dollars` when this file was cut from another codebase and kept that
 * name through everything above. The names are the unit the game does not use,
 * so they are the unit somebody reaches for by mistake.
 */
export function units(amount: number): Money {
  return Math.round(amount * 100);
}

export function toUnits(cents: Money): number {
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

/**
 * The unit the ledger is kept in, and the one place it is decided.
 *
 * The euro, and it took a screenshot to notice. This formatter was written
 * against USD and stayed that way, while every piece of the game that reasons
 * about money came out the other side in euros: `ISK_A_EURO` converts an
 * Icelandic budget to euros so it can be set against a rate card quoted in
 * euros per square meter, `BUILD_COST_CENTS` is what the family put into the
 * lot in euros, and all three of the engine's own notification helpers printed
 * a euro sign. On one boot, fourteen of fourteen money-bearing notifications
 * said € and the panel beside them said $ for the same number.
 *
 * The dollar was never a decision. It is what `dollars()` and `toDollars()`
 * below are left over from, and they are the last of a codebase this one was
 * cut out of.
 *
 * NOT to be confused with the gazetteer's own unit. `content/currency.ts`
 * carries `unitsPerUsd` for 252 countries so a player standing in Tokyo sees
 * yen, and its rents and cost-of-living figures are quoted in US dollars.
 * That atlas is internally consistent, it is a reference rather than a
 * balance, and nothing in it is ever debited from an account — checked, and
 * the check is the only reason the two can be different units safely.
 */
export const LEDGER_CURRENCY = 'EUR';

const withCents = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: LEDGER_CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const whole = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: LEDGER_CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 0,
});

/** The ledger's symbol on its own, for the places that build a string by hand. */
export const CURRENCY_SYMBOL = whole.format(0).replace(/[\d.,\s]/g, '');

export function formatMoney(cents: Money, opts: { cents?: boolean } = {}): string {
  const showCents = opts.cents ?? Math.abs(cents) < 100_000_00;
  return (showCents ? withCents : whole).format(cents / 100);
}

/** Compact display for large sums: €1.2M, €340K, €4.8B. */
export function formatMoneyCompact(cents: Money): string {
  const v = Math.abs(cents) / 100;
  const sign = cents < 0 ? '-' : '';
  const s = CURRENCY_SYMBOL;
  if (v >= 1_000_000_000) return `${sign}${s}${(v / 1_000_000_000).toFixed(v >= 10_000_000_000 ? 0 : 1)}B`;
  if (v >= 1_000_000) return `${sign}${s}${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 10_000) return `${sign}${s}${Math.round(v / 1000)}K`;
  return formatMoney(cents, { cents: v < 100 });
}

export function formatSignedMoney(cents: Money): string {
  return `${cents > 0 ? '+' : ''}${formatMoney(cents)}`;
}
