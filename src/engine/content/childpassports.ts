/**
 * SLATE — a child's own passport, by the country that issues it (from
 * 2026-10-05; `docs/research/world/research-gaps-2026-10-05.json`): the
 * first passport's fee for a child, the ages it covers, how many years it
 * lasts, and the standard days to have it, as each office publishes them.
 *
 * - America: the DS-11 for a child under 16, the $100 application fee and
 *   the $35 execution fee; five years; routine processing four to six weeks,
 *   the six taken (read through a page quoting the State Department, whose
 *   own site refused the read).
 * - Canada: a child of 0 to 15, C$58.50 from 31 March 2026; five years; 10 to
 *   20 business days inside Canada, the 20 taken, four weeks.
 * - Britain: a child under 16, £66.50 applying online; five years; up to
 *   three weeks online (read secondhand).
 * - Ireland: a child under 18 on Passport Online, €20; five years; ten
 *   working days, two weeks (both read secondhand; the DFA's pages refused).
 * - Mexico: a child under 3, the one-year passport at MX$920; from 3, the
 *   three-year one at MX$1,795, the SRE's 2026 tariffs; issued the day of the
 *   appointment.
 * A child past the ages a child's passport covers takes the adult's
 * (`content/passports.ts`).
 */

export interface ChildPassportRule {
  /** The ages it covers: under this. */
  under: number;
  fee: number;
  currency: string;
  years: number;
  days: number;
  /** A shorter passport for the youngest, at its own fee. */
  infant?: { under: number; fee: number; years: number };
  basis: string;
}

export const CHILD_PASSPORTS: Readonly<Record<string, ChildPassportRule>> = {
  US: { under: 16, fee: 100 + 35, currency: 'USD', years: 5, days: 42, basis: 'The DS-11 for a child under 16: $100 to the State Department and $35 to the acceptance facility; routine processing up to six weeks.' },
  CA: { under: 16, fee: 58.5, currency: 'CAD', years: 5, days: 28, basis: 'IRCC’s child passport, 0 to 15, from 31 March 2026; up to 20 business days inside Canada.' },
  GB: { under: 16, fee: 66.5, currency: 'GBP', years: 5, days: 21, basis: 'HM Passport Office’s child passport applied for online; up to three weeks.' },
  IE: { under: 18, fee: 20, currency: 'EUR', years: 5, days: 14, basis: 'Passport Online’s five-year child passport; ten working days.' },
  MX: { under: 18, fee: 1_795, currency: 'MXN', years: 3, days: 0, infant: { under: 3, fee: 920, years: 1 }, basis: 'The SRE’s 2026 tariffs: the three-year passport, or the one-year one under 3; issued the day of the appointment.' },
};
