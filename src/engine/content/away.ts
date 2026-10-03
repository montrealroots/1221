/**
 * SLATE — what's kept while a home is empty: the post's hold on the mail,
 * and a house sitter (from 2026-10-03; `docs/research/world/
 * research-mail-sitters.json`, each read on its service's own page on
 * 2026-10-02 unless marked).
 *
 * **The post's hold**, by country:
 * - America, USPS Hold Mail: free, 3 to 30 days, from the next delivery day,
 *   everything held (letters and packages, read on 2026-10-03) and delivered
 *   on the hold's last day.
 * - Canada, Canada Post Hold Mail: C$24.25 for up to 10 weekdays, the least
 *   charged however short, and C$12 for each 5 more; it starts 3 business
 *   days after it's ordered, holds no parcels, delivers what it held the next
 *   business day after, and gives nothing back once begun.
 * - Britain, Royal Mail Keepsafe: £27.50 to 17 days, £34 to 24, £42 to 31,
 *   £78 to 66 and £114.50 to 100, with 5 working days' notice, delivered the
 *   next working day after. Royal Mail's own pages refused every fetch, so
 *   these are its April 2026 price guide as summarized elsewhere, unconfirmed,
 *   and whether it keeps parcels wasn't read: it holds letters here.
 * - Ireland, An Post's MailMinder: €14 under 4 weeks, €19 to 8, €24 to 12,
 *   the most, with 5 working days' notice; no parcel is held.
 * - Mexico: Correos de México has no hold on a home's delivery.
 *
 * **A house sitter**, a night, Rover's own average for a sitter staying in
 * the home in the town: New York $65.96, Los Angeles $73.94, Toronto C$60.26,
 * Vancouver C$56, London £38.72. Rover's sitters mind a pet as well, no
 * house-only price being published by town; elsewhere none is.
 */

export interface MailHoldRule {
  service: string;
  currency: string;
  /** The fee for a hold of some days, so many of them weekdays, in its money's units. */
  fee: (days: number, weekdays: number) => number;
  leastDays: number;
  mostDays?: number;
  /** Business days' notice before it can start; 0, the next day. */
  noticeBusinessDays: number;
  /** Whether what it held comes the next business day after its end, or on its last day. */
  deliversAfter: boolean;
  parcels: boolean;
  confirmed: boolean;
}

export const MAIL_HOLDS: Readonly<Record<string, MailHoldRule>> = {
  us: { service: 'USPS Hold Mail', currency: 'USD', fee: () => 0, leastDays: 3, mostDays: 30, noticeBusinessDays: 0, deliversAfter: false, parcels: true, confirmed: true },
  // Charged by the weekdays in it, holidays counted in, as Canada Post counts them.
  ca: { service: 'Canada Post Hold Mail', currency: 'CAD', fee: (_days, weekdays) => 24.25 + 12 * Math.max(0, Math.ceil((weekdays - 10) / 5)), leastDays: 1, noticeBusinessDays: 3, deliversAfter: true, parcels: false, confirmed: true },
  uk: { service: 'Royal Mail Keepsafe', currency: 'GBP', fee: (days) => (days <= 17 ? 27.5 : days <= 24 ? 34 : days <= 31 ? 42 : days <= 66 ? 78 : 114.5), leastDays: 1, mostDays: 100, noticeBusinessDays: 5, deliversAfter: true, parcels: false, confirmed: false },
  ie: { service: 'An Post MailMinder', currency: 'EUR', fee: (days) => (days < 28 ? 14 : days <= 56 ? 19 : 24), leastDays: 1, mostDays: 84, noticeBusinessDays: 5, deliversAfter: false, parcels: false, confirmed: true },
};

/** Rover's average night of house sitting in a town, in its money. */
export const SITTER_NIGHT: Readonly<Record<string, { amount: number; currency: string }>> = {
  'us-ny-newyork': { amount: 65.96, currency: 'USD' },
  'us-ca-losangeles': { amount: 73.94, currency: 'USD' },
  'ca-on-toronto': { amount: 60.26, currency: 'CAD' },
  'ca-bc-vancouver': { amount: 56, currency: 'CAD' },
  'uk-eng-london': { amount: 38.72, currency: 'GBP' },
};

/** The hour held post is brought, SLATE's reading of a round's delivery. */
export const POST_HOUR = 10;
