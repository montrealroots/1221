
import type { ActingTerms, BillingPosition, Role } from '../domain/company';

export interface ActingTermsInput {
  sequelOptions?: number;
  optionRaisePct?: number;
  backendPointsBps?: number;
  billing?: BillingPosition;
}

export const BILLING_POSITIONS: readonly { id: BillingPosition; label: string }[] = [
  { id: 'first', label: 'First Billing' },
  { id: 'featured', label: 'Featured Billing' },
  { id: 'shared', label: 'Shared Billing' },
  { id: 'standard', label: 'Standard Billing' },
];

export const MAX_SEQUEL_OPTIONS = 4;
export const MIN_OPTION_RAISE = 0.05;
export const MAX_OPTION_RAISE = 0.50;
export const MAX_BACKEND_BPS = 500;

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

export function defaultActingTerms(role: Role): ActingTerms {
  const billing: BillingPosition =
    role.size === 'lead'
      ? 'first'
      : role.size === 'support'
        ? 'featured'
        : role.size === 'guest'
          ? 'shared'
          : 'standard';
  return {
    sequelOptions: 0,
    optionRaisePct: 0.15,
    backendPointsBps: 0,
    billing,
  };
}

export function normalizeActingTerms(role: Role, input?: ActingTermsInput): ActingTerms {
  const base = defaultActingTerms(role);
  return {
    sequelOptions: Math.round(clamp(input?.sequelOptions ?? base.sequelOptions, 0, MAX_SEQUEL_OPTIONS)),
    optionRaisePct: clamp(
      Number.isFinite(input?.optionRaisePct) ? Number(input?.optionRaisePct) : base.optionRaisePct,
      MIN_OPTION_RAISE,
      MAX_OPTION_RAISE,
    ),
    backendPointsBps: Math.round(clamp(
      Number.isFinite(input?.backendPointsBps) ? Number(input?.backendPointsBps) : base.backendPointsBps,
      0,
      MAX_BACKEND_BPS,
    )),
    billing: BILLING_POSITIONS.some((one) => one.id === input?.billing)
      ? input!.billing!
      : base.billing,
  };
}

/**
 * Negotiated terms are not cash, but they move whether somebody takes the deal.
 * The number is intentionally small compared with the fee: a producer cannot
 * replace salary with a vanity credit, but a strong package can settle a close call.
 */
export function actingTermsAcceptanceDelta(terms: ActingTerms | undefined): number {
  if (!terms) return 0;
  const billing =
    terms.billing === 'first'
      ? 0.055
      : terms.billing === 'featured'
        ? 0.03
        : terms.billing === 'shared'
          ? 0.01
          : 0;
  const backend = (terms.backendPointsBps / MAX_BACKEND_BPS) * 0.055;
  const optionBurden = terms.sequelOptions * 0.022;
  const optionProtection = terms.sequelOptions > 0
    ? Math.max(0, terms.optionRaisePct - 0.10) * 0.20 * terms.sequelOptions
    : 0;
  return clamp(billing + backend + optionProtection - optionBurden, -0.12, 0.14);
}

export function optionFeeCents(baseFeeCents: number, terms: ActingTerms, optionNumber: number): number | undefined {
  if (optionNumber < 1 || optionNumber > terms.sequelOptions) return undefined;
  return Math.round(baseFeeCents * Math.pow(1 + terms.optionRaisePct, optionNumber));
}

export function actingTermsSummary(terms: ActingTerms): string {
  const pieces: string[] = [];
  pieces.push(BILLING_POSITIONS.find((one) => one.id === terms.billing)?.label ?? terms.billing);
  if (terms.sequelOptions > 0) {
    pieces.push(
      terms.sequelOptions + ' sequel option' + (terms.sequelOptions === 1 ? '' : 's')
      + ' at +' + Math.round(terms.optionRaisePct * 100) + '% each',
    );
  }
  if (terms.backendPointsBps > 0) {
    pieces.push((terms.backendPointsBps / 100).toFixed(2).replace(/\.00$/, '') + '% contingent gross');
  }
  return pieces.join(' · ');
}


/**
 * What a contingent-gross clause earns from one contractual receipt.
 *
 * Kept as a pure function so the accounting layer can post the payment exactly
 * once at the moment the receipt arrives. Basis points make small percentages
 * exact enough for contract storage without putting floating-point shares in a save.
 */
export function backendParticipationCents(receiptCents: number, terms: ActingTerms | undefined): number {
  if (!terms || terms.backendPointsBps <= 0 || receiptCents <= 0) return 0;
  return Math.max(0, Math.round(receiptCents * terms.backendPointsBps / 10_000));
}
