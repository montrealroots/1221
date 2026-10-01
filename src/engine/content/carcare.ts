/**
 * SLATE — a car's warranty, its servicing and its collisions (Stage 8 of
 * `docs/BACKLOG.md`, from 2026-10-01), from
 * `docs/research/world/research-car-ownership2.json`, read 2026-10-01; many
 * makers' pages refused a read, and those figures are a search's summary.
 *
 * **The warranty**, bumper to bumper, from new, years and kilometers,
 * whichever comes first, passing to a later owner:
 * - America: Toyota, Honda, Ford, Chevrolet, GMC, Ram, Nissan and Mazda
 *   three years or 36,000 miles; Hyundai and Kia five or 60,000;
 *   Volkswagen, Volvo and Tesla four or 50,000.
 * - Britain: Toyota, Ford, Nissan, Volvo, Volkswagen, Skoda and Vauxhall
 *   three years or 60,000 miles (Volkswagen's, Skoda's and Vauxhall's
 *   unlimited early on, taken at the year-three limit); Honda three or
 *   90,000; Hyundai five unlimited; Kia seven or 100,000; MG seven or
 *   80,000; Mazda six or 100,000; Tesla four or 60,000 (one source says
 *   50,000).
 * - Canada: three years or 60,000 km, Hyundai and Kia five or 100,000,
 *   Mazda three unlimited, Volkswagen four or 80,000.
 * - Ireland isn't published for most makes: Britain's, Hyundai's five
 *   unlimited confirmed. Mexico: Toyota's and Nissan's three years or
 *   60,000 km read; the rest America's, in km. SLATE's readings.
 * A warranty is kept only while the car's servicing is: America's
 * Magnuson-Moss lets it be done anywhere, but on schedule.
 *
 * **Servicing**, by the maker's interval: in America Toyota, Ford,
 * Volkswagen, Mazda and Volvo every 10,000 miles or a year, Honda,
 * Hyundai, Kia and Nissan 7,500 or a year; Chevrolet's, GMC's and Ram's
 * weren't found and take 7,500, SLATE's reading; in Britain Toyota,
 * Hyundai and Volkswagen 10,000 miles or a year, Skoda 9,000, MG 15,000,
 * Volvo 18,000, the rest 10,000; Canada America's in km; Mexico every six
 * months or 10,000 km. An electric car needs no oil and none is drawn.
 * At a chain's posted price: Valvoline's full-synthetic $89 to $129 in
 * America, the middle; Kwik Fit's full service from £246.95 in Britain; a
 * Dundalk garage's €249 full service in Ireland (one garage, low
 * confidence); Canadian Tire's synthetic C$90 (read in 2022); a Toyota
 * agency's 10,000 km service MX$2,195 in Mexico.
 *
 * **What a service record is worth**: in Britain Dealer Auction finds a
 * full documented history worth 10 to 15% more than none, and SLATE takes
 * a car whose servicing wasn't kept as worth 10% less. Nothing is
 * published for elsewhere.
 *
 * **A collision** happens at America's 4.16 collision claims a year in 100
 * insured cars (ISO and Verisk, 2024), taken everywhere, no other place's
 * own-damage frequency being published; it costs America's $5,489 average
 * claim, Britain's £4,900 average motor claim (ABI, Q2 2026, all claim
 * kinds), Ireland's €2,236 average damage claim (Central Bank, 2024),
 * Canada's C$5,044 average repairable claim (2023) and, none published in
 * Mexico, America's. Full cover pays the repair over America's usual $500
 * deductible, at the exchange where none is published; liability doesn't.
 *
 * **Changing cover** in Britain costs an insurer's cancellation fee,
 * Direct Line's £53.25 (search summary); elsewhere no fee was found.
 */

const MI = 1.609344;
export interface Term { years: number; km: number }
const t = (years: number, miles: number | null): Term => ({ years, km: miles === null ? Infinity : miles * MI });
const k = (years: number, km: number | null): Term => ({ years, km: km ?? Infinity });

export const WARRANTY: Readonly<Record<'us' | 'uk' | 'ca' | 'mx', Readonly<Record<string, Term>>>> = {
  us: { Toyota: t(3, 36_000), Honda: t(3, 36_000), Ford: t(3, 36_000), Chevrolet: t(3, 36_000), GMC: t(3, 36_000), Ram: t(3, 36_000), Nissan: t(3, 36_000), Mazda: t(3, 36_000), Hyundai: t(5, 60_000), Kia: t(5, 60_000), Volkswagen: t(4, 50_000), Volvo: t(4, 50_000), Tesla: t(4, 50_000) },
  uk: { Toyota: t(3, 60_000), Ford: t(3, 60_000), Nissan: t(3, 60_000), Volvo: t(3, 60_000), Volkswagen: t(3, 60_000), Skoda: t(3, 60_000), Vauxhall: t(3, 60_000), Honda: t(3, 90_000), Hyundai: t(5, null), Kia: t(7, 100_000), MG: t(7, 80_000), Mazda: t(6, 100_000), Tesla: t(4, 60_000) },
  ca: { Toyota: k(3, 60_000), Honda: k(3, 60_000), Ford: k(3, 60_000), Chevrolet: k(3, 60_000), GMC: k(3, 60_000), Nissan: k(3, 60_000), Hyundai: k(5, 100_000), Kia: k(5, 100_000), Mazda: k(3, null), Volkswagen: k(4, 80_000) },
  mx: { Toyota: k(3, 60_000), Nissan: k(3, 60_000) },
};

export interface Interval { months: number; km: number }
const i = (months: number, miles: number): Interval => ({ months, km: miles * MI });
export const SERVICE_INTERVAL: Readonly<Record<'us' | 'uk', Readonly<Record<string, Interval>>>> = {
  us: { Toyota: i(12, 10_000), Ford: i(12, 10_000), Volkswagen: i(12, 10_000), Mazda: i(12, 10_000), Volvo: i(12, 10_000), Honda: i(12, 7_500), Hyundai: i(12, 7_500), Kia: i(12, 7_500), Nissan: i(12, 7_500), Chevrolet: i(12, 7_500), GMC: i(12, 7_500), Ram: i(12, 7_500) },
  uk: { Toyota: i(12, 10_000), Hyundai: i(12, 10_000), Volkswagen: i(12, 10_000), Skoda: i(12, 9_000), MG: i(12, 15_000), Volvo: i(12, 18_000) },
};
export const MEXICO_INTERVAL: Interval = { months: 6, km: 10_000 };
export const DEFAULT_INTERVAL: Interval = i(12, 10_000);

/** A service's posted price, by market, in its money. */
export const SERVICE_PRICE: Readonly<Record<string, { amount: number; currency: string; /** What's done, the button's tooltip. */ what: string; hours: number }>> = {
  us: { amount: (89 + 129) / 2, currency: 'USD', what: 'Valvoline’s full-synthetic oil change and check', hours: 0.25 },
  uk: { amount: 246.95, currency: 'GBP', what: 'Kwik Fit’s full service', hours: 3 },
  ie: { amount: 249, currency: 'EUR', what: 'A full service, a Dundalk garage’s', hours: 3 },
  ca: { amount: 90, currency: 'CAD', what: 'Canadian Tire’s synthetic oil change', hours: 0.5 },
  mx: { amount: 2_195, currency: 'MXN', what: 'A Toyota agency’s 10,000 km service', hours: 1 },
};

/** Britain's: what a car whose servicing wasn't kept is worth less by. */
export const NO_HISTORY_GB = 0.1;

export const COLLISION = {
  perYear: 4.16 / 100,
  severity: { us: { amount: 5_489, currency: 'USD' }, uk: { amount: 4_900, currency: 'GBP' }, ie: { amount: 2_236, currency: 'EUR' }, ca: { amount: 5_044, currency: 'CAD' }, mx: { amount: 5_489, currency: 'USD' } } as Readonly<Record<string, { amount: number; currency: string }>>,
  deductibleUsd: 500,
} as const;

export const COVER_CHANGE_FEE_GB = 53.25;
